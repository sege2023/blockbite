export const checkout = async(req,res) => {
  const { order, buyerPubKey: buyerPubKeyStr } = req.body;
  const buyerPubKey = new PublicKey(buyerPubKeyStr);

  try {
    const { vendorPubKey, priceU64, items } = order;
    const vendor = new PublicKey(vendorPubKey);

    // CRITICAL VALIDATION: Ensure the order is for *your* vendor
    if (vendor.toBase58() !== VENDOR_PUBKEY.toBase58()) {
      return res.status(400).send({ error: "Invalid vendor public key." });
    }

    const offChainOrderId = uuidv4();
    const onChainOrderId = Math.floor(Math.random() * 10000000000); 

    // 1. Find PDAs and ATAs (same logic as before)
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), new anchor.BN(onChainOrderId).toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );
    const [treasuryTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), vendor.toBuffer()],
        PROGRAM_ID
    );
    const buyerTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, buyerPubKey);
    const [TREASURY_PDA] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);

    // 2. Build Instructions
    const addOrderIx = await program.methods
      .addOrder(new anchor.BN(onChainOrderId), new anchor.BN(priceU64))
      .accounts({
        order: orderPDA,
        vendor: VENDOR_PUBKEY, // Backend is signing for the Vendor
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
        vendor: VENDOR_PUBKEY,
        treasury: TREASURY_PDA,
        mint: USDC_MINT,
      })
      .instruction();

    // 3. Create Transaction
    const recentBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: buyerPubKey, // Buyer pays SOL for fees
      recentBlockhash: recentBlockhash.blockhash,
    });

    // Add BOTH instructions
    transaction.add(addOrderIx);
    transaction.add(checkoutIx);
    
    // IMPORTANT: The Vendor must sign this transaction for the `add_order` instruction
    transaction.partialSign(vendorKeypair); 

    // 4. Save Pending Order to DB
    db.orders[offChainOrderId] = {
      status: 'pending',
      vendorPubKey: vendorPubKey.toBase58(),
      priceU64: priceU64.toString(),
      items,
      txHash: null,
      onChainOrderId,
      buyerPubKey: buyerPubKey.toBase58(),
    };

    // 5. Respond with partially signed transaction
    res.json({
      offChainOrderId,
      // The transaction is now partially signed by the vendor.
      serializedTransaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to prepare transaction.", details: error.message });
  }
};