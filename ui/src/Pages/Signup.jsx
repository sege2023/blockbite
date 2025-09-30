import React from 'react'
import Log from '../Components/Log.jsx'
import '../Styles/Signup.scss'
import SignUpForm from '../Forms/signUpForm.jsx'

const Signup = () => {
  return (
    <div className='card'>
      <Log/>
      <SignUpForm/>
    </div>
  )
}

export default Signup
