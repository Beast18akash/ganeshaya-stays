import React, { useMemo, useState } from 'react'
import { assets, facilityIcons } from '../assets/assets'
import { useNavigate, useSearchParams } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { useApp } from '../context/AppContext'

const CheckBox = ({ label, selected = false, onChange = () => {} }) => (
    <label className='flex gap-3 items-center cursor-pointer mt-2 text-sm'>
        <input type='checkbox' checked={selected} onChange={(e) => onChange(e.target.checked, label)} />
        <span className='font-light select-none'>{label}</span>
    </label>
)

const RadioButton = ({ label, selected = false, onChange = () => {} }) => (
    <label className='flex gap-3 items-center cursor-pointer mt-2 text-sm'>
        <input type='radio' name='sortOption' checked={selected} onChange={() => onChange(label)} />
        <span className='font-light select-none'>{label}</span>
    </label>
)

const roomTypes = ['Single Bed', 'Double Bed', 'Luxury Room', 'Family Suite']

const priceRanges = [
    { label: '$0 to $500',    min: 0,    max: 500  },
    { label: '$500 to $1000', min: 500,  max: 1000 },
    { label: '$1000 to $2000',min: 1000, max: 2000 },
    { label: '$2000 to $3000',min: 2000, max: 3000 },
]

const sortOptions = ['Price Low to High', 'Price High to Low', 'Newest First']

const AllRooms = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { rooms } = useApp()
    const navigate = useNavigate()
    const destination = searchParams.get('destination')
    const [openFilters, setOpenFilters] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState({
        roomTypes: [],
        priceRanges: [],
    })
    const [selectedSort, setSelectedSort] = useState('')


    // handle changes for filters and sort options
    const handleFilterChange = (checked, value, type) => {
        setSelectedFilters(prev => {
            const values = checked
                ? [...prev[type], value]
                : prev[type].filter(currentValue => currentValue !== value)

            return { ...prev, [type]: values }
        })
    }

    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
    }

    // Function to check if a room matches the selected filters
    const matchesRoomType = (room) => {
        const normalizeRoomType = (value) => value.toLowerCase().replace(/[-\s]/g, '')
        return selectedFilters.roomTypes.length === 0 || selectedFilters.roomTypes.some(type =>
            normalizeRoomType(type) === normalizeRoomType(room.roomType)
        )
    }

    // Function to check if a room matches the selected price ranges
    const matchesPriceRange = (room) => {
        return selectedFilters.priceRanges.length === 0 || selectedFilters.priceRanges.some(label => {
            const range = priceRanges.find(priceRange => priceRange.label === label)
            return range && room.pricePerNight >= range.min && room.pricePerNight <= range.max
        })
    }

    // function to sort rooms based on selected sort option
    const sortRooms = (a, b) => {
        if (selectedSort === 'Price Low to High') {
            return a.pricePerNight - b.pricePerNight
        } else if (selectedSort === 'Price High to Low') {
            return b.pricePerNight - a.pricePerNight
        } else if (selectedSort === 'Newest First') {
            return new Date(b.createdAt) - new Date(a.createdAt)
        }
        return 0
    }

    // Filter Destination
    const filterDestination = (room) => {
    const destination = searchParams.get('destination')
    if (!destination) {
        return true
    }
    return room.hotel.city.toLowerCase().includes(destination.toLowerCase())
}

//  Filter and sort rooms based on selected filters and sort option
const filteredAndSortedRooms = useMemo(() => {
    return rooms
        .filter(room => matchesRoomType(room) && matchesPriceRange(room) && filterDestination(room))
        .sort(sortRooms)
}, [rooms, selectedFilters, selectedSort, destination])

