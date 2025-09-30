// import React, { useEffect, useState, useRef } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { setCart } from "../store/cartSlice";
// import { checkout } from "./checkout";
// import { PublicKey } from "@solana/web3.js";
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// import { getAssociatedTokenAddress } from '@solana/spl-token';
// const CartPage = () => {
//   const cartItems = useSelector((state) => state.cart.items);
//   const dispatch = useDispatch();
//   const { publicKey } = useWallet();
//   const { connection } = useConnection();
//   const [loading, setLoading] = useState(true);
//   // const [loading, setLoading] = useState(true);
//   const [checkoutStatus, setCheckoutStatus] = useState("idle");

//   const token = localStorage.getItem("token");

//   // Ref to store pending updates
//   const pendingUpdates = useRef({});

//   // Fetch cart from API on load
//   useEffect(() => {
//     const fetchCart = async () => {
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await fetch("http://127.0.0.1:8000/orders/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) throw new Error("Failed to fetch cart");
//         const data = await res.json();

//         const items =
//           data.results[0]?.items.map((item) => ({
//             productId: item.product_id,
//             name: item.product_name,
//             description: item.product_description || "",
//             price: Number(item.product_price),
//             quantity: item.quantity,
//             image: item.product_image || "",
//             vendor: item.product_vendor || "9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx", // From Order/Product
//             mint: item.product_mint || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // Devnet USDC
//           })) || [];

//         dispatch(setCart(items));
//       } catch (err) {
//         console.error("Cart API fetch failed:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCart();
//   }, [dispatch, token]);

//   // Function to flush pending updates to API
//   const flushUpdates = async () => {
//     if (!token || Object.keys(pendingUpdates.current).length === 0) return;

//     const updates = pendingUpdates.current;
//     pendingUpdates.current = {}; // reset

//     try {
//       for (const productId in updates) {
//         const quantity = updates[productId];
//         await fetch("http://127.0.0.1:8000/orders/", {
//           method: "POST", // adjust if your API uses PATCH
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ product_id: productId, quantity }),
//         });
//       }
//     } catch (err) {
//       console.error("Failed to flush cart updates:", err);
//     }
//   };

//   // Flush updates every 2 seconds and on unmount
//   useEffect(() => {
//     const interval = setInterval(flushUpdates, 2000);

//     return () => {
//       clearInterval(interval);
//       flushUpdates(); // flush pending updates before unmount
//     };
//   }, []);

//   const updateQuantity = (productId, delta) => {
//     const item = cartItems.find((p) => p.productId === productId);
//     if (!item) return;

//     const newQuantity = item.quantity + delta;
//     let updatedItems;
//     if (newQuantity <= 0) {
//       updatedItems = cartItems.filter((p) => p.productId !== productId);
//     } else {
//       updatedItems = cartItems.map((p) =>
//         p.productId === productId ? { ...p, quantity: newQuantity } : p
//       );
//     }

//     // Update Redux immediately
//     dispatch(setCart(updatedItems));

//     // Add to pending updates
//     pendingUpdates.current[productId] = newQuantity;
//   };

//   const increaseQuantity = (productId) => updateQuantity(productId, 1);
//   const decreaseQuantity = (productId) => updateQuantity(productId, -1);


//   const handleCheckout = async () => {
//     // if (!publicKey) {
//     //   alert("Connect your wallet first!");
//     //   return;
//     // }
//     if (cartItems.length === 0) {
//       alert("Cart is empty!");
//       return;
//     }

//     setCheckoutStatus("processing");
//     try {
//       const payload = {
//         items: cartItems.map((item) => ({
//           product: item.name,
//           quantity: item.quantity,
//         })),
//       };

//       const response = await fetch("http://127.0.0.1:8000/api/prepare_checkout/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) throw new Error("Failed to prepare checkout");
//       const data = await response.json();

//       const mintPubkey = new PublicKey(data.mint);
//       const buyerTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);

//       await checkout({
//         orderId: data.orderId,
//         price: data.price,
//         vendor: data.vendor,
//         buyerTokenAccount: buyerTokenAccount.toString(),
//         mint: data.mint,
//       });

