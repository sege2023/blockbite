// utils/cartStorage.js (or just paste into your component)

export const CART_STORAGE_KEY = "guestCart";

// Load cart from local storage
export const loadCart = () => {
  try {
    const serializedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (serializedCart === null) {
      return [];
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    console.error("Could not load cart from local storage", err);
    return [];
  }
};

// Save cart to local storage
export const saveCart = (cartItems) => {
  try {
    const serializedCart = JSON.stringify(cartItems);
    localStorage.setItem(CART_STORAGE_KEY, serializedCart);
  } catch (err) {
    console.error("Could not save cart to local storage", err);
  }
};