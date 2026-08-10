import React from 'react'
import { assets } from '../assets/assets'

const ComingSoon = ({ title = 'Coming Soon', subtitle = 'We are working hard to bring this page to life. Stay tuned!' }) => {
  return (
    <div className='min-h-[70vh] flex flex-col items-center justify-center px-4 text-center'>

      {/* Logo */}
      <img src={assets.logo} alt='Ganeshaya Stays' className='h-10 mb-8 opacity-80' />

      {/* Animated dots */}
      <div className='flex items-center gap-2 mb-6'>
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]'></span>
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]'></span>
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce'></span>
      </div>

      {/* Heading */}
      <h1 className='font-playfair text-4xl md:text-5xl font-bold text-gray-800 mb-4'>{title}</h1>
      <p className='text-gray-500 text-sm md:text-base max-w-md'>{subtitle}</p>

      {/* Divider */}
      <div className='flex items-center gap-3 mt-8'>
        <div className='h-px w-16 bg-gray-300'></div>
        <p className='text-xs text-gray-400 uppercase tracking-widest'>Ganeshaya Stays</p>
        <div className='h-px w-16 bg-gray-300'></div>
      </div>

    </div>
  )
}

export default ComingSoon
