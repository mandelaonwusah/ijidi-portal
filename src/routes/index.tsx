// src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getEcosystemMetrics } from "@/lib/portal-queries";
import { useLiveActivityLog } from "@/hooks/useLiveActivityLog";
import { Bot, Zap, Shield, Globe, Users, Building2, ArrowRight, Loader2, Activity, Bell, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: CommandCenterOverview,
});

function formatTacticalTime(isoString?: string): string {
  if (!isoString) return "00:00:00";
  try {
    const date = new Date(iso
