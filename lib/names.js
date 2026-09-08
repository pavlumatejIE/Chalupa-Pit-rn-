// Vrátí jen křestní jméno, pokud je mezi danými profily jedinečné.
// Pokud se stejné křestní jméno objeví u víc lidí (např. dva "Petr"),
// zobrazí radši celé jméno, aby šlo poznat, o koho jde.
export function shortDisplayName(profile, allProfiles) {
  if (!profile?.full_name) return "";
  const firstName = profile.full_name.trim().split(/\s+/)[0];
  const collisionCount = (allProfiles || []).filter(
    (p) => p?.full_name && p.full_name.trim().split(/\s+/)[0] === firstName
  ).length;
  return collisionCount > 1 ? profile.full_name : firstName;
}
