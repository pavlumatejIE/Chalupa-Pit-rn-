# Historie verzí – Chalupa Pitárné

Číslo verze se zobrazuje v appce (v postranním panelu i na přihlašovací
obrazovce), takže po nasazení hned poznáš, jestli se nová verze opravdu
dostala na Netlify.

## 1.14
- Oprava vážné chyby: appka mohla občas spadnout s hláškou "client-side
  exception" hned po otevření stránky. Příčina: každá stránka si sama
  nezávisle znovu zjišťovala přihlášeného uživatele, a když se data
  stránky (rezervace, dokumenty…) načetla rychleji, appka se pokusila
  přečíst údaje z ještě nenačteného uživatele. Profil se teď zjišťuje
  jen jednou nahoře a předává se dál, takže se ten závod už nemůže stát

## 1.13
- Appku teď jde přidat na plochu telefonu jako skutečnou ikonu (vlastní
  ikonka, otevře se bez adresního řádku prohlížeče) – přidán web manifest
  a ikony pro Android i iOS

## 1.12
- Oprava: nahrané .txt (a další textové) soubory s češtinou se mohly
  zobrazit s rozsypanou diakritikou – appka teď explicitně řekne
  prohlížeči, že jde o UTF-8, takže se text zobrazí správně

## 1.11
- Oprava: chybějící SUPABASE_SERVICE_ROLE_KEY dřív shodila celé sestavení
  webu na Netlify. Teď se appka sestaví v pořádku vždy – bez klíče jen
  tlačítka „Nastavit heslo“ a mazání uživatele zobrazí srozumitelnou
  chybovou hlášku místo pádu celého webu

## 1.10
- Nová sekce „Co je potřeba" – práce a nákupy s termínem, přiřazením,
  odhadem nákladu (Kč/hodin/člověkodní), žebříčkem „kdo udělal nejvíc"
  a součtem nákladů
- Administrace: nové tlačítko „Nastavit heslo" – admin může uživateli
  rovnou nastavit nové heslo bez e-mailového odkazu
- Administrace: možnost natrvalo smazat uživatele (s potvrzením)
- Vyžaduje nový tajný klíč SUPABASE_SERVICE_ROLE_KEY v Netlify (viz README)

## 1.09
- Dokumenty přepracované na odstavce podle kategorie – každá kategorie má
  vlastní blok se svými dokumenty (i dokumenty bez kategorie mají svůj blok)
- Přidán filtr podle roku nahrání a podle kategorie – klikni na štítek a
  zobrazí se jen odpovídající dokumenty, další klik filtr zruší

## 1.08
- Oprava: mazání kategorie se dřív mohlo tiše nezdařit bez jakékoli hlášky
  (databáze u zamítnutého mazání nevrací chybu, jen smaže 0 řádků) –
  appka to teď pozná a řekne přesně, v čem je problém

## 1.07
- Oprava: sekce Dokumenty měla omylem zdvojený kód (dva seznamy kategorií,
  dvě funkce na mazání) – vyčištěno na jedno přehledné místo
- Mazání kategorie teď zobrazí chybovou hlášku, pokud se nepovede
  (nejspíš proto, že ještě nebyla spuštěná migration_5_category_delete.sql)

## 1.06
- Existující kategorie dokumentů se teď zobrazí jako zelené štítky nad
  seznamem dokumentů; administrátor je odtud může mazat

## 1.05
- Oprava: tlačítko „Přidat kategorii" teď zobrazí chybovou hlášku, pokud
  se přidání nepovede (dřív selhalo tiše a vypadalo to, že nefunguje)

## 1.04
- Oprava chyby, kdy se datum rezervace při kliknutí na den posunulo o den
  zpátky (byl to problém s časovou zónou)
- Poznámka u rezervace se teď zobrazí přímo v políčku kalendáře, ne jen
  po rozkliknutí dne

## 1.03
- Zvětšené a přehlednější rozhraní pro monitory a PC (kalendář, pás fotek,
  postranní panel, karty, formuláře) – mobil zůstává kompaktní beze změny
- Mazání: administrátor může smazat cokoli; ostatní uživatelé mažou jen
  svoje rezervace, příspěvky na nástěnce, dokumenty, hlasování a fotky

## 1.02
- Hlasování – návrhy, možnosti, hlasování s grafem výsledků
- Fotky – galerie s nahráváním + pomalu rolující pás fotek vedle kalendáře

## 1.01
- Kategorie dokumentů + tlačítko na přidání kategorie
- Náhled a rozklikávání fotek na nástěnce
- „Poslední události" pod kalendářem (log aktivit)

## 1.00
- První nasazená verze: kalendář s českými svátky, nástěnka, dokumenty,
  administrace, responzivní rozhraní pro mobil
