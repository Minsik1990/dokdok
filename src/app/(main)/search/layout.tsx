import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "책 검색",
  description: "책 검색하고 독서 기록 시작하기",
  openGraph: {
    title: "책 검색 | 독독",
    description: "책 검색하고 독서 기록 시작하기",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
