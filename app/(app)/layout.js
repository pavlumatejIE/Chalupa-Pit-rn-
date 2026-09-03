"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import { ProfileProvider } from "@/lib/ProfileContext";
import AppShell from "@/components/AppShell";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { loading, session, profile } = useProfile();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (profile?.status !== "approved") router.replace("/pending");
  }, [loading, session, profile, router]);

  if (loading || !session || profile?.status !== "approved") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8a82", fontSize: 14 }}>
        Načítám…
      </div>
    );
  }

  return (
    <ProfileProvider profile={profile}>
      <AppShell profile={profile}>{children}</AppShell>
    </ProfileProvider>
  );
}
