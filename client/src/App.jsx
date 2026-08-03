import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home';
import Footer from './components/Footer';

const App = () => {

  const iSOwnerPath = useLocation().pathname.includes("owner");
  return (
    <div>
    {/* 
    if you are the owner then i will not show you the navigation bar
    */}
    {!iSOwnerPath &&  <Navbar/>}
    <div className='min-h-[70vh]'>
      <Routes>
        <Route path ='/' element={<Home/>}/>
      </Routes>
    </div>
    <Footer/>
    </div>
  )
}

export default App