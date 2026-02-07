"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [mode, setMode] = useState<"magic" | "password">("magic");

  // auth callback 에러 감지 (Magic Link 만료 등)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth") {
      setError("로그인 링크가 만료되었거나 유효하지 않아요. 다시 시도해주세요.");
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
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
        if (authError.status === 429) {
          setError("이메일 발송 한도에 도달했어요. 1분 후 다시 시도해주세요.");
          startCooldown();
        } else if (authError.message?.includes("email")) {
          setError("이메일 전송에 실패했어요. 이메일 주소를 다시 확인해주세요.");
        } else {
          setError(`로그인에 실패했어요. (${authError.message || "알 수 없는 오류"})`);
        }
      } else {
        setSent(true);
      }
    } catch {
      setError("잠깐 문제가 생겼어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.status === 429) {
          setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
          startCooldown();
        } else if (authError.message?.includes("Invalid login")) {
          setError("이메일 또는 비밀번호가 맞지 않아요.");
        } else {
          setError(`로그인에 실패했어요. (${authError.message || "알 수 없는 오류"})`);
        }
      } else {
        router.push("/");
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
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>이메일이 오지 않나요?</p>
              <ul className="list-inside list-disc space-y-0.5 text-left">
                <li>스팸/프로모션 폴더를 확인해주세요</li>
                <li>1~2분 정도 걸릴 수 있어요</li>
              </ul>
              <button onClick={() => setSent(false)} className="text-primary mt-2 underline">
                다시 보내기
              </button>
            </div>
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
          {mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
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
              <Button
                type="submit"
                className="w-full"
                disabled={!email.trim() || loading || cooldown > 0}
              >
                {loading
                  ? "전송 중..."
                  : cooldown > 0
                    ? `${cooldown}초 후 다시 시도`
                    : "로그인 링크 받기"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError("");
                  setCooldown(0);
                }}
                className="text-muted-foreground hover:text-foreground block w-full text-center text-xs transition-colors"
              >
                비밀번호로 로그인
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center"
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                />
                {error && <p className="text-destructive text-center text-sm">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!email.trim() || !password.trim() || loading}
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("magic");
                  setError("");
                }}
                className="text-muted-foreground hover:text-foreground block w-full text-center text-xs transition-colors"
              >
                이메일 링크로 로그인
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
