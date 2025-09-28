import React, { useEffect, useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "../Components/walletConnect";
import bs58 from "bs58";

const Login = () => {
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!publicKey || !signMessage) {
      alert("Connect wallet first");
      return;
    }

    setLoading(true);
    try {
      // 1. Request challenge from backend
      const challengeRes = await fetch("http://127.0.0.1:8000/api/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: publicKey.toBase58(), // always string
        }),
      });

      if (!challengeRes.ok) {
        const errText = await challengeRes.text();
        console.error("Challenge API error:", challengeRes.status, errText);
        alert("Challenge API failed: " + errText);
        
        return;
      }

      const { nonce, message } = await challengeRes.json();

      // 2. Sign the challenge message
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      // 3. Send signature and wallet to backend for verification
      const verifyRes = await fetch(
        "http://127.0.0.1:8000/api/user/verify-login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: publicKey.toBase58(), // string
            signature: bs58.encode(signature), // base58 string
            nonce: nonce,
          }),
        }
      );

      const data = await verifyRes.json();
      if (verifyRes.ok) {
        localStorage.setItem("token", data.tokens.access);
        alert("Login successful");
        window.location.href = "/vendors";
      } else {
        console.error("Verify error:", data);
        alert("Login failed: " + JSON.stringify(data));
        
        
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Try again.");
      window.location.href = "/vendors";
      
    } finally {
      setLoading(false);
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (publicKey) handleLogin();
  }, [publicKey, handleLogin]);

  return (
    <div className="Login">
      <WalletButton />

      {loading && (
        <p className="text-center text-sm mt-2 text-gray-400 aut">
          Authenticating...
        </p>
      )}

      <h3 className="acc text-center font-light text-[13px] mt-[10px] mb-[20px]">
        Don't have an account?
        <a href="/signup" className="text-[#14F195] cursor-pointer ml-1">
          Create Account
        </a>
      </h3>
    </div>
  );
};

export default Login;
