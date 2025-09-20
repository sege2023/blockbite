import React, { useState } from "react";

export default function Header({ onSearch, onFilter }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

  const filters = ["All", "Drinks", "Rice", "Swallow"];

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilter = (filter) => {
    setActive(filter);
    onFilter(filter);
  };

  return (
    <div className="headerr">
      <input
        type="text"
        placeholder="Search for food"
        value={query}
        onChange={handleSearch}
        className="search"
      />
      <div className="filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`bbtn ${active === filter ? "active" : ""}`}
            onClick={() => handleFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
