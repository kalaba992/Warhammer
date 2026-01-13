# ⚡ SUPER BRZI VODIČ - Snimanje na GitHub

## 3 KORAKA DO GITHUB-A (5 minuta)

### 1️⃣ Kreiraj Repository na GitHub
1. Idi na: **https://github.com/new**
2. Repository name: **`all-for-customs`**
3. NE čekiraj ništa drugo
4. Klikni **"Create repository"**

---

### 2️⃣ Poveži Projekat (Zameni TVOJE_IME)
```bash
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git
```

**Primjer:**
```bash
git remote add origin https://github.com/kalaba992/all-for-customs.git
```

---

### 3️⃣ Push Sve Na GitHub
```bash
chmod +x git-save.sh
./git-save.sh "Inicijalni commit - kompletna aplikacija"
```

---

## ✅ PROVJERI DA LI RADI

Otvori u browseru:
```
https://github.com/TVOJE_IME/all-for-customs
```

Ako vidiš sve fajlove i README - **GOTOVO!** 🎉

---

## 🔄 ZA KASNIJE (Snimanje promjena)

Svaki put kada nešto promijeniš:
```bash
./git-save.sh "Opis šta si promijenio"
```

---

## 📝 ALTERNATIVA (Bez skripte)

Ako želiš ručno:
```bash
git add .
git commit -m "Tvoja poruka"
git push
```

---

## ⚠️ AKO DOBIJЕŠ GREŠKU

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TVOJE_IME/all-for-customs.git
```

### "failed to push"
```bash
git branch -M main
git push -u origin main
```

---

## 🚀 TO JE SVE!

**Za detaljne upute vidi:** [KAKO_SNIMITI_NA_GITHUB.md](KAKO_SNIMITI_NA_GITHUB.md)

**Za deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
