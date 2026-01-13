# 🚀 KAKO SNIMITI SVE NA GITHUB - JEDNOSTAVNI VODIČ

## 📝 ŠTA TREBA URADITI (Korak po korak)

### KORAK 1: Kreiraj GitHub Repository (3 minute)

1. **Idi na GitHub:**
   - Otvori browser i idi na: https://github.com/new
   
2. **Popuni informacije:**
   - **Repository name:** `all-for-customs`
   - **Description:** `AI sistem za klasifikaciju carinskih HS kodova`
   - **Public** ili **Private** (tvoj izbor)
   - ⚠️ **NE** čekiraj "Add a README file" (već imamo kod)
   - ⚠️ **NE** čekiraj "Add .gitignore" (već imamo)
   - ⚠️ **NE** čekiraj "Choose a license" (već imamo)

3. **Klikni "Create repository"**

4. **SAČUVAJ LINK koji GitHub pokazuje** - izgleda ovako:
   ```
   https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs.git
   ```

---

### KORAK 2: Poveži Projekat sa GitHub-om (1 minut)

Otvori terminal u tvom projektu i izvrši ove komande **JEDNU PO JEDNU**:

#### A) Provjeri Git status
```bash
git status
```
Trebalo bi da vidiš listu fajlova koji će biti sačuvani.

#### B) Dodaj GitHub repository adresu
**Zameni "TVOJE_KORISNIČKO_IME" sa stvarnim GitHub username-om!**

```bash
git remote add origin https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs.git
```

**PRIMJER** (ako je tvoj GitHub username `kalaba992`):
```bash
git remote add origin https://github.com/kalaba992/all-for-customs.git
```

#### C) Provjeri da li je povezano
```bash
git remote -v
```
Trebalo bi da vidiš liniju sa `origin` i tvojim GitHub linkom.

---

### KORAK 3: Snimi SVE Fajlove na GitHub (2 minute)

#### Opcija A: JEDNOSTAVNA METODA (Koristi spremnu skriptu)

```bash
# Učini skriptu izvršnom
chmod +x git-save.sh

# Pokreni je sa porukom
./git-save.sh "Inicijalni commit - Carinski Alat kompletna aplikacija"
```

**TO JE SVE!** Skripta će automatski:
- Dodati sve fajlove
- Napraviti commit
- Push-ovati na GitHub
- Prikazati status

---

#### Opcija B: RUČNA METODA (Korak po korak)

Ako želiš ručno, izvršiti ove komande:

```bash
# 1. Dodaj SVE fajlove
git add .

# 2. Napravi commit sa opisom
git commit -m "Inicijalni commit - Carinski Alat kompletna aplikacija

Features implementirane:
- Multi-language support (12 jezika)
- Cyrillic/Latin script konverzija
- AI-powered HS code klasifikacija
- Batch document upload
- CSV/Excel import i export
- Classification history sa statistikama
- Document analiza
- Real-time chat interface
- HS code search i tree view
- User preferences i favorites
- Complete dokumentacija (3500+ linija)
- GitHub Actions CI/CD
- Cloudflare Pages deployment setup"

# 3. Push na GitHub (PRVI PUT)
git push -u origin main
```

**Ako dobijеš grešku o branch-u, probaj:**
```bash
git branch -M main
git push -u origin main
```

---

### KORAK 4: Verifikuj Da Je SVE Na GitHub-u (1 minut)

1. **Otvori browser i idi na:**
   ```
   https://github.com/TVOJE_KORISNIČKO_IME/all-for-customs
   ```

2. **Trebalo bi da vidiš:**
   - ✅ Svi tvoji fajlovi (src/, components/, itd.)
   - ✅ README.md prikazan na početnoj strani
   - ✅ Dokumentaciju (DEPLOYMENT.md, CONTRIBUTING.md, itd.)
   - ✅ GitHub Actions tab (workflows)

**AKO VIDIŠ SVE OVO - USPJEŠNO SI SNIMIO PROJEKAT! 🎉**

---

## 🔄 KAKO SNIMITI PROMJENE KASNIJE (Nakon prvog push-a)

Svaki put kada napraviš izmjene i želiš ih snimiti na GitHub:

### Metod 1: Koristi Skriptu (BRZO)
```bash
./git-save.sh "Opis šta si promijenio"
```

**Primjeri:**
```bash
./git-save.sh "Dodao novu funkciju za batch export"
./git-save.sh "Popravljен bug u classification history"
./git-save.sh "Ažurirao dokumentaciju"
```

