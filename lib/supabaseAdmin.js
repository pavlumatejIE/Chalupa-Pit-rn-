import { createClient } from "@supabase/supabase-js";

// POZOR: tento soubor se smí importovat jen v souborech uvnitř app/api/**
// (běží pouze na serveru). SUPABASE_SERVICE_ROLE_KEY nesmí mít prefix
// NEXT_PUBLIC_ a nesmí se nikdy poslat do prohlížeče.
//
// Klient se vytváří "líně" (až při prvním použití), aby chybějící
// proměnná prostředí nespadla celé sestavení appky, ale jen konkrétní
// admin akci s jasnou chybovou hláškou.
let _client = null;
function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Chybí proměnná prostředí SUPABASE_SERVICE_ROLE_KEY na serveru (Netlify → Environment variables)."
    );
  }
  if (!_client) {
    _client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getAdminClient()[prop];
    },
  }
);

// Ověří, že požadavek přišel od přihlášeného a schváleného administrátora.
// Vrací buď { user } při úspěchu, nebo { errorResponse } při odmítnutí.
export async function requireAdmin(request) {
  let admin;
  try {
    admin = getAdminClient();
  } catch (e) {
    return { errorResponse: Response.json({ error: e.message }, { status: 500 }) };
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return { errorResponse: Response.json({ error: "Chybí přihlášení." }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return { errorResponse: Response.json({ error: "Neplatné přihlášení." }, { status: 401 }) };
  }

  const { data: profile } = await admin.from("profiles").select("role, status").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || profile.status !== "approved") {
    return { errorResponse: Response.json({ error: "Tuto akci může provést jen administrátor." }, { status: 403 }) };
  }

  return { user };
}
