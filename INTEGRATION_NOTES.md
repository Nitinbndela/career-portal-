# Integrated Scraper Configuration

## Quick Start

```bash
# Install dependencies
npm install

# Run everything (React + Scraper)
npm start

# The app will:
# ✓ Start React dev server on http://localhost:3000
# ✓ Automatically launch background scraper
# ✓ Update jobs.json every 10 minutes automatically
```

## What Changed

### Files Added
- `src/services/scraper.js` - Background scraper service
- `scripts/start-with-scraper.js` - Combined launcher for React + Scraper
- `scripts/scraper-only.js` - Standalone scraper runner
- `SCRAPER_SETUP.md` - Complete documentation

### Files Modified
- `package.json` - Added puppeteer & fs-extra dependencies, updated scripts
- `src/App.js` - Added useEffect to initialize scraper on app startup

### Current Scraper Settings
```javascript
CONFIG = {
  baseUrl: "https://www.sarkariresult.com/",
  scrapeInterval: 10 * 60 * 1000,  // 10 minutes
  concurrency: 2,                   // 2 parallel tabs
  timeout: 60000,                   // 60 seconds per page
  maxJsonLines: 90000,              // Keep file size reasonable
}
```

## Available Commands

### Development Mode (React + Scraper)
```bash
npm start
```
- Starts React on port 3000
- Launches background scraper
- Best for development

### React Only (No Scraper)
```bash 
npm run dev
```
- Starts React dev server only
- Use if scraper causes issues
- Can still use old snapshot data in jobs.json

### Scraper Only (No React)
```bash
npm run scraper-only
```
- Runs just the scraper
- Useful for server deployments
- Updates jobs.json from command line

### Production Build
```bash
npm run build
```
- Creates optimized React build
- Scraper will still run if needed
- Generates `build/` folder

## How to Customize

### Change Scrape Interval

Edit `src/services/scraper.js` line 15:

```javascript
// Change from 10 minutes to:
scrapeInterval: 5 * 60 * 1000,    // 5 minutes
scrapeInterval: 15 * 60 * 1000,   // 15 minutes
scrapeInterval: 30 * 60 * 1000,   // 30 minutes
scrapeInterval: 60 * 60 * 1000,   // 1 hour
```

### Change Website to Scrape

Edit `src/services/scraper.js` lines 11-12:

```javascript
baseUrl: "https://www.example.com/",
baseHost: "example.com",
```

### Adjust Concurrency (Parallel Load)

Edit `src/services/scraper.js` line 14:

```javascript
concurrency: 2,  // Change to 1, 3, 5, etc.
```

## Data Flow

```
npm start
    ↓
React Server Started (port 3000)
    ↓
App.js useEffect triggers
    ↓
src/services/scraper.js starts
    ↓
BackgroundScraper class initializes
    ↓
Puppeteer browser launches (headless)
    ↓
Crawls sarkariresult.com recursively
    ↓
Every 10 minutes, updates src/data/jobs.json
    ↓
React context auto-reloads job data
    ↓
UI displays fresh jobs
```

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install
```

### React starts but scraper doesn't
1. Check console for errors
2. Ensure internet connectivity
3. Try `npm run dev` to confirm React works
4. Try `npm run scraper-only` to test scraper alone

### Port 3000 in use
```bash
PORT=3001 npm start
```

### Need to clear old jobs and start fresh
1. Delete `src/data/jobs.json`
2. Run `npm start`
3. Scraper will recreate from scratch

### Scraper causing React to crash
```bash
npm run dev          # Use without scraper
npm run scraper-only # Run scraper in separate terminal
```

## No Longer Using Separate Scraper Folder

✅ **DEPRECATED**: `/scrapper` folder is no longer needed  
✅ **NEW**: Everything is in career-portal  
✅ **ONE COMMAND**: `npm start` does everything  
✅ **NO SETUP**: No extra configuration needed  

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm start` to launch everything
3. Open http://localhost:3000 in browser
4. Watch console for scraper logs
5. Check `src/data/jobs.json` for updated data

## Questions?

Check the logs in the terminal running `npm start`. The scraper outputs:
- `[SCRAPER]` lines for scraper activity
- `[APP]` lines for React integration
- `[✓]` when a job is successfully scraped

Happy scraping! 🚀
