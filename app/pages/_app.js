import Head from 'next/head';
import '../styles/global.css';
import { WalletConnectProvider } from '../components/WalletConnectProvider';
import '@solana/wallet-adapter-react-ui/styles.css';
import ClientOnly from '../components/ClientOnly';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Todo App</title>
            </Head>
            <main>
                <ClientOnly>
                    <WalletConnectProvider>
                        <Component {...pageProps} />
                    </WalletConnectProvider>
                </ClientOnly>
            </main>
        </>
    );
}

export default MyApp;
