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

import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCart } from "../store/cartSlice";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const pendingUpdates = useRef({});

  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/orders/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();

        const items =
          data.results[0]?.items.map((item) => ({
            productId: item.product_id,
            name: item.product_name,
            description: item.product_description || "",
            price: Number(item.product_price),
            quantity: item.quantity,
            image: item.product_image || "",
            vendor: item.product_vendor || "9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx",
            mint: item.product_mint || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          })) || [];

        dispatch(setCart(items));
      } catch (err) {
        console.error("Cart API fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [dispatch, token]);

  const flushUpdates = async () => {
    if (!token || Object.keys(pendingUpdates.current).length === 0) return;

    const updates = pendingUpdates.current;
    pendingUpdates.current = {};

    try {
      for (const productId in updates) {
        const quantity = updates[productId];
        await fetch("http://127.0.0.1:8000/orders/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: productId, quantity }),
        });
      }
    } catch (err) {
      console.error("Failed to flush cart updates:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(flushUpdates, 2000);
    return () => {
      clearInterval(interval);
      flushUpdates();
    };
  }, []);

  const updateQuantity = (productId, delta) => {
    const item = cartItems.find((p) => p.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    let updatedItems;
    if (newQuantity <= 0) {
      updatedItems = cartItems.filter((p) => p.productId !== productId);
    } else {
      updatedItems = cartItems.map((p) =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      );
    }

    dispatch(setCart(updatedItems));
    pendingUpdates.current[productId] = newQuantity;
  };

  const increaseQuantity = (productId) => updateQuantity(productId, 1);
  const decreaseQuantity = (productId) => updateQuantity(productId, -1);

  if (loading) return <p className="loading">Loading cart...</p>;
  if (cartItems.length === 0) return <p className="empty-cart">Your cart is empty</p>;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = 2.5;
  const deliveryFee = 3.99;
  const total = subtotal + tax + deliveryFee;

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Cart</h2>

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.productId} className="cart-item">
            <img
              src={item.image || "https://via.placeholder.com/80"}
              className="cart-item-image"
            />
            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p className="description">{item.description || "No description"}</p>
              <p className="price">${item.price.toFixed(2)}</p>
            </div>
            <div className="quantity-controls">
              <button onClick={() => decreaseQuantity(item.productId)} className="decrease">-</button>
              <span>{item.quantity}</span>
              <button onClick={() => increaseQuantity(item.productId)} className="increase">+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery Fee</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>

        <div className="summary-total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button className="continue-btn"
        onClick={() => navigate("/vendors")}>Continue Shopping</button>
        <button
          className="checkout-btn"
          onClick={() => navigate("/checkout")}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;