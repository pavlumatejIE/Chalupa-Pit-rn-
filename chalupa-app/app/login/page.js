"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { APP_VERSION } from "@/lib/version";
import { Home } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Nesprávný e-mail nebo heslo.");
      return;
    }
    router.push("/");
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "var(--roof)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Home size={19} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600 }}>Chalupa</div>
            <div style={{ fontSize: 12, color: "#8a8a82" }}>Pitárné</div>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            {loading ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>

        <div style={{ fontSize: 13, color: "#6b6a63", marginTop: 18, textAlign: "center" }}>
          Nemáš účet? <Link href="/register" style={{ color: "var(--roof)" }}>Zaregistruj se</Link>
        </div>
        <div style={{ fontSize: 11, color: "#c2c0b6", marginTop: 14, textAlign: "center" }}>verze {APP_VERSION}</div>
      </div>
    </div>
  );
}
