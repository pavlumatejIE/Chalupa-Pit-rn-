"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { logActivity } from "@/lib/activity";
import { Plus, X, Check, Hammer, ShoppingCart, Trash2, Trophy } from "lucide-react";

const UNIT_LABEL = { czk: "Kč", hours: "hodin", persondays: "člověkodní" };

function fmtDate(dateOrIso) {
  if (!dateOrIso) return "";
  return new Date(dateOrIso).toLocaleDateString("cs-CZ");
}

function Avatar({ profile, size = 20 }) {
  if (!profile) return null;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: profile.color,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {profile.full_name?.split(" ").map((p) => p[0]).join("").slice(0, 2)}
    </span>
  );
}

export default function TasksPage() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [filterKind, setFilterKind] = useState(null);
  const [filterStav, setFilterStav] = useState("open");

  const [kind, setKind] = useState("prace");
  const [popis, setPopis] = useState("");
  const [termin, setTermin] = useState("");
  const [prirazeno, setPrirazeno] = useState("");
  const [cena, setCena] = useState("");
  const [jednotka, setJednotka] = useState("czk");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: profs } = await supabase.from("profiles").select("id, full_name, color");
    const map = {};
    (profs || []).forEach((p) => (map[p.id] = p));
    setProfiles(map);

    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = tasks.filter((t) => {
    if (filterKind && t.kind !== filterKind) return false;
    if (filterStav === "open" && t.hotovo) return false;
    if (filterStav === "done" && !t.hotovo) return false;
    return true;
  });

  const stats = useMemo(() => {
    const byUser = {};
    tasks
      .filter((t) => t.hotovo && t.prirazeno)
      .forEach((t) => {
        byUser[t.prirazeno] = (byUser[t.prirazeno] || 0) + 1;
      });
    return Object.entries(byUser)
      .map(([id, count]) => ({ profile: profiles[id], count }))
      .filter((s) => s.profile)
      .sort((a, b) => b.count - a.count);
  }, [tasks, profiles]);

  const totalCzk = tasks.filter((t) => t.jednotka === "czk").reduce((s, t) => s + Number(t.cena || 0), 0);

  async function addTask() {
    if (!popis.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      kind,
      popis: popis.trim(),
      termin: termin || null,
      prirazeno: prirazeno || null,
      cena: cena ? Number(cena) : null,
      jednotka,
      zadal: profile.id,
    });
    if (!error) {
      await logActivity(profile.id, `přidal/a požadavek – ${popis.trim()}`);
    }
    setPopis("");
    setTermin("");
    setPrirazeno("");
    setCena("");
    setJednotka("czk");
    setKind("prace");
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function toggleDone(t) {
    await supabase.from("tasks").update({ hotovo: !t.hotovo }).eq("id", t.id);
    if (!t.hotovo) {
      await logActivity(profile.id, `splnil/a požadavek – ${t.popis}`);
    }
    load();
  }

  async function removeTask(id) {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Co je potřeba</h2>
        <p className="page-sub">Práce a nákupy, které je potřeba udělat na chalupě.</p>
      </div>

      <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }} onClick={() => setShowForm(true)}>
        <Plus size={17} /> Přidat požadavek
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <span
          onClick={() => setFilterKind(null)}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: "1px solid #d9d4c5", background: filterKind === null ? "var(--ink)" : "#fff", color: filterKind === null ? "#fff" : "var(--ink)" }}
        >
          Vše
        </span>
        <span
          onClick={() => setFilterKind(filterKind === "prace" ? null : "prace")}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: "1px solid #d9d4c5", background: filterKind === "prace" ? "var(--ink)" : "#fff", color: filterKind === "prace" ? "#fff" : "var(--ink)" }}
        >
          <Hammer size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Práce
        </span>
        <span
          onClick={() => setFilterKind(filterKind === "nakup" ? null : "nakup")}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: "1px solid #d9d4c5", background: filterKind === "nakup" ? "var(--ink)" : "#fff", color: filterKind === "nakup" ? "#fff" : "var(--ink)" }}
        >
          <ShoppingCart size={13} style={{ marginRight: 5, verticalAlign: -2 }} /> Nákup
        </span>
        <span style={{ width: 1, background: "#e4e0d5", margin: "0 4px" }} />
        {[
          ["open", "Nesplněné"],
          ["done", "Splněné"],
          ["all", "Všechny"],
        ].map(([val, label]) => (
          <span
            key={val}
            onClick={() => setFilterStav(val)}
            style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, cursor: "pointer", border: "1px solid #d9d4c5", background: filterStav === val ? "var(--ink)" : "#fff", color: filterStav === val ? "#fff" : "var(--ink)" }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8a8a82", marginBottom: 10, textTransform: "uppercase" }}>
            <Trophy size={14} /> Kdo udělal nejvíc
          </div>
          {stats.length === 0 && <div style={{ fontSize: 13, color: "#8a8a82" }}>Zatím nic hotového.</div>}
          {stats.map((s, idx) => (
            <div key={s.profile.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
              <span style={{ width: 14, color: "#8a8a82" }}>{idx + 1}.</span>
              <Avatar profile={s.profile} size={20} />
              <span style={{ flex: 1 }}>{s.profile.full_name}</span>
              <span style={{ color: "#6b6a63" }}>{s.count}×</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 12, color: "#8a8a82", marginBottom: 10, textTransform: "uppercase" }}>Celkem v Kč (vše zadané)</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 24 }}>{totalCzk.toLocaleString("cs-CZ")} Kč</div>
          <div style={{ fontSize: 12, color: "#8a8a82", marginTop: 4 }}>{tasks.length} požadavků celkem</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Nic tu není.</div>}
        {filtered.map((t) => {
          const assignee = profiles[t.prirazeno];
          const creator = profiles[t.zadal];
          const canManage = t.zadal === profile.id || t.prirazeno === profile.id || profile.role === "admin";
          const canDelete = t.zadal === profile.id || profile.role === "admin";
          return (
            <div key={t.id} className="card" style={{ opacity: t.hotovo ? 0.6 : 1, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <button
                onClick={() => canManage && toggleDone(t)}
                disabled={!canManage}
                title={t.hotovo ? "Označit jako nesplněné" : "Označit jako splněné"}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: t.hotovo ? "none" : "1.5px solid #d9d4c5",
                  background: t.hotovo ? "var(--moss)" : "#fff",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canManage ? "pointer" : "default",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {t.hotovo && <Check size={14} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: t.kind === "prace" ? "#F6E9D8" : "#E6F1FB",
                      color: t.kind === "prace" ? "#9a6a26" : "#185FA5",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {t.kind === "prace" ? <Hammer size={11} /> : <ShoppingCart size={11} />}
                    {t.kind === "prace" ? "Práce" : "Nákup"}
                  </span>
                  <span style={{ fontSize: 15, textDecoration: t.hotovo ? "line-through" : "none" }}>{t.popis}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "#6b6a63" }}>
                  {t.termin && <span>do {fmtDate(t.termin)}</span>}
                  {t.cena != null && (
                    <span>
                      {t.cena} {UNIT_LABEL[t.jednotka]}
                    </span>
                  )}
                  {assignee && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Avatar profile={assignee} size={16} /> {assignee.full_name}
                    </span>
                  )}
                  <span>
                    zadal/a {creator?.full_name} · {fmtDate(t.created_at)}
                  </span>
                </div>
              </div>

              {canDelete && (
                <button className="icon-btn danger" onClick={() => removeTask(t.id)} title="Smazat">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowForm(false)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 440, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>Nový požadavek</div>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, color: "#6b6a63" }}>
                Typ
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1, background: kind === "prace" ? "#F6E9D8" : "#fff", borderColor: kind === "prace" ? "#eeddc4" : "#d9d4c5" }}
                    onClick={() => setKind("prace")}
                  >
                    <Hammer size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Práce
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ flex: 1, background: kind === "nakup" ? "#E6F1FB" : "#fff", borderColor: kind === "nakup" ? "#b5d4f4" : "#d9d4c5" }}
                    onClick={() => setKind("nakup")}
                  >
                    <ShoppingCart size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Nákup
                  </button>
                </div>
              </label>

              <label style={{ fontSize: 12, color: "#6b6a63" }}>
                Co je potřeba udělat / koupit
                <input className="input" value={popis} onChange={(e) => setPopis(e.target.value)} placeholder="např. Vyměnit těsnění u kohoutku" style={{ marginTop: 4 }} />
              </label>

              <div className="form-row" style={{ display: "flex", gap: 10 }}>
                <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
                  Do kdy (volitelné)
                  <input type="date" className="input" value={termin} onChange={(e) => setTermin(e.target.value)} style={{ marginTop: 4 }} />
                </label>
                <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
                  Kdo to udělá (volitelné)
                  <select className="input" value={prirazeno} onChange={(e) => setPrirazeno(e.target.value)} style={{ marginTop: 4 }}>
                    <option value="">Nepřiřazeno</option>
                    {Object.values(profiles).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row" style={{ display: "flex", gap: 10 }}>
                <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
                  Odhad nákladu (volitelné)
                  <input type="number" className="input" value={cena} onChange={(e) => setCena(e.target.value)} placeholder="0" style={{ marginTop: 4 }} />
                </label>
                <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
                  Jednotka
                  <select className="input" value={jednotka} onChange={(e) => setJednotka(e.target.value)} style={{ marginTop: 4 }}>
                    <option value="czk">Kč</option>
                    <option value="hours">hodin</option>
                    <option value="persondays">člověkodní</option>
                  </select>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>
                Zrušit
              </button>
              <button className="btn-primary" onClick={addTask} disabled={saving || !popis.trim()}>
                {saving ? "Ukládám…" : "Přidat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
