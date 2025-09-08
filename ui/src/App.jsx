import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/login.jsx'
import Signup from './Pages/Signup.jsx'
import Vendors from './Pages/Vendors.jsx'
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/signup' element={<Signup/>}/>
        <Route
          path='Vendors' element={
            <ProtectedRoute>
              <Vendors/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

