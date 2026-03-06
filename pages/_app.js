import '../styles/globals.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

const NO_LAYOUT_PAGES = ['/', '/register'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isNoLayout = NO_LAYOUT_PAGES.includes(router.pathname);

  if (isNoLayout) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
