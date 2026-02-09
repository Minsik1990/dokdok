import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookOpen, Calendar, Users, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClubCoverUploader } from "@/components/features/club-cover-uploader";
import { MemberManager } from "@/components/features/member-manager";
import { ProfilePhotoGrid } from "@/components/features/profile-photo-grid";
import { MemberBooksSection } from "@/components/features/member-books-section";
import { PresenterStatsSection } from "@/components/features/presenter-stats-section";
import { YearlyMeetingChart } from "@/components/features/yearly-meeting-chart";
import type { Database } from "@/lib/supabase/database.types";

type Club = Database["public"]["Tables"]["clubs"]["Row"];

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;
  const supabase = createClient();

  // 모임 정보 + 세션(books JOIN) + 멤버 병렬 조회
  const [clubResult, sessionsResult, membersResult] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", clubId).maybeSingle(),
    supabase
      .from("club_sessions")
      .select(
        "id, session_date, is_counted, presenter, participants, book_id, photos, content, books(title, author, cover_image_url)"
      )
      .eq("club_id", clubId)
      .order("session_date", { ascending: false }),
    supabase.from("members").select("name").eq("club_id", clubId).order("name"),
  ]);

  const club = clubResult.data as Club | null;
  if (!club) notFound();
  const rawSessions = sessionsResult.data ?? [];
  const allSessions = rawSessions as unknown as {
    id: string;
    session_date: string;
    is_counted: boolean;
    presenter: string[] | null;
    participants: string[] | null;
    book_id: string | null;
    photos: string[] | null;
    content: string | null;
    books: { title: string; author: string | null; cover_image_url: string | null } | null;
  }[];
  const memberNames = (membersResult.data ?? []).map((m) => m.name);

  // 통계 계산: is_counted=false 세션 제외, 같은 날짜 = 1번의 모임
  const countedSessions = allSessions.filter((s) => s.is_counted !== false);
  const uniqueDates = [...new Set(countedSessions.map((s) => s.session_date))].sort();
  const totalMeetings = uniqueDates.length;
  const dateToMeetingNum = new Map<string, number>();
  uniqueDates.forEach((date, i) => dateToMeetingNum.set(date, i + 1));

  const uniqueBookIds = new Set(countedSessions.map((s) => s.book_id).filter(Boolean));
  const totalBooks = uniqueBookIds.size;

  const totalMembers = memberNames.length;

  // 발제자 통계 (is_counted=false 세션 제외)
  const presenterCount = new Map<string, number>();
  for (const s of countedSessions) {
    const pres = s.presenter ?? [];
    for (const p of pres) {
      presenterCount.set(p, (presenterCount.get(p) ?? 0) + 1);
    }
  }
  const presenterStats = Array.from(presenterCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 참여자 통계 (참여만, 발제 제외) — 책이 있는 counted 세션만
  const participationCount = new Map<string, number>();
  for (const s of countedSessions) {
    if (!s.book_id) continue;
    const parts = s.participants ?? [];
    for (const p of parts) {
      participationCount.set(p, (participationCount.get(p) ?? 0) + 1);
    }
  }
  const memberStats = Array.from(participationCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 연간 모임 횟수 계산 (is_counted=false 세션 제외)
  const yearlyMeetings = new Map<string, Set<string>>();
  for (const s of countedSessions) {
    const year = s.session_date.slice(0, 4);
    if (!yearlyMeetings.has(year)) yearlyMeetings.set(year, new Set());
    yearlyMeetings.get(year)!.add(s.session_date);
  }
  const yearlyData = Array.from(yearlyMeetings.entries())
    .map(([year, dates]) => ({ year, count: dates.size }))
    .sort((a, b) => a.year.localeCompare(b.year));

  // Client Component에 전달할 세션 데이터 (counted 세션만, books 포함)
  const sessionsForClient = countedSessions.map((s) => ({
    id: s.id,
    session_date: s.session_date,
    presenter: s.presenter,
    participants: s.participants,
    content: s.content,
    book: s.books,
  }));

  // "우리가 함께 읽은 책" — 책이 있는 세션만
  const bookSessionsForClient = sessionsForClient.filter((s) => s.book);

  // 전체 사진 수집 (최신 세션 먼저 = 갤러리와 동일)
  const allPhotos: { url: string; sessionId: string; sessionOrder: number }[] = [];
  for (let i = 0; i < allSessions.length; i++) {
    const s = allSessions[i];
    const photos = (s.photos as string[] | null) ?? [];
    const meetingNum = dateToMeetingNum.get(s.session_date) ?? 0;
    const order = meetingNum;
    for (const url of photos) {
      allPhotos.push({ url, sessionId: s.id, sessionOrder: order });
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
        <CardContent className="flex items-center gap-4">
          <ClubCoverUploader clubId={clubId} initialUrl={club?.cover_image_url ?? null} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{club?.name ?? "모임"}</h2>
            {club?.description && (
              <p className="text-muted-foreground mt-0.5 text-sm">{club.description}</p>
            )}
            {firstDate && (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {formatDate(firstDate)} ~ {formatDate(today)} ({daysBetween(firstDate, today)}일)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 주요 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Calendar} label="모임" value={totalMeetings} unit="회" />
        <StatCard icon={BookOpen} label="읽은 책" value={totalBooks} unit="권" />
        <StatCard icon={Users} label="멤버" value={totalMembers} unit="명" />
      </div>

      {/* 지금 함께하는 사람 */}
      <Card className="rounded-[20px]">
        <CardContent>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="text-primary h-4 w-4" />
            지금 함께하는 사람
          </h3>
          <MemberManager clubId={clubId} initialMembers={memberNames} />
        </CardContent>
      </Card>

      {/* 우리가 함께 읽은 책 */}
      {memberStats.length > 0 && (
        <MemberBooksSection
          memberStats={memberStats}
          sessions={bookSessionsForClient}
          clubId={clubId}
        />
      )}

      {/* 발제 횟수 */}
      {presenterStats.length > 0 && (
        <PresenterStatsSection
          presenterStats={presenterStats}
          sessions={sessionsForClient}
          clubId={clubId}
        />
      )}

      {/* 연간 모임 */}
      <YearlyMeetingChart data={yearlyData} />

      {/* 모임 사진 */}
      <Card className="rounded-[20px]">
        <CardContent>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ImageIcon className="text-primary h-4 w-4" />
            모임 사진 {allPhotos.length > 0 && `(${allPhotos.length})`}
          </h3>
          {allPhotos.length > 0 ? (
            <ProfilePhotoGrid photos={allPhotos} clubId={clubId} />
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

function daysBetween(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
