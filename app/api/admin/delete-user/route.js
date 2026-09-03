import { supabaseAdmin, requireAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { user, errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  const { userId } = await request.json();
  if (!userId) {
    return Response.json({ error: "Chybí ID uživatele." }, { status: 400 });
  }
  if (userId === user.id) {
    return Response.json({ error: "Nemůžeš smazat sám sebe." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
