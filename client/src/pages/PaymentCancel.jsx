import { Link } from 'react-router-dom'

/**
 * PaymentCancel
 *
 * Stripe redirects here when the customer cancels or closes the Checkout page:
 *   /payment-cancel?booking_id=<bookingId>
 *
 * The pending booking remains in the database so the customer can retry payment
 * from My Bookings using the "Pay Now" button. It will be automatically marked
 * as expired/cancelled by the Stripe webhook when the session expires (30 min).
 */
const PaymentCancel = () => {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50'>
      <div className='bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center'>

        {/* Cancel icon */}
        <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
          <svg className='h-8 w-8 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z' />
          </svg>
        </div>

        <h1 className='font-playfair text-2xl font-semibold text-gray-900 mb-2'>
          Checkout Not Completed
        </h1>
        <p className='text-gray-500 text-sm mb-6'>
          Checkout was not completed. Visit{' '}
          <Link to='/my-bookings' className='text-primary underline'>
            My Bookings
          </Link>{' '}
          to verify your payment status or retry payment if it is still available.
        </p>

        <Link
          to='/my-bookings'
          className='block w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dull transition-all mb-3'
        >
          Go to My Bookings
        </Link>
        <Link to='/rooms' className='block text-sm text-gray-500 hover:text-gray-700'>
          Browse Other Rooms
        </Link>
      </div>
    </div>
  )
}

export default PaymentCancel
