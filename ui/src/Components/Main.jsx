import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCart } from "../store/cartSlice";

const CheckoutPage = () => {
  const cartItems = useSelector((state) => state.cart.items || []);
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);

  // Fetch cart from server on page load
  useEffect(() => {
    const fetchCart = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/user-orders/", {
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
          })) || [];

        dispatch(setCart(items));
      } catch (err) {
        console.error("Cart fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [dispatch, token]);

  if (loading) return <p>Loading checkout...</p>;
  if (cartItems.length === 0) return <p>Your cart is empty</p>;

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

export default CheckoutPage;
