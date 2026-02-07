"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !accessCode.trim() || !adminPassword) {
      setError("필수 항목을 모두 입력하세요.");
      return;
    }

    if (accessCode.trim().length < 2) {
      setError("접속 코드는 2자 이상이어야 합니다.");
      return;
    }

    if (adminPassword.length < 4) {
      setError("관리자 비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          accessCode: accessCode.trim(),
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "모임 생성에 실패했습니다.");
        return;
      }

      // 생성 후 바로 접속 코드로 입장
      const verifyRes = await fetch("/api/club/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubName: name.trim(), accessCode: accessCode.trim() }),
      });

      if (verifyRes.ok) {
        router.push(`/club/${data.clubId}`);
      } else {
        router.push("/");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="독독" width={60} height={60} className="rounded-2xl" />
          <h1 className="text-xl font-bold">새 모임 만들기</h1>
          <p className="text-muted-foreground text-sm">독서 모임을 만들어 보세요</p>
        </div>

        <Card className="rounded-[20px]">
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">모임 이름 *</Label>
                <Input
                  id="name"
                  placeholder="예: 독독 독서회"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input h-12 border-0"
                  required
                />
                <p className="text-muted-foreground text-xs">모임 이름은 고유해야 합니다</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  placeholder="모임 소개 (선택)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input h-12 border-0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accessCode">접속 코드 *</Label>
                <Input
                  id="accessCode"
                  placeholder="멤버들이 입력할 접속 코드"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-input h-12 border-0"
                  required
                />
                <p className="text-muted-foreground text-xs">
                  이 코드로 멤버들이 모임에 접속합니다
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminPassword">관리자 비밀번호 *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="모임 설정 변경 시 필요"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-input h-12 border-0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminPasswordConfirm">비밀번호 확인 *</Label>
                <Input
                  id="adminPasswordConfirm"
                  type="password"
                  placeholder="비밀번호 다시 입력"
                  value={adminPasswordConfirm}
                  onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                  className="bg-input h-12 border-0"
                  required
                />
              </div>

              {error && <p className="text-destructive text-center text-sm">{error}</p>}

              <Button type="submit" className="h-12 w-full rounded-[14px]" disabled={loading}>
                {loading ? "생성 중..." : "모임 만들기"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-xs">
          <Link href="/" className="text-primary font-medium underline-offset-4 hover:underline">
            홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
