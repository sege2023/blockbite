import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required(' Email is Required'),
  username: Yup.string()
    .min(3, 'Username is not unique')
    .max(15, 'username is too long')
    .required(' Username is Required'),
  password: Yup.string()
    .min(6, 'Password is not strong enough')
    .max(20, 'Password is too long')
    .required(' Password is Required'),
})

export default function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', username: '', password: '' }}
      validationSchema={loginSchema}
      onSubmit={(values) => {
        console.log(values)
      }}
    >
      {() => (
        <Form>
          <div>
            <label htmlFor="email">Email</label><br/>
            <Field name="email" type="email" className='bg-[#33263B] form' />
            <ErrorMessage name="email" component="div" className='error' />
          </div>

          <div>
            <label htmlFor="username">Username</label><br/>
            <Field name="username" type="text"  className='bg-[#33263B] form'  />
            <ErrorMessage name="username" component="div" className='error' />
          </div>

          <div>
            <label htmlFor="password">Password</label><br/>
            <Field name="password" type="password"  className='bg-[#33263B] form'  />
            <ErrorMessage name="password" component="div" className='error' />
          </div>

          <button type="submit" className='login'>Login</button>
          <h3 className='acc'>Don't have an account? 
            <a href='/signup'> Create Account</a>
          </h3>
          <h3 className='ven'>Sign up as a vendor</h3>
        </Form>
        
      )}
    </Formik>
  )
}
