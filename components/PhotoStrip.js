"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function PhotoStrip() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(16);
      setPhotos(data || []);
    }
    load();
  }, []);

  if (photos.length === 0) return null;
  const loop = [...photos, ...photos];

  return (
    <div className="photo-strip-aside">
      <div style={{ fontSize: 11, textTransform: "uppercase", color: "#8a8a82", marginBottom: 8 }}>Fotky</div>
      <div className="photo-strip-viewport">
        <div className="photo-strip-track">
          {loop.map((p, i) => (
            <img key={i} src={p.url} alt="" className="photo-strip-img" />
          ))}
        </div>
      </div>
      <Link href="/photos" style={{ display: "block", fontSize: 12, color: "var(--roof)", marginTop: 8, textAlign: "center" }}>
        Zobrazit vše
      </Link>
    </div>
  );
}
