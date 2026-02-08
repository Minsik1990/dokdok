"use client";

import { useState, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MemberManagerProps {
  clubId: string;
  initialMembers: string[];
}

export function MemberManager({ clubId, initialMembers }: MemberManagerProps) {
  const [members, setMembers] = useState<string[]>(initialMembers);
  const [input, setInput] = useState("");
  const inputRef = useRef("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);

  async function handleAdd() {
    const name = (inputRef.current || input).trim();
    if (!name) return;
    if (members.includes(name)) {
      setInput("");
      inputRef.current = "";
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/club/${clubId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMembers((prev) => [...prev, name].sort());
        setInput("");
        inputRef.current = "";
      }
    } catch {
      // 무시
    } finally {
      setAdding(false);
    }
  }

  function handleAddSafe() {
    setTimeout(() => handleAdd(), 50);
  }

  async function handleRemove(name: string) {
    setRemoving(name);
    try {
      const res = await fetch(`/api/club/${clubId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m !== name));
      }
    } catch {
      // 무시
    } finally {
      setRemoving(null);
    }
  }

  function confirmRemove() {
    const targetName = deleteTargetName;
    setDeleteTargetName(null);
    if (targetName) {
      handleRemove(targetName);
    }
  }

  return (
    <div className="space-y-3">
      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <Badge key={m} variant="secondary" className="gap-1 rounded-full py-1 pr-1.5 pl-3">
              {m}
              <button
                type="button"
                onClick={() => setDeleteTargetName(m)}
                disabled={removing === m}
                className="hover:bg-muted rounded-full p-0.5"
              >
                {removing === m ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="멤버 이름 입력"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            inputRef.current = e.target.value;
          }}
          onCompositionEnd={(e) => {
            const val = (e.target as HTMLInputElement).value;
            setInput(val);
            inputRef.current = val;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleAddSafe();
            }
          }}
          className="bg-input h-10 flex-1 border-0"
          autoComplete="off"
          disabled={adding}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0 rounded-[14px] px-3"
          onClick={handleAddSafe}
          disabled={adding || !input.trim()}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      <AlertDialog
        open={!!deleteTargetName}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetName(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{deleteTargetName}&apos; 멤버를 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
