"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export default function PendingPage() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <Clock size={30} color="var(--roof)" style={{ marginBottom: 14 }} />
        <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 600, marginBottom: 8 }}>
          Čeká se na schválení
        </div>
        <p style={{ fontSize: 14, color: "#6b6a63", lineHeight: 1.5, marginBottom: 20 }}>
          Tvůj účet zatím čeká, než ho potvrdí administrátor. Jakmile bude schválen, budeš se moct přihlásit
          a rezervovat pobyty na chalupě.
        </p>
        <button className="btn-ghost" onClick={signOut}>
          Odhlásit se
        </button>
      </div>
    </div>
  );
}
