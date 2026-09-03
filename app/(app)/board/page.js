"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { logActivity } from "@/lib/activity";
import { Paperclip, X } from "lucide-react";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp"];
function isImage(name) {
  if (!name) return false;
  const ext = name.split(".").pop().toLowerCase();
  return IMAGE_EXT.includes(ext);
}

export default function BoardPage() {
  const { profile } = useProfile();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  async function load() {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles(full_name, color)")
      .order("created_at", { ascending: false });
    setMessages(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function post() {
    if (!text.trim()) return;
    setSending(true);
    let attachment_url = null;
    let attachment_name = null;

    if (file) {
      const path = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
      if (!upErr) {
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        attachment_url = data.publicUrl;
        attachment_name = file.name;
      }
    }

    await supabase.from("messages").insert({
      user_id: profile.id,
      content: text,
      attachment_url,
      attachment_name,
    });
    await logActivity(profile.id, "přidal/a příspěvek na nástěnku");

    setText("");
    setFile(null);
    setSending(false);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, margin: 0 }}>Nástěnka</h2>
        <p style={{ margin: "4px 0 0", color: "#6b6a63", fontSize: 14 }}>Vzkazy, novinky a fotky pro celou rodinu.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napiš zprávu pro ostatní…"
          style={{ minHeight: 60, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
          <label className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <Paperclip size={14} />
            {file ? file.name : "Přiložit soubor"}
            <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button className="btn-primary" onClick={post} disabled={sending}>
            {sending ? "Odesílám…" : "Odeslat"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", gap: 12 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: m.profiles?.color || "#999",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{m.profiles?.full_name}</span>
                <span style={{ fontSize: 11, color: "#8a8a82" }}>{new Date(m.created_at).toLocaleString("cs-CZ")}</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5 }}>{m.content}</p>
              {m.attachment_url && isImage(m.attachment_name) && (
                <img
                  src={m.attachment_url}
                  alt={m.attachment_name}
                  onClick={() => setLightbox(m.attachment_url)}
                  style={{
                    marginTop: 8,
                    width: 160,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    display: "block",
                  }}
                />
              )}
              {m.attachment_url && !isImage(m.attachment_name) && (
                <a
                  href={m.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--moss)",
                    border: "1px solid #dfe4d8",
                    borderRadius: 6,
                    padding: "4px 8px",
                    background: "#F3F5EF",
                  }}
                >
                  <Paperclip size={12} />
                  {m.attachment_name}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(43,42,38,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 20,
          }}
        >
          <button className="icon-btn" style={{ position: "absolute", top: 20, right: 20, color: "#fff" }} onClick={() => setLightbox(null)}>
            <X size={26} />
          </button>
          <img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
