# ⚡ Quick Reference Guide - Carinski Alat

Fast reference for common tasks, shortcuts, and troubleshooting.

---

## 🚀 Quick Start (60 seconds)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/all-for-customs.git
cd all-for-customs

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

**Done! 🎉** The application is now running locally.

---

## 🎯 Common Tasks

### Classify a Single Product

1. Open Chat interface (default view)
2. Type product description in any language
3. Press Enter or click Send
4. Review HS code, confidence, and reasoning

**Example:**
```
Input: "pšenično brašno tip 500"
Output: HS Code 1101.00.15 (High confidence, Defensibility 8/10)
```

### Batch Process Multiple Documents

1. Click **Batch Upload** in sidebar
2. Drag & drop up to 50 files OR click "Dodaj Fajlove"
3. Click **Počni Obradu** (Start Processing)
4. Monitor progress in real-time
5. Click **Eksportuj u Excel** when complete

### Import Product List from Excel

1. Click **CSV/Excel Import** in sidebar
2. Download template (optional)
3. Upload your .xlsx or .csv file
4. Preview products in table
5. Click **Započni Klasifikaciju**
6. Export results when complete

### Search for HS Code

1. Click **Pretraga** (Search) in sidebar
2. Enter HS code (e.g., "1101") or keyword (e.g., "flour")
3. Browse results
4. Click code for full details
5. Click ⭐ to add to favorites

### Export Classification History

1. Click **Istorija** (History) in sidebar
2. Click **Eksportuj u Excel**
3. Configure filters:
   - Toggle "Sva Polja" for all fields vs basic
   - Toggle "Samo Favoriti" for favorites only
   - Select confidence level filter
4. Review filtered count
5. Click **Eksportuj**

### Change Language

1. Click **Postavke** (Settings) in sidebar
2. Select **UI Language** (interface language)
3. Select **HS Description Language** (code descriptions)
4. Select **AI Communication Language** (chat language)
5. For BA/SR, choose **Script Variant** (Latin/Cyrillic)
6. Changes apply instantly!

---

## ⌨️ Keyboard Shortcuts

*(To be implemented in v1.1.0)*

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus chat input |
| `Ctrl/Cmd + N` | New conversation |
| `Ctrl/Cmd + F` | Focus search |
| `Ctrl/Cmd + H` | View history |
| `Ctrl/Cmd + ,` | Open settings |
| `Esc` | Close dialog/modal |

---

## 📊 Understanding Results

### Confidence Levels

- **🟢 High (Visoka)** - 90%+ confidence, strong precedent support
- **🟡 Medium (Srednja)** - 70-89% confidence, some uncertainty
- **🔴 Low (Niska)** - <70% confidence, needs more information

### Defensibility Score

Scale: **1-10** (higher is better)

- **9-10:** Excellent - Strong legal precedent, clear GIR application
- **7-8:** Good - Solid reasoning, acceptable for most cases
- **5-6:** Fair - Weak precedent, consider expert review
- **1-4:** Poor - High risk, require additional verification

### Validation Layers

Every classification passes through 3 layers:

1. **Zero Tolerance Blocker** ⛔ - Verifies code exists in TARIC
2. **Anti-Hallucination Validator** ⚠️ - Computes trust score
3. **Hierarchical Validator** 🔗 - Checks 4→6→8 digit consistency

If any layer fails, classification is blocked or downgraded.

---

## 🔧 Troubleshooting

### Application Won't Start

**Problem:** `npm run dev` fails

**Solutions:**
```bash
# 1. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Check Node version (need 18+)
node --version

# 3. Clear npm cache
npm cache clean --force
```

### Classification Not Working

**Problem:** AI returns error or no response

**Solutions:**
1. Check internet connection (requires Spark LLM API)
2. Try shorter, simpler product description
3. Specify material composition and end use
4. Check browser console for errors (F12)

### Batch Upload Stuck

**Problem:** Files not processing or stuck at 0%

**Solutions:**
1. Check file types (PDF, TXT, DOC supported)
2. Ensure files under 25MB each
3. Try uploading smaller batch (10-20 files)
4. Refresh page and try again

### Excel Export Not Downloading

**Problem:** Export button clicked but no file downloads

**Solutions:**
1. Check browser download settings
2. Disable popup blocker for this site
3. Try different browser
4. Check if filters yield any results (need at least 1 record)

### Script Conversion Not Working

**Problem:** Text not converting between Latin/Cyrillic

**Solutions:**
1. Verify language selected is BA or SR (only these support script conversion)
2. Refresh page to reset state
3. Clear browser cache and reload
4. Check that script variant is explicitly selected in settings

---

## 📱 Mobile Usage Tips

### Best Practices

- Use **portrait mode** for chat interface
- Use **landscape mode** for history/search tables
- **Swipe** to close modals and dialogs
- **Long press** for context menus (favorites, delete)
- Batch upload limited to **10 files** on mobile (performance)

### Known Limitations

