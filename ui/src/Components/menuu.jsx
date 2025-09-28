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

  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    dispatch(addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
    }));

    const token = localStorage.getItem("token");
    if (!token) return; // skip API if not logged in

    try {
      await fetch("http://127.0.0.1:8000/orders/", {
        method: "POST", // adjust if your API uses PATCH for existing orders
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

  // Fetch products from backend
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

        if (!res.ok) throw new Error(`Failed to fetch products. Status: ${res.status}`);

        const data = await res.json();
        console.log("API Data:", data);
        setProducts(data.results || data);
        setFilteredProducts(data.results || data);
      } catch (err) {
        console.error("API fetch failed:", err.message);
        setError("API fetch failed. Showing mock data.");

        const mockData = [
          {
            id: 1,
            name: "Jollof Rice",
            description: "Spicy rice",
            price: 20,
            stock: 5,
            category: "Rice",
          },
          {
            id: 2,
            name: "Semo",
            description: "Hot semo and soup",
            price: 25,
            stock: 2,
            category: "Swallow",
          },
          {
            id: 3,
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
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  // Fetch existing cart items for logged in user
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

  // Filter products based on search and category
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
  if (filteredProducts.length === 0) return <p>No products found.</p>;

  return (
    <div>
      <h2 style={{ padding: "1rem" }}>Menu</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="menu-grid">
        {filteredProducts.map((product, index) => (
          <div key={index} className="iitem">
            {/* Image and favorite button commented out */}
            {/* <div className="imager">
              <img src="https://via.placeholder.com/150" alt={product.name} />
              <button className="fav-btn">♥</button>
            </div> */}
            <div className="imager">
              <img src="https://via.placeholder.com/150" alt={product.name} />
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
