import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// Yup validation schema
const signUpSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full Name is not valid")
    .max(30, "Full Name is too long"),
  email: Yup.string()
    .email("Invalid email")
    .required("Email is Required"),
  username: Yup.string()
    .min(3, "Username is not unique")
    .max(15, "Username is too long")
    .required("Username is Required"),
  password: Yup.string()
    .min(6, "Password is not strong enough")
    .max(20, "Password is too long")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
    .required("Password is Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is Required"),
});

export default function SignUpForm() {
  const [walletAddress, setWalletAddress] = useState(null);

  
  const connectWallet = async () => {
    try {
      if ("solana" in window) {
        const provider = window.solana;
        if (provider.isPhantom) {
          const resp = await provider.connect();
          setWalletAddress(resp.publicKey.toString());
          console.log("Connected wallet:", resp.publicKey.toString());
        }
      } else {
        alert("Phantom wallet not found. Please install it from your store.");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  return (
    <Formik
      initialValues={{
        fullName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      }}
      validationSchema={signUpSchema}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {() => (
        <Form>
          <div>
            <label htmlFor="fullName">Full Name</label><br />
            <Field
              name="fullName"
              type="text"
              className="bg-[#33263B] formm"
              placeholder="Enter your full name"
            />
            <ErrorMessage name="fullName" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="email">Email</label><br />
            <Field
              name="email"
              type="email"
              className="bg-[#33263B] formm"
              placeholder="Enter your email"
            />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="username">Username</label><br />
            <Field
              name="username"
              type="text"
              className="bg-[#33263B] formm"
              placeholder="Choose a username"
            />
            <ErrorMessage name="username" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="password">Password</label><br />
            <Field
              name="password"
              type="password"
              className="bg-[#33263B] formm"
              placeholder="Create a password"
            />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label><br />
            <Field
              name="confirmPassword"
              type="password"
              className="bg-[#33263B] formm"
              placeholder="Confirm password"
            />
            <ErrorMessage name="confirmPassword" component="div" className="error" />
          </div>
          <div>
            <button type="button" onClick={connectWallet} className="wallet">
              {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : " 🧼Connect Phantom Wallet"}
            </button>
          </div>

          <div>
            <button type="submit" className="sign">Sign Up</button>
          </div>

          
        </Form>
      )}
    </Formik>
  );
}
