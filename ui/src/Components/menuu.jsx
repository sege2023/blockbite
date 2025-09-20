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
      if (!token) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/products/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert("Session expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch products. Status: ${res.status}`);
        }

        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setError(err.message);
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
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(temp);
  }, [products, activeFilter, searchQuery]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (filteredProducts.length === 0) return <p>No products found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Menu</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredProducts.map((product, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#fafafa",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>{product.name}</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              {product.description}
            </p>
            <p style={{ fontWeight: "bold", margin: "10px 0" }}>
              Price: ₦{product.price}
            </p>
            <p
              style={{
                fontSize: "14px",
                color: product.stock > 0 ? "green" : "red",
              }}
            >
              {product.stock > 0
                ? `In Stock: ${product.stock}`
                : "Out of Stock"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
