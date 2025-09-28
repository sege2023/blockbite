// import idl from "../idl/myprogram.json";
// const programId = new PublicKey(idl.metadata.address);
// const program = new Program(idl as Idl, programId, provider);
// const programID = new PublicKey(idl.metadata.address);
// const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
// const wallet = useAnchorWallet();
// const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
// const program = new Program(idl as any, programID, provider);

// const checkout = async (orderId: number, price: number, vendor: string, buyerTokenAccount: string, mint: string) => {
//   try {
//     // PDAs
//     const [orderPda] = PublicKey.findProgramAddressSync(
//       [Buffer.from("order"), new BN(orderId).toArrayLike(Buffer, "le", 8)],
//       program.programId
//     );

//     const [treasuryPda] = PublicKey.findProgramAddressSync(
//       [Buffer.from("treasury")],
//       program.programId
//     );

//     const [treasuryTokenPda] = PublicKey.findProgramAddressSync(
//       [Buffer.from("treasury"), new PublicKey(vendor).toBuffer()],
//       program.programId
//     );

//     const txSig = await program.methods
//       .checkout(new BN(orderId))
//       .accounts({
//         buyer: wallet.publicKey,
//         order: orderPda,
//         buyerTokenAccount: new PublicKey(buyerTokenAccount),
//         treasuryTokenAccount: treasuryTokenPda,
//         tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
//         vendor: new PublicKey(vendor),
//         treasury: treasuryPda,
//         mint: new PublicKey(mint),
//       })
//       .rpc();

//     console.log("✅ Checkout complete, tx:", txSig);
//     alert(`Checkout success! Tx: ${txSig}`);
//   } catch (err) {
//     console.error("Checkout error:", err);
//     alert("Checkout failed: " + err.message);
//   }

//   return(
//     <>
        
//     </>
//   )
// };
// export default checkout;

import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { PublicKey, BN } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
// import idl from '../idl/myprogram.json'; // Your IDL
import idl from '../idl/onchain.json'

const programId = new PublicKey(idl.metadata.address);

export const checkout = async ({ orderId, price, vendor, buyerTokenAccount, mint }) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = new Program(idl, programId, provider);

  try {
    // PDAs (same as your code)
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), new BN(orderId).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      program.programId
    );
    const [treasuryTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), new PublicKey(vendor).toBuffer()],
      program.programId
    );

    const txSig = await program.methods
      .checkout(new BN(orderId))
      .accounts({
        buyer: wallet.publicKey,
        order: orderPda,
        buyerTokenAccount: new PublicKey(buyerTokenAccount),
        treasuryTokenAccount: treasuryTokenPda,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        vendor: new PublicKey(vendor),
        treasury: treasuryPda,
        mint: new PublicKey(mint),
      })
      .rpc();

    console.log('✅ Checkout complete, tx:', txSig);
    alert(`Checkout success! Tx: ${txSig}`);

    // After success, send txSig to backend to save
    await fetch('/api/save-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txSignature: txSig, status: 'success' }),
    });

  } catch (err) {
    console.error('Checkout error:', err);
    alert('Checkout failed: ' + err.message);
    throw err; // Bubble up for Cart to handle
  }
};