- Large Excel exports may be slower on mobile
- Voice input not yet supported (coming in v1.3)
- Image classification not yet supported (coming in v1.3)

---

## 🌍 Language Support

### Supported Languages

| Code | Language | UI | HS Desc | AI | Script |
|------|----------|----|---------|----|--------|
| ba | Bosanski | ✅ | ✅ | ✅ | Latin/Cyrillic |
| en | English | ✅ | ✅ | ✅ | - |
| de | Deutsch | ✅ | ✅ | ✅ | - |
| hr | Hrvatski | ✅ | ✅ | ✅ | - |
| sr | Srpski | ✅ | ✅ | ✅ | Latin/Cyrillic |
| sk | Slovenčina | ✅ | ✅ | ✅ | - |
| sl | Slovenščina | ✅ | ✅ | ✅ | - |
| al | Shqip | ✅ | ✅ | ✅ | - |
| mk | Македонски | ✅ | ✅ | ✅ | - |
| fr | Français | ✅ | ✅ | ✅ | - |
| es | Español | ✅ | ✅ | ✅ | - |
| it | Italiano | ✅ | ✅ | ✅ | - |

**Note:** Script conversion (Latin ↔ Cyrillic) only available for Bosnian and Serbian.

---

## 💾 Data Management

### Where Is My Data Stored?

All data stored **locally in your browser** using Spark KV API:
- Classification history
- User preferences (language, script)
- Favorites
- Conversation history

**No server uploads. No cloud sync. Complete privacy.**

### How to Export All Data

1. Go to **Istorija** (History)
2. Click **Eksportuj u Excel**
3. Select "Sva Polja" (All Fields)
4. Select "Sve" for confidence (all records)
5. Download complete history

### How to Clear All Data

```javascript
// Open browser console (F12)
// Clear all application data
await spark.kv.keys().then(keys => Promise.all(keys.map(k => spark.kv.delete(k))))

// Or use browser settings:
// Settings → Privacy → Clear browsing data → Cookies and site data
```

⚠️ **Warning:** This action cannot be undone. Export data first!

---

## 🎨 Customization

### Changing Theme Colors

Currently uses fixed color palette. Dark mode planned for v1.1.0.

### Changing Fonts

Edit `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap" rel="stylesheet">
```

Edit `index.css`:
```css
body {
  font-family: 'YOUR_FONT', sans-serif;
}
```

---

## 📞 Getting Help

### Documentation

- **README.md** - Complete feature documentation
- **CONTRIBUTING.md** - Development guidelines
- **DEPLOYMENT.md** - Cloudflare Pages deployment
- **IMPLEMENTATION.md** - Technical specifications
- **PRD.md** - Product requirements

### Support Channels

- **Email:** kalaba992@gmail.com
- **GitHub Issues:** [Report bug](https://github.com/YOUR_USERNAME/all-for-customs/issues/new?template=bug_report.md)
- **GitHub Discussions:** [Ask question](https://github.com/YOUR_USERNAME/all-for-customs/discussions)

### Before Asking for Help

1. ✅ Check this Quick Reference Guide
2. ✅ Search existing GitHub issues
3. ✅ Review documentation files
4. ✅ Try troubleshooting steps above
5. ✅ Check browser console for errors

---

## 🔢 Version Information

**Current Version:** v1.0.0  
**Release Date:** January 2024  
**Latest Update:** Check [CHANGELOG.md](./CHANGELOG.md)

To check version in application:
- Look at page footer
- Or check `package.json` in project root

---

## 🚦 Status & Limits

### Current Limitations

| Feature | Limit | Reason |
|---------|-------|--------|
| Batch upload | 50 files | Performance |
| File size | 25 MB | Memory |
| CSV import | 100 rows | Processing time |
| Chat history | Unlimited | Local storage |
| Classification history | Unlimited | Local storage |

### API Rate Limits

- **Spark LLM API:** 20 requests/minute
- **Auto-throttling:** Excess requests queued
- **Owner accounts:** Priority processing

---

## 💡 Pro Tips

### For Best Classification Results

1. **Be specific** - Include material, composition, purpose
2. **Use technical terms** - Industry-standard terminology
3. **Mention processing** - How product is made/processed
4. **State end use** - What is product used for
5. **Ask for clarification** - If result uncertain, ask follow-ups

### Example: Good vs. Bad Descriptions

❌ **Bad:** "flour"  
✅ **Good:** "wheat flour, type 500, for bread making, protein content 11%"

❌ **Bad:** "metal part"  
✅ **Good:** "stainless steel bolt, M8 x 40mm, for automotive use"

### For Faster Batch Processing

1. Process smaller batches (10-20 files at a time)
2. Use consistent file naming
3. Pre-organize files by product category
4. Use file names that describe content

### For Organized History

1. Mark important classifications as favorites (⭐)
2. Export history regularly as backup
3. Use descriptive product descriptions
4. Delete test/duplicate entries

---

**Keep this guide bookmarked for quick reference! 📑**

**Last Updated:** January 15, 2024
