import React, { useState } from "react"

export default function Header({ onSearch, onFilter }) {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState("All")

  const filters = ["All", "Drinks", "Rice", "Swallow"]

  const handleSearch = (e) => {
    setQuery(e.target.value)
    onSearch(e.target.value)
  }

  const handleFilter = (filter) => {
    setActive(filter)
    onFilter(filter)
  }

  return (
    <div className="menu-header">
      <input
        type="text"
        placeholder="Search for food"
        value={query}
        onChange={handleSearch}
        className="menu-header__search"
      />

      <div className="menu-header__filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`menu-header__btn ${
              active === filter ? "active" : ""
            }`}
            onClick={() => handleFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}
