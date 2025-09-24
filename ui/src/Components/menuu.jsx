import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const MenuPage = ({ searchQuery, activeFilter }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");

      // if (!token) {
      //   alert("Please login first.");
      //   navigate("/");
      //   return;
      // }

      try {
        const res = await fetch("http://127.0.0.1:8000/products/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // if (res.status === 401) {
        //   alert("Session expired. Please login again.");
        //   localStorage.removeItem("token");
        //   localStorage.removeItem("refresh");
        //   navigate("/");
        //   return;
        // }

        if (!res.ok) {
          throw new Error(`Failed to fetch products. Status: ${res.status}`);
        }

        const data = await res.json();
        console.log("API Data:", data);
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        
        const mockData = [
          {
            name: "Jollof Rice",
            description: "Spicy rice",
            price: 20,
            stock: 5,
            category: "Rice",
          },
          {
            name: "Semo",
            description: "Hot semo and soup",
            price: 25,
            stock: 2,
            category: "Swallow",
          },
          {
            name: "Coke",
            description: "Chilled soft drink",
            price: 8,
            stock: 10,
            category: "Drinks",
          },
        ];
        console.log("Mock Data:", mockData);
        setProducts(mockData);
        setFilteredProducts(mockData);
        setError(null);
        

        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  useEffect(() => {
    let temp = [...products];

    if (activeFilter && activeFilter !== "All") {
      temp = temp.filter((p) => p.category === activeFilter);
    }

    if (searchQuery) {
      temp = temp.filter((p) =>
        (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(temp);
  }, [products, activeFilter, searchQuery]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (filteredProducts.length === 0) return <p>No products found.</p>;

  return (
    <div>
      <h2 style={{ padding: "1rem" }}>Menu</h2>
      <div className="menu-grid">
        {filteredProducts.map((product, index) => (
          <div key={index} className="iitem">
            <div className="imager">
              <img
                src="https://via.placeholder.com/150"
                alt={product.name}
              />
              <button className="fav-btn">♥</button>
            </div>
            <div className="iitem__details">
              <h3>{product.name}</h3>
              <p className="desc">{product.description}</p>
              <p className="price">${product.price}</p>
              <p className="stock">
                {product.stock > 0
                  ? `In Stock: ${product.stock}`
                  : "Out of Stock"}
              </p>
              <button className="add-btn">Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
