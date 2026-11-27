import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import RealReservationSchema from "../models/roomNightReservation.js";

process.env.STRIPE_SECRET_KEY = "sk_test_unit_test_only";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_test_only";

const state = {
  bookings: [],
  reservations: [],
  webhookEvents: new Map(),
  room: null,
  event: null,
  signature: null,
  emailError: null,
  emailsSent: 0,
  sessionCreates: [],
  nextBookingId: 1,
};

const makeQuery = (getValue) => {
  const query = {
    populate() { return query; },
    select() { return query; },
    sort() { return query; },
    then(resolve, reject) {
      return Promise.resolve().then(getValue).then(resolve, reject);
    },
  };
  return query;
};

const matches = (document, filter = {}) =>
  Object.entries(filter).every(([key, value]) => {
    if (key.startsWith("$")) return true;
    if (value && typeof value === "object" && !(value instanceof Date)) return true;
    if (document[key] instanceof Date && value instanceof Date) {
      return document[key].getTime() === value.getTime();
    }
    return String(document[key]) === String(value);
  });

const applyUpdate = (document, update) => {
  Object.assign(document, update.$set || {});
  for (const key of Object.keys(update.$unset || {})) delete document[key];
};

class Booking {
  constructor(values) {
    Object.assign(this, values);
    this._id = `64${String(state.nextBookingId++).padStart(22, "0")}`;
    if (this.stripeSessionId === undefined) this.stripeSessionId = null;
    if (this.stripeSessionLockToken === undefined) this.stripeSessionLockToken = null;
    if (this.stripeSessionLockExpiresAt === undefined) this.stripeSessionLockExpiresAt = null;
  }

  async save() {
    state.bookings.push(this);
    return this;
  }

  static findOne(filter) {
    return makeQuery(() => state.bookings.find((item) => matches(item, filter)) || null);
  }

  static findOneAndUpdate(filter, update) {
    return makeQuery(() => {
      const booking = state.bookings.find((item) => matches(item, filter));
      if (!booking) return null;
      applyUpdate(booking, update);
      return booking;
    });
  }

  static findById(id) {
    return makeQuery(() => state.bookings.find((item) => String(item._id) === String(id)) || null);
  }

  static async exists(filter) {
    return state.bookings.find((item) => matches(item, filter)) || null;
  }

  static async updateOne(filter, update) {
    const booking = state.bookings.find((item) => matches(item, filter));
    if (booking) applyUpdate(booking, update);
    return { modifiedCount: booking ? 1 : 0 };
  }
}

class RoomNightReservation {
  static async findOne(filter) {
    return state.reservations.find((item) => matches(item, filter)) || null;
  }
}

class StripeWebhookEvent {
  static findOne(filter) {
    return makeQuery(() => state.webhookEvents.get(filter.stripeEventId) || null);
  }

  static async updateOne(filter, update) {
    const record = state.webhookEvents.get(filter.stripeEventId) || {};
    Object.assign(record, update.$set || {});
    for (const key of Object.keys(update.$unset || {})) delete record[key];
    state.webhookEvents.set(filter.stripeEventId, record);
    return { upsertedCount: 1 };
  }
}

const stripe = {
  checkout: {
    sessions: {
      async create(parameters, options) {
        state.sessionCreates.push({ parameters, options });
        return {
          id: `cs_test_${state.sessionCreates.length}`,
          url: "https://checkout.stripe.test/session",
          status: "open",
          payment_status: "unpaid",
          expires_at: Math.floor(Date.now() / 1000) + 1800,
        };
      },
      async retrieve(id) {
        return {
          id,
          url: "https://checkout.stripe.test/existing",
          status: "expired",
          payment_status: "unpaid",
        };
      },
      async expire(id) {
        return { id, status: "expired", payment_status: "unpaid" };
      },
    },
  },
  webhooks: {
    constructEvent(_body, signature) {
      if (!signature || signature !== "valid-test-signature") {
        throw new Error("Invalid signature");
      }
      return state.event;
    },
  },
};

const transporter = {
  async sendMail() {
    state.emailsSent += 1;
    if (state.emailError) throw state.emailError;
  },
};

