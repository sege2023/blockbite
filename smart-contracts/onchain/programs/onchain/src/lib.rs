use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};
// use anchor_spl::token_interface::{self, TokenAccount, Token, Transfer};
// Anchor 0.31.1, the anchor_spl::token_interface module doesn’t export a Token struct directly
use anchor_spl::token::accessor::mint;
use anchor_spl::token_interface::{TokenAccount, TokenInterface, TransferChecked, Mint};
// use anchor_spl::token::Token;
declare_id!("9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx");

#[error_code]
pub enum ErrorCode {
    // #[msg("Bump seed not found for treasury PDA")]
    // // BumpNotFound,
    // InvalidOrderId,
    #[msg("Invalid order ID")]
    InvalidOrderId,
    #[msg("Invalid vendor")]
    InvalidVendor,
    // #[msg("Order already completed")]
    // OrderAlreadyCompleted,
}

#[program]
pub mod onchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        // treasury.bump = *ctx.bumps.treasury;
        // treasury.bump = ctx.bumps.get("treasury").ok_or_else(|| error!(ErrorCode::BumpNotFound))?;
        treasury.bump = ctx.bumps.treasury;
        // msg!("Greetings from: {:?}", ctx.program_id);
        msg!("Initialized treasury with bump: {}", treasury.bump);
        Ok(())
    }

    pub fn add_order(ctx: Context<AddOrder>, order_id: u64, price: u64) -> Result<()> {
        let order = &mut ctx.accounts.order;
        order.id = order_id;
        order.price = price;
        order.vendor = ctx.accounts.vendor.key();
        Ok(())
    }

    pub fn checkout(ctx: Context<Checkout>, order_id: u64) -> Result<()> {
        let order = &ctx.accounts.order;
        // require_eq!(order.id, order_id, ErrorCode::InvalidOrderId);
        require_eq!(order.id, order_id, ErrorCode::InvalidOrderId);
        require_eq!(order.vendor, ctx.accounts.vendor.key(), ErrorCode::InvalidVendor);
        // require!(!order.completed, ErrorCode::OrderAlreadyCompleted);
        // Transfer USDC from buyer → vendor treasury PDA.
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
            // mint: ctx.accounts.buyer_token_account.mint,
            mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // token::transfer(cpi_ctx, order.price)?;
        // token module wasn't imported, use token_interface module
        // anchor_spl::token_interface::transfer(cpi_ctx, order.price)?; deprecated 
        anchor_spl::token_interface::transfer_checked(cpi_ctx, order.price, 6)?; // USDC decimals = 6

        // ✅ At this point:
        // - On-chain USDC transfer executed.
        // - tx hash is your trustless receipt.
        // - Backend links tx hash → order metadata.
        Ok(())
    }
}

#[account]
pub struct Order {
    pub id: u64,      
    pub price: u64,   
    pub vendor: Pubkey,
}

#[account]
pub struct Treasury {
    pub bump: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 1, seeds = [b"treasury"], bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct AddOrder<'info> {
    // #[account(init, payer = vendor, space = 8 + 8 + 8 + 32)]
    #[account(init, payer = vendor, space = 8 + 8 + 8 + 32 + 1, seeds = [b"order", order_id.to_le_bytes().as_ref()], bump)]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub vendor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
// for solana token program
// #[derive(Accounts)]
// pub struct Checkout<'info> {
//     #[account(mut)]
//     pub buyer: Signer<'info>,

//     #[account(mut)]
//     pub order: Account<'info, Order>,

//     #[account(mut)]
//     pub buyer_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub treasury_token_account: Account<'info, TokenAccount>,

//     pub token_program: Program<'info, Token>,
// }

// for spl-token-interface program
#[derive(Accounts)]
pub struct Checkout<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(mut,
    // token::mint = treasury_token_account.mint
    token::mint = mint,
    )]

    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut,
    token::authority = treasury,
    // token::mint = buyer_token_account.mint,
    token::mint = mint,
    seeds = [b"treasury", vendor.key().as_ref()],
    bump = treasury.bump)]

    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    /// CHECK: Verified against order.vendor and used in treasury_token_account PDA seeds
    pub vendor: AccountInfo<'info>,
    #[account(seeds = [b"treasury"], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    #[account(
        constraint = buyer_token_account.mint == mint.key() @ ErrorCode::InvalidVendor
    )]
    pub mint: InterfaceAccount<'info, Mint>,
}