//  Clear all filters 
 const clearFilters = () => {
    setSelectedFilters({
        roomTypes: [],
        priceRanges: [],
    })
    setSelectedSort('')
    setSearchParams({})
}

    return (
        <div className='flex flex-col-reverse lg:flex-row items-start justify-between pt-28 md:pt-35 px-4 md:px-16 lg:px-24'>
            <div>
                <div className='flex flex-col items-start text-left'>
                    <h1 className='font-playfair text-4xl md:text-[40px]'>Hotel Rooms</h1>
                    <p className='text-sm md:text-base text-gray-500/90 mt-2 max-w-174'>Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories.</p>
                </div>

                {filteredAndSortedRooms.length === 0 ? (
                    <p className='text-gray-500 mt-10'>No rooms match your filters. Try adjusting your selection.</p>
                ) : (
                    filteredAndSortedRooms.map((room) => (
                        <div key={room._id} className='flex flex-col md:flex-row items-start py-10 gap-6 border-b border-gray-300 last:pb-30 last:border-0'>
                            <img src={room.images[0]} alt="hotel-img" title="View Room Details" className='max-h-65 md:w-1/2 rounded-xl shadow-lg object-cover cursor-pointer' onClick={() => { navigate(`/rooms/${room._id}`); scrollTo(0, 0) }} />
                            <div className='md:w-1/2 flex flex-col gap-2'>
                                <p className='text-gray-500'>{room.hotel.city}</p>
                                <p onClick={() => { navigate(`/rooms/${room._id}`); scrollTo(0, 0) }} className='text-gray-800 text-3xl font-playfair cursor-pointer'>{room.hotel.name}</p>
                                <div className='flex items-center'>
                                    <StarRating />
                                    <p className='ml-2'>200+ reviews</p>
                                </div>
                                <div className='flex items-center gap-1 text-gray-500 mt-2 text-sm'>
                                    <img src={assets.locationIcon} alt="location-icon" /><span>{room.hotel.address}</span>
                                </div>
                                {/* Room Amenities */}
                                <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
                                    {room.amenities.map((item, index) => (
                                        <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F5F5FF]/70'>
                                            <img src={facilityIcons[item]} alt={item} className='w-5 h-5' />
                                            <p className='text-xs'>{item}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className='text-xl font-medium text-gray-700'>${room.pricePerNight} /night</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Filters */}
            <div className='bg-white w-80 border border-gray-300 text-gray-600 max-lg:mb-8 lg:mt-16'>
                <div className={`flex items-center justify-between px-5 py-2.5 lg:border-gray-300 ${openFilters && 'border-b'}`}>
                    <p className='text-base font-medium text-gray-800'>FILTERS</p>
                    <div className='text-xs cursor-pointer'>
                        <span onClick={() => setOpenFilters(!openFilters)} className='lg:hidden'>{openFilters ? 'HIDE' : 'SHOW'}</span>
                        <span onClick={clearFilters} className='hidden lg:block hover:text-primary transition-colors'>CLEAR</span>
                    </div>
                </div>

                <div className={`${openFilters ? 'h-auto' : 'h-0 lg:h-auto overflow-hidden transition-all duration-700'}`}>
                    <div className='px-5 pt-5'>
                        <p className='font-medium text-gray-800 pb-2'>Room Type</p>
                        {roomTypes.map((type, index) => (
                            <CheckBox
                                key={index}
                                label={type}
                                selected={selectedFilters.roomTypes.includes(type)}
                                onChange={(checked) => handleFilterChange(checked, type, 'roomTypes')}
                            />
                        ))}
                    </div>

                    <div className='px-5 pt-5'>
                        <p className='font-medium text-gray-800 pb-2'>Price Range</p>
                        {priceRanges.map((range, index) => (
                            <CheckBox
                                key={index}
                                label={range.label}
                                selected={selectedFilters.priceRanges.includes(range.label)}
                                onChange={(checked) => handleFilterChange(checked, range.label, 'priceRanges')}
                            />
                        ))}
                    </div>

                    <div className='px-5 pt-5 pb-7'>
                        <p className='font-medium text-gray-800 pb-2'>Sort By</p>
                        {sortOptions.map((option, index) => (
                            <RadioButton
                                key={index}
                                label={option}
                                selected={selectedSort === option}
                                onChange={(value) => setSelectedSort(value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AllRooms
