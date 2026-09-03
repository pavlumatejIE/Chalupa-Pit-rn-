import { supabase } from "./supabaseClient";

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` };
}

export async function adminSetPassword(userId, newPassword) {
  const res = await fetch("/api/admin/set-password", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ userId, newPassword }),
  });
  return res.json();
}

export async function adminDeleteUser(userId) {
  const res = await fetch("/api/admin/delete-user", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
