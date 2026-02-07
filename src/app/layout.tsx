import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4F46E5",
};

export const metadata: Metadata = {
  title: {
    default: "독독 — 독서를 두드리다",
    template: "%s | 독독",
  },
  description: "읽고, 느끼고, 기록하다. 나만의 독서 기록과 독서 모임을 위한 웹앱",
  keywords: ["독서", "독서 기록", "독서 모임", "책 리뷰", "독독"],
  openGraph: {
    title: "독독 — 독서를 두드리다",
    description: "읽고, 느끼고, 기록하다. 나만의 독서 기록과 독서 모임을 위한 웹앱",
    type: "website",
    locale: "ko_KR",
    siteName: "독독",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "독독",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
