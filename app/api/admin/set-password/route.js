import { supabaseAdmin, requireAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  const { userId, newPassword } = await request.json();
  if (!userId || !newPassword || newPassword.length < 6) {
    return Response.json({ error: "Heslo musí mít alespoň 6 znaků." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
