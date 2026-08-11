import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getActivity, ActivityEntry } from "@/lib/portal-queries";

export function useLiveActivityLog() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial hydration fetch
    getActivity()
      .then((data) => {
        if (isMounted) setLogs(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // 2. Realtime WebSocket subscription
    const channel = supabase
      .channel("live_logs_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log" },
        (payload) => {
          const newRecord = payload.new;
          if (!newRecord || !newRecord.id) return;

          const newEntry: ActivityEntry = {
            id: newRecord.id,
            actor: newRecord.actor || "SYSTEM",
            action: newRecord.action || "Executed system command",
            timestamp: newRecord.created_at || new Date().toISOString(),
            type: newRecord.type || "SYSTEM",
          };

          setLogs((prev) => {
            // Deduplicate to prevent race conditions during initial fetch
            if (prev.some((entry) => entry.id === newEntry.id)) {
              return prev;
            }
            return [newEntry, ...prev.slice(0, 9)];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { logs, isLoading };
}
