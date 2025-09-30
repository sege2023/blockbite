import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';

import {Connection, PublicKey, Keypair, SystemProgram, Transaction} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';
import { v4 as uuidv4 } from 'uuid';
const VENDOR_PUBLICKEY = new PublicKey(process.env.VENDOR_PUBLICKEY); 
// const VENDOR_PRIVATEKEY = process.env.VENDOR_PRIVATEKEY; 
const vendorKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.VENDOR_PRIVATEKEY)) // Assuming the private key is stored as a JSON array
);

const PROGRAM_ID = new PublicKey("CZmkNn3pixHtcWF5dRPY87Pd2uyJWrvgtN8rmbiQGGkZ");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // e.g., devnet USDC
const IDL = await import("./idl/onchain.json", { assert: { type: "json" } }).then(module => module.default);
const connection = new Connection("https://api.devnet.solana.com", "confirmed"); // e.g., 'https://api.devnet.solana.com'

const app = express();
app.use(express.json());

const db = {
  orders: {} // { 'offChainOrderId': { status: 'pending', vendorPubKey: '...', priceU64: 1000000, items: [], txHash: null } }
};

// Anchor Provider (signer won't be used for the frontend-signed tx, but needed for program API)
const provider = new anchor.AnchorProvider(
  connection,
  // We need a dummy wallet because the transaction is signed by the frontend.
  // The backend only builds the transaction.
  new anchor.Wallet(Keypair.generate()),
  { commitment: "confirmed" }
);
const program = new anchor.Program(IDL, PROGRAM_ID, provider);

// Utility to find PDAs
const [TREASURY_PDA] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);

/**
 * Endpoint 1: Prepares the Solana transaction(s) for the buyer to sign.
 */
// app.post('/api/checkout/prepare', async (req, res) => {
//   const { orders } = req.body; // Array of orders, each with vendorPubKey, priceU64, items
//   const buyerPubKey = new PublicKey(req.body.buyerPubKey); // Buyer's connected wallet public key (MUST be sent from frontend)

//   if (!orders || orders.length === 0 || !buyerPubKey) {
//     return res.status(400).send({ error: "Missing required fields." });
//   }

//   try {
//     const transactionsData = [];

//     for (const orderData of orders) {
//       const { vendorPubKey, priceU64, items } = orderData;
//       const vendor = new PublicKey(vendorPubKey);
//       const offChainOrderId = uuidv4(); // Unique ID for your DB

//       // 1. Find PDAs and ATAs
//       const orderIdBuffer = anchor.utils.bytes.u64.toBuffer(new anchor.BN(offChainOrderId.replace(/-/g, ''), 16)); // Simplistic u64 conversion from UUID (needs better handling, but works for unique ID)
//       // NOTE: Your on-chain Rust uses order_id: u64, but the payload is a UUID string.
//       // A safer approach is to use a simple sequence number for order_id or pass a simpler u64.
//       // For this example, let's use a simpler, high random u64 for the on-chain order_id.
//       const onChainOrderId = Math.floor(Math.random() * 10000000000); // Use a simpler u64

//       const [orderPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("order"), new anchor.BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
//         PROGRAM_ID
//       );

//       const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);
//       const [treasuryTokenAccountPDA] = PublicKey.findProgramAddressSync(
//           [Buffer.from("treasury"), vendor.toBuffer()],
//           PROGRAM_ID
//       );
      
//       const buyerTokenAccount = getAssociatedTokenAddressSync(
//         USDC_MINT,
//         buyerPubKey
//       );
      
//       const tokenProgramId = TOKEN_PROGRAM_ID; // Assuming SPL-Token

//       // 2. Build Instructions
//       const addOrderIx = await program.methods
//         .addOrder(new anchor.BN(onChainOrderId), new anchor.BN(priceU64))
//         .accounts({
//           order: orderPDA,
//           vendor: vendor, // Vendor must sign add_order
//           systemProgram: SystemProgram.programId,
//         })
//         .instruction();

//       const checkoutIx = await program.methods
//         .checkout(new anchor.BN(onChainOrderId))
//         .accounts({
//           buyer: buyerPubKey,
//           order: orderPDA,
//           buyerTokenAccount: buyerTokenAccount,
//           treasuryTokenAccount: treasuryTokenAccountPDA,
//           tokenProgram: tokenProgramId, // Should be Token_Interface_Program_ID if using TokenInterface
//           vendor: vendor,
//           treasury: TREASURY_PDA,
//           mint: USDC_MINT,
//         })
//         .instruction();

