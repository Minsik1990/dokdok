import { SessionForm } from "@/components/features/session-form";

export default async function NewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clubId } = await params;

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">새 모임 기록</h2>
      <SessionForm clubId={clubId} />
    </div>
  );
}
