import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";


const Footer = () => {
  const location = useLocation();

  const navItems = [
    { path: "/vendors", label: "Home", icon: <FaHome /> },
    { path: "/Favorites", label: "Favorites", icon: <FaHeart /> },
    { path: "/orders", label: "Orders", icon: <FaShoppingBag /> },
    { path: "/profile", label: "Profile", icon: <FaUser /> },
  ];

  return (
    <nav className="footer">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`item ${location.pathname === item.path ? "active" : ""}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Footer;