//       // 3. Create Transaction
//       const recentBlockhash = await connection.getLatestBlockhash();
//       const transaction = new Transaction({
//         feePayer: buyerPubKey,
//         recentBlockhash: recentBlockhash.blockhash,
//       });

//       // The `add_order` instruction must be signed by the vendor.
//       // The vendor key must be added as a *signer* in the transaction object.
//       // NOTE: For a real food system, the vendor would use their *own* wallet/backend to sign this.
//       // For a hackathon, if the vendor is a fixed account, you might sign this on the backend
//       // and only have the buyer sign the transfer part. But your current SC requires `vendor` to sign `add_order`.
//       // The easiest hackathon path is to **pre-create the order accounts** via a backend cron/manual job,
//       // which would only require the buyer to sign the `checkout` instruction.
//       //
//       // *Assuming for simplicity/hackathon, you can skip `add_order` and only use `checkout` if the order account is already created.*
//       //
//       // **HACKATHON SIMPLIFICATION:** Pre-create the Order account manually using the vendor's wallet
//       // and a known `onChainOrderId`. You then only need to execute `checkout`.
      
//       // ***Using simplified checkout-only transaction***
//       transaction.add(checkoutIx); 

//       // 4. Save to DB (optional, but good practice for a backend)
//       db.orders[offChainOrderId] = {
//         status: 'pending',
//         vendorPubKey,
//         priceU64: priceU64.toString(),
//         items,
//         txHash: null,
//         onChainOrderId,
//         buyerPubKey: buyerPubKey.toBase58(),
//       };

//       transactionsData.push({
//         offChainOrderId,
//         serializedTransaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
//         onChainOrderId,
//         price: priceU64 / Math.pow(10, 6) // price for display
//       });
//     }

//     res.json({ transactions: transactionsData });

//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: "Failed to prepare transaction.", details: error.message });
//   }
// });







// app.post('/api/checkout/prepare', async (req, res) => {
//   const { order, buyerPubKey: buyerPubKeyStr } = req.body;
//   const buyerPubKey = new PublicKey(buyerPubKeyStr);

//   try {
//     const { vendorPubKey, priceU64, items } = order;
//     const vendor = new PublicKey(vendorPubKey);

//     // CRITICAL VALIDATION: Ensure the order is for *your* vendor
//     if (vendor.toBase58() !== VENDOR_PUBKEY.toBase58()) {
//       return res.status(400).send({ error: "Invalid vendor public key." });
//     }

//     const offChainOrderId = uuidv4();
//     const onChainOrderId = Math.floor(Math.random() * 10000000000); 

//     // 1. Find PDAs and ATAs (same logic as before)
//     const [orderPDA] = PublicKey.findProgramAddressSync(
//       [Buffer.from("order"), new anchor.BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
//       PROGRAM_ID
//     );
//     const [treasuryTokenAccountPDA] = PublicKey.findProgramAddressSync(
//         [Buffer.from("treasury"), vendor.toBuffer()],
//         PROGRAM_ID
//     );
//     const buyerTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, buyerPubKey);
//     const [TREASURY_PDA] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);

//     // 2. Build Instructions
//     const addOrderIx = await program.methods
//       .addOrder(new anchor.BN(onChainOrderId), new anchor.BN(priceU64))
//       .accounts({
//         order: orderPDA,
//         vendor: VENDOR_PUBKEY, // Backend is signing for the Vendor
//         systemProgram: SystemProgram.programId,
//       })
//       .instruction();

//     const checkoutIx = await program.methods
//       .checkout(new anchor.BN(onChainOrderId))
//       .accounts({
//         buyer: buyerPubKey,
//         order: orderPDA,
//         buyerTokenAccount: buyerTokenAccount,
//         treasuryTokenAccount: treasuryTokenAccountPDA,
//         tokenProgram: TOKEN_PROGRAM_ID, 
//         vendor: VENDOR_PUBKEY,
//         treasury: TREASURY_PDA,
//         mint: USDC_MINT,
//       })
//       .instruction();

//     // 3. Create Transaction
//     const recentBlockhash = await connection.getLatestBlockhash();
//     const transaction = new Transaction({
//       feePayer: buyerPubKey, // Buyer pays SOL for fees
//       recentBlockhash: recentBlockhash.blockhash,
//     });

//     // Add BOTH instructions
//     transaction.add(addOrderIx);
//     transaction.add(checkoutIx);
    
//     // IMPORTANT: The Vendor must sign this transaction for the `add_order` instruction
//     transaction.partialSign(VENDOR_PRIVATEKEY); 

