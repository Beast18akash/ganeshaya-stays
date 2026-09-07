import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { assets, facilityIcons, roomCommonData } from '../assets/assets'
import StarRating from '../components/StarRating'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

const RoomDetails = () => {
  const {id} = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [room , setRoom] = useState(null)
  const [mainImage , setMainImage] = useState(null)
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [booking, setBooking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    let active = true

    const fetchRoom = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await api.get('/rooms')
        const rooms = response.data?.rooms || []
        const selectedRoom = rooms.find((item) => String(item._id) === id)

        if (!selectedRoom) {
          throw new Error('Room not found')
        }

        if (active) {
          setRoom(selectedRoom)
          setMainImage(selectedRoom.images?.[0] || null)
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError.response?.data?.message || fetchError.message || 'Unable to load room details.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchRoom()
    return () => { active = false }
  },[id])

  const validateDates = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkIn = new Date(`${checkInDate}T00:00:00`)
    const checkOut = new Date(`${checkOutDate}T00:00:00`)

    if (!checkInDate || !checkOutDate) {
      toast.error('Please select both check-in and check-out dates.')
      return false
    }
    if (checkIn < today) {
      toast.error('Check-in date cannot be in the past.')
      return false
    }
    if (checkOut <= checkIn) {
      toast.error('Check-out date must be after check-in date.')
      return false
    }
    if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
      toast.error('Guests must be at least 1.')
      return false
    }
    return true
  }

  const handleAvailabilityCheck = async (e) => {
    e.preventDefault()
    if (!validateDates()) return

    if (availabilityChecked) {
      if (!user) {
        navigate('/signin', { state: { from: location.pathname, message: 'Please sign in to book this room.' } })
        return
      }

      try {
        setBooking(true)
        const response = await api.post('/bookings/book', {
          room: room._id,
          guests: Number(guests),
          checkInDate,
          checkOutDate,
        })
        toast.success(response.data?.message || 'Room booked successfully.')
        navigate('/my-bookings')
      } catch (bookingError) {
        setAvailabilityChecked(false)
        toast.error(bookingError.response?.data?.message || 'Unable to book this room.')
      } finally {
        setBooking(false)
      }
      return
    }

    try {
      setCheckingAvailability(true)
      const response = await api.post('/bookings/check-availability', {
        room: room._id,
        checkInDate,
        checkOutDate,
      })
      if (response.data?.isAvailable) {
        setAvailabilityChecked(true)
        toast.success('This room is available. You can book it now.')
      } else {
        setAvailabilityChecked(false)
        toast.error(response.data?.message || 'This room is unavailable for those dates.')
      }
    } catch (availabilityError) {
      setAvailabilityChecked(false)
      toast.error(availabilityError.response?.data?.message || 'Unable to check room availability.')
    } finally {
      setCheckingAvailability(false)
    }
  }
  if (loading) {
    return <div className='min-h-[70vh] flex items-center justify-center'>Loading room details...</div>
  }

  if (error || !room) {
    return <div className='min-h-[70vh] flex items-center justify-center text-gray-500'>{error || 'Room not found.'}</div>
  }

  return (
    <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>

      {/* Room Details */}
      <div className='flex flex-col md:flex-row items-start md:items-center gap-2'>
        <h1 className='text-3xl md:text-4xl font-playfair'>{room.hotel.name}<span className='font-inter text-sm'>({room.roomType})</span></h1>
        <p className='text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full'>20% OFF</p>
      </div>
      {/* Room Rating */}
      <div className='flex items-center gap-1 mt-2'>
      <StarRating/>
      <p className='ml-2'>200+ reviews</p>
      </div>
{/*  Room Address */}
<div className='flex items-center gap-1 text-gray-500 mt-2'>
  <img  src ={assets.locationIcon} alt ="location-icon"/>
  <span>{room.hotel.address}</span>
</div>

{/* room images */}
<div className='flex flex-col lg:flex-row gap-4 mt-6'>
  <div className='lg:w-1/2 w-full'>
    <img src={mainImage} alt="Room Image" className='w-full rounded-xl shadow-lg object-cover'/>
  </div>

  <div className='grid grid-cols-2 gap-4 lg:w-1/2 w-full'>
    {room?.images.length > 1 && room.images.map((image, index) => (
      <img src={image} key={index} alt="Room Image"
        className={`w-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image ? "outline-3 outline-orange-500" : ""}`}
        onClick={() => setMainImage(image)}
      />
    ))}
  </div>
</div>

{/* Room Highlights */}
<div className='flex flex-col md:flex-row md:justify-between mt-10'>
  <div className='flex flex-col '>
    <h1 className='text-3xl md:text-4xl font-playfair'>Experience Luxury Like Never Before</h1>
    <div className='flex-wrap items-center mt-3 mb-6 gap-4'>
      {room.amenities.map((item,index)=>(
        <div key ={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100'>
          <img src ={facilityIcons[item]} alt ={item} className='w-5 h-5'/>
          <p className='text-xs'>{item}</p>
          </div>
      ))}
    </div>
  </div>
  {/* Room price */}
<p className='text-2xl font-medium'>${room.pricePerNight}/night</p>
</div>
{/* checkIn checkOut -form */}
<form onSubmit={handleAvailabilityCheck} className='flex flex-col md:flex-row items-start md:items-center justify-between bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.15)] p-6 rounded-xl mx-auto mt-16 max-w-6xl'>
  <div className='flex flex-col flex-wrap md:flex-row items-start md:items-center gap-4 md:gap-10 text-gray-500'>
    <div className='flex flex-col'>
      <label htmlFor='checkInDate' className='font-medium'>Check-In</label>
      <input type='date' id='checkInDate' min={new Date().toISOString().split('T')[0]} value={checkInDate} onChange={(e) => { setCheckInDate(e.target.value); setAvailabilityChecked(false) }} className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' required/>
    </div>

    <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>

    <div className='flex flex-col'>
      <label htmlFor='checkOutDate' className='font-medium'>Check-Out</label>
      <input type='date' id='checkOutDate' min={checkInDate || new Date().toISOString().split('T')[0]} value={checkOutDate} onChange={(e) => { setCheckOutDate(e.target.value); setAvailabilityChecked(false) }} className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' required/>
    </div>

    <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>

    <div className='flex flex-col'>
      <label htmlFor='guests' className='font-medium'>Guests</label>
      <input type='number' id='guests' min={1} step={1} value={guests} onChange={(e) => { setGuests(e.target.value); setAvailabilityChecked(false) }} className='max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' required/>
    </div>
  </div>
  <button type='submit' disabled={checkingAvailability || booking} className='bg-primary hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60 active:scale-95 transition-all text-white rounded-md max-md:w-full max-md:mt-6 md:px-25 py-3 md:py-4 text-base cursor-pointer'>{checkingAvailability ? 'Checking...' : booking ? 'Booking...' : availabilityChecked ? 'Book Now' : 'Check Availability'}</button>
</form>

{/* Common specifications */}
<div className='mt-25 space-y-4'>
  {roomCommonData.map(( spec , index)=>(
    <div key = {index} className='flex items-start gap-2'>
      <img src={spec.icon} alt={`${spec.title} -icon`} className='w--6.5' />
      <div>
        <p className='text-base'>{spec.title}</p>
        <p className='text-gray-500'>{spec.description}</p>
        </div>
      </div>
  ))}
</div>

<div>
  <p className='max-w-3xl  border-y border-gray-300 my-15 py-10 text-gray-500'>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa nam excepturi animi fuga omnis iusto dolores repellat accusamus obcaecati, quasi ipsum, sunt dicta odio necessitatibus veniam repellendus, non ipsam quibusdam. Ut mollitia, dolorem quasi voluptatum cum qui atque, perferendis soluta veniam dolorum placeat quidem enim quod! Iusto nam explicabo amet perspiciatis fugit tempora deleniti sapiente ab!</p>
</div>
{/* Hosted By */}
<div className='flex flex-col items-start gap-0'>
  <div className='flex -gap-4'>
    <img src={room.hotel.owner.profilePicture || assets.userIcon} alt = " Host" className='h-14 w-14 md:h-18 md:w-18 rounded-full'/>
    <div>
      <p className='text-lg md:text-xl'>Hosted By {room.hotel.name}</p>
      <div className='flex items-center mt-1'>
        <StarRating/>
        <p className='ml-2'>200+ Reviews</p>
      </div>
    </div>
  </div>
<button className='px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull trnasition-all cursor-pointer'>Contact Now</button>
</div>

    </div>
  )
}

export default RoomDetails