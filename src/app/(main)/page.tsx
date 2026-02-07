import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { RecordCard } from "@/components/features/record-card";
import { EmptyState } from "@/components/features/empty-state";
import type { RecordWithBook } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 기록",
  description: "나의 독서 기록 타임라인",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user!.id)
    .single();

  const { data: records } = (await supabase
    .from("records")
    .select("*, books(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })) as { data: RecordWithBook[] | null };

  const readingCount = records?.filter((r) => r.status === "reading").length ?? 0;
  const completedCount = records?.filter((r) => r.status === "completed").length ?? 0;

  return (
    <div className="space-y-6">
      {/* 환영 섹션 */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] leading-tight font-bold">
            {profile?.nickname ?? "독서가"}님의 기록
          </h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            {completedCount > 0
              ? `${completedCount}권 완독, ${readingCount}권 읽는 중`
              : "첫 번째 기록을 남겨보세요"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/record/new">
            <Plus className="mr-1 h-4 w-4" />새 기록
          </Link>
        </Button>
      </section>

      {/* 독서 기록 타임라인 */}
      {!records || records.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="아직 기록이 없어요"
          description="읽고 있는 책이나 읽었던 책을 기록해보세요"
          action={
            <Button asChild>
              <Link href="/record/new">
                <Plus className="mr-1 h-4 w-4" />첫 기록 남기기
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
