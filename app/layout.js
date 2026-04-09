import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/ScrollReveal";
import ToastViewport from "../components/ToastViewport";
import Providers from "./providers";

export const metadata = {
  title: "ClubSphere",
  description: "College tech club platform demo"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ScrollReveal />
          <Navbar />
          <ToastViewport />
          <main className="min-h-[calc(100vh-128px)] py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
