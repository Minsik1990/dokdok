import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubHeader } from "@/components/features/club-header";
import { FabButton } from "@/components/features/fab-button";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: club } = await supabase.from("clubs").select("id, name").eq("id", id).maybeSingle();

  if (!club) notFound();

  return (
    <div className="bg-background mx-auto min-h-dvh max-w-[480px]">
      <ClubHeader clubId={club.id} clubName={club.name} />
      <main className="px-4 pt-4 pb-24">{children}</main>
      <FabButton href={`/club/${club.id}/session/new`} />
    </div>
  );
}
