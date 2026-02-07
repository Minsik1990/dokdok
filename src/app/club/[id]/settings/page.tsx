"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Copy, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<{
    name: string;
    description: string | null;
    access_code: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/club/${clubId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.club) {
          setClub(data.club);
          setEditName(data.club.name);
          setEditDescription(data.club.description ?? "");
        }
      })
      .catch(() => {});
  }, [clubId]);

  function copyAccessCode() {
    if (club?.access_code) {
      navigator.clipboard.writeText(club.access_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSave() {
    if (!adminPassword.trim()) {
      setError("관리자 비밀번호를 입력하세요.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/club/${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }

      setClub(data.club);
      setEditing(false);
      setAdminPassword("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLeave() {
    await fetch("/api/club/leave", { method: "POST" });
    router.push("/");
  }

  if (!club) {
    return <div className="text-muted-foreground py-12 text-center text-sm">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Settings className="h-5 w-5" />
        모임 설정
      </h2>

      {/* 접속 코드 */}
      <Card className="rounded-[20px]">
        <CardContent className="space-y-3 pt-6">
          <Label>접속 코드</Label>
          <div className="flex items-center gap-2">
            <Input
              value={club.access_code}
              readOnly
              className="bg-input h-12 border-0 text-center text-lg font-medium"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-[14px]"
              onClick={copyAccessCode}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            이 코드를 공유하면 누구나 모임에 접속할 수 있어요
          </p>
        </CardContent>
      </Card>

      {/* 모임 정보 수정 */}
      <Card className="rounded-[20px]">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <Label>모임 정보</Label>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-primary text-sm font-medium"
              >
                수정
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-xs">
                  모임 이름
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-input h-12 border-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editDesc" className="text-xs">
                  설명
                </Label>
                <Input
                  id="editDesc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-input h-12 border-0"
                  placeholder="모임 설명 (선택)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminPw" className="text-xs">
                  관리자 비밀번호
                </Label>
                <Input
                  id="adminPw"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setError("");
                  }}
                  className="bg-input h-12 border-0"
                  placeholder="비밀번호 입력"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="h-10 flex-1 rounded-[14px]"
                >
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setAdminPassword("");
                    setError("");
                    setEditName(club.name);
                    setEditDescription(club.description ?? "");
                  }}
                  className="h-10 rounded-[14px]"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">{club.name}</p>
              <p className="text-muted-foreground text-sm">{club.description || "설명 없음"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 나가기 */}
      <Button
        variant="outline"
        className="text-muted-foreground h-12 w-full rounded-[14px]"
        onClick={handleLeave}
      >
        <LogOut className="mr-2 h-4 w-4" />
        모임에서 나가기
      </Button>
    </div>
  );
}
