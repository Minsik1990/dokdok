import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Calendar, Users, Mic, UserCheck, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClubCoverUploader } from "@/components/features/club-cover-uploader";
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
    .select("id, session_date, presenter, participants, book_id, photos")
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

  // 참여자 통계 (참여만, 발제 제외)
  const participationCount = new Map<string, number>();
  for (const s of allSessions) {
    if (s.participants) {
      for (const p of s.participants as string[]) {
        participationCount.set(p, (participationCount.get(p) ?? 0) + 1);
      }
    }
  }
  const memberStats = Array.from(participationCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 전체 사진 수집 (최근 세션 순, 세션 ID 포함)
  const allPhotos: { url: string; sessionId: string }[] = [];
  for (const s of allSessions) {
    const photos = (s.photos as string[] | null) ?? [];
    for (const url of photos) {
      allPhotos.push({ url, sessionId: s.id });
    }
  }

  // 첫 모임 날짜 ~ 오늘 (KST)
  const firstDate =
    allSessions.length > 0 ? allSessions[allSessions.length - 1].session_date : null;
  const today = getKSTDate();

  return (
    <div className="space-y-6">
      {/* 모임 정보 */}
      <Card className="rounded-[20px]">
        <CardContent className="flex items-center gap-4 pt-6">
          <ClubCoverUploader clubId={clubId} initialUrl={club?.cover_image_url ?? null} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{club?.name ?? "모임"}</h2>
            {club?.description && (
              <p className="text-muted-foreground mt-0.5 text-sm">{club.description}</p>
            )}
            {firstDate && (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {formatDate(firstDate)} ~ {formatDate(today)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 주요 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="모임" value={totalSessions} unit="회" />
        <StatCard icon={BookOpen} label="읽은 책" value={totalBooks} unit="권" />
        <StatCard icon={Users} label="멤버" value={totalMembers} unit="명" />
      </div>

      {/* 멤버 참여 현황 */}
      {memberStats.length > 0 && (
        <Card className="rounded-[20px]">
          <CardContent className="pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="text-primary h-4 w-4" />
              참여 현황
            </h3>
            <div className="flex flex-wrap gap-2">
              {memberStats.map((m) => (
                <Badge
                  key={m.name}
                  variant="secondary"
                  className="gap-1.5 rounded-full py-1.5 pr-2.5 pl-3"
                >
                  {m.name}
                  <span className="bg-primary/10 text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold">
                    {m.count}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 발제 횟수 */}
      {presenterStats.length > 0 && (
        <Card className="rounded-[20px]">
          <CardContent className="pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Mic className="text-primary h-4 w-4" />
              발제 횟수
            </h3>
            <div className="space-y-2.5">
              {presenterStats.map((m) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 truncate text-sm font-medium">{m.name}</span>
                  <div className="bg-muted h-7 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary flex h-full items-center rounded-full px-2.5 transition-all"
                      style={{
                        width: `${Math.max((m.count / presenterStats[0].count) * 100, 15)}%`,
                      }}
                    >
                      <span className="text-xs font-bold text-white">{m.count}회</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 모임 사진 */}
      <Card className="rounded-[20px]">
        <CardContent className="pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ImageIcon className="text-primary h-4 w-4" />
            모임 사진 {allPhotos.length > 0 && `(${allPhotos.length})`}
          </h3>
          {allPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.slice(0, 12).map((photo, i) => (
                <Link
                  key={i}
                  href={`/club/${clubId}/session/${photo.sessionId}`}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={photo.url}
                    alt={`모임 사진 ${i + 1}`}
                    fill
                    sizes="(max-width: 480px) 33vw, 120px"
                    className="object-cover"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              아직 모임 사진이 없습니다. 세션 상세에서 사진을 추가해보세요!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getKSTDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    .toISOString()
    .split("T")[0];
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
