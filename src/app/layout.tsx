import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediSync - Intelligent Healthcare Platform",
  description: "AI-powered surgery planning and healthcare assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
