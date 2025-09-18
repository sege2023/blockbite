import React from "react";
import MenuItem from "../Components/menu.jsx";

const MenuPage = () => {
  const items = [
    { name: "Jollof Rice", price: 5, image: "/images/Jollofrice.jpg" },
    { name: "Eba & Egusi", price: 7, image: "/images/eba.jpg" },
    { name: "Pepsi", price: 2, image: "/images/pepsi.jpg" },
  ];

  return (
    <div className="menu-grid">
      {items.map((item, index) => (
        <MenuItem
          key={index}
          name={item.name}
          price={item.price}
          image={item.image}
          onAdd={() => console.log(`Added ${item.name}`)}
        />
      ))}
    </div>
  );
};

export default MenuPage;
