import { supabase } from "./supabase";

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type?: string;
}

export type ProposalStatus = "pending_review" | "approved" | "rejected";

// Mirrors the real `proposals` table columns.
export interface ProposalRecord {
  id: string;
  created_at: string;
  updated_at: string;
  actor_type: string;
  source: string | null;
  intent: string;
  suggested_action: string;
  reasoning: string | null;
  confidence_score: number | null;
  status: ProposalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

// Kept so any older import of this name still compiles. It now describes the
// real proposals table, not the old made-up shape.
export type GovernanceProposal = ProposalRecord;

// Mirrors the real `decisions` table columns.
export interface DecisionRecord {
  id: number;
  date: string;
  label: string;
  detail: string;
  state: string;
}

export interface NodeStatus {
  id: string;
  name: string;
  region: string;
  latencyMs: number;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  loadPct: number;
}

export interface EcosystemMetrics {
  totalVaultAssets: string;
  activeProposals: string;
  governanceStatus: string;
  uptime: string;
}

// 1. Live Activity Log — real rows only. The real column is `timestamp`
//    (there is no `created_at`). Errors are thrown, not hidden, so the UI can
//    show "unavailable" instead of pretending the log is empty.
export async function getActivity(): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, actor, action, timestamp")
    .order("timestamp", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to load activity_log:", error);
    throw error;
  }

  return (data ?? []).map((d) => ({
    id: String(d.id),
    actor: d.actor,
    action: d.action,
    timestamp: d.timestamp,
  }));
}

// 2. Proposals — real rows from `proposals`. Empty array means genuinely none;
//    a failure throws so the page can say so honestly.
export async function getProposals(): Promise<ProposalRecord[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select(
      "id, created_at, updated_at, actor_type, source, intent, suggested_action, reasoning, confidence_score, status, reviewed_by, reviewed_at, review_note"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load proposals:", error);
    throw error;
  }

  return (data ?? []) as ProposalRecord[];
}

// 3. Decision log — real rows from `decisions`.
export async function getDecisions(): Promise<DecisionRecord[]> {
  const { data, error } = await supabase
    .from("decisions")
    .select("id, date, label, detail, state")
    .order("id", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load decisions:", error);
    throw error;
  }

  return (data ?? []) as DecisionRecord[];
}

// 4. Node Telemetry — honest stub until real infrastructure monitoring exists
export async function getNodeTelemetry(): Promise<NodeStatus[]> {
  // No real node/infra monitoring wired up yet. Return empty rather than
  // simulated/random data, per Honest-State Protocol.
  return [];
}

// 5. Ecosystem Top-Level Metrics — real pending-proposal count, honest
//    NOT TRACKED for everything that has no real source yet.
//    A failed query THROWS (it is not converted to NOT TRACKED), so the
//    Command Center can show the data link as unreachable instead of
//    reporting a connection that did not work.
export async function getEcosystemMetrics(): Promise<EcosystemMetrics> {
  const { count: pendingCount, error } = await supabase
    .from("proposals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) {
    console.error("Failed to load proposals for metrics:", error);
    throw error;
  }

  return {
    totalVaultAssets: "NOT TRACKED", // no vault/finance table exists yet
    activeProposals: String(pendingCount ?? 0).padStart(2, "0"), // proposals awaiting review
    governanceStatus: "NOT TRACKED", // no real governance-state source yet
    uptime: "NOT TRACKED", // no real uptime monitoring wired up yet
  };
}
