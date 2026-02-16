# Career Portal Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Career Portal (Integrated)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  npm start                                               │   │
│  │  (scripts/start-with-scraper.js)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│          ┌────────────────┴────────────────┐                    │
│          │                                 │                    │
│    ┌─────▼──────┐                    ┌────▼──────────┐         │
│    │ React App  │                    │ Scraper       │         │
│    │ (Port 3000)│                    │ (Background)  │         │
│    │            │                    │               │         │
│    │ src/       │                    │ Runs every    │         │
│    │ ├ pages    │                    │ 10 minutes    │         │
│    │ ├ components                    │               │         │
│    │ ├ context  │                    │ Crawls:       │         │
│    │ └ data/    │◄────────────────►  │ sarkariresult │         │
│    │   jobs.json│ (auto-update)      │ .com          │         │
│    └─────┬──────┘                    │               │         │
│          │                           └───┬───────────┘         │
│          │                               │                    │
│          │ Displays jobs               │ Updates              │
│          │ from JSON                   │ jobs.json            │
│          │                             │                      │
│          │                    ┌────────▼─────────┐            │
│          │                    │ Discovered Jobs  │            │
│          │                    │                  │            │
│          │                    │ - Links          │            │
│          │                    │ - Job Details    │            │
│          │                    │ - Important Info │            │
│          │                    └──────────────────┘            │
│          │                                                    │
│          └─────────────────┬──────────────────┘              │
│                            │                                 │
│                       ┌────▼─────────┐                       │
│                       │ src/data/     │                       │
│                       │ jobs.json     │                       │
│                       └───────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. USER STARTS APP
   └─ npm start

2. LAUNCHER SCRIPT EXECUTES
   └─ scripts/start-with-scraper.js

3. REACT SERVER STARTS
   ├─ Port: 3000
   ├─ Reads: src/data/jobs.json (existing data)
   └─ Displays jobs in UI

4. APP.JS useEffect TRIGGERS
   ├─ Imports src/services/scraper.js
   └─ Calls startScraper()

5. BACKGROUND SCRAPER LAUNCHES
   ├─ Initializes Puppeteer (headless browser)
   ├─ Loads existing jobs from src/data/jobs.json
   ├─ Starts crawl queue with base URL
   └─ Begins recursive link discovery

6. SCRAPER PROCESSES PAGES
   ├─ Fetches page content
   ├─ Discovers new links
   ├─ Detects if page is a job listing
   ├─ Extracts job details if match found
   └─ Updates jobs.json with new data

7. REPEAT CYCLE
   ├─ Every 10 minutes
   ├─ Scraper processes new links
   ├─ Updates jobs.json in real-time
   ├─ React app can reload to show fresh data
   └─ Loop continues indefinitely
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  src/App.js                                                  │
│  ├─ useEffect (on mount)                                     │
│  │  └─ import scraper.js                                     │
│  │     └─ startScraper()                                     │
│  │                                                            │
│  └─ Routes                                                    │
│     ├─ / → src/pages/Home.js (displays jobs)                │
│     ├─ /job/:slug → src/pages/JobDetail.js                  │
│     ├─ /admin/login → src/pages/AdminLogin.js               │
│     └─ /admin/dashboard → src/pages/AdminDashboard.js       │
│                                                               │
│  JobProvider (context)                                       │
│  └─ Manages jobs state across app                           │
│     └─ Reads from: src/data/jobs.json                       │
│                                                               │
│  src/services/scraper.js                                    │
│  ├─ BackgroundScraper class                                 │
│  │  ├─ init()     → Load existing jobs, launch browser       │
│  │  ├─ start()    → Main loop, process batches              │
│  │  ├─ processUrl()  → Crawl single page                    │
│  │  ├─ isJobPage()   → Detect job listings                  │
│  │  ├─ scrapeJobDetails() → Extract data                    │
│  │  └─ saveData() → Write to jobs.json                      │
│  │                                                            │
│  └─ exports                                                   │
│     ├─ BackgroundScraper (class)                            │
│     └─ startScraper (function)                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Configuration Structure

