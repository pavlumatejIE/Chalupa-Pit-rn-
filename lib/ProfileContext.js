"use client";
import { createContext, useContext } from "react";

const ProfileContext = createContext(null);

export function ProfileProvider({ profile, children }) {
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

// Vrací profil aktuálně přihlášeného a schváleného uživatele.
// ProtectedLayout garantuje, že v době, kdy se stránky uvnitř (app)
// vykreslují, už je profil vždy načtený – takže tu není žádné
// "loading" ani null, na které by komponenty musely čekat.
export function useCurrentProfile() {
  return useContext(ProfileContext);
}
