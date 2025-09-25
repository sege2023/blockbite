import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';


const Vnav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="vnav">
      <div className="logo">Blockbite</div>

      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <a href="/dashboard">Dashboard</a>
        <a href="/orders">Orders</a>
        <a href="/menu">Menu</a>
        <a href="/profile">Profile</a>
      </div>

      <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiX size={25} color="#fff" /> : <FiMenu size={25} color="#fff" />}
      </div>
    </nav>
  );
};

export default Vnav;
