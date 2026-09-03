"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/useProfile";
import { logActivity } from "@/lib/activity";
import { uploadContentType } from "@/lib/uploadHelpers";
import { FileText, Plus, X, Tag, Trash2 } from "lucide-react";

export default function DocumentsPage() {
  const { profile } = useProfile();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categoryListError, setCategoryListError] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterYear, setFilterYear] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState(null);

  async function load() {
    const { data } = await supabase
      .from("documents")
      .select("*, profiles(full_name), document_categories(id, name)")
      .order("created_at", { ascending: false });
    setDocuments(data || []);

    const { data: cats } = await supabase.from("document_categories").select("*").order("name");
    setCategories(cats || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newCategory.trim()) return;
    setCategoryError("");
    const { error } = await supabase.from("document_categories").insert({ name: newCategory.trim() });
    if (error) {
      if (error.code === "23505") {
        setCategoryError("Tahle kategorie už existuje.");
      } else {
        setCategoryError("Nepodařilo se přidat kategorii: " + error.message);
      }
      return;
    }
    await logActivity(profile.id, `přidal/a kategorii dokumentů – ${newCategory.trim()}`);
    setNewCategory("");
    setShowCategoryForm(false);
    load();
  }

  async function removeCategory(id) {
    setCategoryListError("");
    const { data, error } = await supabase.from("document_categories").delete().eq("id", id).select();
    if (error) {
      setCategoryListError("Nepodařilo se smazat kategorii: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      setCategoryListError(
        "Kategorie se nesmazala – databáze to zamítla kvůli oprávnění. Zkontroluj, že máš v Supabase spuštěnou migraci migration_5_category_delete.sql."
      );
      return;
    }
    load();
  }

  async function upload() {
    if (!title.trim() || !file) return;
    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
      contentType: uploadContentType(file),
    });
    if (!upErr) {
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      await supabase.from("documents").insert({
        uploaded_by: profile.id,
        title,
        file_url: data.publicUrl,
        visible_to: visibility,
        category_id: categoryId || null,
      });
      await logActivity(profile.id, `nahrál/a nový dokument – ${title}`);
    }
    setTitle("");
    setFile(null);
    setVisibility("all");
    setCategoryId("");
    setShowForm(false);
    setUploading(false);
    load();
  }

  async function removeDocument(id, e) {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from("documents").delete().eq("id", id);
    load();
  }

  const years = useMemo(() => {
    const set = new Set(documents.map((d) => new Date(d.created_at).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (filterYear && new Date(d.created_at).getFullYear() !== filterYear) return false;
      if (filterCategoryId && d.category_id !== filterCategoryId) return false;
      return true;
    });
  }, [documents, filterYear, filterCategoryId]);

  const groups = useMemo(() => {
    const withCategory = categories.map((c) => ({
      id: c.id,
      name: c.name,
      docs: filteredDocuments.filter((d) => d.category_id === c.id),
    }));
    const uncategorized = {
      id: null,
      name: "Bez kategorie",
      docs: filteredDocuments.filter((d) => !d.category_id),
    };
    return [...withCategory, uncategorized].filter((g) => g.docs.length > 0);
  }, [categories, filteredDocuments]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="page-title">Dokumenty</h2>
        <p className="page-sub">Sdílené dokumenty k chalupě – revize, smlouvy, návody.</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setShowForm(true)}>
          <Plus size={17} /> Nahrát dokument
        </button>
        <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setCategoryError(""); setShowCategoryForm(true); }}>
          <Tag size={17} /> Přidat kategorii
        </button>
      </div>

      {categories.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#8a8a82", marginBottom: 8 }}>Kategorie</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => {
              const active = filterCategoryId === c.id;
              return (
                <span
                  key={c.id}
                  onClick={() => setFilterCategoryId(active ? null : c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    padding: "5px 6px 5px 12px",
                    borderRadius: 20,
                    background: active ? "#3B6D11" : "#EAF3DE",
                    color: active ? "#fff" : "#3B6D11",
                    border: "1px solid " + (active ? "#3B6D11" : "#d7e6c4"),
                    cursor: "pointer",
                  }}
                >
                  {c.name}
                  {profile.role === "admin" && (
                    <button
                      className="icon-btn"
                      style={{ padding: 2, color: active ? "#fff" : "#3B6D11" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(c.id);
                      }}
                      title="Smazat kategorii"
                    >
                      <X size={13} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {categoryListError && <div style={{ fontSize: 13, color: "var(--roof)", marginTop: 8 }}>{categoryListError}</div>}
        </div>
      )}

      {years.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#8a8a82", marginBottom: 8 }}>Rok</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {years.map((y) => {
              const active = filterYear === y;
              return (
                <span
                  key={y}
                  onClick={() => setFilterYear(active ? null : y)}
                  style={{
                    fontSize: 13,
                    padding: "5px 14px",
                    borderRadius: 20,
                    background: active ? "var(--roof)" : "#F6E9D8",
                    color: active ? "#fff" : "#9a6a26",
                    border: "1px solid " + (active ? "var(--roof)" : "#eeddc4"),
                    cursor: "pointer",
                  }}
                >
                  {y}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {(filterYear || filterCategoryId) && (
        <button
          className="btn-ghost"
          style={{ fontSize: 13, marginBottom: 20 }}
          onClick={() => {
            setFilterYear(null);
            setFilterCategoryId(null);
          }}
        >
          Zrušit filtr
        </button>
      )}

      {groups.length === 0 && <div style={{ fontSize: 14, color: "#8a8a82" }}>Žádné dokumenty neodpovídají filtru.</div>}

      {groups.map((g) => (
        <div key={g.id || "none"} style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>
            {g.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {g.docs.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", borderBottom: "1px solid #ece8dd" }}>
                <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                  <FileText size={20} color="var(--roof)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: "#8a8a82" }}>
                      nahrál/a {d.profiles?.full_name} · {new Date(d.created_at).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                </a>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 10,
                    background: d.visible_to === "all" ? "#F3F5EF" : "#F6E9D8",
                    color: d.visible_to === "all" ? "var(--moss)" : "#9a6a26",
                    flexShrink: 0,
                  }}
                >
                  {d.visible_to === "all" ? "Pro všechny" : "Jen admini"}
                </span>
                {(d.uploaded_by === profile.id || profile.role === "admin") && (
                  <button className="icon-btn danger" onClick={(e) => removeDocument(d.id, e)} title="Smazat">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowForm(false)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 440 }} onClick={(e) => e.stopPropagation()}>
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
                Kategorie (volitelné)
                <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ marginTop: 4 }}>
                  <option value="">Bez kategorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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

      {showCategoryForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(43,42,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
          onClick={() => setShowCategoryForm(false)}
        >
          <div className="modal-box" style={{ background: "#fff", borderRadius: 10, padding: 26, width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16 }}>Přidat kategorii</div>
              <button className="icon-btn" onClick={() => setShowCategoryForm(false)}>
                <X size={18} />
              </button>
            </div>

            <label style={{ fontSize: 12, color: "#6b6a63" }}>
              Název kategorie
              <input
                className="input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="např. Smlouvy, Revize, Návody"
                style={{ marginTop: 4 }}
              />
            </label>
            {categoryError && <div style={{ fontSize: 13, color: "var(--roof)", marginTop: 8 }}>{categoryError}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowCategoryForm(false)}>
                Zrušit
              </button>
              <button className="btn-primary" onClick={addCategory} disabled={!newCategory.trim()}>
                Přidat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
