import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {ConnectionProvider} from '@solana/wallet-adapter-react';
import {WalletProvider} from '@solana/wallet-adapter-react';
import {WalletModalProvider} from '@solana/wallet-adapter-react-ui';
import {GlowWalletAdapter, PhantomWalletAdapter, LedgerWalletAdapter, TorusWalletAdapter, Coin98WalletAdapter, SolongWalletAdapter} from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';

export const WalletConnectProvider = ({children}) => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = "https://newest-multi-vineyard.solana-devnet.quiknode.pro/5e52162769f4dd32fff19baaa799c8df1fa40617/";
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new GlowWalletAdapter(),
        new LedgerWalletAdapter(),
        new TorusWalletAdapter(),
        new Coin98WalletAdapter(),
        new SolongWalletAdapter()
    ], [network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );

};