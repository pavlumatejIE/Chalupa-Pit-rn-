import "./globals.css";

export const metadata = {
  title: "Chalupa Pitárné",
  description: "Rezervační systém pro rodinnou chalupu v Pitárném",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
