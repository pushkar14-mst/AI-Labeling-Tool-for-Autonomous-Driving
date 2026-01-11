import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Labeling Tool for Autonomous Driving",
  description: "3D Bounding Box Labeling for Autonomous Driving",
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
