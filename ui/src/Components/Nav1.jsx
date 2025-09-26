import React from "react";
import { FaShoppingCart, FaUtensils } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function Nav1() {
  const cartItems = useSelector((state) => state.cart.items);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="navv">
      <div className="navv__logo">
        <FaUtensils className="navv__logo-icon" />
        <span className="navv__logo-text">BlockBite</span>
      </div>

      <div className="navv__cart">
        <Link to="/cart">
          <FaShoppingCart className="cart-icon" />
          <span className="cart-badge">{totalQuantity}</span>
        </Link>
      </div>
    </nav>
  );
}
