import { supabase } from "./supabaseClient";

export async function logActivity(userId, description) {
  await supabase.from("activity_log").insert({ user_id: userId, description });
}
