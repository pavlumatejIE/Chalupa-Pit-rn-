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
