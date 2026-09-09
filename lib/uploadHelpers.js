// Prohlížeče hádají znakovou sadu textových souborů, pokud ji server
// neřekne výslovně, a často to uhodnou špatně (Windows-1252 místo UTF-8),
// což u češtiny s diakritikou vyrobí "rozsypaný čaj". Tahle funkce k typu
// souboru přidá "; charset=utf-8" pro textové soubory, aby to nehádaly.
export function uploadContentType(file) {
  const type = file.type || "application/octet-stream";
  if (type.startsWith("text/") && !type.includes("charset")) {
    return `${type}; charset=utf-8`;
  }
  return type;
}

// Supabase Storage odmítne cestu k souboru, pokud obsahuje diakritiku,
// mezery nebo jiné "neobvyklé" znaky ("Invalid key"). Tahle funkce
// vytvoří z názvu souboru bezpečnou verzi jen pro uložení – v appce se
// dál všude zobrazuje originální, čitelný název (title / attachment_name).
export function sanitizeFileName(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > -1 ? name.slice(0, dot) : name;
  const ext = dot > -1 ? name.slice(dot).toLowerCase() : "";

  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // odstraní diakritická znaménka
    .replace(/[^a-zA-Z0-9-_]+/g, "_") // cokoliv jiného nahradí podtržítkem
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return (safeBase || "soubor") + ext;
}
