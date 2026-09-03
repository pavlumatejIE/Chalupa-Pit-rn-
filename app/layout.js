import "./globals.css";

export const metadata = {
  title: "Chalupa Pitárné",
  description: "Rezervační systém pro rodinnou chalupu v Pitárném",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chalupa",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#A8442D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
