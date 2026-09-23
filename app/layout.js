import './globals.css';
import NavBar from '../components/NavBar';

export const metadata = {
  title: "Where's the News?",
  description: 'Guess where news and historical events happened.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
