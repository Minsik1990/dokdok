"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InvitePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.push("/login");
      } else {
        setError("초대 코드가 맞지 않아요");
      }
    } catch {
      setError("잠깐 문제가 생겼어요. 다시 시도해주세요");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-primary text-2xl font-bold">책담</h1>
          <p className="text-muted-foreground text-sm">나의 독서 기록</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-center text-sm">
                베타 테스트 중이에요. 초대 코드를 입력해주세요.
              </p>
              <Input
                type="text"
                placeholder="초대 코드"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
              {error && <p className="text-destructive text-center text-sm">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!code.trim() || loading}>
              {loading ? "확인 중..." : "입장하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
