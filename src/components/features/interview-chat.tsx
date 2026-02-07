"use client";

import { useState, useRef, useEffect } from "react";
import { Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AgentMessage, BookContext } from "@/lib/agent/types";

interface InterviewChatProps {
  bookContext: BookContext;
  onSummaryReady: (summary: string) => void;
}

export function InterviewChat({ bookContext, onSummaryReady }: InterviewChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const turnCount = messages.filter((m) => m.role === "user").length;

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: AgentMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/agent/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, bookContext }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                assistantText += data.text;
                setMessages([...newMessages, { role: "assistant", content: assistantText }]);
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "잠깐 문제가 생겼어요. 다시 말씀해주세요." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const res = await fetch("/api/agent/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, bookContext }),
      });
      const data = await res.json();
      if (data.summary) {
        onSummaryReady(data.summary);
      }
    } catch {
      alert("정리에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSummarizing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bg-background flex flex-col rounded-[20px] border">
      {/* 메시지 영역 */}
      <div className="max-h-80 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm font-medium">대화로 기록하기</p>
            <p className="text-muted-foreground mt-1 text-xs">
              질문에 답하다 보면 자연스럽게 감상이 정리돼요
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content || (streaming ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 정리 버튼 */}
      {turnCount >= 3 && (
        <div className="border-t px-4 py-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSummarize}
            disabled={summarizing || streaming}
            className="w-full"
          >
            <FileText className="mr-1 h-4 w-4" />
            {summarizing ? "정리하는 중..." : "감상문으로 정리하기"}
          </Button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="min-h-[40px] resize-none text-sm"
            disabled={streaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
