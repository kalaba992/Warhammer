# 🎯 SNIMANJE NA GITHUB - SUPER JEDNOSTAVNO

> **Za one koji samo žele da brzo sačuvaju projekat na GitHub bez puno čitanja**

---

## 📍 GDJE SI SADA?

Imaš kompletan projekat "Carinski Alat" na svom računaru.  
Želiš ga snimiti na GitHub da bude siguran i dostupan svuda.

---

## 🚀 NAČIN 1: NAJBRŽI PUT (2 MINUTE)

### 1️⃣ Kreiraj Repository na GitHub
- Otvori: https://github.com/new
- Ime: `all-for-customs`
- **NE ČEKIRAJ NIŠTA** (već imaš kod)
- Klikni: "Create repository"
- **Kopiraj link** koji ti pokaže (npr: `https://github.com/USERNAME/all-for-customs.git`)

### 2️⃣ U Terminalu - SAMO 2 KOMANDE

Zameni `USERNAME` sa tvojim GitHub username-om:

```bash
git remote add origin https://github.com/USERNAME/all-for-customs.git
```

```bash
chmod +x git-save.sh && ./git-save.sh "Inicijalni commit"
```

### 3️⃣ Provjeri
Otvori: `https://github.com/USERNAME/all-for-customs`

**Vidiš fajlove? GOTOVO! 🎉**

---

## 🔧 NAČIN 2: RUČNO (3 MINUTE)

Ako automatska skripta ne radi, evo ručnog načina:

### 1️⃣ Kreiraj Repository (isto kao gore)
https://github.com/new → `all-for-customs` → Create

### 2️⃣ Terminal Komande (kopiraj i zalijepi jednu po jednu):

```bash
git remote add origin https://github.com/USERNAME/all-for-customs.git
```

```bash
git add .
```

```bash
git commit -m "Inicijalni commit - Carinski Alat"
```

```bash
git push -u origin main
```

Ako zadnja komanda ne radi:
```bash
git branch -M main
git push -u origin main
```

### 3️⃣ Provjeri na GitHub-u
`https://github.com/USERNAME/all-for-customs` - trebao bi vidjeti sve fajlove

---

## 🔄 KASNIJE - Snimanje Novih Promjena

Svaki put kada napraviš izmjene i želiš ih snimiti:

```bash
./git-save.sh "Šta si promijenio"
```

**ILI ručno:**
```bash
git add .
git commit -m "Šta si promijenio"
git push
```

---

## ⚠️ GREŠKE I RJEŠENJA

### "remote origin already exists"
```bash
git remote remove origin
```
Pa ponovi korak 2️⃣

### "Permission denied"
Treba ti Personal Access Token:
1. https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Čekiraj `repo`
4. Kopiraj token
5. Koristi token kao password

### "failed to push"
```bash
git pull origin main --rebase
git push
```

---

## 📞 HELP

Problem? Probaj:
```bash
./git-status.sh
```

Ili pročitaj detaljnije upute:
- **START_OVDJE.md** - Vizuelni vodič
- **KAKO_SNIMITI_NA_GITHUB.md** - Detaljne upute
- **BRZI_VODIC.md** - Srednje detaljno

Email: kalaba992@gmail.com

---

## ✅ QUICK CHECKLIST

- [ ] GitHub repository kreiran
- [ ] `git remote add origin ...` izvršeno
- [ ] Kod push-ovan (`git push`)
- [ ] Vidim projekat na github.com

**Svi ✅ ? USPJEH! 🎊**

---

## 🎯 ONE-LINER

Za iskusne, sve u jednoj liniji:

```bash
git remote add origin https://github.com/USERNAME/all-for-customs.git && git add . && git commit -m "Initial commit" && git push -u origin main
```

---

**To je to! Jednostavnije nije moglo! 🚀**
