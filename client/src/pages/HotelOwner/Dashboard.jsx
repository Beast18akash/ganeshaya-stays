import React from 'react'
import { assets, dashboardDummyData } from '../../assets/assets'

const Dashboard = () => {
  const { totalBookings, totalRevenue, bookings } = dashboardDummyData

  const stats = [
    {
      icon: assets.totalBookingIcon,
      label: 'Total Bookings',
      value: totalBookings,
    },
    {
      icon: assets.totalRevenueIcon,
      label: 'Total Revenue',
      value: `$${totalRevenue}`,
    },
  ]

  return (
    <div className='px-6 py-8 md:px-10'>

      <h1 className='text-2xl font-playfair text-gray-800 mb-6'>Dashboard</h1>

      {/* Stats Cards */}
      <div className='flex flex-wrap gap-5 mb-10'>
        {stats.map((stat, index) => (
          <div key={index} className='flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-sm min-w-52 flex-1'>
            <div className='p-3 bg-primary/10 rounded-full'>
              <img src={stat.icon} alt={stat.label} className='w-6 h-6' />
            </div>
            <div>
              <p className='text-2xl font-semibold text-gray-800'>{stat.value}</p>
              <p className='text-sm text-gray-500 mt-0.5'>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-base font-medium text-gray-800'>Recent Bookings</h2>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-gray-600'>
            <thead className='bg-gray-50 text-gray-500 text-xs uppercase'>
              <tr>
                <th className='px-6 py-3 text-left'>Guest</th>
                <th className='px-6 py-3 text-left'>Room</th>
                <th className='px-6 py-3 text-left'>Check-In</th>
                <th className='px-6 py-3 text-left'>Check-Out</th>
                <th className='px-6 py-3 text-left'>Amount</th>
                <th className='px-6 py-3 text-left'>Payment</th>
                <th className='px-6 py-3 text-left'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {bookings.map((booking) => (
                <tr key={booking._id} className='hover:bg-gray-50 transition-colors'>
                  {/* Guest */}
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <img src={booking.user.image} alt={booking.user.username} className='w-8 h-8 rounded-full object-cover' />
                      <div>
                        <p className='font-medium text-gray-800'>{booking.user.username}</p>
                        <p className='text-xs text-gray-400'>{booking.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Room */}
                  <td className='px-6 py-4'>
                    <p className='font-medium text-gray-700'>{booking.hotel.name}</p>
                    <p className='text-xs text-gray-400'>{booking.room.roomType}</p>
                  </td>

                  {/* Check-In */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {new Date(booking.checkInDate).toDateString()}
                  </td>

                  {/* Check-Out */}
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {new Date(booking.checkOutDate).toDateString()}
                  </td>

                  {/* Amount */}
                  <td className='px-6 py-4 font-medium text-gray-800'>
                    ${booking.totalPrice}
                  </td>

                  {/* Payment Method */}
                  <td className='px-6 py-4 text-gray-500'>
                    {booking.paymentMethod}
                  </td>

                  {/* Payment Status */}
                  <td className='px-6 py-4'>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${booking.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${booking.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {booking.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default Dashboard
