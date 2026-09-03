"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { logActivity } from "@/lib/activity";
import { Plus, X, Trash2 } from "lucide-react";

export default function PollsPage() {
  const { profile } = useProfile();
  const [polls, setPolls] = useState([]);
  const [options, setOptions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [draftOptions, setDraftOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: pollsData } = await supabase
      .from("polls")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });
    const { data: optionsData } = await supabase.from("poll_options").select("*");
    const { data: votesData } = await supabase.from("poll_votes").select("*");
    setPolls(pollsData || []);
    setOptions(optionsData || []);
    setVotes(votesData || []);
  }

  useEffect(() => {
    load();
  }, []);

  function updateDraftOption(idx, value) {
    setDraftOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  }

  function addOptionField() {
    setDraftOptions((prev) => [...prev, ""]);
  }

  function removeOptionField(idx) {
    setDraftOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createPoll() {
    const cleanOptions = draftOptions.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) return;
    setSaving(true);
    const { data: poll, error } = await supabase
      .from("polls")
      .insert({ created_by: profile.id, question: question.trim() })
      .select()
      .single();
    if (!error && poll) {
      await supabase.from("poll_options").insert(cleanOptions.map((text) => ({ poll_id: poll.id, text })));
      await logActivity(profile.id, `vytvořil/a hlasování – ${question.trim()}`);
    }
    setQuestion("");
    setDraftOptions(["", ""]);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function vote(pollId, optionId) {
    await supabase
      .from("poll_votes")
      .upsert({ poll_id: pollId, option_id: optionId, user_id: profile.id }, { onConflict: "poll_id,user_id" });
    load();
  }

  async function removePoll(id) {
    await supabase.from("polls").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Hlasování</h2>
        <p className="page-sub">Navrhni téma a nech ostatní hlasovat.</p>
      </div>

      <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }} onClick={() => setShowForm(true)}>
        <Plus size={17} /> Nové hlasování
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {polls.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Zatím žádná hlasování.</div>}
        {polls.map((poll) => {
          const pollOptions = options.filter((o) => o.poll_id === poll.id);
          const pollVotes = votes.filter((v) => v.poll_id === poll.id);
          const total = pollVotes.length;
          const myVote = pollVotes.find((v) => v.user_id === profile.id)?.option_id;
          const canDelete = poll.created_by === profile.id || profile.role === "admin";

          return (
            <div key={poll.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{poll.question}</div>
                {canDelete && (
                  <button className="icon-btn danger" onClick={() => removePoll(poll.id)} title="Smazat hlasování">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#8a8a82", marginBottom: 16 }}>
                navrhl/a {poll.profiles?.full_name} · {total} {total === 1 ? "hlas" : total >= 2 && total <= 4 ? "hlasy" : "hlasů"}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pollOptions.map((opt) => {
                  const count = pollVotes.filter((v) => v.option_id === opt.id).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isMine = myVote === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => vote(poll.id, opt.id)}
                      style={{
                        border: isMine ? "1.5px solid var(--roof)" : "1px solid var(--border)",
                        borderRadius: 7,
                        padding: 0,
                        background: "#fff",
                        cursor: "pointer",
                        overflow: "hidden",
                        position: "relative",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: `${pct}%`,
                          background: isMine ? "#F6E9D8" : "#F3F5EF",
                          transition: "width 0.3s",
                        }}
                      />
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "11px 16px", fontSize: 14.5 }}>
                        <span>{opt.text}</span>
                        <span style={{ color: "#6b6a63", flexShrink: 0, marginLeft: 10 }}>
                          {count} · {pct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowForm(false)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 460, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>Nové hlasování</div>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <label style={{ fontSize: 12, color: "#6b6a63" }}>
              O čem se bude hlasovat
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="např. Kam pojedeme na jaře?" style={{ marginTop: 4 }} />
            </label>

            <div style={{ marginTop: 14, fontSize: 12, color: "#6b6a63" }}>Možnosti</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {draftOptions.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", gap: 6 }}>
                  <input
                    className="input"
                    value={opt}
                    onChange={(e) => updateDraftOption(idx, e.target.value)}
                    placeholder={`Možnost ${idx + 1}`}
                  />
                  {draftOptions.length > 2 && (
                    <button className="icon-btn" onClick={() => removeOptionField(idx)}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={addOptionField}>
              + Přidat možnost
            </button>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>
                Zrušit
              </button>
              <button
                className="btn-primary"
                disabled={saving || !question.trim() || draftOptions.map((o) => o.trim()).filter(Boolean).length < 2}
                onClick={createPoll}
              >
                {saving ? "Vytvářím…" : "Vytvořit hlasování"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
