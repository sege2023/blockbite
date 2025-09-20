import React from "react";
import { FaHeart } from "react-icons/fa";

const MenuItem = ({ name, price, image, onAdd, onFav }) => {
  return (
    <div className="iitem">
      <div className="imager">
        <img src={image} alt={name} />
        <button className="fav-btn" onClick={onFav}>
          <FaHeart />
        </button>
      </div>
      <div className="menu-item__details">
        <h3>{name}</h3>
        <p className="price">${price}</p>
        <button className="add-btn" onClick={onAdd}>Add to Cart</button>
      </div>
    </div>
  );
};

export default MenuItem;
