"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";

export default function Home() {
  const router = useRouter();
  const { loading, session, profile } = useProfile();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (profile?.status !== "approved") router.replace("/pending");
    else router.replace("/calendar");
  }, [loading, session, profile, router]);

  return null;
}
