import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import api from '../lib/api'


const MyBookings = () => {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let active = true

        const fetchBookings = async () => {
            try {
                const response = await api.get('/bookings/user')
                if (active) setBookings(response.data?.bookings || [])
            } catch (error) {
                if (active) {
                    toast.error(error.response?.data?.message || 'Unable to load your bookings.')
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchBookings()
        return () => { active = false }
    }, [])

    const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    const getStatusClasses = (status) => {
        if (status === 'cancelled') return 'bg-red-50 text-red-600'
        if (status === 'confirmed') return 'bg-green-50 text-green-600'
        return 'bg-amber-50 text-amber-700'
    }

    return (
        <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>
            <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />

            {loading && <p className='max-w-6xl mt-8 text-gray-500'>Loading your bookings...</p>}

            {!loading && bookings.length === 0 && (
                <div className='max-w-6xl mt-8 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center'>
                    <p className='text-lg font-medium text-gray-800'>You have no bookings yet.</p>
                    <p className='mt-2 text-sm text-gray-500'>Your confirmed and upcoming stays will appear here.</p>
                </div>
            )}

            {!loading && bookings.length > 0 && <div className='max-w-6xl mt-8 w-full text-gray-800'>
                {/* Table Header */}
                <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
                    <div>Hotels</div>
                    <div>Date & Timings</div>
                    <div>Payment</div>
                </div>

                {/* Booking Rows */}
                {bookings.map((booking) => (
                    <div key={booking._id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>

                        {/* Hotel Details */}
                        <div className='flex flex-col md:flex-row gap-3'>
                            <img src={booking.room?.images?.[0] || assets.logo} alt={booking.hotel?.name || 'Booked room'} className='w-full md:w-44 h-40 md:h-auto rounded-lg shadow object-cover' />
                            <div className='flex flex-col justify-center gap-1.5'>
                                <p className='font-playfair text-2xl'>
                                    {booking.hotel?.name || 'Hotel'}
                                    <span className='font-inter text-sm'> ({booking.room?.roomType || 'Room'})</span>
                                </p>
                                <div className='flex items-center gap-1 text-sm text-gray-500'>
                                    <img src={assets.locationIcon} alt="location-icon" />
                                    <span>{booking.hotel?.address || 'Address unavailable'}</span>
                                </div>
                                <div className='flex items-center gap-1 text-sm text-gray-500'>
                                    <img src={assets.guestsIcon} alt="guest-icon" />
                                    <span>Guests: {booking.guests}</span>
                                </div>
                                <p className='text-base font-medium'>Total: ${Number(booking.totalPrice || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Date & Timings */}
                        <div className='flex flex-row md:justify-start md:items-center gap-16 mt-4 md:mt-0'>
                            <div>
                                <p className='font-medium'>Check-In</p>
                                <p className='text-gray-500 text-sm'>{formatDate(booking.checkInDate)}</p>
                            </div>
                            <div>
                                <p className='font-medium'>Check-Out</p>
                                <p className='text-gray-500 text-sm'>{formatDate(booking.checkOutDate)}</p>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div className='flex md:flex-col md:justify-center items-start gap-2 mt-4 md:mt-0'>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusClasses(booking.status)}`}>
                                {booking.status || 'pending'}
                            </span>
                            <div className='flex items-center gap-2'>
                                <div className={`h-3 w-3 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                                <p className={`text-sm font-medium ${booking.isPaid ? "text-green-500" : "text-red-500"}`}>
                                    {booking.isPaid ? "Paid" : "Unpaid"}
                                </p>
                            </div>
                            {!booking.isPaid  && ( <button className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer'>Pay Now</button>)}
                        </div>

                    </div>
                ))}

            </div>}
        </div>
    )
}

export default MyBookings
