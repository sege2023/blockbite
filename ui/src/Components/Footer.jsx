import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaHeart, FaShoppingCart, FaCreditCard } from "react-icons/fa";

const Footer = () => {
  const location = useLocation();

  const navItems = [
    { path: "/vendors", label: "Home", icon: <FaHome /> },
    { path: "/cart", label: "Cart", icon: <FaShoppingCart /> },
    { path: "/checkout", label: "Checkout", icon: <FaCreditCard /> },
  ];

  return (
    <nav className="footer">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`item ${isActive ? "active" : ""}`}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Footer;
