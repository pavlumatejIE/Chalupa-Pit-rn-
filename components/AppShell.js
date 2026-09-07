"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { APP_VERSION } from "@/lib/version";
import { useNotifications } from "@/lib/NotificationsContext";
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
  ListChecks,
} from "lucide-react";

const TABS = [
  { href: "/calendar", label: "Kalendář", icon: CalendarIcon, badgeKey: "calendar" },
  { href: "/board", label: "Nástěnka", icon: MessageSquare, badgeKey: "board" },
  { href: "/documents", label: "Dokumenty", icon: FileText, badgeKey: "documents" },
  { href: "/tasks", label: "Co je potřeba", icon: ListChecks, badgeKey: "tasks" },
  { href: "/polls", label: "Hlasování", icon: BarChart3, badgeKey: "polls" },
  { href: "/photos", label: "Fotky", icon: ImageIcon, badgeKey: "photos" },
  { href: "/payments", label: "Platby", icon: CreditCard },
];

function Badge({ count }) {
  if (!count) return null;
  return <span className="nav-badge">{count > 99 ? "99+" : count}</span>;
}

function BottomBadge({ count }) {
  if (!count) return null;
  return <span className="bottom-nav-badge">{count > 9 ? "9+" : count}</span>;
}

export default function AppShell({ profile, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { counts } = useNotifications();
  const tabs = profile?.role === "admin" ? [...TABS, { href: "/admin", label: "Admin", icon: ShieldCheck, badgeKey: "admin" }] : TABS;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: "var(--roof)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={21} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>Chalupa</div>
            <div style={{ fontSize: 12, color: "#8a8a82" }}>Pitárné · v{APP_VERSION}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={`nav-item ${pathname === t.href ? "active" : ""}`}>
              <t.icon size={18} />
              {t.label}
              {t.badgeKey && <Badge count={counts[t.badgeKey]} />}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, flex: 1 }}>
            <div>{profile?.full_name}</div>
            <div style={{ color: "#8a8a82" }}>{profile?.role === "admin" ? "administrátor" : "člen rodiny"}</div>
          </div>
          <button className="icon-btn" onClick={signOut} title="Odhlásit se">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="content">{children}</div>

      {/* Mobile bottom bar */}
      <div className="bottom-nav">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`bottom-nav-item ${pathname === t.href ? "active" : ""}`}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <t.icon size={20} />
              {t.badgeKey && <BottomBadge count={counts[t.badgeKey]} />}
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
