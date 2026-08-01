import React from 'react'
import Navbar from './components/Navbar'
import { useLocation } from 'react-router-dom'

const App = () => {

  const iSOwnerPath = useLocation().pathname.includes("owner");
  return (
    <>  
    {/* 
    if you are the owner then i will not show you the navigation bar
    */}
    {!iSOwnerPath &&  <Navbar/>}
    </>
  )
}

export default App