"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { FileText, Plus, X } from "lucide-react";

export default function DocumentsPage() {
  const { profile } = useProfile();
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("documents")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });
    setDocuments(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function upload() {
    if (!title.trim() || !file) return;
    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (!upErr) {
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      await supabase.from("documents").insert({
        uploaded_by: profile.id,
        title,
        file_url: data.publicUrl,
        visible_to: visibility,
      });
    }
    setTitle("");
    setFile(null);
    setVisibility("all");
    setShowForm(false);
    setUploading(false);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, margin: 0 }}>Dokumenty</h2>
        <p style={{ margin: "4px 0 0", color: "#6b6a63", fontSize: 14 }}>Sdílené dokumenty k chalupě – revize, smlouvy, návody.</p>
      </div>

      <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }} onClick={() => setShowForm(true)}>
        <Plus size={16} /> Nahrát dokument
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {documents.map((d) => (
          <a
            key={d.id}
            href={d.file_url}
            target="_blank"
            rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: "1px solid #ece8dd", textDecoration: "none", color: "inherit" }}
          >
            <FileText size={18} color="var(--roof)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
              <div style={{ fontSize: 11, color: "#8a8a82" }}>nahrál/a {d.profiles?.full_name}</div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 10,
                background: d.visible_to === "all" ? "#F3F5EF" : "#F6E9D8",
                color: d.visible_to === "all" ? "var(--moss)" : "#9a6a26",
                flexShrink: 0,
              }}
            >
              {d.visible_to === "all" ? "Pro všechny" : "Jen admini"}
            </span>
          </a>
        ))}
      </div>

      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowForm(false)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 22, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>Nahrát dokument</div>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, color: "#6b6a63" }}>
                Název dokumentu
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="např. Revize komína 2026.pdf" style={{ marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, color: "#6b6a63" }}>
                Soubor
                <input type="file" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ marginTop: 4, padding: 6 }} />
              </label>
              <label style={{ fontSize: 12, color: "#6b6a63" }}>
                Kdo to může vidět
                <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)} style={{ marginTop: 4 }}>
                  <option value="all">Všichni schválení uživatelé</option>
                  <option value="admins">Jen administrátoři</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>
                Zrušit
              </button>
              <button className="btn-primary" onClick={upload} disabled={uploading || !title || !file}>
                {uploading ? "Nahrávám…" : "Nahrát"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
