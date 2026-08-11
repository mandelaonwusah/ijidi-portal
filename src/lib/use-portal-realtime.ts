// src/lib/use-portal-realtime.ts

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function usePortalRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("portal-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          // Instantly refresh active queries on database updates
          queryClient.invalidateQueries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
