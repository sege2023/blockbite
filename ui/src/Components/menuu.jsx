// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { addToCart, setCart } from "../store/cartSlice";
// import { loadCart, saveCart } from "./cartStorage";

// const MenuPage = ({ searchQuery, activeFilter }) => {
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // const handleAddToCart = async (product) => {
//   //   // update Redux cart instantly
//   //   dispatch(
//   //     addToCart({
//   //       productId: product.id,
//   //       name: product.name,
//   //       price: Number(product.price),
//   //     })
//   //   );

//   //   const token = localStorage.getItem("token");
//   //   if (!token) return;

//   //   try {
//   //     await fetch("http://127.0.0.1:8000/create-orders/", {
//   //       method: "POST", 
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //         Authorization: `Bearer ${token}`,
//   //       },
//   //       body: JSON.stringify({
//   //         // product_name: product.name,
//   //         // product_id: product.id,
//   //         // quantity: 1
//   //         items: [
//   //           {
//   //             // The OrderItem object must contain 'product' (ID) and 'quantity'
//   //             // name: product.name,
//   //             product: product.id, // <--- Send the product ID
//   //             quantity: 1
//   //           }
//   //         ]
//   //       }),
//   //     });

//   //     if (!res.ok) {
//   //       const errData = await res.json();
//   //       console.error("Order create failed:", errData);
//   //     } else {
//   //       const data = await res.json();
//   //       console.log("Order created:", data);
//   //     }
//   //   } catch (err) {
//   //     console.error("Network error creating order:", err.message);
//   //   }
//   // };
// const handleAddToCart = (product) => {
//   // 1. Get current cart from local storage
//   const currentCart = loadCart();

//   // Assuming product object has: id, name, price, vendorPubKey (REQUIRED!)
//   const productToAdd = {
//     productId: product.id,
//     name: product.name,
//     price: Number(product.price),
//     vendorPubKey: product.vendor, // <-- MUST contain the vendor's PubKey
//     quantity: 1, // Default to 1
//   };

//   // 2. Check if item already exists
//   const existingItemIndex = currentCart.findIndex(
//     (item) => item.productId === product.id
//   );

//   let newCart;
//   if (existingItemIndex !== -1) {
//     // Increase quantity
//     newCart = currentCart.map((item, index) =>
//       index === existingItemIndex
//         ? { ...item, quantity: item.quantity + 1 }
//         : item
//     );
//   } else {
//     // Add new item
//     newCart = [...currentCart, productToAdd];
//   }

//   // 3. Update Redux (assuming you have a reducer for this)
//   dispatch(
//     addToCart({
//       productId: productToAdd.productId,
//       name: productToAdd.name,
//       price: productToAdd.price,
//       quantity: 1, // Redux needs the change, or you pass the full newCart
//     })
//   );

//   // 4. Update local storage
//   saveCart(newCart);

//   console.log("Item added to cart and saved to local storage.");
// };

//   useEffect(() => {
//     const fetchProducts = async () => {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         alert("Please login first.");
//         navigate("/");
//         return;
//       }

//       try {
//         const res = await fetch("http://127.0.0.1:8000/products/", {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (res.status === 401) {
//           alert("Session expired. Please login again.");
//           localStorage.removeItem("token");
//           localStorage.removeItem("refresh");
//           navigate("/");
//           return;
//         }

//         if (!res.ok) throw new Error(`Failed to fetch products. Status: ${res.status}`);

//         const data = await res.json();
//         setProducts(data.results || data);
//         setFilteredProducts(data.results || data);
//       } catch (err) {
//         console.error("API fetch failed:", err.message);
//         setError("API fetch failed. Showing mock data.");

//         const mockData = [
//           { id: 1, name: "Jollof Rice", description: "Spicy rice", price: 20, stock: 5, category: "Rice", image: null },
//           { id: 2, name: "Semo", description: "Hot semo and soup", price: 25, stock: 2, category: "Swallow", image: null },
//           { id: 3, name: "Coke", description: "Chilled soft drink", price: 8, stock: 10, category: "Drinks", image: null },
//         ];
//         setProducts(mockData);
//         setFilteredProducts(mockData);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, [navigate]);

//   useEffect(() => {
//     const fetchCart = async () => {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       try {
//         const res = await fetch("http://127.0.0.1:8000/orders/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) throw new Error(`Failed to fetch cart. Status: ${res.status}`);
//         const data = await res.json();
//         const items =
//           data.results[0]?.items.map((item) => ({
//             productId: item.product_id,
//             name: item.product_name,
//             price: Number(item.product_price),
//             quantity: item.quantity,
//           })) || [];
//         dispatch(setCart(items));
//       } catch (err) {
//         console.error("Failed to fetch cart from server:", err);
//       }
//     };
//     fetchCart();
//   }, [dispatch]);

//   useEffect(() => {
//     let temp = [...products];

//     if (activeFilter && activeFilter !== "All") {
//       temp = temp.filter((p) => p.category === activeFilter);
//     }

//     if (searchQuery) {
//       temp = temp.filter((p) =>
//         (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     setFilteredProducts(temp);
//   }, [products, activeFilter, searchQuery]);

//   const getImageUrl = (imagePath) => {
//     if (!imagePath) return "https://via.placeholder.com/150";
//     return imagePath.startsWith("http") ? imagePath : `http://127.0.0.1:8000${imagePath}`;
//   };