```
const CONFIG = {
  baseUrl: "https://www.sarkariresult.com/",
              ▲
              │
              └─ Website to scrape
  
  baseHost: "sarkariresult.com",
              ▲
              │
              └─ Domain filter
  
  jobsFile: path to src/data/jobs.json,
              ▲
              │
              └─ Where to save data
  
  concurrency: 2,
              ▲
              │
              └─ Parallel page loads
  
  timeout: 60000,
              ▲
              │
              └─ Max time per page
  
  scrapeInterval: 10 * 60 * 1000,
              ▲
              │
              └─ How often to scrape (10 minutes = 600,000ms)
  
  maxQueueSize: 15000,
              ▲
              │
              └─ Queue limit to prevent memory overflow
  
  maxJsonLines: 90000,
              ▲
              │
              └─ Keep file size manageable
}
```

## Execution Timeline

```
TIME → 

0:00  ┌─────────────────────────────────────┐
      │ npm start                            │
      │ ├─ React starts                     │
      │ └─ Scraper initializes              │
      └─────────────────────────────────────┘

0:30  ┌─────────────────────────────────────┐
      │ Scraper crawling first page set      │
      │ Discovering links...                │
      └─────────────────────────────────────┘

3:00  ┌─────────────────────────────────────┐
      │ First jobs extracted                │
      │ src/data/jobs.json updated          │
      │ UI can refresh to show new jobs     │
      └─────────────────────────────────────┘

10:00 ┌─────────────────────────────────────┐
      │ CYCLE COMPLETE                      │
      │ Next cycle starts                   │
      │ Scraper resumes from queue          │
      └─────────────────────────────────────┘

10:00 ┌─────────────────────────────────────┐
      │ Jobs that are duplicates skipped     │
      │ Only NEW jobs added                 │
      │ Data is incremental                 │
      └─────────────────────────────────────┘

20:00 ┌─────────────────────────────────────┐
      │ Next cycle (replaces 10:00)         │
      │ Continues indefinitely...           │
      └─────────────────────────────────────┘
```

## File Dependencies

```
scripts/start-with-scraper.js
  │
  ├─ Spawns: npm react-scripts start
  │           └─ src/index.js
  │              └─ src/App.js
  │                 ├─ Import: src/services/scraper.js
  │                 │           └─ Requires:
  │                 │              ├─ puppeteer (browser)
  │                 │              ├─ fs-extra (file I/O)
  │                 │              └─ path (paths)
  │                 │
  │                 ├─ JobProvider Context
  │                 │  └─ Reads: src/data/jobs.json
  │                 │
  │                 └─ Routes/Pages
  │                    ├─ Home.js (displays jobs)
  │                    ├─ JobDetail.js (single job)
  │                    └─ Admin pages
  │
  └─ SetTimeout after 3s
     └─ initScraper()
        └─ src/services/scraper.js
           └─ BackgroundScraper.start()
              └─ Updates: src/data/jobs.json
                 └─ React auto-reloads
```

## Features Flowchart

```
                    ┌──────────────────┐
                    │  npm start       │
                    └─────────┬────────┘
                              │
                    ┌─────────▼────────┐
                    │ Check for        │
                    │ existing data    │
                    └─────────┬────────┘
                              │
                ┌─────────────▼──────────────┐
                │                            │
          ┌─────▼──────┐            ┌──────▼────────┐
          │ Load        │            │ Create new    │
          │ existing    │            │ empty Map     │
          │ jobs        │            │               │
          └─────┬──────┘            └──────┬────────┘
                │                          │
                └──────────────┬───────────┘
                               │
                    ┌──────────▼─────────┐
                    │ Start crawling     │
                    │ from base URL      │
                    └──────────┬─────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Process batch of    │
                    │ URLs (concurrency)  │
                    └──────────┬──────────┘
                               │
                ┌──────────────▼───────────────┐
                │                              │
          ┌─────▼───────┐          ┌──────────▼──────┐
          │ Page is      │          │ Page is job     │
          │ category?    │          │ listing?        │
          │ Skip it      │          │ Scrape details  │
          └─────┬───────┘          └──────────┬──────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Discover new links  │
                    │ Add to queue        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Save jobs.json      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ More URLs in queue? │
                    │ YES → continue      │
                    │ NO  → wait 10 mins  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Loop repeats every  │
                    │ 10 minutes          │
                    │ (incremental)       │
                    └─────────────────────┘
```

This architecture ensures:
✓ Non-blocking scraper (doesn't interrupt React)
✓ Real-time data updates (every 10 minutes)
✓ Incremental crawling (only new jobs)
✓ Efficient resource usage (configurable concurrency)
✓ Data persistence (survives app restarts)
✓ Error resilience (continues on failures)
