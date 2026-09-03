"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/pending");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background:
          "linear-gradient(180deg, rgba(43,42,38,0.55), rgba(43,42,38,0.55)), url('/chalupa.jpg') center/cover",
      }}
    >
      <div style={{ width: 360, maxWidth: "100%", background: "#fff", borderRadius: 12, padding: 28 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Nová registrace</div>
        <div style={{ fontSize: 13, color: "#8a8a82", marginBottom: 20 }}>
          Účet bude aktivní až po schválení administrátorem.
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 12, color: "#6b6a63" }}>
            Celé jméno
            <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ marginTop: 5 }} />
          </label>
          <label style={{ fontSize: 12, color: "#6b6a63" }}>
            E-mail
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 5 }} />
          </label>
          <label style={{ fontSize: 12, color: "#6b6a63" }}>
            Heslo
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 5 }}
            />
          </label>
          {error && <div style={{ fontSize: 13, color: "var(--roof)" }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? "Zakládám účet…" : "Zaregistrovat se"}
          </button>
        </form>

        <div style={{ fontSize: 13, color: "#6b6a63", marginTop: 18, textAlign: "center" }}>
          Už máš účet? <Link href="/login" style={{ color: "var(--roof)" }}>Přihlas se</Link>
        </div>
      </div>
    </div>
  );
}
