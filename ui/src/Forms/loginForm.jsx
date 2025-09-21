import React, {useEffect} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "../Components/walletConnect";

const Login = () => {
  const { publicKey, signMessage } = useWallet();
  useEffect(() => {
    if (publicKey) {
      // Wallet just connected → run your login logic
      handleLogin();
    }
  }, [publicKey]);

  const handleLogin = async () => {
    if (!publicKey || !signMessage) {
      alert("Connect wallet first");
      return;
    }

    // 1. Get challenge (nonce) from backend
    const challengeRes = await fetch("http://127.0.0.1:8000/api/auth/challenge/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: publicKey.toBase58() }),
    });
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
      localStorage.setItem("token", data.access); // store JWT
      alert("Login success");
      window.location.href = "/vendors";
    } else {
      alert("Login failed: " + JSON.stringify(data));
    }
  };

  return (
   <>
     <div className="Login">
      {/* <WalletMultiButton /> */}
      <WalletButton/>
    </div>
    <h3 className="acc text-center font-light text-[13px] ml-[-50px] mt-[10px] mb-[20px]">
      Don't have an account?
      <a href="/signup" className="text-[#14F195] cursor-pointer"> Create Account</a>
    </h3>
   </>
  );
};
// function handleLogin(walletAddr) {
//   console.log("Logging in with wallet:", walletAddr);
//   // Call backend here
// }

export default Login;
