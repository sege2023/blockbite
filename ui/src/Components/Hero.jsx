import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCart } from "../store/cartSlice";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Ref to store pending updates
  const pendingUpdates = useRef({});

  // Fetch cart from API on load
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

  // Function to flush pending updates to API
  const flushUpdates = async () => {
    if (!token || Object.keys(pendingUpdates.current).length === 0) return;

    const updates = pendingUpdates.current;
    pendingUpdates.current = {}; // reset

    try {
      // Convert pending updates into backend-compatible format
      const itemsPayload = Object.entries(updates).map(
        ([productId, quantity]) => ({
          product: productId, // matches your serializer slug_field or PK
          quantity,
        })
      );

      const res = await fetch("http://127.0.0.1:8000/create-orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Cart update failed:", errData);
      } else {
        const data = await res.json();
        console.log("Cart updated:", data);
      }
    } catch (err) {
      console.error("Failed to flush cart updates:", err);
    }
  };

  // Flush updates every 2 seconds and on unmount
  useEffect(() => {
    const interval = setInterval(flushUpdates, 2000);

    return () => {
      clearInterval(interval);
      flushUpdates(); // flush pending updates before unmount
    };
  }, []);

  const updateQuantity = (productId, delta) => {
    const item = cartItems.find((p) => p.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    let updatedItems;

    if (newQuantity <= 0) {
      // remove from frontend cart
      updatedItems = cartItems.filter((p) => p.productId !== productId);
    } else {
      updatedItems = cartItems.map((p) =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      );
    }

    // Update Redux immediately
    dispatch(setCart(updatedItems));

    // Add to pending updates
    pendingUpdates.current[productId] = newQuantity;
  };

  const increaseQuantity = (productId) => updateQuantity(productId, 1);
  const decreaseQuantity = (productId) => updateQuantity(productId, -1);

  if (loading) return <p>Loading cart...</p>;
  if (cartItems.length === 0) return <p>Your cart is empty</p>;

  return (
    <div className="cart-page">
      <h2>Cart</h2>
      {cartItems.map((item) => (
        <div key={item.productId} className="cart-item">
          <img
            src={item.image || "https://via.placeholder.com/150"}
            alt={item.name}
            className="cart-item-image"
          />
          <div className="cart-item-details">
            <h3>{item.name}</h3>
            <p>{item.description || "No description"}</p>
            <p>${item.price}</p>
            <div className="quantity-controls">
              <button onClick={() => decreaseQuantity(item.productId)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => increaseQuantity(item.productId)}>+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartPage;
