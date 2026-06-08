import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Analytics | Multi-Tenant Dashboard",
  description: "A centralized platform for system health telemetry, traffic analysis, and deployment tracking across multiple serverless sites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased dark">
      <body className="grid-bg min-h-full bg-background text-foreground flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