//       dispatch(clearCart());
//       setCheckoutStatus("success");
//     } catch (error) {
//       console.error("Checkout error:", error);
//       alert("Checkout failed: " + error.message);
//       setCheckoutStatus("error");
//     }
//   };



//   if (loading) return <p>Loading cart...</p>;
//   if (cartItems.length === 0) return <p>Your cart is empty</p>;

//   return (
//     <div className="cart-page">
//       <h2>Cart</h2>
//       {cartItems.map((item) => (
//         <div key={item.productId} className="cart-item">
//           <img
//             src={item.image || "https://via.placeholder.com/150"}
//             alt={item.name}
//             className="cart-item-image"
//           />
//           <div className="cart-item-details">
//             <h3>{item.name}</h3>
//             <p>{item.description || "No description"}</p>
//             <p>${item.price}</p>
//             <div className="quantity-controls">
//               <button onClick={() => decreaseQuantity(item.productId)}>-</button>
//               <span>{item.quantity}</span>
//               <button onClick={() => increaseQuantity(item.productId)}>+</button>
//             </div>

//             <div>
//               <p>Total: ${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}</p>
//               <button onClick={handleCheckout}>
//                 {checkoutStatus === "processing" ? "Processing..." : "Proceed to Checkout"}
//                 checkout
//               </button>
//               {checkoutStatus === "success" && <p>Checkout successful!</p>}
//               {checkoutStatus === "error" && <p>Checkout failed. Try again.</p>}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default CartPage;

// import React, { useEffect, useState, useRef } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { setCart, clearCart } from "../store/cartSlice";
// import { checkout } from "./checkout";
// import { PublicKey } from "@solana/web3.js";
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// import { getAssociatedTokenAddress } from '@solana/spl-token';

// const CartPage = () => {
//   const cartItems = useSelector((state) => state.cart.items);
//   const dispatch = useDispatch();
//   const { publicKey } = useWallet();
//   const { connection } = useConnection();
//   const [loading, setLoading] = useState(true);
//   const [checkoutStatus, setCheckoutStatus] = useState("idle");

//   const token = localStorage.getItem("token");

//   // Ref to store pending updates
//   const pendingUpdates = useRef({});

