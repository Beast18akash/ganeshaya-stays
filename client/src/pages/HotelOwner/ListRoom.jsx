import React from 'react'
import Title from '../../components/Title'
import {roomsDummyData} from '../../assets/assets'
import { useState } from 'react'

const ListRoom = () => {

  const [rooms , setRooms] = useState(roomsDummyData)
  return (
    <div className='ml-10 mt-10'>
      <Title  align='left' font='outfit' title='Room Listings' subTitle='View, edit, and manage your rooms. Keep the information up-to-date to provide the best experience for your guests.'/>
      <p className='text-gray-500 mt-8'>All Rooms</p>
      <div className='w-full max-w-3xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll mt-3'>
        <table className='w-full'>
      <thead className='bg-gray-50'>
        <tr>
          <th clasName ='py-3 px-4 text-gray-800 font-medium'>Name</th>
          <th clasName ='py-3 px-4 text-gray-800 font-medium max-sm-hidden'>Facility</th>
          <th clasName ='py-3 px-4 text-gray-800 font-medium'>Price / night</th>
          <th clasName ='py-3 px-4 text-gray-800 font-medium text-center'>Actions</th>
        </tr>
      </thead>
      <tbody className ='text-sm'>
        {rooms.map((item,index)=>(
          <tr key={index}>
            <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>{item.roomType}</td>
            <td className='py-3 px-4 text-gray-700 max-sm-hidden'>{item.amenities.join(', ')}</td>
            <td className='py-3 px-4 text-gray-700'>${item.pricePerNight}</td>
            <td className='py-3 px-4 text-gray-700 text-center'>
              <td className='border-t border-gray-300 text-red-500 text-center py-3 px-4'>
                <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
                  <input type="checkbox" value="" className="sr-only peer" checked={item.isAvailable} />
                  <div className='w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200'></div>
                  <span className=' dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5 '></span>
                </label>
              </td>
            </td>
          </tr>
        ))}

      </tbody>

        </table>
        </div>
    </div>
  )
}

export default ListRoom
