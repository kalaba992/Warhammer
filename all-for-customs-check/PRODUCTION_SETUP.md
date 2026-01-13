# Production Setup - Carinski Asistent

<!-- markdownlint-disable MD022 MD031 MD032 MD034 MD040 MD041 -->

**Status:** ✅ Live at www.carinski-asistent.com (Cloudflare Pages)
**Build Version:** 41ecc03  
**Last Updated:** 2026-01-02  

---

## 📋 Quick Start

### 1. **Pristup Aplikaciji**

- **Production URL:** https://www.carinski-asistent.com
- **Demo URL:** https://carinski-asistent.com

Aplikacija je omogućena za sve korisnike. Nema potrebe za specijalnom konfiguracijom.

### 2. **Prijava (Login)**

```
1. Klikni na "Login" dugme u gornjem desnom uglu
2. Slijedi Auth0 flow (email + lozinka)
3. Slijedi se vraćaš na aplikaciju sa aktivnom sesijom
```

### 3. **Upload Dokumenata**

```
1. Idi na "Dokumenti" sekciju
2. Klikni "Učitaj dokument" ili drag & drop
3. Odaberi PDF, Excel ili CSV fajl
4. Čekaj da se učitavanje završi (progres bar)
5. Dokument je sada u sistemu
```

### 4. **AI Klasifikacija**

```
1. Upišite opis proizvoda
2. Klikni "Klasificiraj"
3. Očekuj rezultat sa:
   - HS kodom (Harmonizovani sistem klasifikacije)
   - Vjerovatnoćom klasifikacije
   - Obrazloženjem
4. Sačuva se u povijesti automatski
```

### 5. **Pretraga Baze Znanja**

```
1. Idi na "Baza Znanja"
2. Pretraga po:
   - HS kodu
   - Nazivu proizvoda
   - Ključnim riječima
3. Pregled primjera i precendenti
```

### 6. **Export Rezultata**

```
1. Idi na "Preuzmi"
2. Odaberi format:
   - Excel (.xlsx)
   - CSV (.csv)
   - JSON (.json)
3. Klikni "Preuzmi" ili "Pošalji email"
```

---

## 🔐 Security & Privacy

- **Enkripcija:** Sve komunikacije su TLS 1.3 šifrirane
- **Auth:** Auth0 sa Multi-Factor Authentication opcijom
- **Data Storage:** Cloudflare Pages + Convex database
- **GDPR:** Kompatibilno sa GDPR zahtjevima
  - Pravo na zaboravljanje (Right to be forgotten)
  - Export podataka na zahtjev
  - Privacy policy dostupna u aplikaciji

---

## 📊 System Architecture

```
┌─────────────────────────────────────────┐
│      www.carinski-asistent.com          │
│       (Cloudflare Pages + Workers)      │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐  ┌────────────────┐ │
│  │  React UI      │  │  Vite Build    │ │
│  │  (TypeScript)  │  │  (Optimization)│ │
│  └────────────────┘  └────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ Convex DB      │  │ Auth0          │ │
│  │ (Data)         │  │ (Auth)         │ │
│  └────────────────┘  └────────────────┘ │
│                                         │
│  ┌────────────────┐  ┌────────────────┐ │
│  │ OpenAI API     │  │ Logging        │ │
│  │ (LLM)          │  │ (Analytics)    │ │
│  └────────────────┘  └────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🛠️ Admin Features

### Admin Dashboard (God Mode)

```
1. Pritisni Ctrl+Alt+G da otključaš admin mod
2. Dostupne opcije:
   - Pregled svih klasifikacija
   - Brisanje korisničkih podataka
   - Export kompletan database
   - System diagnostika
   - Cache management
```

---

## 📞 Support

**Email:** support@carinski-asistent.com  
**GitHub:** https://github.com/kalaba992/all-for-customs  
**Issues:** Prijava problema u GitHub issues  

---

## 🐛 Troubleshooting

### Problem: "LLM servis nije dostupan"

**Rješenje:**
- Aplikacija je u demo modu
- Čekaj da se OpenAI API integrira
- Probaj refresh (F5) strane

### Problem: "Dokument se ne učitava"

**Rješenje:**
- Provjeri veličinu fajla (max 50MB)
- Provjeri format (PDF, Excel, CSV)
- Provjeri internet konekciju

### Problem: "Ne mogu se prijaviti"

**Rješenje:**
- Provjeri da li je Auth0 dostupan
- Resetuj lozinku na Auth0
- Očisti browser cache (Ctrl+Shift+Delete)
- Kontaktiraj support@carinski-asistent.com

---

## 📈 Performance Tips

1. **Brže učitavanje:** Koristi Chrome/Firefox (ne IE)
2. **Brži upload:** Kompresuj PDF-e prije uploada
3. **Brža pretraga:** Koristi specifičnije ključne riječi

---

## 🔄 Updates & Maintenance

- **Automatski update:** Aplikacija se automatski ažurira na novoj verziji
- **Bez downtime-a:** Zero-downtime deployment preko Cloudflare
- **Backup:** Dnevne sigurnosne kopije baze podataka

---

**Verzija dokumentacije:** 1.0  
**Zadnja ažuriranja:** 2. januar 2026.
