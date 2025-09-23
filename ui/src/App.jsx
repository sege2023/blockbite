
// import React from 'react'
// import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Pages/login.jsx'
import Signup from './Pages/Signup.jsx'
import Vendors from './Pages/Vendors.jsx'
import Favourite from './Pages/Favourite.jsx'
import ProtectedRoute from "./Components/ProtectedRoute.jsx"
// import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
// import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// const wallets = [new PhantomWalletAdapter()];

// const App = () => {
//   return (
//     <>
//       <BrowserRouter>
//         <Routes>
//           <Route path='/' element={<Login/>}/>
//           <Route path='/signup' element={<Signup/>}/>
//           <Route
//             path='Vendors' element={
//               <ProtectedRoute>
//                 <Vendors/>
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </BrowserRouter>

//       <ConnectionProvider endpoint="https://api.devnet.solana.com">
//         <WalletProvider wallets={wallets} autoConnect>
//           <WalletModalProvider>
//             <YourRoutes />
//           </WalletModalProvider>
//         </WalletProvider>
//       </ConnectionProvider>
//     </>
//   )
// }

// export default App

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react'
import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets'
import './App.css'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import Home from './pages/home';

function App() {
  const wallets = [new PhantomWalletAdapter()]
  const network = WalletAdapterNetwork.Devnet

  return (
    <ConnectionProvider endpoint={`https://api.${network}.solana.com`}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/" element={<Login />} />

              <Route path="/signup" element={<Signup />} />

              <Route
                path="/vendors"
                element={
                  <ProtectedRoute>
                    <Vendors />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/favourite"
                element={
                  <ProtectedRoute>
                    <Favourite />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
