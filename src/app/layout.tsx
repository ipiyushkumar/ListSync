import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ListSync — Media Tracker",
  description: "Track anime, manhwa, movies, web series, and music",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var c = localStorage.getItem('listsync-accent');
            if (c && /^#[0-9a-fA-F]{6}$/.test(c)) {
              document.documentElement.style.setProperty('--accent', c);
              var r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
              document.documentElement.style.setProperty('--accent-hover', 'rgb(' + Math.max(0,r-20) + ',' + Math.max(0,g-20) + ',' + Math.max(0,b-20) + ')');
              document.documentElement.style.setProperty('--accent-light', 'rgba(' + r + ',' + g + ',' + b + ',0.1)');
              document.documentElement.style.setProperty('--accent-border', 'rgba(' + r + ',' + g + ',' + b + ',0.2)');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-full bg-gray-950 text-gray-100 flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
