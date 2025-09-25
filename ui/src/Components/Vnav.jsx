import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';


const Vnav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="vnav">
      <div className="logo">Blockbite</div>

      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <a href="/dashboard">Dashboard</a>
        <a href="/orders">Orders</a>
        <a href="/menu">Menu</a>
        
      </div>

      <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes size={25} color="#fff" /> : <FaBars size={25} color="#fff" />}
      </div>
    </nav>
  );
};

export default Vnav;
