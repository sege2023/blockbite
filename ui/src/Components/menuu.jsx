import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, setCart } from "../store/cartSlice";

const MenuPage = ({ searchQuery, activeFilter }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleAddToCart = async (product) => {
    dispatch(addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
    }));

    const token = localStorage.getItem("token");
    if (!token) return; 

    try {
      await fetch("http://127.0.0.1:8000/orders/", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        }),
      });
    } catch (err) {
      console.error("Failed to update cart on server:", err);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first.");
        navigate("/");
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
          navigate("/");
          return;
        }

        if (!res.ok) throw new Error(`Failed to fetch products. Status: ${res.status}`);

        const data = await res.json();
        setProducts(data.results || data);
        setFilteredProducts(data.results || data);
      } catch (err) {
        console.error("API fetch failed:", err.message);
        setError("API fetch failed. Showing mock data.");

        const mockData = [
          { id: 1, name: "Jollof Rice", description: "Spicy rice", price: 20, stock: 5, category: "Rice", image: null },
          { id: 2, name: "Semo", description: "Hot semo and soup", price: 25, stock: 2, category: "Swallow", image: null },
          { id: 3, name: "Coke", description: "Chilled soft drink", price: 8, stock: 10, category: "Drinks", image: null },
        ];
        setProducts(mockData);
        setFilteredProducts(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://127.0.0.1:8000/orders/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch cart. Status: ${res.status}`);
        const data = await res.json();
        const items = data.results[0]?.items.map(item => ({
          productId: item.product_id,
          name: item.product_name,
          price: Number(item.product_price),
          quantity: item.quantity
        })) || [];
        dispatch(setCart(items));
      } catch (err) {
        console.error("Failed to fetch cart from server:", err);
      }
    };
    fetchCart();
  }, [dispatch]);

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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imagePath.startsWith("http") ? imagePath : `http://127.0.0.1:8000${imagePath}`;
  };

  if (loading) return <p>Loading products...</p>;
  if (filteredProducts.length === 0) return <p>No products found.</p>;

  return (
    <div>
      <h2 style={{ padding: "1rem" }}>Menu</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="menu-grid">
        {filteredProducts.map((product, index) => (
          <div key={index} className="iitem">
            <div className="imager">
              <img src={getImageUrl(product.image)} alt={product.name} />
            </div>
            <div className="iitem__details">
              <h3>{product.name}</h3>
              <p className="desc">{product.description}</p>
              <p className="price">${product.price}</p>
              <p className="stock">
                {product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}
              </p>
              <button
                className="add-btn"
                onClick={() => handleAddToCart(product)}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
