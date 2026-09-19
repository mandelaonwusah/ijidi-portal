import { supabase } from "./supabase";

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type?: string;
}import { supabase } from "./supabase";

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type?: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: "ACTIVE" | "PASSED" | "FAILED" | "PENDING";
  votesFor: number;
  votesAgainst: number;
  quorumPct: number;
  endsIn: string;
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

// 1. Live Activity Log (Real data only — honest empty state if none exists)
// Columns: id, timestamp, actor, action, entity_id
export async function getActivity(): Promise<ActivityEntry[]> {
  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to load activity_log:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((d: Record<string, any>) => ({
      id: String(d.id),
      actor: d.actor || "GOVERNOR",
      action: d.action || "Executed system command",
      timestamp: d.timestamp || "",
      type: "SYSTEM", // activity_log has no type column
    }));
  } catch (err) {
    console.error("getActivity failed:", err);
    return [];
  }
}

// 2. Governance Proposals — honest stub until a real `proposals` table exists
export async function getProposals(): Promise<GovernanceProposal[]> {
  try {
    const { data, error } = await supabase.from("proposals").select("*").limit(5);

    if (error) {
      // Table likely doesn't exist yet — not an error state, just NOT TRACKED
      return [];
    }

    return (data as GovernanceProposal[]) ?? [];
  } catch (err) {
    console.error("getProposals failed:", err);
    return [];
  }
}

// 3. Node Telemetry — honest stub until real infrastructure monitoring exists
export async function getNodeTelemetry(): Promise<NodeStatus[]> {
  // No real node/infra monitoring wired up yet. Return empty rather than
  // simulated/random data, per Honest-State Protocol.
  return [];
}

// 4. Ecosystem Top-Level Metrics — real data from `decisions`, honest NOT TRACKED elsewhere
export async function getEcosystemMetrics(): Promise<EcosystemMetrics> {
  try {
    const { count: openDecisionCount, error } = await supabase
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("state", "OPEN");

    if (error) {
      console.error("Failed to load decisions for metrics:", error);
      return {
        totalVaultAssets: "NOT TRACKED",
        activeProposals: "NOT TRACKED",
        governanceStatus: "NOT TRACKED",
        uptime: "NOT TRACKED",
      };
    }

    return {
      totalVaultAssets: "NOT TRACKED", // no vault/finance table exists yet
      activeProposals: String(openDecisionCount ?? 0).padStart(2, "0"),
      governanceStatus: "NOT TRACKED", // no real governance-state source yet
      uptime: "NOT TRACKED", // no real uptime monitoring wired up yet
    };
  } catch (err) {
    console.error("getEcosystemMetrics failed:", err);
    return {
      totalVaultAssets: "NOT TRACKED",
      activeProposals: "NOT TRACKED",
      governanceStatus: "NOT TRACKED",
      uptime: "NOT TRACKED",
    };
  }
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: "ACTIVE" | "PASSED" | "FAILED" | "PENDING";
  votesFor: number;
  votesAgainst: number;
  quorumPct: number;
  endsIn: string;
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

// 1. Live Activity Log (Real data only — honest empty state if none exists)
export async function getActivity(): Promise<ActivityEntry[]> {
  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to load activity_log:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((d) => ({
      id: d.id,
      actor: d.actor || "GOVERNOR",
      action: d.action || "Executed system command",
      timestamp: d.created_at || new Date().toISOString(),
      type: d.type || "SYSTEM",
    }));
  } catch (err) {
    console.error("getActivity failed:", err);
    return [];
  }
}

// 2. Governance Proposals — honest stub until a real `proposals` table exists
export async function getProposals(): Promise<GovernanceProposal[]> {
  try {
    const { data, error } = await supabase.from("proposals").select("*").limit(5);

    if (error) {
      // Table likely doesn't exist yet — not an error state, just NOT TRACKED
      return [];
    }

    return (data as GovernanceProposal[]) ?? [];
  } catch (err) {
    console.error("getProposals failed:", err);
    return [];
  }
}

// 3. Node Telemetry — honest stub until real infrastructure monitoring exists
export async function getNodeTelemetry(): Promise<NodeStatus[]> {
  // No real node/infra monitoring wired up yet. Return empty rather than
  // simulated/random data, per Honest-State Protocol.
  return [];
}

// 4. Ecosystem Top-Level Metrics — real data from `decisions`, honest NOT TRACKED elsewhere
export async function getEcosystemMetrics(): Promise<EcosystemMetrics> {
  try {
    const { count: openDecisionCount, error } = await supabase
      .from("decisions")
      .select("*", { count: "exact", head: true })
      .eq("state", "OPEN");

    if (error) {
      console.error("Failed to load decisions for metrics:", error);
      return {
        totalVaultAssets: "NOT TRACKED",
        activeProposals: "NOT TRACKED",
        governanceStatus: "NOT TRACKED",
        uptime: "NOT TRACKED",
      };
    }

    return {
      totalVaultAssets: "NOT TRACKED", // no vault/finance table exists yet
      activeProposals: String(openDecisionCount ?? 0).padStart(2, "0"),
      governanceStatus: "NOT TRACKED", // no real governance-state source yet
      uptime: "NOT TRACKED", // no real uptime monitoring wired up yet
    };
  } catch (err) {
    console.error("getEcosystemMetrics failed:", err);
    return {
      totalVaultAssets: "NOT TRACKED",
      activeProposals: "NOT TRACKED",
      governanceStatus: "NOT TRACKED",
      uptime: "NOT TRACKED",
    };
  }
}
