// // import idl from "../idl/myprogram.json";
// // const programId = new PublicKey(idl.metadata.address);
// // const program = new Program(idl as Idl, programId, provider);
// // const programID = new PublicKey(idl.metadata.address);
// // const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
// // const wallet = useAnchorWallet();
// // const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
// // const program = new Program(idl as any, programID, provider);

// // const checkout = async (orderId: number, price: number, vendor: string, buyerTokenAccount: string, mint: string) => {
// //   try {
// //     // PDAs
// //     const [orderPda] = PublicKey.findProgramAddressSync(
// //       [Buffer.from("order"), new BN(orderId).toArrayLike(Buffer, "le", 8)],
// //       program.programId
// //     );

// //     const [treasuryPda] = PublicKey.findProgramAddressSync(
// //       [Buffer.from("treasury")],
// //       program.programId
// //     );

// //     const [treasuryTokenPda] = PublicKey.findProgramAddressSync(
// //       [Buffer.from("treasury"), new PublicKey(vendor).toBuffer()],
// //       program.programId
// //     );

// //     const txSig = await program.methods
// //       .checkout(new BN(orderId))
// //       .accounts({
// //         buyer: wallet.publicKey,
// //         order: orderPda,
// //         buyerTokenAccount: new PublicKey(buyerTokenAccount),
// //         treasuryTokenAccount: treasuryTokenPda,
// //         tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
// //         vendor: new PublicKey(vendor),
// //         treasury: treasuryPda,
// //         mint: new PublicKey(mint),
// //       })
// //       .rpc();

// //     console.log("✅ Checkout complete, tx:", txSig);
// //     alert(`Checkout success! Tx: ${txSig}`);
// //   } catch (err) {
// //     console.error("Checkout error:", err);
// //     alert("Checkout failed: " + err.message);
// //   }

// //   return(
// //     <>
        
// //     </>
// //   )
// // };
// // export default checkout;

// 


// checkout.js
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/onchain.json';
// import BN from 'bn.js';
import { Buffer } from 'buffer';
const programId = new PublicKey(idl.address);
// const programId = new PublicKey(idl.metadata.address);
const textEncoder = new TextEncoder();

function toUint8ArrayFromBnLE(value, byteLength = 8) {
  // BN -> Uint8Array little-endian
  return new BN(value).toArrayLike(Uint8Array, 'le', byteLength);
}

function ensurePubkey(input, name = 'pubkey') {
  if (!input) throw new Error(`${name} is required`);
  try {
    return new PublicKey(input);
  } catch (e) {
    throw new Error(`${name} is not a valid public key: ${input}`);
  }
}

/**
 * checkout
 * @param {Object} params
 * @param {number|string} params.orderId
 * @param {number|string} params.price
 * @param {string|PublicKey} params.vendor
 * @param {string} params.buyerTokenAccount
 * @param {string|PublicKey} params.mint
 * @param {Object} params.wallet - anchor wallet (from useAnchorWallet())
 * @param {Object} params.connection - solana connection (from useConnection())
 * @param {string} [params.saveTxUrl='/api/save-transaction'] - backend url to save tx
 */
export const checkout = async ({
  orderId,
  price,
  vendor,
  buyerTokenAccount,
  mint,
  wallet,
  connection,
  saveTxUrl = '/api/save-transaction',
}) => {
  if (!wallet) throw new Error('Wallet not provided. Pass wallet from useAnchorWallet().');
  if (!connection) throw new Error('Connection not provided. Pass connection from useConnection().');

  // Validate pubkeys early (gives clearer errors)
  const vendorPubkey = ensurePubkey(vendor, 'vendor');
  const mintPubkey = ensurePubkey(mint, 'mint');
  const buyerTaPubkey = ensurePubkey(buyerTokenAccount, 'buyerTokenAccount');

  console.log('checkout inputs:', { orderId, price, vendor: vendorPubkey.toBase58(), mint: mintPubkey.toBase58(), buyerTokenAccount: buyerTaPubkey.toBase58() });

  // Anchor provider & program
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = new Program(idl, programId, provider);

  try {
    // Seeds: use TextEncoder + Uint8Array (no Buffer)
    const orderSeed = toUint8ArrayFromBnLE(orderId, 8);
    const orderSeedLabel = textEncoder.encode('order');

    const [orderPda] = PublicKey.findProgramAddressSync(
      [orderSeedLabel, orderSeed],
      program.programId
    );

    const treasurySeedLabel = textEncoder.encode('treasury');
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [treasurySeedLabel],
      program.programId
    );

    // for vendor-based treasury token PDA use vendor pubkey bytes
    const vendorBytes = Uint8Array.from(vendorPubkey.toBuffer()); // toBuffer() -> Uint8Array-like
    const [treasuryTokenPda] = PublicKey.findProgramAddressSync(
      [treasurySeedLabel, vendorBytes],
      program.programId
    );

    console.log('PDAs:', {
      orderPda: orderPda.toBase58(),
      treasuryPda: treasuryPda.toBase58(),
      treasuryTokenPda: treasuryTokenPda.toBase58(),
    });

    // Run the RPC method (adjust method name / args to match your IDL)
    const txSig = await program.methods
      .checkout(new BN(orderId))
      .accounts({
        buyer: wallet.publicKey,
        order: orderPda,
        buyerTokenAccount: buyerTaPubkey,
        treasuryTokenAccount: treasuryTokenPda,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        vendor: vendorPubkey,
        treasury: treasuryPda,
        mint: mintPubkey,
      })
      .rpc();

    console.log('✅ Checkout complete, tx:', txSig);

    // send tx sig to backend
    try {
      await fetch(saveTxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, txSignature: txSig, status: 'success' }),
      });
    } catch (err) {
      console.warn('Could not save tx to backend:', err);
    }

    return txSig;
  } catch (err) {
    console.error('Checkout error:', err);
    // Try to give nicer error messages for common mistakes:
    if (err.message && err.message.includes('public key')) {
      throw err;
    }
    // Re-throw so caller can handle
    throw err;
  }
};