//     // 4. Save Pending Order to DB
//     db.orders[offChainOrderId] = {
//       status: 'pending',
//       vendorPubKey: vendorPubKey.toBase58(),
//       priceU64: priceU64.toString(),
//       items,
//       txHash: null,
//       onChainOrderId,
//       buyerPubKey: buyerPubKey.toBase58(),
//     };

//     // 5. Respond with partially signed transaction
//     res.json({
//       offChainOrderId,
//       // The transaction is now partially signed by the vendor.
//       serializedTransaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: "Failed to prepare transaction.", details: error.message });
//   }
// });



app.post('/api/checkout/prepare', async (req, res) => {
  const { order, buyerPubKey: buyerPubKeyStr } = req.body;

  if (!order || !buyerPubKeyStr || !order.vendorPubKey || !order.priceU64 || !order.items || !Array.isArray(order.items)) {
    return res.status(400).send({ error: "Missing or invalid required fields." });
  }
  if (isNaN(order.priceU64) || order.priceU64 <= 0) {
    return res.status(400).send({ error: "Invalid priceU64." });
  }

  try {
    const buyerPubKey = new PublicKey(buyerPubKeyStr);
    const { vendorPubKey, priceU64, items } = order;
    const vendor = new PublicKey(vendorPubKey);

    if (vendor.toBase58() !== VENDOR_PUBLICKEY.toBase58()) {
      return res.status(400).send({ error: "Invalid vendor public key." });
    }

    const offChainOrderId = uuidv4();
    const onChainOrderId = new anchor.BN(uuidv4().replace(/-/g, '').slice(0, 16), 16).toNumber();

    const [orderPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("order"), new anchor.BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );
    const [treasuryTokenAccountPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("treasury"), vendor.toBuffer()],
      PROGRAM_ID
    );
    const buyerTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, buyerPubKey);

    const addOrderIx = await program.methods
      .addOrder(new anchor.BN(onChainOrderId), new anchor.BN(priceU64))
      .accounts({
        order: orderPDA,
        vendor: vendor,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const checkoutIx = await program.methods
      .checkout(new anchor.BN(onChainOrderId))
      .accounts({
        buyer: buyerPubKey,
        order: orderPDA,
        buyerTokenAccount: buyerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccountPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        vendor: VENDOR_PUBLICKEY,
        treasury: TREASURY_PDA,
        mint: USDC_MINT,
      })
      .instruction();

    const recentBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: buyerPubKey,
      recentBlockhash: recentBlockhash.blockhash,
    });

    transaction.add(addOrderIx);
    transaction.add(checkoutIx);
    transaction.partialSign(vendorKeypair);

    db.orders[offChainOrderId] = {
      status: 'pending',
      vendorPubKey: vendorPubKey.toBase58(),
      priceU64: priceU64.toString(),
      items,
      txHash: null,
      onChainOrderId,
      buyerPubKey: buyerPubKey.toBase58(),
    };

    let serializedTransaction;
    try {
      serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
    } catch (error) {
      console.error('Serialization failed:', error);
      return res.status(500).send({ error: 'Failed to serialize transaction.', details: error.message });
    }

    res.json({
      offChainOrderId,
      serializedTransaction,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to prepare transaction.", details: error.message });
  }
});



/**
 * Endpoint 2: Confirms the transaction after the buyer signs and sends it.
 */
app.post('/api/checkout/confirm', async (req, res) => {
  const { offChainOrderIds, transactionSignature } = req.body;

  if (!offChainOrderIds || !transactionSignature) {
    return res.status(400).send({ error: "Missing signature or order ID." });
  }

  try {
    // 1. Wait for confirmation (optional, but better than just saving the hash)
    await connection.confirmTransaction(transactionSignature, 'confirmed');

    // 2. Save transaction hash and update status in DB
    for (const id of offChainOrderIds) {
      if (db.orders[id]) {
        db.orders[id].txHash = transactionSignature;
        db.orders[id].status = 'complete';
      }
    }

    // 3. Respond
    res.json({ message: "Transaction confirmed and order status updated.", transactionSignature });

  } catch (error) {
    console.error(error);
    // Even if confirmation fails, you might want to log it and let the user know to check manually.
    for (const id of offChainOrderIds) {
      if (db.orders[id]) {
        db.orders[id].txHash = transactionSignature; // Save the hash even if confirmation failed
        db.orders[id].status = 'confirmation_failed';
      }
    }
    res.status(500).send({ error: "Failed to confirm transaction.", details: error.message });
  }
});

app.get('/', (req,res) =>{
    res.status(200).send('hello, world!');
    console.log(`${req.method} ${req.path}`);
});

app.listen(3000, () => console.log('Server running on port 3000'));