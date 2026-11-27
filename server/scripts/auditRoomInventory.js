import "dotenv/config";
import mongoose from "mongoose";

const COLLECTIONS = {
  rooms: "rooms",
  bookings: "bookings",
  reservations: "roomnightreservations",
};

const ROOM_FIELDS = [
  "_id",
  "hotel",
  "roomType",
  "pricePerNight",
  "amenities",
  "images",
  "isAvailable",
  "totalQuantity",
  "createdAt",
  "updatedAt",
];

const STALE_ATTEMPT_AGE_MS = 40 * 60 * 1000;
const MAX_TIME_MS = 60_000;

const groupByRoomTypeAndHotel = [
  {
    $group: {
      _id: {
        roomType: { $ifNull: ["$roomType", "<missing>"] },
        hotel: { $ifNull: ["$hotel", null] },
      },
      count: { $sum: 1 },
    },
  },
  { $sort: { "_id.roomType": 1, "_id.hotel": 1 } },
];

const referenceAuditPipeline = (field, targetCollection, lookupAlias) => [
  {
    $lookup: {
      from: targetCollection,
      let: { referenceId: `$${field}` },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$referenceId"] } } },
        { $project: { _id: 1 } },
        { $limit: 1 },
      ],
      as: lookupAlias,
    },
  },
  {
    $set: {
      referenceType: { $type: `$${field}` },
      referenceState: {
        $switch: {
          branches: [
            {
              case: {
                $in: [{ $type: `$${field}` }, ["missing", "null"]],
              },
              then: "missing",
            },
            {
              case: { $ne: [{ $type: `$${field}` }, "objectId"] },
              then: "invalid_type",
            },
            {
              case: { $eq: [{ $size: `$${lookupAlias}` }, 0] },
              then: "dangling",
            },
          ],
          default: "valid",
        },
      },
    },
  },
  {
    $group: {
      _id: "$referenceState",
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];

const formatIndexes = (indexes) =>
  indexes.map((index) => ({
    name: index.name,
    key: index.key,
    unique: Boolean(index.unique),
    sparse: Boolean(index.sparse),
    hasPartialFilter: Boolean(index.partialFilterExpression),
    expireAfterSeconds: index.expireAfterSeconds ?? null,
  }));

const countByRoomFieldType = async (rooms) => {
  const groups = await rooms
    .aggregate([
      {
        $project: {
          fields: {
            $filter: {
              input: { $objectToArray: "$$ROOT" },
              as: "field",
              cond: { $in: ["$$field.k", ROOM_FIELDS] },
            },
          },
        },
      },
      { $unwind: "$fields" },
      {
        $group: {
          _id: {
            field: "$fields.k",
            type: { $type: "$fields.v" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.field": 1, "_id.type": 1 } },
    ], { maxTimeMS: MAX_TIME_MS })
    .toArray();

  const total = await rooms.countDocuments({}, { maxTimeMS: MAX_TIME_MS });

  return ROOM_FIELDS.map((field) => {
    const fieldGroups = groups.filter((group) => group._id.field === field);
    const present = fieldGroups.reduce((sum, group) => sum + group.count, 0);

    return {
      field,
      present,
      missing: total - present,
      types: Object.fromEntries(
        fieldGroups.map((group) => [group._id.type, group.count])
      ),
    };
  });
};

const main = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  mongoose.set("autoIndex", false);
  mongoose.set("autoCreate", false);

  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
    autoCreate: false,
    bufferCommands: false,
  });

  const db = mongoose.connection.db;
  const collectionPresence = {};

  for (const [label, collectionName] of Object.entries(COLLECTIONS)) {
    collectionPresence[label] = await db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .hasNext();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    collectionPresence,
    totals: {},
    rooms: null,
    bookings: null,
    reservations: null,
    migrationRisks: [
      "The current Room model has no totalQuantity field; existing quantities require an explicit, owner-verified migration decision.",
      "Room documents are grouped for reporting only. The audit does not recommend or infer which documents should be merged.",
      "The current reservation model has no status or quantity field; linked booking states are reported separately and are not reservation status values.",
      "The current unique (room, date) reservation index may conflict with multiple bookings per category-night and requires a planned index migration.",
      "Bookings store guests, not booked room-unit quantity; do not infer quantity from guest count.",
      "Stripe status and timestamps are database snapshots only. This audit does not contact Stripe, prove payment settlement, or establish that a reservation is safe to release.",
      "Confirm production MongoDB transaction support and backup/cutover strategy before implementing multi-document inventory transactions.",
    ],
  };

  const collections = {};

  for (const [label, collectionName] of Object.entries(COLLECTIONS)) {
    if (!collectionPresence[label]) {
      report.totals[label] = 0;
      continue;
    }

    collections[label] = db.collection(collectionName);
    report.totals[label] = await collections[label].countDocuments(
      {},
      { maxTimeMS: MAX_TIME_MS }
    );
  }

  if (collections.rooms) {
    const rooms = collections.rooms;

    report.rooms = {
      countsByRoomTypeAndHotel: await rooms
        .aggregate(groupByRoomTypeAndHotel, { maxTimeMS: MAX_TIME_MS })
        .toArray(),
      inventoryFieldPresenceAndTypes: await countByRoomFieldType(rooms),
      invalidOrMissingTotalQuantity: await rooms.countDocuments({
        $expr: {
          $cond: [
            { $isNumber: "$totalQuantity" },
            {
              $or: [
                { $lte: ["$totalQuantity", 0] },
                { $ne: ["$totalQuantity", { $floor: "$totalQuantity" }] },
              ],
            },
            true,
          ],
        },
      }, { maxTimeMS: MAX_TIME_MS }),
    };
  }

  if (collections.bookings) {
    const bookings = collections.bookings;
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - STALE_ATTEMPT_AGE_MS);

    report.bookings = {
      countsByBookingAndPaymentStatus: await bookings
        .aggregate([
          {
            $group: {
              _id: {
                status: { $ifNull: ["$status", "<missing>"] },
                paymentStatus: {
                  $ifNull: ["$paymentStatus", "<missing>"],
                },
                paymentMethod: {
                  $ifNull: ["$paymentMethod", "<missing>"],
                },
                isPaid: { $ifNull: ["$isPaid", null] },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.status": 1, "_id.paymentStatus": 1 } },
        ], { maxTimeMS: MAX_TIME_MS })
        .toArray(),

      roomReferenceStates: collectionPresence.rooms
        ? await bookings
            .aggregate(
              referenceAuditPipeline("room", COLLECTIONS.rooms, "roomMatch"),
              { maxTimeMS: MAX_TIME_MS }
            )
            .toArray()
        : null,

      activeLikeBookingsByReservationPresence:
        collectionPresence.reservations
          ? await bookings
              .aggregate([
                {
                  $lookup: {
                    from: COLLECTIONS.reservations,
                    let: { bookingId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$booking", "$$bookingId"] },
                        },
                      },
                      { $project: { _id: 1 } },
                      { $limit: 1 },
                    ],
                    as: "reservationMatch",
                  },
                },
                {
                  $set: {
                    hasReservation: {
                      $gt: [{ $size: "$reservationMatch" }, 0],
                    },
                  },
                },
                {
                  $match: {
                    status: { $ne: "cancelled" },
                    paymentStatus: {
                      $nin: ["expired", "failed", "refunded"],
                    },
                  },
                },
                {
                  $group: {
                    _id: {
                      status: { $ifNull: ["$status", "<missing>"] },
                      paymentStatus: {
                        $ifNull: ["$paymentStatus", "<missing>"],
                      },
                      hasReservation: "$hasReservation",
                    },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { "_id.status": 1, "_id.hasReservation": 1 } },
              ], { maxTimeMS: MAX_TIME_MS })
              .toArray()
          : null,

      pendingOrUnsettledStripeAttemptSummaries: await bookings
        .aggregate([
          {
            $match: {
              paymentMethod: "stripe",
              isPaid: { $ne: true },
              paymentStatus: { $nin: ["paid", "refunded"] },
            },
          },
          {
            $set: {
              hasStripeSessionId: {
                $and: [
                  { $ne: [{ $type: "$stripeSessionId" }, "missing"] },
                  { $ne: ["$stripeSessionId", null] },
                ],
              },
              lockState: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $in: [
                          { $type: "$stripeSessionLockExpiresAt" },
                          ["missing", "null"],
                        ],
                      },
                      then: "no_expiry",
                    },
                    {
                      case: {
                        $lte: ["$stripeSessionLockExpiresAt", now],
                      },
                      then: "expired",
                    },
                  ],
                  default: "not_expired",
                },
              },
              ageBucket: {
                $switch: {
                  branches: [
                    {
                      case: { $ne: [{ $type: "$createdAt" }, "date"] },
                      then: "unknown",
                    },
                    {
                      case: { $lte: ["$createdAt", staleCutoff] },
                      then: "at_least_40_minutes",
                    },
                  ],
                  default: "under_40_minutes",
                },
              },
            },
          },
          {
            $group: {
              _id: {
                status: { $ifNull: ["$status", "<missing>"] },
                paymentStatus: {
                  $ifNull: ["$paymentStatus", "<missing>"],
                },
                hasStripeSessionId: "$hasStripeSessionId",
                lockState: "$lockState",
                ageBucket: "$ageBucket",
              },
              count: { $sum: 1 },
              oldestCreatedAt: { $min: "$createdAt" },
              newestUpdatedAt: { $max: "$updatedAt" },
              earliestLockExpiry: { $min: "$stripeSessionLockExpiresAt" },
            },
          },
          { $sort: { "_id.ageBucket": 1, "_id.paymentStatus": 1 } },
        ], { maxTimeMS: MAX_TIME_MS })
        .toArray(),
    };
  }

  if (collections.reservations) {
    const reservations = collections.reservations;

    report.reservations = {
      countsByStoredStatus: await reservations
        .aggregate([
          {
            $group: {
              _id: { $ifNull: ["$status", "<missing>"] },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ], { maxTimeMS: MAX_TIME_MS })
        .toArray(),

      bookingReferenceStates: collectionPresence.bookings
        ? await reservations
            .aggregate(
              referenceAuditPipeline(
                "booking",
                COLLECTIONS.bookings,
                "bookingMatch"
              ),
              { maxTimeMS: MAX_TIME_MS }
            )
            .toArray()
        : null,

      roomReferenceStates: collectionPresence.rooms
        ? await reservations
            .aggregate(
              referenceAuditPipeline("room", COLLECTIONS.rooms, "roomMatch"),
              { maxTimeMS: MAX_TIME_MS }
            )
            .toArray()
        : null,

      linkedBookingLifecycleCounts: collectionPresence.bookings
        ? await reservations
            .aggregate([
              {
                $lookup: {
                  from: COLLECTIONS.bookings,
                  let: { bookingId: "$booking" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$bookingId"] },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        status: 1,
                        paymentStatus: 1,
                      },
                    },
                    { $limit: 1 },
                  ],
                  as: "bookingMatch",
                },
              },
              {
                $set: {
                  linkedBookingState: {
                    $ifNull: [
                      { $arrayElemAt: ["$bookingMatch", 0] },
                      { status: "<missing>", paymentStatus: "<missing>" },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: {
                    bookingStatus: {
                      $ifNull: [
                        "$linkedBookingState.status",
                        "<missing>",
                      ],
                    },
                    paymentStatus: {
                      $ifNull: [
                        "$linkedBookingState.paymentStatus",
                        "<missing>",
                      ],
                    },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { "_id.bookingStatus": 1, "_id.paymentStatus": 1 } },
            ], { maxTimeMS: MAX_TIME_MS })
            .toArray()
        : null,
    };
  }

  report.indexes = {};

  for (const [label, collectionName] of Object.entries(COLLECTIONS)) {
    report.indexes[label] = collectionPresence[label]
      ? formatIndexes(await collections[label].listIndexes().toArray())
      : null;
  }

  console.log(JSON.stringify(report, null, 2));
};

try {
  await main();
} catch {
  console.error(
    "Read-only room inventory audit failed. Check the environment and database permissions; raw connection errors are intentionally suppressed."
  );
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