const roomAvailability = new Map();
const getNights = (checkInDate, checkOutDate) => {
  const nights = [];
  for (
    let date = new Date(`${checkInDate}T00:00:00.000Z`);
    date < new Date(`${checkOutDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    nights.push(date.toISOString().slice(0, 10));
  }
  return nights;
};

const bookingAvailability = {
  async checkBookingAvailability({ checkInDate, checkOutDate, room, excludeBookingId }) {
    return getNights(checkInDate, checkOutDate).every((date) => {
      const holder = roomAvailability.get(`${room}:${date}`);
      return !holder || String(holder) === String(excludeBookingId);
    });
  },
  async reserveRoomNights({ room, checkInDate, checkOutDate, bookingId, reservationToken, leaseExpiresAt }) {
    const nights = getNights(checkInDate, checkOutDate);
    if (nights.some((date) => roomAvailability.has(`${room}:${date}`))) return false;
    for (const date of nights) {
      roomAvailability.set(`${room}:${date}`, bookingId);
      state.reservations.push({
        room,
        date: new Date(`${date}T00:00:00.000Z`),
        booking: bookingId,
        reservationToken,
        leaseExpiresAt,
      });
    }
    return true;
  },
  async releaseRoomNights(bookingId, filter = {}) {
    state.reservations = state.reservations.filter((reservation) => {
      if (String(reservation.booking) !== String(bookingId)) return true;
      if (filter.stripeSessionId && reservation.stripeSessionId !== filter.stripeSessionId) return true;
      if (filter.reservationToken && reservation.reservationToken !== filter.reservationToken) return true;
      roomAvailability.delete(`${reservation.room}:${reservation.date.toISOString().slice(0, 10)}`);
      return false;
    });
  },
  async updateRoomNightLease() {},
  async attachStripeSessionToRoomNights(bookingId, stripeSessionId, leaseExpiresAt) {
    for (const reservation of state.reservations) {
      if (String(reservation.booking) === String(bookingId)) {
        reservation.stripeSessionId = stripeSessionId;
        reservation.leaseExpiresAt = leaseExpiresAt;
      }
    }
  },
};

const Room = {
  findById() {
    return makeQuery(() => state.room);
  },
};

mock.module("../models/booking.js", { exports: { default: Booking } });
mock.module("../models/room.js", { exports: { default: Room } });
mock.module("../models/roomNightReservation.js", { exports: { default: RoomNightReservation } });
mock.module("../models/stripeWebhookEvent.js", { exports: { default: StripeWebhookEvent } });
mock.module("../config/nodemailer.js", { exports: { default: transporter } });
mock.module("../config/stripe.js", { exports: { default: stripe } });
mock.module("../utils/bookingAvailability.js", { exports: bookingAvailability });

const { createCheckoutSession, reactivateCheckoutSession, stripeWebhook } =
  await import("../controllers/payment.controller.js");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  send(body) {
    this.body = body;
    return this;
  },
});

const makeRoom = () => ({
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  isAvailable: true,
  pricePerNight: 125.5,
  images: [],
  roomType: "Standard",
  hotel: { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Test Hotel" },
});

const validCheckoutRequest = (overrides = {}) => ({
  body: {
    room: "aaaaaaaaaaaaaaaaaaaaaaaa",
    guests: 2,
    checkInDate: "2030-01-10",
    checkOutDate: "2030-01-12",
    ...overrides,
  },
  user: {
    _id: "cccccccccccccccccccccccc",
    email: "guest@example.test",
  },
});

const makeWebhookEvent = ({
  id = "evt_test_paid",
  amount = 25100,
  currency = "usd",
} = {}) => ({
  id,
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_paid",
      payment_status: "paid",
      amount_total: amount,
      currency,
      payment_intent: "pi_test_paid",
      metadata: {},
    },
  },
});

const makePendingBooking = (overrides = {}) => ({
  _id: "dddddddddddddddddddddddd",
  user: "cccccccccccccccccccccccc",
  room: makeRoom(),
  hotel: "bbbbbbbbbbbbbbbbbbbbbbbb",
  guests: 2,
  checkInDate: new Date("2030-01-10T00:00:00.000Z"),
  checkOutDate: new Date("2030-01-12T00:00:00.000Z"),
  totalPrice: 251,
  currency: "usd",
  paymentMethod: "stripe",
  stripeSessionId: "cs_test_paid",
  stripeSessionLockToken: null,
  stripeSessionLockExpiresAt: null,
  status: "pending",
  paymentStatus: "pending",
  isPaid: false,
  ...overrides,
});

beforeEach(() => {
  state.bookings = [];
  state.reservations = [];
  state.webhookEvents = new Map();
  state.room = makeRoom();
  state.event = null;
  state.signature = null;
  state.emailError = null;
  state.emailsSent = 0;
  state.sessionCreates = [];
  state.nextBookingId = 1;
  roomAvailability.clear();
});

test("creates Checkout Session with server-calculated cents and USD", async () => {
  const response = makeResponse();
  await createCheckoutSession(validCheckoutRequest({ totalPrice: 0.01 }), response);

  assert.equal(response.statusCode, 201);
  assert.equal(state.bookings[0].totalPrice, 251);
  assert.equal(state.bookings[0].currency, "usd");
  assert.equal(state.sessionCreates[0].parameters.line_items[0].price_data.unit_amount, 25100);
  assert.equal(state.sessionCreates[0].parameters.line_items[0].price_data.currency, "usd");
});

test("rejects past dates, invalid date ranges, and invalid guest counts", async (t) => {
  const cases = [
    { name: "past check-in", input: { checkInDate: "2020-01-01", checkOutDate: "2020-01-02" } },
    { name: "checkout before check-in", input: { checkInDate: "2030-01-12", checkOutDate: "2030-01-10" } },
    { name: "zero guests", input: { guests: 0 } },
    { name: "fractional guests", input: { guests: 1.5 } },
  ];

  for (const item of cases) {
    await t.test(item.name, async () => {
      const response = makeResponse();
      await createCheckoutSession(validCheckoutRequest(item.input), response);
      assert.equal(response.statusCode, 400);
      assert.equal(state.sessionCreates.length, 0);
    });
  }
});

test.skip("rejects guest counts above the configured room occupancy capacity", () => {
  // Room has no guest-capacity field or policy; totalQuantity is room inventory, not occupancy.
});

test("prevents concurrent overlapping checkout reservations", async () => {
  const first = makeResponse();
  const second = makeResponse();
  await Promise.all([
    createCheckoutSession(validCheckoutRequest(), first),
    createCheckoutSession(validCheckoutRequest(), second),
  ]);

  assert.deepEqual([first.statusCode, second.statusCode].sort(), [201, 409]);
  assert.equal(state.bookings.length, 1);
  assert.equal(state.sessionCreates.length, 1);
});

test("RoomNightReservation declares a unique room/date index", () => {
  assert.ok(
    RealReservationSchema.schema.indexes().some(([keys, options]) =>
      keys.room === 1 && keys.date === 1 && Object.keys(keys).length === 2 && options.unique
    )
  );
});

for (const signature of [undefined, "invalid-test-signature"]) {
  test(`rejects webhook signature ${signature ? "when invalid" : "when missing"}`, async () => {
    state.bookings.push(makePendingBooking());
    state.event = makeWebhookEvent();
    const request = {
      headers: signature ? { "stripe-signature": signature } : {},
      body: Buffer.from("{}"),
    };
    const response = makeResponse();
    await stripeWebhook(request, response);

    assert.equal(response.statusCode, 400);
    assert.equal(state.bookings[0].isPaid, false);
  });
}

test("confirms a paid booking when amount and currency match", async () => {
  state.bookings.push(makePendingBooking());
  state.event = makeWebhookEvent();
  const response = makeResponse();

  await stripeWebhook(
    { headers: { "stripe-signature": "valid-test-signature" }, body: Buffer.from("{}") },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(state.bookings[0].isPaid, true);
  assert.equal(state.bookings[0].status, "confirmed");
  assert.equal(state.bookings[0].paymentStatus, "paid");
});

for (const mismatch of [
  { label: "amount", amount: 25099, currency: "usd" },
  { label: "currency", amount: 25100, currency: "cad" },
]) {
  test(`does not confirm a paid booking when ${mismatch.label} mismatches`, async () => {
    state.bookings.push(makePendingBooking());
    state.event = makeWebhookEvent(mismatch);
    const response = makeResponse();

    await stripeWebhook(
      { headers: { "stripe-signature": "valid-test-signature" }, body: Buffer.from("{}") },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(state.bookings[0].isPaid, false);
    assert.equal(state.bookings[0].status, "pending");
    assert.equal(state.webhookEvents.get(state.event.id).processingStatus, "ignored");
  });
}

test("duplicate webhook event does not reconfirm or resend confirmation email", async () => {
  state.bookings.push(makePendingBooking());
  state.event = makeWebhookEvent();
  const request = {
    headers: { "stripe-signature": "valid-test-signature" },
    body: Buffer.from("{}"),
  };
  const firstResponse = makeResponse();
  await stripeWebhook(request, firstResponse);
  const secondResponse = makeResponse();
  await stripeWebhook(request, secondResponse);

  assert.equal(firstResponse.statusCode, 200);
  assert.equal(secondResponse.statusCode, 200);
  assert.equal(state.emailsSent, 1);
  assert.equal(state.bookings[0].status, "confirmed");
});

test("email failure is logged and webhook still acknowledges payment", async () => {
  state.bookings.push(makePendingBooking());
  state.event = makeWebhookEvent();
  state.emailError = new Error("SMTP unavailable");
  const response = makeResponse();

  await stripeWebhook(
    { headers: { "stripe-signature": "valid-test-signature" }, body: Buffer.from("{}") },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(state.bookings[0].isPaid, true);
  assert.equal(state.webhookEvents.get(state.event.id).processingStatus, "processed");
});

test("booking owner can reactivate an eligible unpaid booking", async () => {
  const booking = makePendingBooking({
    status: "cancelled",
    paymentStatus: "expired",
    stripeSessionId: null,
  });
  state.bookings.push(booking);
  const response = makeResponse();

  await reactivateCheckoutSession(
    {
      body: { bookingId: booking._id },
      user: { _id: booking.user, email: "guest@example.test" },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.url, "https://checkout.stripe.test/session");
  assert.equal(booking.paymentStatus, "pending");
  assert.equal(state.bookings.length, 1);
});

test("another user cannot reactivate the booking", async () => {
  const booking = makePendingBooking({
    status: "cancelled",
    paymentStatus: "expired",
    stripeSessionId: null,
  });
  state.bookings.push(booking);
  const response = makeResponse();

  await reactivateCheckoutSession(
    {
      body: { bookingId: booking._id },
      user: { _id: "eeeeeeeeeeeeeeeeeeeeeeee", email: "other@example.test" },
    },
    response
  );

  assert.equal(response.statusCode, 404);
  assert.equal(state.sessionCreates.length, 0);
});
