"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { APP_VERSION } from "@/lib/version";
import {
  Calendar as CalendarIcon,
  MessageSquare,
  FileText,
  CreditCard,
  ShieldCheck,
  Home,
  LogOut,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";

const TABS = [
  { href: "/calendar", label: "Kalendář", icon: CalendarIcon },
  { href: "/board", label: "Nástěnka", icon: MessageSquare },
  { href: "/documents", label: "Dokumenty", icon: FileText },
  { href: "/polls", label: "Hlasování", icon: BarChart3 },
  { href: "/photos", label: "Fotky", icon: ImageIcon },
  { href: "/payments", label: "Platby", icon: CreditCard },
];

export default function AppShell({ profile, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = profile?.role === "admin" ? [...TABS, { href: "/admin", label: "Admin", icon: ShieldCheck }] : TABS;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--roof)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>Chalupa</div>
            <div style={{ fontSize: 11, color: "#8a8a82" }}>Pitárné · v{APP_VERSION}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={`nav-item ${pathname === t.href ? "active" : ""}`}>
              <t.icon size={16} />
              {t.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, flex: 1 }}>
            <div>{profile?.full_name}</div>
            <div style={{ color: "#8a8a82" }}>{profile?.role === "admin" ? "administrátor" : "člen rodiny"}</div>
          </div>
          <button className="icon-btn" onClick={signOut} title="Odhlásit se">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="content">{children}</div>

      {/* Mobile bottom bar */}
      <div className="bottom-nav">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`bottom-nav-item ${pathname === t.href ? "active" : ""}`}>
            <t.icon size={20} />
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