### Metod 2: Ručno (3 komande)
```bash
git add .
git commit -m "Opis promjena"
git push
```

---

## 💡 QUICK TIPS

### 🔹 Provjeri Status U Bilo Koje Vrijeme
```bash
git status
```
Pokazuje šta je promijenjeno, šta je spremno za commit, itd.

### 🔹 Vidi Istoriju Commit-ova
```bash
git log --oneline
```

### 🔹 Vidi Razlike (Šta Si Promijenio)
```bash
git diff
```

### 🔹 Auto-Save Alias (Opciono)
Dodaj ovo u `~/.bashrc` ili `~/.zshrc` za super brzo snimanje:
```bash
alias gitsave='git add . && git commit -m "Auto-save: $(date +%Y-%m-%d\ %H:%M:%S)" && git push'
```

Onda samo kucaj:
```bash
gitsave
```

---

## ⚠️ ČESTE GREŠKE I RJEŠENJA

### ❌ Greška: "remote origin already exists"
**Rješenje:**
```bash
git remote remove origin
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git
```

### ❌ Greška: "failed to push some refs"
**Rješenje:**
```bash
git pull origin main --rebase
git push -u origin main
```

### ❌ Greška: "Permission denied"
**Rješenje:** Potrebno je autentificirati se:
```bash
# Generisi GitHub Personal Access Token
# Idi na: https://github.com/settings/tokens
# Generate new token → Kopiraj ga

# Koristi token kao password kada git pita
```

### ❌ Greška: "nothing to commit"
**To nije greška!** Znači da nema novih promjena za snimiti.

---

## 📱 NAKON ŠTO SNIMИŠ NA GITHUB

### Sljedeći Korak: Deploy na Cloudflare Pages

1. **Idi na:** https://dash.cloudflare.com
2. **Klikni:** Pages → Create a project
3. **Connect to Git:** Odaberi `all-for-customs`
4. **Build settings** (automatski detektovano):
   - Build command: `npm run build`
   - Output directory: `dist`
5. **Klikni:** Save and Deploy

**Za detaljne upute, vidi: [DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 📚 DODATNA DOKUMENTACIJA

Nakon push-a na GitHub, imaš pristup:

- **[README.md](README.md)** - Glavni vodič za projekat
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Cloudflare deployment upute
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Kako doprinijeti projektu
- **[SECURITY.md](SECURITY.md)** - Sigurnosne procedure
- **[ROADMAP.md](ROADMAP.md)** - Budući planovi
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Brzi početak za korisnike

---

## 🎯 BRZA PROVJERA - Da Li Sam Sve Uradio?

- [ ] GitHub repository kreiran (`all-for-customs`)
- [ ] Git remote dodan (`git remote -v` pokazuje origin)
- [ ] Svi fajlovi commit-ovani i push-ovani
- [ ] Repository vidljiv na GitHub-u
- [ ] README.md prikazan na GitHub homepage-u
- [ ] GitHub Actions workflows vidljivi (Actions tab)
- [ ] Dokumentacija dostupna

**Ako su svi čekirani - GOTOVO JE! ✅**

---

## 📞 POMOĆ

Imaš problema?

1. **Provjeri:** Git status komandu `git status`
2. **Provjeri:** Remote povezanost `git remote -v`
3. **Provjeri:** GitHub repository da postoji
4. **Provjeri:** GitHub autentifikaciju

**Kontakt za dodatnu pomoć:**
- Email: kalaba992@gmail.com
- GitHub Issues: (nakon što push-uješ projekat)

---

## 🎉 ČESTITAMO!

Jednom kada vidiš svoj kod na GitHub-u, **uspješno si snimio cijeli projekat!**

**Sada možeš:**
- ✅ Raditi sa bilo kojeg računara (kloniraj repo)
- ✅ Dijeliti projekat sa drugima
- ✅ Automatski deploy na Cloudflare Pages
- ✅ Koristiti GitHub Issues za tracking
- ✅ Primati doprinose od drugih developera
- ✅ Imati backup svog koda

---

## 🚀 ONE-LINER ZA BRZE LJUDE

Ako si iskusan sa git-om, evo sve u jednom:

```bash
# Ako remote nije dodan
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git

# Ili koristi skriptu
chmod +x git-save.sh && ./git-save.sh "Initial commit"

# Ili ručno
git add . && git commit -m "Initial commit" && git push -u origin main
```

**To je to! 🎊**
