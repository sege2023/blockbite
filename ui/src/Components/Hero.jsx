import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCart } from "../store/cartSlice";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart?.items || []);
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
        const res = await fetch("http://127.0.0.1:8000/user-orders/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();

        const items =
          data.results[0]?.items.map((item) => ({
            productId: item.product_id,
            name: item.product_name,
            description: item.product_description || item.description || "",
            price: Number(item.product_price),
            quantity: item.quantity,
            image: item.product_image || "",
            vendor:
              item.product_vendor ||
              "9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx",
            mint:
              item.product_mint ||
              "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
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

  const flushUpdates = useCallback(async () => {
    if (!token || Object.keys(pendingUpdates.current).length === 0) return;

    const updates = pendingUpdates.current;
    pendingUpdates.current = {};

    try {
      const items = Object.entries(updates)
        .filter(([_, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({
          product: parseInt(id, 10),
          quantity,
        }));

      if (items.length === 0) return;

      await fetch("http://127.0.0.1:8000/create-orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error("Failed to flush cart updates:", err);
    }
  }, [token]);

  useEffect(() => {
    const interval = setInterval(flushUpdates, 2000);
    return () => {
      clearInterval(interval);
      flushUpdates();
    };
  }, [flushUpdates]);

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
  if (cartItems.length === 0)
    return <p className="empty-cart">Your cart is empty</p>;

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Cart</h2>

      <div className="cart-items">
        {cartItems.map((item) => (
          <div key={item.productId} className="cart-item">
            <img
              src={item.image || "https://dummyimage.com/80x80/cccccc/000000.png&text=Product"}
              alt={item.name}
              className="cart-item-image"
            />
            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p className="description">{item.description}</p>
              <p className="price">${item.price.toFixed(2)}</p>
            </div>
            <div className="quantity-controls">
              <button
                onClick={() => decreaseQuantity(item.productId)}
                className="decrease"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => increaseQuantity(item.productId)}
                className="increase"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-actions">
        <button className="continue-btn" onClick={() => navigate("/vendors")}>
          Continue Shopping
        </button>
        <button className="checkout-btn" onClick={() => navigate("/checkout")}>
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
