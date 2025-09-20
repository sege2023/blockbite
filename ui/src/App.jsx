import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/login.jsx'
import Signup from './Pages/Signup.jsx'
import Vendors from './Pages/Vendors.jsx'
import Favourite from './Pages/Favourite.jsx';
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/login' element={<Login/>}/>   
        <Route path='/signup' element={<Signup/>}/>
        <Route
          path='Vendors' element={
            <ProtectedRoute>
              <Vendors/>
              
            </ProtectedRoute>
          }
        />
        <Route
          path='Favorites' element={
            <ProtectedRoute>
              <Favourite/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

