# Career Portal with Integrated Scraper

This project combines a React-based career job portal with an automated web scraper that continuously fetches job data from Sarkari Result.

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

This will install both React dependencies and scraper dependencies (puppeteer, fs-extra).

### 2. Run the Application

#### Option A: Run Everything (React + Scraper)
```bash
npm start
```

This command:
- Starts the React development server on `http://localhost:3000`
- Automatically launches the background scraper
- Scraper updates `src/data/jobs.json` every **10 minutes**
- No separate terminal needed - everything runs together

#### Option B: React Only (No Scraper)
```bash
npm run dev
```

This starts just the React development server without the background scraper.

#### Option C: Scraper Only (No React)
```bash
npm run scraper-only
```

This runs just the background scraper in standalone mode.

### 3. Build for Production

```bash
npm run build
```

Creates an optimized production build.

## Architecture

### Components

1. **React Frontend** (`src/`)
   - Displays jobs from `src/data/jobs.json`
   - Auto-reloads when scraper updates data
   - Pages: Home, JobDetail, AdminLogin, AdminDashboard

2. **Background Scraper** (`src/services/scraper.js`)
   - Runs in background every **10 minutes**
   - Crawls https://www.sarkariresult.com/
   - Discovers job links automatically
   - Extracts comprehensive job details
   - Updates `src/data/jobs.json` incrementally

3. **Launcher Script** (`scripts/start-with-scraper.js`)
   - Orchestrates React + Scraper startup
   - Ensures non-blocking execution

### Data Flow

```
Start App (npm start)
    ↓
Launch React Server (localhost:3000)
    ↓
Start Background Scraper
    ↓
Scraper crawls sarkariresult.com every 10 mins
    ↓
Updates src/data/jobs.json
    ↓
React UI auto-refreshes with new jobs
```

## Scraper Configuration

Edit `src/services/scraper.js` to customize:

```javascript
const CONFIG = {
  baseUrl: "https://www.sarkariresult.com/",
  jobsFile: path.join(__dirname, "../data/jobs.json"),
  scrapeInterval: 10 * 60 * 1000,  // 10 minutes
  concurrency: 2,                   // Parallel page loads
  timeout: 60000,                   // Page load timeout
  maxJsonLines: 90000,              // Max file size
};
```

### Change Scrape Interval

To change from 10 minutes to a different interval:

```javascript
scrapeInterval: 5 * 60 * 1000,   // 5 minutes
scrapeInterval: 30 * 60 * 1000,  // 30 minutes
scrapeInterval: 60 * 60 * 1000,  // 60 minutes (1 hour)
```

## What Gets Scraped

For each job posting, the scraper extracts:

- **Basic Info**: Title, Category, Post Date
- **Important Dates**: Application start/end, exam date, admit card date, result date
- **Fees**: Application fee by category (General, OBC, SC, ST)
- **Age Limit**: Minimum/maximum age requirements
- **Vacancy Details**: Post name, number of positions, eligibility
- **Important Links**: Apply online, notification PDF, official website
- **How to Apply**: Step-by-step application instructions
- **Selection Process**: Written test, interview, document verification
- **Educational Qualification**: Required qualifications by post

## File Structure

```
career-portal/
├── src/
│   ├── services/
│   │   └── scraper.js              # Background scraper service
│   ├── data/
│   │   └── jobs.json               # Auto-updated by scraper
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── App.js                      # Updated with useEffect for scraper
│   └── index.js
├── scripts/
│   ├── start-with-scraper.js       # Combined launcher
│   └── scraper-only.js             # Standalone scraper runner
├── package.json                    # Updated with scraper deps
└── public/
```

## Features

✅ **Automatic Scraping**: No manual intervention needed
✅ **Incremental Updates**: Only scrapes new jobs, preserves existing data
✅ **Format Preservation**: Tables and bullet points stay structured
✅ **Comprehensive Data**: Extracts all job details
✅ **Non-Blocking**: Scraper runs in background, doesn't block UI
✅ **Memory Efficient**: Limits JSON file size, removes oldest jobs if needed
✅ **Error Resilient**: Continues working if scraper fails
✅ **Configurable**: Easy to adjust intervals and settings

## Troubleshooting

### Node modules not installed
```bash
npm install
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm start
```

### Scraper not updating jobs.json
1. Check console logs for errors
2. Ensure internet connection is stable
3. Verify `src/data/jobs.json` has write permissions
4. Check that Sarkari Result website is accessible

### Clear old data and rescan
1. Delete or backup `src/data/jobs.json`
2. Restart the application
3. Scraper will detect empty file and start fresh crawl

## No Longer Need Separate Scraper Project

✅ You **no longer need** the separate `/scrapper` folder
✅ Everything is integrated into the career-portal
✅ Just run `npm start` and everything works together
✅ Data automatically syncs between scraper and UI

## Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
PORT=3000
SCRAPE_INTERVAL=600000  # 10 minutes in milliseconds
SCRAPER_CONCURRENCY=2
```

## License

MIT

## Support

For issues or questions, check the logs in the terminal where you ran `npm start`.
