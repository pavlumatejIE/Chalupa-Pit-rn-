"use client";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Platby</h2>
        <p className="page-sub">Tahle sekce se doladí podle toho, jak chcete náklady dělit.</p>
      </div>
      <div style={{ border: "1px dashed #cfc9b8", borderRadius: 8, padding: 48, textAlign: "center", color: "#8a8a82" }}>
        <CreditCard size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontSize: 15 }}>Zatím prázdné – upřesníme společně, co přesně tu chcete sledovat.</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Např. energie, společné nákupy, rozúčtování podle počtu nocí…</div>
      </div>
    </div>
  );
}