//   if (loading) return <p>Loading products...</p>;
//   if (filteredProducts.length === 0) return <p>No products found.</p>;

//   return (
//     <div>
//       <h2 style={{ padding: "1rem" }}>Menu</h2>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <div className="menu-grid">
//         {filteredProducts.map((product, index) => (
//           <div key={index} className="iitem">
//             <div className="imager">
//               <img src={getImageUrl(product.image)} alt={product.name} />
//             </div>
//             <div className="iitem__details">
//               <h3>{product.name}</h3>
//               <p className="desc">{product.description}</p>
//               <p className="price">${product.price}</p>
//               <p className="stock">
//                 {product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}
//               </p>
//               <button className="add-btn" onClick={() => handleAddToCart(product)}>
//                 Add
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MenuPage;


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart , setCart} from "../store/cartSlice"; // Assume cartSlice exists
import { loadCart, saveCart } from "./cartStorage"; // Your utility file
import WalletButton from "./walletConnect";


// --- HACKATHON MOCK DATA ---
// We need a VENDOR PUBLIC KEY for the smart contract!
const SINGLE_VENDOR_PUBKEY = "CZmkNn3pixHtcWF5dRPY87Pd2uyJWrvgtN8rmbiQGGkZ"; 
// Assuming all products are from the same vendor for now.
// import eba from 'C:\Users\user\desktop\projects\blockbitev2\ui\public\images\eba.jpg'
import eba from '../assets/eba.jpg'
import pepsi from '../assets/pepsi.jpg'
import jollof from '../assets/Jollofrice.jpg'
const MOCK_PRODUCTS = [
    { id: 1, name: "Jollof Rice", description: "Spicy rice with chicken", price: 20, stock: 5, category: "Rice", image: jollof, vendor: SINGLE_VENDOR_PUBKEY },
    { id: 2, name: "Semo & Soup", description: "Hot semo and Egusi soup", price: 25, stock: 2, category: "Swallow", image: eba, vendor: SINGLE_VENDOR_PUBKEY },
    { id: 3, name: "Pepsi", description: "Chilled soft drink", price: 8, stock: 10, category: "Drinks", image: pepsi, vendor: SINGLE_VENDOR_PUBKEY },
    { id: 4, name: "Hamburger", description: "Hamburger", price: 15, stock: 8, category: "Snacks", image: eba, vendor: SINGLE_VENDOR_PUBKEY },
];
// -----------------------------

const MenuPage = ({ searchQuery, activeFilter }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    // The handleAddToCart function you wrote is perfect for local storage.
    const handleAddToCart = (product) => {
        const currentCart = loadCart();

        const productToAdd = {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            vendorPubKey: product.vendor,
            quantity: 1,
        };

        const existingItemIndex = currentCart.findIndex((item) => item.productId === product.id);

        let newCart;
        if (existingItemIndex !== -1) {
            newCart = currentCart.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            newCart = [...currentCart, productToAdd];
        }

        // Update Redux state
        dispatch(
            addToCart({
                productId: productToAdd.productId,
                name: productToAdd.name,
                price: productToAdd.price,
                quantity: 1, // Redux expects the single item quantity change
            })
        );

        // Update local storage
        saveCart(newCart);
        console.log("Item added to cart and saved to local storage.");
    };

    // 1. Component Mount: Load mock products and synchronize cart from local storage
    useEffect(() => {
        // Use mock data immediately
        setProducts(MOCK_PRODUCTS);
        setFilteredProducts(MOCK_PRODUCTS);

        // Synchronize Redux cart state with Local Storage cart state
        const initialCart = loadCart();
        dispatch(setCart(initialCart));

        setLoading(false);
    }, [dispatch]);

    // 2. Filter/Search Effect (you were confused about this, here's what it does)
    useEffect(() => {
        // This effect runs whenever 'products', 'activeFilter', or 'searchQuery' changes.
        // The array [products, activeFilter, searchQuery] is the dependency array.
        // It ensures the filtering logic executes only when the inputs change.
        
        let temp = [...products];

        // Filter 1: Category filter
        if (activeFilter && activeFilter !== "All") {
            temp = temp.filter((p) => p.category === activeFilter);
        }

        // Filter 2: Search query filter
        if (searchQuery) {
            temp = temp.filter((p) =>
                (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(temp);
    }, [products, activeFilter, searchQuery]); // <-- Dependencies are fine

    // Simple Image URL helper
    const getImageUrl = (imagePath) => {
        return imagePath?.startsWith("http") ? imagePath : "https://via.placeholder.com/150/0000FF/FFFFFF?text=FOOD";
    };

    if (loading) return <p>Loading products...</p>;
    if (filteredProducts.length === 0) return <p>No products found matching the criteria.</p>;

    return (
        <div>
            <h2 style={{ padding: "1rem" }}>Menu</h2>
            <div className="menu-grid">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="iitem">
                        <div className="imager">
                            {/* <img src={getImageUrl(product.image)} alt={product.name} /> */}
                            <img src={product.image || getImageUrl(product.image)} alt={product.name} />
                        </div>
                        <div className="iitem__details">
                            <h3>{product.name}</h3>
                            <p className="desc">{product.description}</p>
                            <p className="price">$ {product.price.toFixed(2)}</p>
                            <p className="stock">
                                {product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}
                            </p>
                            <button className="add-btn" onClick={() => handleAddToCart(product)}>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuPage;