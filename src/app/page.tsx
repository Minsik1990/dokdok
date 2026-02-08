"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface RecentClub {
  code: string;
  clubId: string;
  clubName: string;
}

export default function HomePage() {
  const router = useRouter();
  const [clubName, setClubName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentClubs, setRecentClubs] = useState<RecentClub[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("dokdok_recent_clubs");
    if (stored) {
      try {
        setRecentClubs(JSON.parse(stored));
      } catch {
        // 무시
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubName.trim() || !code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/club/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubName: clubName.trim(), accessCode: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "접속에 실패했습니다.");
        return;
      }

      // localStorage에 최근 모임 저장
      const newRecent: RecentClub = {
        code: code.trim(),
        clubId: data.clubId,
        clubName: data.clubName,
      };
      const updated = [newRecent, ...recentClubs.filter((r) => r.clubId !== data.clubId)].slice(
        0,
        5
      );
      localStorage.setItem("dokdok_recent_clubs", JSON.stringify(updated));

      router.push(`/club/${data.clubId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleRecentClick(club: RecentClub) {
    setClubName(club.clubName);
    setCode(club.code);
    // 자동 제출
    setLoading(true);
    setError("");

    fetch("/api/club/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubName: club.clubName, accessCode: club.code }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          router.push(`/club/${data.clubId}`);
        } else {
          setError(data.error || "접속에 실패했습니다.");
        }
      })
      .catch(() => setError("네트워크 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="독독" width={80} height={80} className="rounded-2xl" />
          <div className="text-center">
            <h1 className="text-foreground text-2xl font-bold">독독</h1>
            <p className="text-muted-foreground text-sm">독서를 두드리다</p>
          </div>
        </div>

        {/* 접속 입력 */}
        <Card className="rounded-[20px]">
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="모임 이름"
                value={clubName}
                onChange={(e) => {
                  setClubName(e.target.value);
                  setError("");
                }}
                className="h-12 text-center text-lg"
                autoFocus
                disabled={loading}
              />
              <Input
                placeholder="접속 코드"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="h-12 text-center text-lg"
                disabled={loading}
              />
              {error && <p className="text-destructive text-center text-sm">{error}</p>}
              <Button
                type="submit"
                className="h-12 w-full rounded-[14px]"
                disabled={!clubName.trim() || !code.trim() || loading}
              >
                {loading ? "접속 중..." : "입장하기"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 최근 접속 모임 */}
        {recentClubs.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-center text-xs">최근 접속한 모임</p>
            <div className="flex flex-wrap justify-center gap-2">
              {recentClubs.map((club) => (
                <button
                  key={club.clubId}
                  type="button"
                  onClick={() => handleRecentClick(club)}
                  className="bg-secondary text-secondary-foreground hover:bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {club.clubName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 관리자 링크 */}
        <p className="text-muted-foreground text-center text-xs">
          관리자이신가요?{" "}
          <a
            href="/admin/new"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            새 모임 만들기
          </a>
        </p>
      </div>
    </div>
  );
}
