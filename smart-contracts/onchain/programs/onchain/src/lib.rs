use anchor_lang::prelude::*;

declare_id!("9WAZQTunxCMK9cJbn67vDrFhtsYPDCZpuJzquyH4NnKx");

#[program]
pub mod onchain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
