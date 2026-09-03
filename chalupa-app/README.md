# Chalupa Pitárné – rezervační systém

Next.js aplikace + Supabase (autentizace, databáze, úložiště souborů). Responzivní –
na desktopu boční panel, na mobilu spodní lišta a přizpůsobené formuláře.

## 1. Založení Supabase projektu

1. Jdi na [supabase.com](https://supabase.com) → New project.
2. Po vytvoření otevři **SQL Editor** → New query, vlož celý obsah souboru
   `supabase/schema.sql` a spusť ho. Tím vzniknou tabulky, zabezpečení (RLS)
   i úložiště na dokumenty a přílohy.
3. V **Project Settings → API** si zkopíruj `Project URL` a `anon public` klíč.
4. V **Authentication → Providers** nech zapnuté přihlášení e-mailem/heslem
   (výchozí nastavení).
5. V **Authentication → URL Configuration** nastav Site URL na adresu, na
   které appka poběží (např. `https://chalupa-pitarne.netlify.app`).

## 2. Lokální spuštění

```bash
npm install
cp .env.local.example .env.local
# do .env.local vlož Project URL a anon klíč ze Supabase
npm run dev
```

Aplikace poběží na `http://localhost:3000`.

## 3. První administrátor

1. Zaregistruj se v appce běžným formulářem.
2. V Supabase SQL Editoru spusť (uprav e-mail):

```sql
update public.profiles
set role = 'admin', status = 'approved'
where email = 'tvuj@email.cz';
```

Od teď se můžeš přihlásit a v sekci **Administrace** schvalovat další rodinné
příslušníky.

## 4. Nasazení – GitHub + Netlify

1. Založ nový GitHub repozitář a nahraj do něj tenhle projekt:
   ```bash
   git init
   git add .
   git commit -m "Rezervační systém pro chalupu"
   git branch -M main
   git remote add origin https://github.com/TVUJ_UCET/chalupa-pitarne.git
   git push -u origin main
   ```
2. Na [netlify.com](https://netlify.com) → **Add new site → Import an
   existing project** → vyber svůj GitHub repozitář.
3. Netlify díky `netlify.toml` sám pozná, že jde o Next.js (použije plugin
   `@netlify/plugin-nextjs`).
4. V **Site settings → Environment variables** přidej:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy. Po nasazení nezapomeň v Supabase (**Authentication → URL
   Configuration**) nastavit ostrou Netlify adresu jako Site URL.

## Co appka umí

- **Kalendář** – klik na den, rozsah od–do, volitelně hodiny a poznámka.
  Víkendy a české státní svátky jsou barevně odlišené. Víc lidí ve stejný den
  je v pořádku, kolize se neřeší.
- **Nástěnka** – zprávy s volitelnou přílohou (foto/dokument).
- **Dokumenty** – sdílené soubory, u každého lze zvolit „pro všechny" nebo
  „jen pro administrátory".
- **Platby** – zatím prázdná záložka, doladí se podle potřeby.
- **Administrace** – schvalování nových registrací, nastavení role admin/user,
  odeslání odkazu na reset hesla.
- **Registrace + schvalování** – nový účet je do schválení administrátorem
  needit, uvidí jen čekárnu.

## Co případně doladit dál

- Fotky chalupy jako hero na přihlašovací obrazovce (aktuálně gradient v
  barvách okolí – stačí nahradit `background` v `app/login/page.js` a
  `app/register/page.js` obrázkem, např. z `public/chalupa.jpg`).
- Push notifikace / e-mail při nové rezervaci nebo zprávě (Supabase Edge
  Functions + Resend/SendGrid).
- Sekce Platby – rozpočítávání nákladů mezi uživateli.
- Soukromější úložiště dokumentů (aktuálně veřejné odkazy v rámci storage
  bucketu – pro citlivější dokumenty lze přepnout na signed URLs).
