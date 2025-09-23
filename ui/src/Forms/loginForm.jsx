import React, { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "../Components/walletConnect";

const Login = () => {
  const { publicKey, signMessage } = useWallet();

  useEffect(() => {
    if (publicKey) {
      handleLogin();
    }
  }, [publicKey]);

  const handleLogin = async () => {
    if (!publicKey || !signMessage) {
      alert("Connect wallet first");
      return;
    }

    try {
      // 1. Get challenge (nonce) from backend
      const challengeRes = await fetch("http://127.0.0.1:8000/api/auth/challenge/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: publicKey.toBase58() }),
      });

      if (!challengeRes.ok) throw new Error("Challenge API failed");
      const { nonce } = await challengeRes.json();

      // 2. Sign challenge
      const message = new TextEncoder().encode(nonce);
      const signature = await signMessage(message);

      // 3. Send signed message to backend for verification
      const res = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: publicKey.toBase58(),
          signature: Array.from(signature),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access);
        alert("Login success");
        window.location.href = "/vendors";
      } else {
        throw new Error("Login failed: " + JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Backend not ready, using dev-token. Error:", err.message);
      localStorage.setItem("token", "dev-token");
      window.location.href = "/vendors";
    } 
  };

  return (
    <>
      <div className="Login">
        <WalletButton />
      </div>
      <h3 className="acc text-center font-light text-[13px] ml-[-50px] mt-[10px] mb-[20px]">
        Don't have an account?
        <a href="/signup" className="text-[#14F195] cursor-pointer">
          {" "}Create Account
        </a>
      </h3>
    </>
  );
};

export default Login;
