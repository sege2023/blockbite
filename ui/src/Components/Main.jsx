
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCart } from "../store/cartSlice";

const Main = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  if (cartItems.length === 0) {
    return <p className="empty-checkout">Your cart is empty</p>;
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = 2.5;
  const deliveryFee = 3.99;
  const total = subtotal + tax + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!token) {
      alert("You must be logged in to place an order");
      return;
    }

    try {
      const items = cartItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      const response = await fetch("http://127.0.0.1:8000/pay/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("Order placement failed:", errData);
        alert("Failed to place order");
        return;
      }

      alert("Order placed successfully!");
      dispatch(setCart([])); 
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="checkout-page">

      <div className="order-summary-card">
        
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

      <button className="place-order-btn" onClick={handlePlaceOrder}>
        Pay Now
      </button>
    </div>
  );
};

export default Main;
