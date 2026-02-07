import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <BookOpen className="text-primary h-7 w-7" />
      </div>
      <h1 className="mb-2 text-xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-muted-foreground mb-6 text-[13px]">
        찾으시는 페이지가 존재하지 않거나 이동했을 수 있어요.
      </p>
      <Button asChild size="sm">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