//   // Fetch cart from API on load
//   useEffect(() => {
//     const fetchCart = async () => {
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await fetch("http://127.0.0.1:8000/orders/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) throw new Error("Failed to fetch cart");
//         const data = await res.json();

//         const items =
//           data.results[0]?.items.map((item) => ({
//             productId: item.product_id,
//             name: item.product_name,
//             description: item.product_description || "",
//             price: Number(item.product_price),
//             quantity: item.quantity,
//             image: item.product_image || "",
//             vendor: item.product_vendor || "9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx",
//             mint: item.product_mint || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
//           })) || [];

//         dispatch(setCart(items));
//       } catch (err) {
//         console.error("Cart API fetch failed:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCart();
//   }, [dispatch, token]);

//   // Function to flush pending updates to API
//   const flushUpdates = async () => {
//     if (!token || Object.keys(pendingUpdates.current).length === 0) return;

//     const updates = pendingUpdates.current;
//     // pendingUpdates.current = {};

//     try {
//       for (const productId in updates) {
//         const quantity = updates[productId];
//         await fetch("http://127.0.0.1:8000/orders/", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ product_id: productId, quantity }),
//         });
//       }
//     } catch (err) {
//       console.error("Failed to flush cart updates:", err);
//     }
//   };

//   // Flush updates every 2 seconds and on unmount
//   useEffect(() => {
//     const interval = setInterval(flushUpdates, 2000);

//     return () => {
//       clearInterval(interval);
//       flushUpdates();
//     };
//   }, []);

//   const updateQuantity = (productId, delta) => {
//     const item = cartItems.find((p) => p.productId === productId);
//     if (!item) return;

//     const newQuantity = item.quantity + delta;
//     let updatedItems;
//     if (newQuantity <= 0) {
//       updatedItems = cartItems.filter((p) => p.productId !== productId);
//     } else {
//       updatedItems = cartItems.map((p) =>
//         p.productId === productId ? { ...p, quantity: newQuantity } : p
//       );
//     }

//     dispatch(setCart(updatedItems));
//     pendingUpdates.current[productId] = newQuantity;
//   };

//   const increaseQuantity = (productId) => updateQuantity(productId, 1);
//   const decreaseQuantity = (productId) => updateQuantity(productId, -1);

//   const handleCheckout = async () => {
//     // if (!publicKey) {
//     //   alert("Connect your wallet first!");
//     //   return;
//     // }
//     if (cartItems.length === 0) {
//       alert("Cart is empty!");
//       return;
//     }

//     setCheckoutStatus("processing");
//     try {
//       // FIXED: Send product_id instead of product name
//       const payload = {
//         items: cartItems.map((item) => ({
//           product: item,  // 👈 Changed from product to product_id
//           quantity: item.quantity,
//         })),
//       };

//       const response = await fetch("http://127.0.0.1:8000/api/prepare_checkout/", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(JSON.stringify(errorData));
//       }
      
//       const data = await response.json();

//       const mintPubkey = new PublicKey(data.mint);
//       const buyerTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);

//       await checkout({
//         orderId: data.orderId,
//         price: data.price,
//         vendor: data.vendor,
//         buyerTokenAccount: buyerTokenAccount.toString(),
//         mint: data.mint,
//       });

//       dispatch(clearCart());
//       setCheckoutStatus("success");
//     } catch (error) {
//       console.error("Checkout error:", error);
//       alert("Checkout failed: " + error.message);
//       setCheckoutStatus("error");
//     }
//   };

//   if (loading) return <p>Loading cart...</p>;
//   if (cartItems.length === 0) return <p>Your cart is empty</p>;

//   const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   return (
//     <div className="cart-page">
//       <h2>Cart</h2>
//       {cartItems.map((item) => (
//         <div key={item.productId} className="cart-item">
//           <img
//             src={item.image || "https://via.placeholder.com/150"}
//             alt={item.name}
//             className="cart-item-image"
//           />
//           <div className="cart-item-details">
//             <h3>{item.name}</h3>
//             <p>{item.description || "No description"}</p>
//             <p>${item.price}</p>
//             <div className="quantity-controls">
//               <button onClick={() => decreaseQuantity(item.productId)}>-</button>
//               <span>{item.quantity}</span>
//               <button onClick={() => increaseQuantity(item.productId)}>+</button>
//             </div>
//           </div>
//         </div>
//       ))}
      
//       <div className="cart-summary">
//         <p>Total: ${totalPrice.toFixed(2)}</p>
//         <button onClick={handleCheckout} disabled={checkoutStatus === "processing"}>
//           {checkoutStatus === "processing" ? "Processing..." : "Proceed to Checkout"}
//         </button>
//         {checkoutStatus === "success" && <p>Checkout successful!</p>}
//         {checkoutStatus === "error" && <p>Checkout failed. Try again.</p>}
//       </div>
//     </div>
//   );
// };

// export default CartPage;


import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCart, clearCart } from "../store/cartSlice";
import { PublicKey, Transaction } from "@solana/web3.js"; // <-- Import Transaction
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { loadCart, saveCart, CART_STORAGE_KEY } from "./cartStorage"; // <-- Import loadCart/saveCart/KEY

