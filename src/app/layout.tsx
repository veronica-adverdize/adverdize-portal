import type { Metadata } from "next";
import "@/styles/globals.css";
import ProgressBar from "@/components/ui/ProgressBar";

export const metadata: Metadata = {
  title: "Adverdize Client Portal",
  description: "Manage your Adverdize services, billing, and reports.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProgressBar />
        {children}
      </body>
    </html>
  );
}
