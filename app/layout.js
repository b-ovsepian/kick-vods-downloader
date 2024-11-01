import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kick VODs Downloader | Download Your Favorite Kick Streams Easily",
  description:
    "Easily download your favorite VODs from Kick with our Kick VODs Downloader. Enter a Kick VOD link, select resolution, and download. Perfect for offline viewing!",
  keywords:
    "Kick VODs downloader, Kick VODs download, Kick VODs, Kick downloader, Kick download",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Kick Vods" />
        <link rel="manifest" href="/site.webmanifest" />

        <meta property="og:image" content="/og-image.webp" />
        <meta name="twitter:image" content="/og-image.webp" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={inter.className}>
        {children}
        <footer className="py-6 text-sm text-center text-gray-500">
          <p>
            Built by{" "}
            <a
              href="https://www.ovsepyan.com.ua/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-green-500 hover:underline"
            >
              Bahdasar Ovsepian
            </a>{" "}
            &copy; {new Date().getFullYear()}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
