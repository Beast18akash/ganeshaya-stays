import HotelCard from './HotelCard'
import { useApp } from '../context/AppContext.jsx'
import Title from './Title'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const FeaturedDestinationSkeleton = () => (
  <div
    aria-hidden="true"
    className="relative w-full max-w-70 overflow-hidden rounded-xl bg-white shadow-[0px_4px_4px_rgba(0,0,0,0.05)]"
  >
    <div className="aspect-[3/2] w-full animate-pulse bg-slate-200" />
    <div className="min-h-[148px] space-y-4 p-4 pt-5">
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-2/5 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-24 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  </div>
)

const FeaturedDestination = () => {
  const { rooms, roomsStatus, roomsError, loadRooms } = useApp()

  const navigate = useNavigate()

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  const isLoading = roomsStatus === 'idle' || roomsStatus === 'loading'
  const featuredRooms = rooms.slice(0, 4)

  if (roomsStatus === 'error') {
    return <div className='flex flex-col items-center bg-slate-50 px-6 py-20 md:px-16 lg:px-24'><Title title='Featured Destination' subTitle='Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experience.' /><p className='mt-10 text-sm text-gray-500'>{roomsError}</p></div>
  }

  return (
    <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20'>
        <Title title='Featured Destination' subTitle='Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experience. '/>
        <div className='flex w-full flex-wrap items-center justify-center gap-6 mt-20' aria-busy={isLoading}>
           {isLoading && Array.from({ length: 4 }, (_, index) => <FeaturedDestinationSkeleton key={index} />)}
           {!isLoading && featuredRooms.length > 0 && featuredRooms.map((room,index)=>(<HotelCard key={room._id} room={room} index={index}/>))}
           {!isLoading && featuredRooms.length === 0 && (
             <p className='w-full max-w-xl rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-gray-500' role='status'>
               No featured destinations are available right now. Please check back soon.
             </p>
           )}
        </div>

        {featuredRooms.length > 0 && <button className='my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer'  onClick={()=>{navigate('/rooms'); scrollTo(0,0)}}> View All Destination</button>}

    </div>
  )
}

export default FeaturedDestination
