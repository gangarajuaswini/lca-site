import { Inter, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import ToasterClient from './ToasterClient';

export const metadata = {
  title: { default: 'LCA Visual Studios', template: '%s | LCA Visual Studios' },
  description: 'Capturing love, life & timeless moments',
  icons: {
    icon: [{ url: '/logo.jpg' }, { url: '/logo.jpg', sizes: '32x32', type: 'image/jpeg' }],
  },
};


const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable}`}>
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}
