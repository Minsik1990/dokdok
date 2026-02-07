"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError("이메일 전송에 실패했어요. 다시 시도해주세요.");
      } else {
        setSent(true);
      }
    } catch {
      setError("잠깐 문제가 생겼어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-col items-center">
            <Image src="/logo.png" alt="독독" width={160} height={107} priority />
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-lg font-medium">로그인 링크를 보냈어요</p>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">{email}</span>로 보낸 이메일을
              확인해주세요.
            </p>
            <p className="text-muted-foreground text-xs">
              이메일이 오지 않나요? 스팸함을 확인하거나{" "}
              <button onClick={() => setSent(false)} className="text-primary underline">
                다시 보내기
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-1">
          <Image src="/logo.png" alt="독독" width={160} height={107} priority />
          <p className="text-muted-foreground text-sm">나의 독서 기록</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-center text-sm">
                이메일을 입력하면 로그인 링크를 보내드려요.
              </p>
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
                autoFocus
              />
              {error && <p className="text-destructive text-center text-sm">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!email.trim() || loading}>
              {loading ? "전송 중..." : "로그인 링크 받기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
