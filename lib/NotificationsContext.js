"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useCurrentProfile } from "./ProfileContext";

const SECTIONS = [
  { key: "calendar", table: "reservations", ownerCol: "user_id" },
  { key: "board", table: "messages", ownerCol: "user_id" },
  { key: "documents", table: "documents", ownerCol: "uploaded_by" },
  { key: "tasks", table: "tasks", ownerCol: "zadal" },
  { key: "polls", table: "polls", ownerCol: "created_by" },
  { key: "photos", table: "photos", ownerCol: "uploaded_by" },
];

const EPOCH = "1970-01-01T00:00:00Z";

const NotificationsContext = createContext({ counts: {}, markSeen: async () => {}, refresh: async () => {} });

export function NotificationsProvider({ children }) {
  const profile = useCurrentProfile();
  const [counts, setCounts] = useState({});

  const loadCounts = useCallback(async () => {
    if (!profile) return;

    const { data: seenRows } = await supabase.from("last_seen").select("section, seen_at").eq("user_id", profile.id);
    const seenMap = {};
    (seenRows || []).forEach((r) => (seenMap[r.section] = r.seen_at));

    const next = {};
    await Promise.all(
      SECTIONS.map(async (s) => {
        const since = seenMap[s.key] || EPOCH;
        const { count } = await supabase
          .from(s.table)
          .select("*", { count: "exact", head: true })
          .gt("created_at", since)
          .neq(s.ownerCol, profile.id);
        next[s.key] = count || 0;
      })
    );

    if (profile.role === "admin") {
      const { count: pendingCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      next.admin = pendingCount || 0;
    }

    setCounts(next);
  }, [profile]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const markSeen = useCallback(
    async (section) => {
      if (!profile) return;
      setCounts((prev) => ({ ...prev, [section]: 0 }));
      await supabase
        .from("last_seen")
        .upsert({ user_id: profile.id, section, seen_at: new Date().toISOString() }, { onConflict: "user_id,section" });
    },
    [profile]
  );

  return (
    <NotificationsContext.Provider value={{ counts, markSeen, refresh: loadCounts }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
