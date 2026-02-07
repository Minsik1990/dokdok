"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (trimmed.length < 2 || trimmed.length > 12) {
      setError("닉네임은 2~12자로 입력해주세요");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: dbError } = await supabase.from("profiles").insert({
        id: user.id,
        nickname: trimmed,
      });

      if (dbError) {
        if (dbError.code === "23505") {
          setError("이미 사용 중인 닉네임이에요");
        } else {
          setError("프로필 생성에 실패했어요. 다시 시도해주세요.");
        }
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("잠깐 문제가 생겼어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-primary text-2xl font-bold">책담</h1>
          <p className="text-muted-foreground text-sm">첫 번째 기록을 시작해볼까요?</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-center text-sm">
                책담에서 사용할 이름을 알려주세요
              </p>
              <Input
                type="text"
                placeholder="닉네임 (2~12자)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="text-center text-lg"
                maxLength={12}
                autoFocus
              />
              {error && <p className="text-destructive text-center text-sm">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!nickname.trim() || loading}>
              {loading ? "설정 중..." : "시작하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
