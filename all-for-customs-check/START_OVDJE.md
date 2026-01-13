# 🎯 POČNI OVDJE - Push na GitHub

> **CILJ:** Snimiti cijeli projekat "Carinski Alat" na GitHub repository `all-for-customs`

---

## 📋 PRIJE NEGO ŠTO POČNEŠ

✅ Imaš GitHub nalog?  
- **DA** → Nastavi dalje  
- **NE** → Idi na https://github.com/signup

✅ Ulogovan si na GitHub?  
- Provjeri: https://github.com

---

## 🚀 NAČIN 1: AUTOMATSKI (Preporučeno - 2 minute)

### Koraci:

#### 1. Kreiraj GitHub Repository
- 🌐 Idi na: https://github.com/new
- 📝 Repository name: `all-for-customs`
- 🔘 Odaberi: Public ili Private
- ⚠️ **VAŽNO:** NE čekiraj "Add README", "Add .gitignore" ili "Choose license"
- ✅ Klikni: **"Create repository"**

#### 2. Kopiraj Repository URL
GitHub će prikazati nešto kao:
```
https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs.git
```
**KOPIRAJ OVAJ LINK!**

#### 3. Otvori Terminal i Izvršи

**Zameni `TVOJE_KORISNIČKO_IME` sa stvarnim username-om:**

```bash
# Dodaj remote
git remote add origin https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs.git

# Pokreni auto-save skriptu
chmod +x git-save.sh
./git-save.sh "🎉 Inicijalni commit - Carinski Alat v1.0.0"
```

#### 4. Provjeri
Otvori u browseru:
```
https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs
```

**Vidiš li sve fajlove?** ✅ GOTOVO!

---

## 🛠️ NAČIN 2: RUČNO (Za one koji vole kontrolu)

### Koraci:

```bash
# 1. Provjeri status
git status

# 2. Dodaj GitHub remote (zameni TVOJE_IME!)
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git

# 3. Provjeri povezanost
git remote -v

# 4. Dodaj sve fajlove
git add .

# 5. Napravi commit
git commit -m "🎉 Inicijalni commit - Carinski Alat v1.0.0

Implementirane funkcionalnosti:
✅ Multi-language support (12 jezika)
✅ Cyrillic/Latin script konverzija
✅ AI-powered HS code klasifikacija
✅ Batch document upload (50 fajlova)
✅ CSV/Excel import (100+ redova)
✅ Excel export sa filterima
✅ Classification history
✅ Real-time chat interface
✅ HS code search i tree view
✅ Complete dokumentacija (3500+ linija)
✅ GitHub Actions CI/CD
✅ Cloudflare Pages ready"

# 6. Push na GitHub
git push -u origin main

# Ako dobijеš grešku, probaj:
git branch -M main
git push -u origin main
```

---

## 🎊 USPJEH - Šta Dalje?

Kada vidiš projekat na GitHub-u:

### 🔥 ODMAH:
1. ⭐ Dodaj "About" sekciju:
   - Go to repository → Settings → About (edit)
   - Dodaj opis: "AI sistem za klasifikaciju carinskih HS kodova"
   - Dodaj topics: `ai`, `customs`, `hs-code`, `classification`, `bosnia`

2. 📌 Pin važne Issues/Discussions

3. ✅ Verifikuj GitHub Actions:
   - Idi na "Actions" tab
   - Trebalo bi da vidiš workflows

### ☁️ SLJEDEĆE (Deploy):
- 📖 Pročitaj: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🚀 Deploy na Cloudflare Pages

### 🔄 ZA BUDUĆNOST:
- Svaka promjena: `./git-save.sh "Opis promjene"`
- Provjera: `git status`
- Istorija: `git log --oneline`

---

## 📚 DODATNI RESURSI

| Dokument | Opis |
|----------|------|
| 📘 [BRZI_VODIC.md](BRZI_VODIC.md) | Super kratke upute |
| 📗 [KAKO_SNIMITI_NA_GITHUB.md](KAKO_SNIMITI_NA_GITHUB.md) | Detaljni vodič sa rješenjima grešaka |
| 📙 [DEPLOYMENT.md](DEPLOYMENT.md) | Cloudflare Pages deployment |
| 📕 [README.md](README.md) | Glavna dokumentacija projekta |
| 📔 [CONTRIBUTING.md](CONTRIBUTING.md) | Doprinos projektu |

---

## ❓ ČESTA PITANJA

### Q: Koji je moj GitHub username?
**A:** Idi na https://github.com - vidi gornji desni ugao

### Q: Kako da promijenim remote URL?
**A:** 
```bash
git remote remove origin
git remote add origin NOVI_URL
```

### Q: Šta ako zaboravim username/password?
**A:** GitHub koristi Personal Access Tokens:
1. Idi na: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`
4. Kopiraj token (čuvaj ga sigurno!)
5. Koristi token kao password pri push-u

### Q: Kako da vidim šta je promijenjeno?
**A:** `git status` i `git diff`

### Q: Mogu li otpozvati commit?
**A:** 
```bash
# Zadnji commit
git reset HEAD~1

# Specifičan commit
git revert COMMIT_HASH
```

### Q: Kako klonirati na drugi računar?
**A:** 
```bash
git clone https://github.com/TVOJE_IME/all-for-customs.git
cd all-for-customs
npm install
npm run dev
```

---

## 🆘 POMOĆ

Nešto ne radi?

1. **Provjeri terminale greške** - često piše šta je problem
2. **Pokreni:** `git status` - vidi trenutno stanje
3. **Provjeri:** `git remote -v` - je li remote dobar
4. **Google-aj grešku** - copy/paste error message

**Direktan kontakt:**
- 📧 Email: kalaba992@gmail.com

---

## ⚡ SUPER BRZA REFERENCA

```bash
# PRVI PUT
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git
./git-save.sh "Initial commit"

# KASNIJE (svaki put)
./git-save.sh "Opis promjene"

# ILI RUČNO
git add .
git commit -m "Poruka"
git push
```

---

## 🎯 TRACKING - Jesi Li Gotov?

- [ ] GitHub repository kreiran
- [ ] Git remote dodan
- [ ] Fajlovi push-ovani
- [ ] Projekat vidljiv na GitHub-u
- [ ] README prikazan na homepage
- [ ] Actions workflows aktivni

**Svi ✅ ? ČESTITAMO! 🎊**

---

<div align="center">

### 🚀 SPREMNO ZA LANSIRANJE!

**Projekat:** Carinski Alat - AI Customs Classification  
**Repository:** all-for-customs  
**Status:** ✅ Production Ready  
**Verzija:** 1.0.0  

**Next:** [Deploy na Cloudflare →](DEPLOYMENT.md)

</div>

---

**Napravljen sa ❤️ za carinsku službu BiH**
