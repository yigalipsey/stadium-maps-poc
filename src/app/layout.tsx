import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bernabéu Stadium Map",
  description: "Interactive Santiago Bernabéu seating map",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
