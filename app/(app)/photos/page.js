"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentProfile } from "@/lib/ProfileContext";
import { logActivity } from "@/lib/activity";
import { Plus, X, Trash2 } from "lucide-react";

export default function PhotosPage() {
  const profile = useCurrentProfile();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  async function load() {
    const { data } = await supabase.from("photos").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setPhotos(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("photos").insert({ uploaded_by: profile.id, url: data.publicUrl });
      await logActivity(profile.id, "přidal/a novou fotku do galerie");
    }
    setUploading(false);
    e.target.value = "";
    load();
  }

  async function removePhoto(photo) {
    await supabase.from("photos").delete().eq("id", photo.id);
    setLightbox(null);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Fotky</h2>
        <p className="page-sub">Společná galerie ze všech pobytů na chalupě.</p>
      </div>

      <label className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, cursor: "pointer" }}>
        <Plus size={17} /> {uploading ? "Nahrávám…" : "Nahrát fotku"}
        <input type="file" accept="image/*" hidden onChange={onFileChosen} disabled={uploading} />
      </label>

      {photos.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Zatím žádné fotky.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {photos.map((p) => (
          <img
            key={p.id}
            src={p.url}
            alt=""
            onClick={() => setLightbox(p)}
            style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }}
          />
        ))}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}
        >
          <button className="icon-btn" style={{ position: "absolute", top: 20, right: 20, color: "#fff" }} onClick={() => setLightbox(null)}>
            <X size={26} />
          </button>
          {(lightbox.uploaded_by === profile.id || profile.role === "admin") && (
            <button
              className="icon-btn"
              style={{ position: "absolute", top: 20, right: 64, color: "#fff" }}
              onClick={(e) => {
                e.stopPropagation();
                removePhoto(lightbox);
              }}
              title="Smazat fotku"
            >
              <Trash2 size={22} />
            </button>
          )}
          <img src={lightbox.url} alt="" style={{ maxWidth: "90vw", maxHeight: "82vh", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
          <div style={{ color: "#fff", fontSize: 13, marginTop: 12 }}>nahrál/a {lightbox.profiles?.full_name}</div>
        </div>
      )}
    </div>
  );
}
