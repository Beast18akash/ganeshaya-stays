import { useState } from 'react'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const AddRoom = () => {

  const [images , setImages] = useState({
    1 : null,
    2: null,
    3 :null,
    4 :null
  })

  const [inputs,setInputs] = useState({
    roomType: "",
    pricePerNight : 0,
    amenities : {
      'Free WiFi' : false,
      'Free Breakfast' : false,
      'Free Service' : false,
      'Mountain View' : false,
      'Pool Access' : false
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const selectedImages = Object.values(images).filter(Boolean)
    if (!inputs.roomType || inputs.pricePerNight <= 0 || selectedImages.length === 0) {
      setError('Please select a room type, enter a price, and upload at least one image.')
      return
    }

    const formData = new FormData()
    selectedImages.forEach((image) => formData.append('images', image))
    formData.append('roomType', inputs.roomType)
    formData.append('pricePerNight', String(inputs.pricePerNight))
    formData.append('amenities', JSON.stringify(
      Object.keys(inputs.amenities).filter((amenity) => inputs.amenities[amenity])
    ))

    setIsSubmitting(true)
    try {
      const response = await api.post('/rooms', formData)
      setImages({ 1: null, 2: null, 3: null, 4: null })
      setInputs({
        roomType: '',
        pricePerNight: 0,
        amenities: Object.fromEntries(Object.keys(inputs.amenities).map((amenity) => [amenity, false]))
      })
      toast.success(response.data.message || 'Room created successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create the room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
   <form onSubmit={handleSubmit}>
    <Title align='left' font='outfit' title='Add Room' subTitle="Fill in the details carefully and accurate room details, pricing , and amenities, to enhance thye user booking experience."/>
    {/* Upload Area for Images */}
    <p className='text-gray-800 mt-10'>Images</p>
    <div className='grid grid-cols-2 sm:flex gap-4 my-2 flex-wrap'>
      {Object.keys(images).map((key)=>(
        <label htmlFor={`roomImage${key}`} key={key}>
          <img className='max-h-13 cursor-pointer opacity-80' src ={images[key] ? URL.createObjectURL(images[key]) : assets.uploadArea} alt =""/>
          <input type="file" accept='image/*' id={`roomImage${key}`} hidden onChange={e=> setImages({...images , [key]: e.target.files[0]})}/>
        </label>
      ))}
    </div>

 <div className='w-full flex max-sm:flex-col sm:gap-4 mt-4'>
  <div className='flex-1 max-w-48'>
    <p className='text-gray-800 mt-4'>Room Type</p>
    <select onChange={e=> setInputs({...inputs,roomType : e.target.value})} value={inputs.roomType} className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full'>
      <option value="">Select Room Type</option>
      <option value="Single-bed">Single bed</option>
      <option value="Double-bed">Double bed</option>
      <option value="Luxury Room">Luxury Room</option>
      <option value="Family Suite">Family Suite</option>
    </select>

  </div>
  <div>
    <p className='text-gray-800 mt-4'>Price<span className="text-xs">/night</span></p>
    <input type="number" min="1" placeholder='0' onChange={e=> setInputs({...inputs, pricePerNight : Number(e.target.value)})} value={inputs.pricePerNight} className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full'/>
  </div>

    </div>
    <p className='text-gray-800 mt-4'>Amenities</p>
    <div className = 'flex flex-col flex-wrap mt-1 text-gray-400 max-w-sm'>
      {Object.keys(inputs.amenities).map((amenity , index)=>(
        <div key={index} className='flex items-center gap-2 mt-2'>
          <input
            type="checkbox"
            id={`amenity${index}`}
            checked={inputs.amenities[amenity]}
            onChange={() =>
              setInputs({
                ...inputs,
                amenities: {
                  ...inputs.amenities,
                  [amenity]: !inputs.amenities[amenity]
                }
              })
            }
          />
          <label htmlFor={`amenity${index}`}>{amenity}</label>
        </div>
      ))}
      {error && <p className='mt-4 text-sm text-red-500'>{error}</p>}
      <button type='submit' disabled={isSubmitting} className='bg-primary text-white px-8 py-2 rounded mt-8 cursor-pointer disabled:opacity-60'>
        {isSubmitting ? 'Creating Room...' : 'Add Room'}
      </button>

    </div>
   </form>
     </>
  )
}

export default AddRoom
