import * as dotenv from 'dotenv';
dotenv.config(); // MUST BE THE FIRST THING CALLED
import cors from 'cors';

// Replacement using synchronous require()
// Node.js will load and parse the JSON file immediately.

// import * as fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// // Helper to get directory name in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Construct the absolute path and load the JSON file
// const IDL_PATH = path.join(__dirname, 'idl', 'onchain.json');
// const IDL_RAW = fs.readFileSync(IDL_PATH, 'utf-8');
// const IDL = JSON.parse(IDL_RAW);

// OR, if you are not using "type": "module" in package.json:
// const IDL = require("./idl/onchain.json");
import idl from './idl/onchain.json' with { type: 'json' };
const IDL = idl;

// import { Onchain} from './idl/onchain.js'; 
import express from 'express';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
// import { BN } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { v4 as uuidv4 } from 'uuid';

const VENDOR_PUBKEY_STR = process.env.VENDOR_PUBLICKEY;
if (!VENDOR_PUBKEY_STR) {
    throw new Error("Missing VENDOR_PUBLICKEY in environment variables.");
}
const VENDOR_PUBLICKEY = new PublicKey(VENDOR_PUBKEY_STR);

// Check for private key presence
const VENDOR_PRIVATEKEY_STR = process.env.VENDOR_PRIVATEKEY;
if (!VENDOR_PRIVATEKEY_STR) {
    throw new Error("Missing VENDOR_PRIVATEKEY in environment variables.");
}
// Safely parse the JSON array for the Keypair
let vendorKeypair;
try {
    const secretKeyArray = JSON.parse(VENDOR_PRIVATEKEY_STR);
    vendorKeypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
} catch (e) {
    throw new Error("VENDOR_PRIVATEKEY is not a valid JSON array.");
}

// 2. PROGRAM & MINT CONSTANTS
const PROGRAM_ID = new PublicKey("CZmkNn3pixHtcWF5dRPY87Pd2uyJWrvgtN8rmbiQGGkZ");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// 3. IDL (Use synchronous require for simplicity if module type is 'commonjs')
// Note: If you use "type": "module" in package.json, your original 'await import' might be fine, 
// but using a standard JSON import or direct require is often safer with Anchor IDLs.
// Assuming your Node environment is setup for ES Modules (`"type": "module"` in package.json):
// const IDL = await import("./idl/onchain.json", { assert: { type: "json" } }).then(module => module.default);

// --- SETUP ---
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5174', // Your frontend URL
    credentials: true
}));

const db = {
    orders: {} 
};

const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(Keypair.generate()),
    { commitment: "confirmed" }
);
const program = new anchor.Program(IDL, provider);

// Utility to find PDAs
// NOTE: Use findProgramAddressSync here, as it's at the top level sync code
const [TREASURY_PDA] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);

// ------------------------------------
// --- API ENDPOINT ---
// ------------------------------------
app.post('/api/checkout/prepare', async (req, res) => {
    // ... (rest of your validation logic) ...
    const { order, buyerPubKey: buyerPubKeyStr } = req.body;

    if (!order || !buyerPubKeyStr || !order.vendorPubKey || !order.priceU64 || !order.items || !Array.isArray(order.items)) {
        return res.status(400).send({ error: "Missing or invalid required fields." });
    }
    if (isNaN(order.priceU64) || order.priceU64 <= 0) {
        return res.status(400).send({ error: "Invalid priceU64." });
    }
    // addy coming from frontend is string we have to convert to check if the base58 is valid then convert to publickey
    try {
        const buyerPubKey = new PublicKey(buyerPubKeyStr);
        const { vendorPubKey, priceU64, items } = order;
        
        // console.log("Raw vendorPubKey from request:", vendorPubKey);
        // console.log("Type of vendorPubKey:", typeof vendorPubKey);
        // console.log("Is vendorPubKey an instance of PublicKey?", vendorPubKey instanceof PublicKey);
        const vendor = new PublicKey(vendorPubKey);
        // let vendor;
        // try {
        // vendor = new PublicKey(vendorPubKey);
        // } catch (err) {
        // return res.status(400).send({ error: "Invalid vendor public key format." });
        // }

        // // console.log("Vendor object:", vendor.toBase58()); // sanity check
        // console.log("Constructed vendor:", vendor);
        // console.log("Type of vendor:", typeof vendor);
        // console.log("Does vendor have toBase58?", typeof vendor.toBase58);


        
        // Security check
        // if (vendor.toBase58() !== VENDOR_PUBLICKEY.toBase58()) {
        //     return res.status(400).send({ error: "Invalid vendor public key." });
        // }

        const offChainOrderId = uuidv4();
        // Use a simpler, non-UUID derived u64 for better compatibility with Anchor's u64 parsing
        const onChainOrderId = Math.floor(Math.random() * 1000000000000); 

        // NOTE: Use findProgramAddressSync here for consistency and synchronous code path
        const [orderPDA] = PublicKey.findProgramAddressSync(
            // [Buffer.from("order"), new anchor.BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
            [Buffer.from("order"), new BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
            PROGRAM_ID
        );
        const [treasuryTokenAccountPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("treasury"), vendor.toBuffer()],
            PROGRAM_ID
        );
        const buyerTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, buyerPubKey);
        
        // ----------------------------------------------------
        // Build Instructions
        // ----------------------------------------------------
        const addOrderIx = await program.methods
            // .addOrder(new anchor.BN(onChainOrderId), new anchor.BN(priceU64))
            .addOrder(new BN(onChainOrderId), new BN(priceU64))
            .accounts({
                order: orderPDA,
                vendor: vendorKeypair.publicKey, // Use the Keypair's public key
                systemProgram: SystemProgram.programId,
            })
            .instruction();

        const checkoutIx = await program.methods
            // .checkout(new anchor.BN(onChainOrderId))
            .checkout(new BN(onChainOrderId))
            .accounts({
                buyer: buyerPubKey,
                order: orderPDA,
                buyerTokenAccount: buyerTokenAccount,
                treasuryTokenAccount: treasuryTokenAccountPDA,
                tokenProgram: TOKEN_PROGRAM_ID, // Assuming SPL Token Program (TokenInterface still uses this ID for transfer_checked)
                vendor: VENDOR_PUBLICKEY,
                treasury: TREASURY_PDA,
                mint: USDC_MINT,
            })
            .instruction();

        // ----------------------------------------------------
        // Build and Sign Transaction
        // ----------------------------------------------------
        const recentBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
            feePayer: buyerPubKey,
            recentBlockhash: recentBlockhash.blockhash,
        });

        transaction.add(addOrderIx);
        transaction.add(checkoutIx);
        
        // Partial sign by the vendor (backend keypair)
        transaction.partialSign(vendorKeypair); 

        // ----------------------------------------------------
        // DB Save and Response
        // ----------------------------------------------------
        db.orders[offChainOrderId] = {
            status: 'pending',
            // vendorPubKey: vendorPubKey.toBase58(),
            vendorPubKey: vendorPubKey,
            priceU64: priceU64.toString(),
            items,
            txHash: null,
            onChainOrderId,
            buyerPubKey: buyerPubKey.toBase58(),
        };

        const serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');

        res.json({
            offChainOrderId,
            serializedTransaction,
        });

    } catch (error) {
        console.error("Preparation Error:", error);
        res.status(500).send({ error: "Failed to prepare transaction.", details: error.message });
    }
});

// Add your /api/checkout/confirm endpoint here (from previous response)

// --- START SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    console.log(`Vendor Public Key: ${VENDOR_PUBLICKEY.toBase58()}`);
});