import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stadium Maps POC",
  description: "Interactive stadium seating maps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
