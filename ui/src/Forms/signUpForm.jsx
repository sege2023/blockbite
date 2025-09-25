import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WalletButton from "../Components/walletConnect";

const signUpSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export default function SignUpForm() {
  const [walletAddress, setWalletAddress] = useState(null);
  const navigate = useNavigate();
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toBase58());
    } else {
      setWalletAddress(null);
    }
  }, [publicKey]);

  const handleSignUp = async (values, { resetForm }) => {
    if (!walletAddress) {
      alert("Please connect your wallet before signing up.");
      return;
    }

    const payload = {
      email: values.email,
      wallet_address: walletAddress,
    };

    try {
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
        navigate("/"); 
      } else {
        alert("Signup failed: " + (data.detail || JSON.stringify(data)));
      }
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  return (
    <Formik
      initialValues={{ email: "" }}
      validationSchema={signUpSchema}
      onSubmit={handleSignUp}
    >
      {() => (
        <Form>
          <div>
            <label>Email</label><br />
            <Field name="email" type="email" className="bg-[#33263B] formm" />
            <ErrorMessage name="email" component="div" className="error" />
          </div>

          <div className="mt-4">
            {/* <WalletMultiButton /> */}
            <WalletButton className="!w-full !signn !max-w-sm"/>
            {walletAddress && <p>Connected: {walletAddress.slice(0, 6)}...</p>}
          </div>

          <div>
            <button type="submit" className="sign">Sign Up</button>
          </div>

          <h3 className="lo">
            Already have an account?
            <a href="/"> Login</a>
          </h3>
        </Form>
      )}
    </Formik>
  );
}
