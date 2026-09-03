"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { czechHolidays, fmtDate } from "@/lib/holidays";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";

const today = new Date();

export default function CalendarPage() {
  const { profile } = useProfile();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [reservations, setReservations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [modalDate, setModalDate] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, margin: 0 }}>Kalendář rezervací</h2>
        <p style={{ margin: "4px 0 0", color: "#6b6a63", fontSize: 14 }}>
          Klikni na den a přidej svůj pobyt. Víc lidí najednou je v pořádku.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontFamily: "var(--serif)", fontSize: 17, textTransform: "capitalize" }}>{monthLabel}</div>
        <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
        {weekLabels.map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 12, fontWeight: 500, color: i >= 5 ? "var(--roof)" : "#8a8a82" }}>
            {w}
          </div>
        ))}
      </div>

      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
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
                borderRadius: 6,
                minHeight: 74,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isToday ? 600 : 400 }}>{date.getDate()}</span>
              {holidayName && <span style={{ fontSize: 10, color: "#9a6a26", lineHeight: 1.2 }}>{holidayName}</span>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {dayRes.map((r) => {
                  const u = profiles[r.user_id];
                  if (!u) return null;
                  return (
                    <span key={r.id} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 10, background: u.color, color: "#fff" }}>
                      {u.full_name.split(" ")[0]}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, color: "#6b6a63" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "#EEF1E9", border: "1px solid #e4e0d5", borderRadius: 3 }} /> víkend
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "#F6E9D8", border: "1px solid #e4e0d5", borderRadius: 3 }} /> státní svátek
        </span>
      </div>

      {modalDate && (
        <ReservationModal
          date={modalDate}
          currentUserId={profile.id}
          existing={reservationsFor(modalDate).map((r) => ({ ...r, user: profiles[r.user_id] }))}
          onClose={() => setModalDate(null)}
          onSave={addReservation}
          onDelete={removeReservation}
        />
      )}
    </div>
  );
}

function ReservationModal({ date, currentUserId, existing, onClose, onSave, onDelete }) {
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
        style={{ background: "#fff", borderRadius: 10, padding: 22, width: 380, maxHeight: "85vh", overflowY: "auto", border: "1px solid var(--border)" }}
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
                  {r.user_id === currentUserId && (
                    <button className="icon-btn" onClick={() => onDelete(r.id)}>
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
