import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import "../Styles/Login.scss"
export default function WalletButton() {
  return (
    <div className="flex justify-center buttt ">
      <WalletMultiButton className="!bg-purple-600 !text-white !px-6 !py-2 !rounded-lg hover:!bg-purple-700 !mb-4 wallet "/>
    </div>
  );
}
