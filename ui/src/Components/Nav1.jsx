import React from "react"
import { FaShoppingCart, FaUtensils } from "react-icons/fa"

export default function Nav1() {
  return (
    <nav className="navv">
      <div className="navv__logo">
        <FaUtensils className="navv__logo-icon" />
        <span className="navv__logo-text">BlockBite</span>
      </div>

      <div className="navv__cart">
        <FaShoppingCart className="cart-icon" />
        <span className="cart-badge">7</span>
      </div>
    </nav>
  )
}
