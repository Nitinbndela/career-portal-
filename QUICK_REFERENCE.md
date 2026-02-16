# Quick Reference Guide

## 🚀 Getting Started (30 seconds)

```bash
cd career-portal-
npm install
npm start
```

Open browser → http://localhost:3000 ✓

## 📋 Command Cheat Sheet

| Want to... | Run... | Result |
|-----------|--------|--------|
| Run everything | `npm start` | React + Scraper ✓✓ |
| React only | `npm run dev` | Just UI |
| Scraper only | `npm run scraper-only` | Just scraping |
| Build for production | `npm run build` | Optimized build |
| Verify setup | `node scripts/verify-integration.js` | Safety check |

## 🔧 Configuration Quick Links

**Change scrape interval:**
- File: `src/services/scraper.js` line 15
- Codes:
  - `5 * 60 * 1000` = 5 minutes
  - `10 * 60 * 1000` = 10 minutes (current)
  - `30 * 60 * 1000` = 30 minutes
  - `60 * 60 * 1000` = 1 hour

**Change website to scrape:**
- File: `src/services/scraper.js` lines 11-12
- Update `baseUrl` and `baseHost`

**Change concurrency (parallel pages):**
- File: `src/services/scraper.js` line 14
- Values: 1-5 (higher = faster but more resource usage)

## 📁 Important Files

```
career-portal-/
├── src/
│   ├── services/scraper.js ......... Scraper logic
│   ├── App.js ..................... Integration point
│   └── data/jobs.json ............. Auto-updated data
├── scripts/
│   ├── start-with-scraper.js ....... Combined launcher
│   ├── scraper-only.js ............ Standalone runner
│   └── verify-integration.js ...... Verification
├── package.json ................... Dependencies & scripts
├── SCRAPER_SETUP.md ............... Complete docs
├── ARCHITECTURE.md ................ System design
└── MIGRATION_COMPLETE.md .......... Status report
```

## 🐛 Troubleshooting Quick Tips

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js |
| Port 3000 in use | `PORT=3001 npm start` |
| Can't find module | `npm install` |
| Scraper not running | Check internet, try `npm run scraper-only` |
| Old jobs still shown | Delete `src/data/jobs.json`, restart |
| React crashes | Try `npm run dev` without scraper |

## 📊 What Gets Scraped

✓ Job Title & Category
✓ Post Date
✓ Important Dates
✓ Application Fee
✓ Age Limit
✓ Vacancy Details
✓ Important Links
✓ Educational Qualification
✓ Selection Process
✓ How to Apply

## 📈 Status Indicators

**Things you should see in terminal:**

```
[SCRAPER] Initializing Background Scraper Service...
[SCRAPER] Loaded X existing jobs from cache.
[SCRAPER] Starting comprehensive crawl...
[SCRAPER] Batch: 2 | Queue: 1234 | Visited: 567
[✓] Job Title...
[SCRAPER] Crawl cycle complete.
[SCRAPER] Next update in 10 minutes...
```

**Your job is working if you see:**
- React server message (not relevant to scraper)
- `[SCRAPER]` log lines
- `[✓]` when jobs are found
- Every 10 minutes, new cycle starts

## 🎯 Typical Workflow

1. **First Run**
   - Dependencies install (1-2 min)
   - React starts (few seconds)
   - Scraper begins crawling
   - Jobs appear in UI over next 10 minutes

2. **Daily Use**
   - `npm start` once
   - Everything runs in background
   - New jobs appear every 10 minutes automatically

3. **No More Manual Work**
   - ✗ Don't run scraper separately
   - ✗ Don't manually sync data
   - ✗ Don't open multiple terminals
   - ✓ Just `npm start` and forget!

## 💾 Data Management

**Current data location:** `src/data/jobs.json`

**File grows?**→ Scraper automatically removes oldest jobs to keep size reasonable

**Start fresh?** → Delete `jobs.json`, restart, scraper creates new file

**Manual backup?** → Copy `jobs.json` to safe location

## 🔒 No More Separate Projects!

```
BEFORE (Old Way - DEPRECATED)
────────────────────────────
Terminal 1: cd scrapper && npm start
Terminal 2: cd career-portal && npm start
Result: 2 processes, out of sync, confusing

AFTER (New Way - INTEGRATED)
────────────────────────────
Terminal: cd career-portal && npm start
Result: 1 command, 2 processes, auto-synced ✓
```

## ❓ FAQ

**Q: Does scraper block React?**
A: No! Runs in background, zero impact on UI performance.

**Q: What if internet goes down?**
A: Scraper handles errors gracefully, tries again next cycle.

**Q: Can I change the 10-minute interval?**
A: Yes! Edit `src/services/scraper.js` line 15.

**Q: Will jobs.json get too big?**
A: No! Scraper automatically manages file size, removes old jobs.

**Q: Can I run just the scraper without React?**
A: Yes! Run `npm run scraper-only`.

**Q: Do I need the old scrapper folder anymore?**
A: No! Safe to delete. Everything is in career-portal now.

## 🚨 Emergency Commands

```bash
# Kill everything and start fresh
npm start

# If port 3000 is stuck
lsof -i :3000
kill -9 <PID>

# Clear all caches
rm -rf node_modules package-lock.json
npm install
npm start

# Test just scraper
npm run scraper-only

# Verify everything is set up
node scripts/verify-integration.js
```

## 📞 Support & Logs

**Where to find help:**
1. Check terminal logs (most useful)
2. Read `SCRAPER_SETUP.md`
3. Check `ARCHITECTURE.md` for system design
4. Look at console output for `[SCRAPER]` messages

**What to share if reporting issues:**
1. Terminal output from `npm start`
2. Your Node version: `node --version`
3. Your npm version: `npm --version`
4. What you were trying to do
5. Any error messages

## 📚 Full Documentation Files

- **SCRAPER_SETUP.md** - Complete user manual
- **INTEGRATION_NOTES.md** - Developer notes
- **ARCHITECTURE.md** - System design & diagrams
- **MIGRATION_COMPLETE.md** - What changed

---

**TL;DR**: Just run `npm install && npm start` and enjoy! 🎉
