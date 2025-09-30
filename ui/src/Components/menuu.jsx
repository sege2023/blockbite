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

  // Refresh token helper
  const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return false;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access);
        return true;
      } else {
        
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        return false;
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      return false;
    }
  };

  
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token available");
    }

    
    let res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    
    if (res.status === 401) {
      console.log("Token expired, attempting refresh...");
      const refreshed = await refreshToken();
      
      if (refreshed) {
        const newToken = localStorage.getItem("token");
        res = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      } else {
        
        alert("Session expired. Please login again.");
        navigate("/");
        throw new Error("Authentication failed");
      }
    }

    return res;
  };

  
  const handleAddToCart = async (product) => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
      })
    );

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetchWithAuth("http://127.0.0.1:8000/create-orders/", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              product: product.id,
              quantity: 1,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Order create failed:", errData);
      } else {
        const data = await res.json();
        console.log("Order created:", data);
      }
    } catch (err) {
      console.error("Network error creating order:", err.message);
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first.");
        navigate("/");
        return;
      }

      try {
        const res = await fetchWithAuth("http://127.0.0.1:8000/products/");

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
        const res = await fetchWithAuth("http://127.0.0.1:8000/user-orders/");

        if (res.status === 403) {
          console.warn("Forbidden: user not allowed to access orders");
          return;
        }

        if (!res.ok) throw new Error(`Failed to fetch cart. Status: ${res.status}`);

        const data = await res.json();
        const orders = data.results || [];
        const latestOrder = orders[0];

        const items =
          latestOrder?.items?.map((item) => ({
            productId: item.product,
            name: item.product_name,
            price: Number(item.product_price),
            quantity: item.quantity,
          })) || [];

        dispatch(setCart(items));
      } catch (err) {
        console.error("Failed to fetch cart from server:", err);
      }
    };

    fetchCart();
  }, [dispatch]);

  // Filtering
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
    if (!imagePath) return "https://dummyimage.com/80x80/cccccc/000000.png&text=Product";
    if (imagePath.startsWith("http")) return imagePath;
    
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `http://127.0.0.1:8000${cleanPath}`;
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
              <button className="add-btn" onClick={() => handleAddToCart(product)}>
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