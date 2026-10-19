import { Link } from 'react-router-dom'
import { assets } from '../assets/uiAssets'
import { getRoomImageSrcSet, getRoomImageUrl } from '../lib/images'

const HotelCard = ({room,index}) => {
  const image = room.images?.[0]
  return (
  <Link to={'/rooms/' + room._id} onClick={()=>scrollTo(0,0)} key ={room._id} className='relative max-w-70 w-full rounded-xl overflow-hidden bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]'>
    <img src={getRoomImageUrl(image, { width: 640, height: 426 })} srcSet={getRoomImageSrcSet(image, [320, 480, 640], { height: 426 })} sizes="(min-width: 1024px) 280px, (min-width: 768px) 40vw, 100vw" width="640" height="426" loading="lazy" decoding="async" alt={`${room.hotel.name} ${room.roomType}`} className="aspect-[3/2] w-full object-cover" />
   { index %2 === 0 &&  <p className='px-3 py-1 absolute top-3 left-3 text-xs bg-white text-gray-800 font-medium rounded-full'>Best seller</p>}
    <div className='pt-5 p-4'>
        <div className='flex items-center justify-between'>
            <p className='font-playfair text-xl font-medium text-gray-800'>{room.hotel.name}</p>
            <div className='flex items-center gap-1'>
                <img src={assets.starIconFilled} alt ="star-icon"/>4.5
            </div>
        </div>
        <div className='flex items-center gap-1 text-sm'>
          <img src={assets.locationIcon} alt ="location-icon"/><span>{room.hotel.address}</span>
        </div>
        <div className='flex items-center justify-between mt-4'>
            <p><span className='text-xl text-gray-800'>${room.pricePerNight}</span>/night</p>
            <button className='px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-all cursor-pointer'>Book Now</button>
        </div>
    </div>

     </Link>
  )
}

export default HotelCard
