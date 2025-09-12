import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const signUpSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full Name is not valid")
    .max(30, "Full Name is too long"),
  email: Yup.string().email("Invalid email").required("Email is Required"),
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
    .matches(/[!@#$%^&*(),.?:{}|<>]/, "Must contain at least one special character")
    .required("Password is Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is Required"),
});

export default function SignUpForm() {
  const [walletAddress, setWalletAddress] = useState(null);
  const navigate = useNavigate();   

  const connect = async () => {
    try {
      if ("solana" in window) {
        const provider = window.solana;
        if (provider.isPhantom) {
          const resp = await provider.connect();
          setWalletAddress(resp.publicKey.toString());
          console.log("Connected wallet:", resp.publicKey.toString());
        }
      } else {
        alert("Phantom wallet not found. Please install it.");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  const handleSignUp = async (values, { resetForm }) => {
    try {
      // Wallet must be connected
      if (!walletAddress) {
        alert("Please connect your Phantom wallet before signing up.");
        return;
      }

      const payload = {
        name: values.fullName,
        email: values.email,
        username: values.username,
        password: values.password,
        wallet_address: walletAddress, 
      };

      const res = await fetch("http://127.0.0.1:8000/api/user/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Register response:", data);

      if (res.ok) {
        alert("Account created successfully");
        resetForm();
        setWalletAddress(null);
        navigate("/Vendors");   
      } else {
        alert("Signup failed: " + (data.detail || JSON.stringify(data)));
        resetForm();
      }
    } catch (err) {
      console.error("Signup error:", err);
      resetForm();
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
      onSubmit={handleSignUp}
    >
      {() => (
        <Form>
          <div>
            <label>Full Name</label><br />
            <Field name="fullName" type="text" className="bg-[#33263B] formm" />
            <ErrorMessage name="fullName" component="div" className="error" />
          </div>

          <div>
            <label>Email</label><br />
            <Field name="email" type="email" className="bg-[#33263B] formm" />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div>
            <label>Username</label><br />
            <Field name="username" type="text" className="bg-[#33263B] formm" />
            <ErrorMessage name="username" component="div" className="error" />
          </div>

          <div>
            <label>Password</label><br />
            <Field name="password" type="password" className="bg-[#33263B] formm" />
            <ErrorMessage name="password" component="div" className="error" />
          </div>

          <div>
            <label>Confirm Password</label><br />
            <Field name="confirmPassword" type="password" className="bg-[#33263B] formm" />
            <ErrorMessage name="confirmPassword" component="div" className="error" />
          </div>

          <div>
            <button type="button" onClick={connect} className="wallet">
              {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "💸Connect Phantom Wallet"}
            </button>
          </div>

          <div>
            <button type="submit" className="sign">Sign Up</button>
          </div>
          <h3 className="lo">Already have an account?
            <a href="/"> Login</a>
          </h3>
        </Form>
      )}
    </Formik>
  );
}
