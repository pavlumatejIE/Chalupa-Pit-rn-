"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { adminSetPassword, adminDeleteUser } from "@/lib/adminActions";
import { Check, X, KeyRound, Trash2 } from "lucide-react";

export default function AdminPage() {
  const { profile } = useProfile();
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState("");
  const [passwordFor, setPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function submitNewPassword() {
    if (newPassword.length < 6) {
      setPasswordError("Heslo musí mít alespoň 6 znaků.");
      return;
    }
    setSavingPassword(true);
    setPasswordError("");
    const result = await adminSetPassword(passwordFor.id, newPassword);
    setSavingPassword(false);
    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setNotice(`Heslo pro ${passwordFor.full_name} bylo změněno.`);
    setTimeout(() => setNotice(""), 4000);
    setPasswordFor(null);
    setNewPassword("");
  }

  async function confirmDelete() {
    setDeleting(true);
    const result = await adminDeleteUser(deleteTarget.id);
    setDeleting(false);
    if (result.error) {
      setNotice("Nepodařilo se smazat uživatele: " + result.error);
      setTimeout(() => setNotice(""), 5000);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    setNotice(`Uživatel ${deleteTarget.full_name} byl smazán.`);
    setTimeout(() => setNotice(""), 4000);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Administrace</h2>
        <p className="page-sub">Schvalování nových žádostí a správa uživatelů.</p>
      </div>

      {notice && <div style={{ fontSize: 14, color: "var(--moss)", marginBottom: 16 }}>{notice}</div>}

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12.5, textTransform: "uppercase", color: "#8a8a82", marginBottom: 12 }}>Čeká na schválení</div>
        {pending.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Žádné nové žádosti.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15 }}>{p.full_name}</div>
                <div style={{ fontSize: 13, color: "#8a8a82" }}>{p.email}</div>
              </div>
              <button className="icon-btn" style={{ color: "var(--moss)" }} onClick={() => approve(p.id)} title="Schválit">
                <Check size={20} />
              </button>
              <button className="icon-btn danger" onClick={() => reject(p.id)} title="Zamítnout">
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12.5, textTransform: "uppercase", color: "#8a8a82", marginBottom: 12 }}>Uživatelé</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {users.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", borderBottom: "1px solid #ece8dd", flexWrap: "wrap" }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: u.color, display: "inline-block" }} />
              <div style={{ flex: 1, minWidth: 130, fontSize: 15 }}>{u.full_name}</div>
              <span style={{ fontSize: 12, color: "#8a8a82" }}>{u.role === "admin" ? "administrátor" : "člen rodiny"}</span>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => toggleRole(u)}>
                {u.role === "admin" ? "Odebrat admin" : "Nastavit jako admina"}
              </button>
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => resetPassword(u.email)}>
                Odkaz na reset
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}
                onClick={() => {
                  setPasswordFor(u);
                  setNewPassword("");
                  setPasswordError("");
                }}
              >
                <KeyRound size={14} /> Nastavit heslo
              </button>
              {u.id !== profile.id && (
                <button className="icon-btn danger" onClick={() => setDeleteTarget(u)} title="Smazat uživatele">
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {passwordFor && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setPasswordFor(null)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>Nastavit heslo – {passwordFor.full_name}</div>
              <button className="icon-btn" onClick={() => setPasswordFor(null)}>
                <X size={18} />
              </button>
            </div>
            <label style={{ fontSize: 12, color: "#6b6a63" }}>
              Nové heslo
              <input
                type="text"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="alespoň 6 znaků"
                style={{ marginTop: 4 }}
              />
            </label>
            <p style={{ fontSize: 12, color: "#8a8a82", marginTop: 8 }}>
              Heslo se změní okamžitě, bez e-mailu s odkazem. Dej ho uživateli vědět mimo appku (osobně, SMS…).
            </p>
            {passwordError && <div style={{ fontSize: 13, color: "var(--roof)", marginTop: 8 }}>{passwordError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setPasswordFor(null)}>
                Zrušit
              </button>
              <button className="btn-primary" onClick={submitNewPassword} disabled={savingPassword || newPassword.length < 6}>
                {savingPassword ? "Ukládám…" : "Nastavit heslo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 16, marginBottom: 10 }}>Smazat uživatele?</div>
            <p style={{ fontSize: 14, color: "#3d3c37", lineHeight: 1.5 }}>
              Opravdu chceš natrvalo smazat <strong>{deleteTarget.full_name}</strong> ({deleteTarget.email})? Tahle akce je nevratná – smažou se i jeho
              rezervace a příspěvky na nástěnce.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>
                Zrušit
              </button>
              <button className="btn-primary" style={{ background: "var(--roof)" }} onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Mažu…" : "Smazat natrvalo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
