import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getSession = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("sessions")
    .select("group_id, books(title, author)")
    .eq("id", id)
    .maybeSingle()) as {
    data: { group_id: string; books: { title: string; author: string } | null } | null;
  };
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) return { title: "독서 세션" };

  const session = await getSession(id);
  const bookTitle = session?.books?.title ?? "독서 세션";
  const description = `${bookTitle} 독서 모임 세션`;
  return {
    title: bookTitle,
    description,
    openGraph: {
      title: `${bookTitle} | 독독`,
      description,
    },
  };
}

export default async function ShortSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const session = await getSession(id);
  if (!session) notFound();

  redirect(`/groups/${session.group_id}/sessions/${id}`);
}
