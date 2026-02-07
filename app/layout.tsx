import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteBoard",
  description: "An interactive canvas for embedding and connecting websites",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: "100vh", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
