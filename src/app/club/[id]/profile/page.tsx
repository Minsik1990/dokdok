import { createClient } from "@/lib/supabase/server";
import { BookOpen, Calendar, Users, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PresenterChart } from "@/components/features/presenter-chart";
import type { Database } from "@/lib/supabase/database.types";

type Club = Database["public"]["Tables"]["clubs"]["Row"];

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  // 모임 정보
  const { data: clubData } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .maybeSingle();

  const club = clubData as Club | null;

  // 세션 목록 (통계용)
  const { data: sessions } = await supabase
    .from("club_sessions")
    .select("id, session_date, presenter, participants, book_id")
    .eq("club_id", clubId)
    .order("session_date", { ascending: false });

  const allSessions = sessions ?? [];

  // 통계 계산
  const totalSessions = allSessions.length;
  const uniqueBookIds = new Set(allSessions.map((s) => s.book_id).filter(Boolean));
  const totalBooks = uniqueBookIds.size;

  // 전체 참여자 수 (유니크)
  const allNames = new Set<string>();
  for (const s of allSessions) {
    if (s.presenter) allNames.add(s.presenter);
    if (s.participants) s.participants.forEach((p: string) => allNames.add(p));
  }
  const totalMembers = allNames.size;

  // 발제자 통계
  const presenterCount = new Map<string, number>();
  for (const s of allSessions) {
    if (s.presenter) {
      presenterCount.set(s.presenter, (presenterCount.get(s.presenter) ?? 0) + 1);
    }
  }
  const presenterStats = Array.from(presenterCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 첫 모임, 마지막 모임 날짜
  const firstDate =
    allSessions.length > 0 ? allSessions[allSessions.length - 1].session_date : null;
  const lastDate = allSessions.length > 0 ? allSessions[0].session_date : null;

  return (
    <div className="space-y-6">
      {/* 모임 정보 */}
      <Card className="rounded-[20px]">
        <CardContent className="pt-6">
          <h2 className="text-lg font-bold">{club?.name ?? "모임"}</h2>
          {club?.description && (
            <p className="text-muted-foreground mt-1 text-sm">{club.description}</p>
          )}
          {firstDate && lastDate && (
            <p className="text-muted-foreground mt-2 text-xs">
              {formatDate(firstDate)} ~ {formatDate(lastDate)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 주요 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="모임" value={totalSessions} unit="회" />
        <StatCard icon={BookOpen} label="읽은 책" value={totalBooks} unit="권" />
        <StatCard icon={Users} label="멤버" value={totalMembers} unit="명" />
      </div>

      {/* 발제자 통계 */}
      {presenterStats.length > 0 && (
        <Card className="rounded-[20px]">
          <CardContent className="pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Mic className="text-primary h-4 w-4" />
              발제자 통계
            </h3>
            <PresenterChart data={presenterStats} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card className="rounded-[20px]">
      <CardContent className="flex flex-col items-center gap-1 py-4">
        <Icon className="text-primary h-5 w-5" />
        <span className="text-xl font-bold">{value}</span>
        <span className="text-muted-foreground text-xs">
          {label} {unit}
        </span>
      </CardContent>
    </Card>
  );
}
