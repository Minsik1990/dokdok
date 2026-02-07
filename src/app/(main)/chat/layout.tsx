import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 독서 대화",
  description: "AI와 독서 대화를 나눠보세요",
  openGraph: {
    title: "AI 독서 대화 | 독독",
    description: "AI와 독서 대화를 나눠보세요",
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