const CartPage = () => {
    const cartItems = useSelector((state) => state.cart.items);
    const dispatch = useDispatch();
    const { publicKey, sendTransaction, wallet } = useWallet(); // <-- Use sendTransaction/wallet
    const { connection } = useConnection();
    const [loading, setLoading] = useState(false); // No more initial API loading
    const [checkoutStatus, setCheckoutStatus] = useState("idle");

    // 1. Initial Load: Load cart from Local Storage to Redux
    useEffect(() => {
        const initialCart = loadCart();
        dispatch(setCart(initialCart));
    }, [dispatch]);

    // 2. Quantity Update (Directly update Redux and Local Storage)
    const updateQuantity = (productId, delta) => {
        const currentCart = loadCart();
        const item = currentCart.find((p) => p.productId === productId);
        if (!item) return;

        const newQuantity = item.quantity + delta;
        let updatedItems;

        if (newQuantity <= 0) {
            // Remove item
            updatedItems = currentCart.filter((p) => p.productId !== productId);
        } else {
            // Update quantity
            updatedItems = currentCart.map((p) =>
                p.productId === productId ? { ...p, quantity: newQuantity } : p
            );
        }

        // Update Redux and Local Storage
        dispatch(setCart(updatedItems));
        saveCart(updatedItems);
    };

    const increaseQuantity = (productId) => updateQuantity(productId, 1);
    const decreaseQuantity = (productId) => updateQuantity(productId, -1);


    // 3. Checkout Logic (Using your Express.js flow)
    const handleCheckout = async () => {
        if (!publicKey || !wallet) {
            alert("Please connect your wallet first!");
            return;
        }

        // Load current cart from the single source of truth (Local Storage is safest here)
        const currentCartItems = loadCart();

        if (currentCartItems.length === 0) {
            alert("Cart is empty!");
            return;
        }

        setCheckoutStatus("processing");
        
        // Calculate Total Price and Payload
        const vendorPubKey = currentCartItems[0].vendorPubKey; 
        const totalUsdcPrice = currentCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const USDC_DECIMALS = 6;
        const priceU64 = Math.round(totalUsdcPrice * Math.pow(10, USDC_DECIMALS));

        const payload = {
            buyerPubKey: publicKey.toBase58(),
            order: {
                vendorPubKey: vendorPubKey,
                priceU64: priceU64,
                items: currentCartItems,
            },
        };

        try {
            // A. Call Express Backend to prepare the partially-signed transaction
            const prepareResponse = await fetch("http://localhost:3000/api/checkout/prepare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!prepareResponse.ok) {
                const errorData = await prepareResponse.json();
                throw new Error(`Backend Error: ${JSON.stringify(errorData)}`);
            }

            const { offChainOrderId, serializedTransaction } = await prepareResponse.json();

            // B. Deserialize, Sign, and Send Transaction
            const transaction = Transaction.from(Buffer.from(serializedTransaction, "base64"));
            
            // Use wallet adapter's sendTransaction (handles signing and sending)
            const signature = await sendTransaction(transaction, connection, {
                 // Ensure the vendor signature isn't dropped by only requiring the buyer's signature
                 signers: [], 
            }); 
            console.log("Transaction Signature:", signature);

            // C. Wait for confirmation (optional, but good practice)
            await connection.confirmTransaction(signature, "confirmed");

            // D. Notify Express Backend of success (to save signature in DB)
            const confirmResponse = await fetch("http://localhost:3000/api/checkout/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    offChainOrderIds: [offChainOrderId], 
                    transactionSignature: signature 
                }),
            });
            
            if (!confirmResponse.ok) {
                // Log but don't fail, the payment is done on-chain
                console.error("Backend confirmation failed:", await confirmResponse.text());
            }

            // E. Success Cleanup
            localStorage.removeItem(CART_STORAGE_KEY);
            dispatch(clearCart());
            setCheckoutStatus("success");
            alert(`Payment Successful! Signature: ${signature}`);
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout failed. Check console for details.");
            setCheckoutStatus("error");
        }
    };


    if (cartItems.length === 0) return <p>Your cart is empty 🛒</p>;

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="cart-page">
            <h2>Cart Summary</h2>
            {cartItems.map((item) => (
                <div key={item.productId} className="cart-item">
                    <img
                        src={item.image || "https://via.placeholder.com/100"}
                        alt={item.name}
                        className="cart-item-image"
                    />
                    <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p>\${item.price.toFixed(2)} x {item.quantity}</p>
                        <div className="quantity-controls">
                            <button onClick={() => decreaseQuantity(item.productId)} disabled={checkoutStatus === "processing"}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => increaseQuantity(item.productId)} disabled={checkoutStatus === "processing"}>+</button>
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="cart-summary">
                <p>Total: \${totalPrice.toFixed(2)}</p>
                <button onClick={handleCheckout} disabled={checkoutStatus === "processing" || !publicKey}>
                    {checkoutStatus === "processing" ? "Processing Transaction..." : "Proceed to Checkout (Solana Pay)"}
                </button>
                {checkoutStatus === "success" && <p style={{color: 'green'}}>✅ Payment successful! Order placed.</p>}
                {checkoutStatus === "error" && <p style={{color: 'red'}}>❌ Checkout failed. Check wallet connection and console.</p>}
                {!publicKey && <p style={{color: 'orange'}}>Please connect your Solana wallet to checkout.</p>}
            </div>
        </div>
    );
};

export default CartPage;