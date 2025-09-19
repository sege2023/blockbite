import React, { useState } from "react";
import MenuItem from "../Components/menu.jsx";
import Header from "../Components/Header.jsx";

const MenuPage = () => {
  const items = [
    { name: "Jollof Rice", price: 5, image: "/images/Jollofrice.jpg", category: "Rice" },
    { name: "Eba & Egusi", price: 7, image: "/images/eba.jpg", category: "Swallow" },
    { name: "Pepsi", price: 2, image: "/images/pepsi.jpg", category: "Drinks" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <Header onSearch={setSearchQuery} onFilter={setFilter} />

      <div className="menu-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <MenuItem
              key={index}
              name={item.name}
              price={item.price}
              image={item.image}
              onAdd={() => console.log(`Added ${item.name}`)}
            />
          ))
        ) : (
          <p className="no-results">No items found.</p>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
