"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentProfile } from "@/lib/ProfileContext";
import { czechHolidays, fmtDate } from "@/lib/holidays";
import { logActivity } from "@/lib/activity";
import PhotoStrip from "@/components/PhotoStrip";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";

function fmtActivityDate(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("cs-CZ");
  const time = d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

const today = new Date();

export default function CalendarPage() {
  const profile = useCurrentProfile();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [reservations, setReservations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [modalDate, setModalDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);

  const holidays = useMemo(() => czechHolidays(cursor.getFullYear()), [cursor]);
  const monthLabel = cursor.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  async function load() {
    setLoading(true);
    const { data: profs } = await supabase.from("profiles").select("id, full_name, color");
    const map = {};
    (profs || []).forEach((p) => (map[p.id] = p));
    setProfiles(map);

    const { data: res } = await supabase
      .from("reservations")
      .select("*")
      .order("date_from", { ascending: true });
    setReservations(res || []);

    const { data: log } = await supabase
      .from("activity_log")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(15);
    setActivity(log || []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  function reservationsFor(date) {
    if (!date) return [];
    const key = fmtDate(date);
    return reservations.filter((r) => key >= r.date_from && key <= r.date_to);
  }

  async function addReservation(payload) {
    const { error } = await supabase.from("reservations").insert(payload);
    if (!error) {
      await logActivity(payload.user_id, `přidal/a rezervaci ${payload.date_from} – ${payload.date_to}`);
      await load();
      setModalDate(null);
    }
  }

  async function removeReservation(id) {
    await supabase.from("reservations").delete().eq("id", id);
    await load();
  }

  const weekLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Kalendář rezervací</h2>
        <p className="page-sub">Klikni na den a přidej svůj pobyt. Víc lidí najednou je v pořádku.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ fontFamily: "var(--serif)", fontSize: 20, textTransform: "capitalize" }}>{monthLabel}</div>
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 10 }}>
        {weekLabels.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: i >= 5 ? "var(--roof)" : "#8a8a82" }}>
            {w}
          </div>
        ))}
      </div>

      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {days.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const dow = (date.getDay() + 6) % 7;
          const isWeekend = dow >= 5;
          const holidayName = holidays[`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`];
          const dayRes = reservationsFor(date);
          const isToday = fmtDate(date) === fmtDate(today);
          let bg = "#fff";
          if (holidayName) bg = "#F6E9D8";
          else if (isWeekend) bg = "#EEF1E9";

          return (
            <button
              key={idx}
              className="day-cell"
              onClick={() => setModalDate(date)}
              title={holidayName || ""}
              style={{
                textAlign: "left",
                background: bg,
                border: isToday ? "1.5px solid var(--roof)" : "1px solid #e4e0d5",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: isToday ? 600 : 400 }}>{date.getDate()}</span>
              {holidayName && <span style={{ fontSize: 11.5, color: "#9a6a26", lineHeight: 1.25 }}>{holidayName}</span>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {dayRes.map((r) => {
                  const u = profiles[r.user_id];
                  if (!u) return null;
                  return (
                    <span
                      key={r.id}
                      title={r.note || ""}
                      style={{ fontSize: 11.5, padding: "2px 7px", borderRadius: 10, background: u.color, color: "#fff" }}
                    >
                      {u.full_name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
              {dayRes.some((r) => r.note) && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b6a63",
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {dayRes
                    .filter((r) => r.note)
                    .map((r) => r.note)
                    .join(" · ")}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 13, color: "#6b6a63" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 13, height: 13, background: "#EEF1E9", border: "1px solid #e4e0d5", borderRadius: 3 }} /> víkend
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 13, height: 13, background: "#F6E9D8", border: "1px solid #e4e0d5", borderRadius: 3 }} /> státní svátek
        </span>
      </div>

      <div style={{ marginTop: 36 }}>
        <div style={{ fontSize: 12.5, textTransform: "uppercase", color: "#8a8a82", marginBottom: 12 }}>Poslední události</div>
        {activity.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Zatím žádná aktivita.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {activity.map((a) => (
            <div key={a.id} style={{ fontSize: 14, lineHeight: 1.5, borderBottom: "1px solid #ece8dd", paddingBottom: 9 }}>
              <span style={{ color: "#8a8a82" }}>{fmtActivityDate(a.created_at)}</span>{" "}
              <span style={{ fontWeight: 500 }}>{a.profiles?.full_name || "Neznámý uživatel"}</span>{" "}
              <span>{a.description}</span>
            </div>
          ))}
        </div>
      </div>

      {modalDate && (
        <ReservationModal
          date={modalDate}
          currentUserId={profile.id}
          isAdmin={profile.role === "admin"}
          existing={reservationsFor(modalDate).map((r) => ({ ...r, user: profiles[r.user_id] }))}
          onClose={() => setModalDate(null)}
          onSave={addReservation}
          onDelete={removeReservation}
        />
      )}
      </div>

      <PhotoStrip />
    </div>
  );
}

function ReservationModal({ date, currentUserId, isAdmin, existing, onClose, onSave, onDelete }) {
  const [from, setFrom] = useState(fmtDate(date));
  const [to, setTo] = useState(fmtDate(date));
  const [hourFrom, setHourFrom] = useState("");
  const [hourTo, setHourTo] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={onClose}
    >
      <div
        className="modal-box"
        style={{ background: "#fff", borderRadius: 10, padding: 26, width: 440, maxHeight: "85vh", overflowY: "auto", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 16, textTransform: "capitalize" }}>
            {date.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {existing.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#8a8a82", marginBottom: 8, textTransform: "uppercase" }}>Kdo tu už bude</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {existing.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: r.user?.color, display: "inline-block" }} />
                  <div style={{ flex: 1 }}>
                    <div>{r.user?.full_name}</div>
                    <div style={{ color: "#8a8a82", fontSize: 11 }}>
                      {r.date_from} – {r.date_to}
                      {r.hour_from && ` · ${r.hour_from}–${r.hour_to}`}
                      {r.note && ` · ${r.note}`}
                    </div>
                  </div>
                  {(r.user_id === currentUserId || isAdmin) && (
                    <button className="icon-btn danger" onClick={() => onDelete(r.id)} title="Smazat">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-row" style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
              Od
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ marginTop: 4 }} />
            </label>
            <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
              Do
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} style={{ marginTop: 4 }} />
            </label>
          </div>
          <div className="form-row" style={{ display: "flex", gap: 10 }}>
            <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
              Hodina od (volitelné)
              <input type="time" className="input" value={hourFrom} onChange={(e) => setHourFrom(e.target.value)} style={{ marginTop: 4 }} />
            </label>
            <label style={{ flex: 1, fontSize: 12, color: "#6b6a63" }}>
              Hodina do (volitelné)
              <input type="time" className="input" value={hourTo} onChange={(e) => setHourTo(e.target.value)} style={{ marginTop: 4 }} />
            </label>
          </div>
          <label style={{ fontSize: 12, color: "#6b6a63" }}>
            Poznámka (volitelné)
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="např. jedeme jen na den" style={{ marginTop: 4 }} />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose}>
            Zrušit
          </button>
          <button
            className="btn-primary"
            disabled={saving || !from || !to || from > to}
            onClick={async () => {
              setSaving(true);
              await onSave({
                user_id: currentUserId,
                date_from: from,
                date_to: to,
                hour_from: hourFrom || null,
                hour_to: hourTo || null,
                note: note || null,
              });
              setSaving(false);
            }}
          >
            {saving ? "Ukládám…" : "Uložit rezervaci"}
          </button>
        </div>
      </div>
    </div>
  );
}
