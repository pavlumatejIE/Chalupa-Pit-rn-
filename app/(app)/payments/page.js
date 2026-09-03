"use client";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, margin: 0 }}>Platby</h2>
        <p style={{ margin: "4px 0 0", color: "#6b6a63", fontSize: 14 }}>Tahle sekce se doladí podle toho, jak chcete náklady dělit.</p>
      </div>
      <div style={{ border: "1px dashed #cfc9b8", borderRadius: 8, padding: 40, textAlign: "center", color: "#8a8a82" }}>
        <CreditCard size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
        <div style={{ fontSize: 14 }}>Zatím prázdné – upřesníme společně, co přesně tu chcete sledovat.</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Např. energie, společné nákupy, rozúčtování podle počtu nocí…</div>
      </div>
    </div>
  );
}
