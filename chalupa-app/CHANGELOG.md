# Historie verzí – Chalupa Pitárné

Číslo verze se zobrazuje v appce (v postranním panelu i na přihlašovací
obrazovce), takže po nasazení hned poznáš, jestli se nová verze opravdu
dostala na Netlify.

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
