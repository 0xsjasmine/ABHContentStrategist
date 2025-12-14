import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambitious But Human - Content Strategist",
  description: "Transform raw thoughts into high-performing X posts by intelligently connecting content across diary entries, book quotes, saved post formats, and real-time cultural trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
