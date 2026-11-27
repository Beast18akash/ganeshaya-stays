import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

/**
 * PaymentSuccess
 *
 * Stripe redirects here after a completed checkout via:
 *   /payment-success?session_id={CHECKOUT_SESSION_ID}
 *
 * IMPORTANT: The Stripe redirect URL alone is NOT proof of payment.
 * We verify by asking our backend for the booking status (which is only
 * set to "confirmed" / isPaid:true by the webhook after Stripe delivers
 * the checkout.session.completed event).
 *
 * We poll up to ~15 s to account for webhook delivery latency.
 */

const MAX_POLLS = 10
const POLL_INTERVAL_MS = 1500

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  // Derive initial status from URL so we never call setState synchronously
  // inside the effect body (satisfies react-hooks/set-state-in-effect).
  const [status, setStatus] = useState(() => (sessionId ? 'verifying' : 'error'))
  const [booking, setBooking] = useState(null)
  const [refreshAttempt, setRefreshAttempt] = useState(0)
  const [errorMessage, setErrorMessage] = useState(() =>
    sessionId ? '' : 'No session ID found in the URL.'
  )

  useEffect(() => {
    if (!sessionId) return // initial state already set above

    let pollCount = 0
    let timeoutId

    const poll = async () => {
      try {
        // Look up the booking by Stripe session ID via our backend.
        // The backend endpoint requires authentication (cookie is sent automatically).
        const response = await api.get(`/payments/session-status/${sessionId}`)
        const { booking: b } = response.data

        if (b.paymentStatus === 'paid' && b.isPaid) {
          setBooking(b)
          setStatus('confirmed')
          return
        }

        if (b.paymentStatus === 'failed' || b.paymentStatus === 'expired') {
          setStatus('error')
          setErrorMessage('Payment was not completed. Please try again.')
          return
        }

        // Still pending — retry if within limit
        pollCount += 1
        if (pollCount < MAX_POLLS) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
        } else {
          // Webhook may be delayed — show a soft pending state
          setBooking(b)
          setStatus('pending')
        }
      } catch (err) {
        setStatus('error')
        setErrorMessage(
          err.response?.data?.message || 'Unable to verify your payment status.'
        )
      }
    }

    poll()
    return () => clearTimeout(timeoutId)
  }, [sessionId, refreshAttempt])

  const handleRefreshPaymentStatus = () => {
    setErrorMessage('')
    setStatus('verifying')
    setRefreshAttempt((attempt) => attempt + 1)
  }

  // ── Verifying ──
  if (status === 'verifying') {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center gap-4 px-4'>
        <div className='w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin' />
        <p className='text-gray-600 text-sm'>Verifying your payment…</p>
      </div>
    )
  }

  // ── Confirmed ──
  if (status === 'confirmed' && booking) {
    const checkIn = new Date(booking.checkInDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
      <div className='min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50'>
        <div className='bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center'>
          {/* Success icon */}
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
            <svg className='h-8 w-8 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
            </svg>
          </div>

          <h1 className='font-playfair text-3xl font-semibold text-gray-900 mb-2'>
            Booking Confirmed!
          </h1>
          <p className='text-gray-500 text-sm mb-6'>
            Payment received. A confirmation email has been sent to you.
          </p>

          {/* Booking summary */}
          <div className='bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-700 space-y-2 mb-6'>
            <div className='flex justify-between'>
              <span className='font-medium'>Hotel</span>
              <span>{booking.hotel?.name}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Room</span>
              <span>{booking.room?.roomType}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Check-in</span>
              <span>{checkIn}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Check-out</span>
              <span>{checkOut}</span>
            </div>
            <div className='flex justify-between'>
              <span className='font-medium'>Guests</span>
              <span>{booking.guests}</span>
            </div>
            <div className='flex justify-between border-t border-gray-200 pt-2 font-semibold'>
              <span>Total paid</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
          </div>

          <Link
            to='/my-bookings'
            className='block w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dull transition-all'
          >
            View My Bookings
          </Link>
          <Link to='/' className='mt-3 block text-sm text-gray-500 hover:text-gray-700'>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Pending (webhook delayed) ──
  if (status === 'pending') {
    return (
      <div className='min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50'>
        <div className='bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center'>
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
            <svg className='h-8 w-8 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z' />
            </svg>
          </div>
          <h1 className='font-playfair text-2xl font-semibold text-gray-900 mb-2'>
            Payment Processing
          </h1>
          <p className='text-gray-500 text-sm mb-6'>
            Your payment is being processed. This may take a moment. Check{' '}
            <Link to='/my-bookings' className='text-primary underline'>My Bookings</Link>{' '}
            shortly for your confirmed booking.
          </p>
          <button
            type='button'
            onClick={handleRefreshPaymentStatus}
            className='mb-4 w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all'
          >
            Refresh Payment Status
          </button>
          <Link to='/' className='text-sm text-gray-500 hover:text-gray-700'>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Error ──
  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50'>
      <div className='bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center'>
        <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
          <svg className='h-8 w-8 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </div>
        <h1 className='font-playfair text-2xl font-semibold text-gray-900 mb-2'>
          Payment Not Confirmed
        </h1>
        <p className='text-gray-500 text-sm mb-6'>
          {errorMessage || 'We could not verify your payment.'}
        </p>
        <Link
          to='/my-bookings'
          className='block w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dull transition-all mb-3'
        >
          View My Bookings
        </Link>
        <Link to='/' className='text-sm text-gray-500 hover:text-gray-700'>
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default PaymentSuccess
