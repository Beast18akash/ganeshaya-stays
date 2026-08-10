import React, { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { assets } from '../../assets/assets'

const sidebarLinks = [
  { name: 'Dashboard', path: '/owner', icon: assets.dashboardIcon },
  { name: 'Add Room',  path: '/owner/add-room', icon: assets.addIcon },
  { name: 'List Rooms', path: '/owner/list-rooms', icon: assets.listIcon },
]

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='flex min-h-screen bg-gray-50'>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isOpen ? 'w-56' : 'w-16'} md:w-56`}>

        {/* Logo */}
        <div className='flex items-center gap-3 px-4 py-5 border-b border-gray-100'>
          <Link to='/'>
            <img src={assets.logo} alt='logo' className='h-8 invert opacity-80' />
          </Link>
        </div>

        {/* Nav Links */}
        <nav className='flex flex-col gap-1 p-3 mt-2 flex-1'>
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/owner'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`
              }
            >
              <img src={link.icon} alt={link.name} className='w-5 h-5 shrink-0' />
              <span className='hidden md:block'>{link.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Back to site */}
        <div className='p-3 border-t border-gray-100'>
          <Link to='/' className='flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors'>
            <img src={assets.homeIcon} alt='home' className='w-5 h-5 shrink-0' />
            <span className='hidden md:block'>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 ml-16 md:ml-56 min-h-screen'>
        {/* Top bar */}
        <div className='sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between'>
          <p className='text-sm text-gray-500'>Hotel Owner Panel</p>
          <div className='flex items-center gap-2'>
            <img src={assets.logo} alt='logo' className='h-6 invert opacity-60' />
          </div>
        </div>

        {/* Page content */}
        <Outlet />
      </main>

    </div>
  )
}

export default Layout
