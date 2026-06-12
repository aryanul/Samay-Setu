import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import { getContestSnapshot } from "@/lib/contest";
import ContestClient from "./ContestClient";
import "./contest.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Founding 50 Race — Samay Setu",
  description: "Race to the top of the Founding 50 leaderboard for a Lifetime VIP Pass.",
};

export default async function ContestPage() {
  const session = await readMemberSession();
  if (!session) {
    redirect("/login");
  }

  const snapshot = await getContestSnapshot(session.memberId);
  return <ContestClient initial={snapshot} />;
}
