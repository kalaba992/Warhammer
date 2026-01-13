# God Mode - Dokumentacija

## Pregled

God Mode je specijalni administratorski režim dostupan isključivo vlasnicima (isOwner=true) sistema sa 2FA zaštitom. Omogućava pristup svim naprednim funkcijama bez ograničenja.

## Aktivacija God Mode-a

**Frontend:**
- Vlasnici vide dugme "Aktiviraj God Mode" u Sidebar-u
- Klikom na dugme šalje POST zahtev na `/api/godmode/activate`
- Backend proverava vlasništvo i 2FA
- Ako je uspešno, prikazuje se badge "GOD MODE AKTIVAN" i upozorenje

**Backend:**
- Endpoint: `POST /api/godmode/activate`
- Provera: `isOwner=true` i `twoFA=true`
- Akcija: Aktivira God Mode za korisnika
- Logovanje: Detaljno beleži aktivaciju u audit trail

## Deaktivacija God Mode-a

**Frontend:**
- Vlasnici vide dugme "Deaktiviraj God Mode" u Sidebar-u kada je režim aktivan
- Klikom šalje POST zahtev na `/api/godmode/deactivate`

**Backend:**
- Endpoint: `POST /api/godmode/deactivate`
- Akcija: Deaktivira God Mode za korisnika
- Logovanje: Detaljno beleži deaktivaciju

## God Mode Status

**Frontend:**
- Koristi useGodMode() hook za praćenje statusa
- GodModeBadge prikazuje crveno upozorenje kada je aktivan
- GodModeWarning prikazuje žuto upozorenje sa tekstom o odgovornosti

**Backend:**
- Endpoint: `GET /api/godmode/status`
- Vraća: `{ godMode: boolean }`

## Kontrola pristupa

**Vidljive komponente samo u God Mode:**
- Admin meni u Sidebar-u
- Napredne dijagnostičke funkcije
- Sve akcije bez limita i zaštite

**Sakrivene komponente:**
- Admin meni je sakriven ako God Mode nije aktivan
- Ostali korisnici nemaju pristup God Mode opcijama

## Audit Logging

Svaka akcija u God Mode-u se detaljno loguje sa:
- Timestamp
- Korisnikova email adresa
- Tip akcije
- Status (uspešno/neuspešno)
- Metapodaci (ako postoje)

Primer log zapisa:
```
[AUDIT] God Mode ACTIVATED by admin@example.com at 2026-01-01T12:00:00Z
[AUDIT] God Mode | diagnostics | success | admin@example.com | 2026-01-01T12:00:30Z | {}
[AUDIT] God Mode DEACTIVATED by admin@example.com at 2026-01-01T12:30:00Z
```

## Sigurnosne Smernice

1. **Koristi God Mode samo kada je potrebno** - Aktiviraj samo kada obavljaš administrativne zadatke
2. **Uvek deaktiviraj nakon korišćenja** - Sprečava slučajne akcije
3. **Monitoring** - Sve akcije se loguju, budi svestan toga
4. **2FA Obavezno** - God Mode zahteva 2FA zaštitu
5. **Samo vlasnici** - Pristup je ograničen na vlasnika sistema
6. **Upozorenja** - Čitaj upozorenja pre nego što izvrši akciju

## API Referenca

### Aktivacija God Mode
```bash
POST /api/godmode/activate
Headers: 
  x-user-id: "user-id"
  x-user-email: "admin@example.com"
  x-user-owner: "true"
  x-user-2fa: "true"

Response:
{
  "godMode": true
}
```

### Deaktivacija God Mode
```bash
POST /api/godmode/deactivate
Headers: (kao iznad)

Response:
{
  "godMode": false
}
```

### Status
```bash
GET /api/godmode/status
Headers: (kao iznad)

Response:
{
  "godMode": true/false
}
```

## Implementacione Datoteke

**Backend:**
- `/apps/backend/src/index.ts` - God Mode API rute i logika
- `/apps/backend/src/rbac.ts` - Audit logging helper

**Frontend:**
- `/src/App.tsx` - GodModeContext, GodModeProvider, GodModeBadge, GodModeWarning
- `/src/components/Sidebar.tsx` - Dugme za aktivaciju/deaktivaciju, filtrirani meni
- `/src/hooks/useGodMode.ts` - Custom hook za pristup God Mode funkcionalnostima

## Testiranje

1. **Aktivacija bez vlasništva:** Trebalo bi da se baci greška 403
2. **Aktivacija bez 2FA:** Trebalo bi da se baci greška 403
3. **Aktivacija sa vlasništvom + 2FA:** Trebalo bi da bude uspešna
4. **Badge i upozorenje:** Trebalo bi da budu vidljivi
5. **Admin meni:** Trebalo bi da bude sakriven bez God Mode
6. **Audit trail:** Trebalo bi da se loguju sve akcije

---

**Zadnje ažuriranje:** 01.01.2026.
