"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { Check, X } from "lucide-react";

export default function AdminPage() {
  const { profile } = useProfile();
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState("");

  async function load() {
    const { data: allProfiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
    setPending((allProfiles || []).filter((p) => p.status === "pending"));
    setUsers((allProfiles || []).filter((p) => p.status !== "pending"));
  }

  useEffect(() => {
    load();
  }, []);

  if (profile?.role !== "admin") {
    return <div style={{ fontSize: 14, color: "#6b6a63" }}>Tuto sekci vidí jen administrátoři.</div>;
  }

  async function approve(id) {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    load();
  }

  async function reject(id) {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    load();
  }

  async function toggleRole(u) {
    const newRole = u.role === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    load();
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setNotice(error ? "Nepodařilo se odeslat odkaz." : `Odkaz na reset hesla byl odeslán na ${email}.`);
    setTimeout(() => setNotice(""), 4000);
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, margin: 0 }}>Administrace</h2>
        <p style={{ margin: "4px 0 0", color: "#6b6a63", fontSize: 14 }}>Schvalování nových žádostí a správa uživatelů.</p>
      </div>

      {notice && <div style={{ fontSize: 13, color: "var(--moss)", marginBottom: 14 }}>{notice}</div>}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8a8a82", marginBottom: 10 }}>Čeká na schválení</div>
        {pending.length === 0 && <div style={{ fontSize: 13, color: "#8a8a82" }}>Žádné nové žádosti.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{p.full_name}</div>
                <div style={{ fontSize: 12, color: "#8a8a82" }}>{p.email}</div>
              </div>
              <button className="icon-btn" style={{ color: "var(--moss)" }} onClick={() => approve(p.id)} title="Schválit">
                <Check size={18} />
              </button>
              <button className="icon-btn" style={{ color: "var(--roof)" }} onClick={() => reject(p.id)} title="Zamítnout">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8a8a82", marginBottom: 10 }}>Uživatelé</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {users.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: "1px solid #ece8dd", flexWrap: "wrap" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: u.color, display: "inline-block" }} />
              <div style={{ flex: 1, minWidth: 120, fontSize: 14 }}>{u.full_name}</div>
              <span style={{ fontSize: 11, color: "#8a8a82" }}>{u.role === "admin" ? "administrátor" : "člen rodiny"}</span>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleRole(u)}>
                {u.role === "admin" ? "Odebrat admin" : "Nastavit jako admina"}
              </button>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => resetPassword(u.email)}>
                Reset hesla
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
