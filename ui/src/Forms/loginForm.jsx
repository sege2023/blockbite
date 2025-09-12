import React from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password is not strong enough")
    .max(20, "Password is too long")
    .required("Password is required"),
})

export default function LoginForm() {
  // Phantom wallet login
  const handlePhantomLogin = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect()
        const walletAddress = response.publicKey.toString()

        console.log("Phantom wallet connected:", walletAddress)

        // Call backend login with wallet
        const res = await fetch("http://127.0.0.1:8000/api/auth/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        })

        const data = await res.json()
        console.log("Backend response:", data)

        if (res.ok) {
          // Save token if exists
          if (data.access && data.refresh) {
            localStorage.setItem("token", data.access)
            localStorage.setItem("refresh", data.refresh)
          } else {
            localStorage.setItem("user", JSON.stringify(data))
          }
          window.location.href = "/vendors"
        } else {
          alert("Wallet login failed: " + (data.detail || "Unknown error"))
        }
      } catch (err) {
        console.error("Wallet connection failed:", err)
      }
    } else {
      alert("Phantom wallet not found. Please install it.")
    }
  }

  // Email + password login
  const handleEmailLogin = async (values) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await res.json()
      console.log("Backend response:", data)

      if (res.ok) {
        // Save token if exists
        if (data.access && data.refresh) {
          localStorage.setItem("token", data.access)
          localStorage.setItem("refresh", data.refresh)
        } else {
          localStorage.setItem("user", JSON.stringify(data))
        }
        window.location.href = "/vendors"
      } else {
        alert("Login failed: " + (data.detail || "Unknown error"))
      }
    } catch (err) {
      console.error("Login error:", err)
    }
  }

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={loginSchema}
      onSubmit={handleEmailLogin}
    >
      {() => (
        <Form>
          <div>
            <label htmlFor="email">Email</label><br />
            <Field name="email" type="email" className="bg-[#33263B] form" />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="password">Password</label><br />
            <Field name="password" type="password" className="bg-[#33263B] form" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          <p className="or">OR</p>

          <div className="mt-4">
            <button
              type="button"
              onClick={handlePhantomLogin}
              className="formm bg-[#33263B]"
            >
              💸Login with Phantom Wallet
            </button>
          </div>

          <button type="submit" className="login">Login</button>

          <h3 className="acc">
            Don't have an account?
            <a href="/signup"> Create Account</a>
          </h3>
        </Form>
      )}
    </Formik>
  )
}
