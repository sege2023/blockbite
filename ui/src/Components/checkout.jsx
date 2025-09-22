import idl from "../idl/myprogram.json";
const programId = new PublicKey(idl.metadata.address);
const program = new Program(idl as Idl, programId, provider);
const programID = new PublicKey(idl.metadata.address);
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = useAnchorWallet();
const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
const program = new Program(idl as any, programID, provider);

const checkout = async (orderId: number, price: number, vendor: string, buyerTokenAccount: string, mint: string) => {
  try {
    // PDAs
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), new BN(orderId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    const [treasuryTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), new PublicKey(vendor).toBuffer()],
      program.programId
    );

    const txSig = await program.methods
      .checkout(new BN(orderId))
      .accounts({
        buyer: wallet.publicKey,
        order: orderPda,
        buyerTokenAccount: new PublicKey(buyerTokenAccount),
        treasuryTokenAccount: treasuryTokenPda,
        tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token Program
        vendor: new PublicKey(vendor),
        treasury: treasuryPda,
        mint: new PublicKey(mint),
      })
      .rpc();

    console.log("✅ Checkout complete, tx:", txSig);
    alert(`Checkout success! Tx: ${txSig}`);
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Checkout failed: " + err.message);
  }

  return(
    <>
        
    </>
  )
};
export default checkout;