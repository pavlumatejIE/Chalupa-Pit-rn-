"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useProfile() {
  const [state, setState] = useState({ loading: true, session: null, profile: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) setState({ loading: false, session: null, profile: null });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (mounted) setState({ loading: false, session, profile });
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
