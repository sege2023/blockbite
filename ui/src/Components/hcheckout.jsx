import { loadCart } from "./cartStorage";
const handleCheckout = async () => {
  if (!publicKey || !wallet) {
    alert("Connect your wallet first!");
    return;
  }

  // 1. Load cart from local storage
  const cartItems = loadCart();

  if (cartItems.length === 0) {
    alert("Cart is empty!");
    return;
  }

  setCheckoutStatus("processing");

  // Since you are single vendor, group by vendor isn't strictly needed,
  // but it's good practice. We'll simplify and calculate one total.
  const vendorPubKey = cartItems[0].vendorPubKey; // Assuming single vendor
  const totalUsdcPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  // Convert price to u64 (microunits) for USDC (6 decimals)
  const USDC_DECIMALS = 6;
  const priceU64 = Math.round(totalUsdcPrice * Math.pow(10, USDC_DECIMALS));

  // 2. Prepare Payload for Express Backend
  const payload = {
    buyerPubKey: publicKey.toBase58(), // Buyer's wallet
    order: {
      vendorPubKey: vendorPubKey,
      priceU64: priceU64,
      items: cartItems, // Save detailed items in the DB
    },
  };

  try {
    // 3. Call Express Backend to prepare the transaction
    // Change URL to your Express server
    const response = await fetch("http://localhost:3000/api/checkout/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Backend Error: ${JSON.stringify(errorData)}`);
    }

    const { offChainOrderId, serializedTransaction } = await response.json();

    // 4. Deserialize, Sign, and Send Transaction
    const transaction = Transaction.from(
      Buffer.from(serializedTransaction, "base64")
    );
    const signature = await wallet.sendTransaction(transaction, connection); // Use wallet-adapter's method

    // 5. Wait for confirmation (optional but recommended)
    await connection.confirmTransaction(signature, "confirmed");

    // 6. Notify Express Backend of success (to save signature in DB)
    await fetch("http://localhost:3000/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offChainOrderIds: [offChainOrderId], transactionSignature: signature }),
    });

    // 7. Success Cleanup
    localStorage.removeItem(CART_STORAGE_KEY);
    dispatch(clearCart());
    setCheckoutStatus("success");
    alert(`Transaction successful! Signature: ${signature}`);
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed: " + error.message);
    setCheckoutStatus("error");
  }
};

export default handleCheckout;