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
  // Placeholder wallet login (no backend yet)
  const handlePhantomLogin = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect()
        const walletAddress = response.publicKey.toString()

        console.log("Phantom wallet connected:", walletAddress)

        // TODO: Replace with backend API when ready
        alert("Wallet connected: " + walletAddress)
        window.location.href = "/vendors"
      } catch (err) {
        console.error("Wallet connection failed:", err)
        alert("Wallet connection failed. Check Phantom extension.")
      }
    } else {
      alert("Phantom wallet not found. Please install it.")
    }
  }

  // Email login flow (works with backend)
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
        if (data.access && data.refresh) {
          localStorage.setItem("token", data.access)
          localStorage.setItem("refresh", data.refresh)
        } else {
          localStorage.setItem("user", JSON.stringify(data))
        }
        window.location.href = "/vendors"
      } else {
        alert(data.detail || "This email or password is incorrect.")
      }
    } catch (err) {
      console.error("Login error:", err)
      alert("Something went wrong. Try again.")
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
              💸 Login with Phantom Wallet
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
