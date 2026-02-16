/**
 * BACKGROUND SCRAPER SERVICE - Integrated with Career Portal
 * Runs in background, scrapes every 10 minutes, updates src/data/jobs.json
 */

const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

const CONFIG = {
  baseUrl: "https://sarkariresult.com.im/",
  baseHost: "sarkariresult.com.im",
  jobsFile: path.join(__dirname, "../data/jobs.json"), // Keep in src/data for import
  jobsFilePublic: path.join(__dirname, "../../public/data/jobs.json"), // Also copy to public for fetch
  concurrency: 2,
  timeout: 60000,
  scrapeInterval: 2 * 60 * 1000, // 2 minutes (change to 10 * 60 * 1000 for 10 minutes)
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  maxQueueSize: 15000,
  maxJsonLines: 90000,
};

// URLs that are category/listing pages - NOT job detail pages
const CATEGORY_PATTERNS = [
  /^https:\/\/sarkariresult\.com\.im\/?$/,
  /^https:\/\/sarkariresult\.com\.im\/(admission|admit-card|sarkari-result|answer-key|sarkari-naukri|syllabus)(\/)?$/,
];

function isCategoryPage(url) {
  const normalized = url.replace(/\/$/, "");
  return CATEGORY_PATTERNS.some((p) => p.test(normalized));
}

class BackgroundScraper {
  constructor() {
    this.browser = null;
    this.queue = new Set([CONFIG.baseUrl]);
    this.visited = new Set();
    this.jobsData = new Map();
    this.isRunning = false;
  }

  async init() {
    if (this.browser) {
      return; // Already initialized
    }

    console.log("[SCRAPER] Initializing Background Scraper Service...");

    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG.jobsFile);
    await fs.ensureDir(dataDir);

    try {
      // Try to load from src/data first, then public/data
      let existing = [];
      if (await fs.pathExists(CONFIG.jobsFile)) {
        existing = await fs.readJson(CONFIG.jobsFile);
      } else if (await fs.pathExists(CONFIG.jobsFilePublic)) {
        existing = await fs.readJson(CONFIG.jobsFilePublic);
      }

      if (Array.isArray(existing) && existing.length > 0) {
        existing.forEach((job) => {
          if (job && job.officialLink) {
            const norm = job.officialLink.split("#")[0].replace(/\/$/, "") || job.officialLink;
            this.jobsData.set(norm, job);
            this.visited.add(norm);
          }
        });
        console.log(`[SCRAPER] Loaded ${this.jobsData.size} existing jobs from cache.`);
      } else {
        console.log("[SCRAPER] No existing jobs file found. Starting fresh.");
        // Initialize with empty array in both locations
        await fs.ensureDir(path.dirname(CONFIG.jobsFile));
        await fs.ensureDir(path.dirname(CONFIG.jobsFilePublic));
        await fs.writeJson(CONFIG.jobsFile, [], { spaces: 2 });
        await fs.writeJson(CONFIG.jobsFilePublic, [], { spaces: 2 });
      }
    } catch (e) {
      console.log("[SCRAPER] Error loading existing data:", e.message);
      console.log("[SCRAPER] Starting with fresh database.");
      // Initialize with empty array in both locations
      await fs.ensureDir(path.dirname(CONFIG.jobsFile));
      await fs.ensureDir(path.dirname(CONFIG.jobsFilePublic));
      await fs.writeJson(CONFIG.jobsFile, [], { spaces: 2 });
      await fs.writeJson(CONFIG.jobsFilePublic, [], { spaces: 2 });
    }

    try {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920,1080",
        ],
        defaultViewport: null,
      });
      console.log("[SCRAPER] Browser initialized successfully.");
    } catch (error) {
      console.error("[SCRAPER] Failed to launch browser:", error.message);
      throw error;
    }
  }

  async start() {
    await this.init();
    this.isRunning = true;
    console.log("[SCRAPER] Background scraper service started successfully!");
    console.log(`[SCRAPER] Scraping interval: ${CONFIG.scrapeInterval / 60000} minutes\n`);

    // Run first cycle immediately
    await this.runCycle();

    // Then schedule periodic cycles
    this.scheduleNextCycle();
  }

  async runCycle() {
    if (!this.isRunning) return;

    // Reset queue for new cycle (add baseUrl if queue is empty)
    if (this.queue.size === 0) {
      this.queue.add(CONFIG.baseUrl);
      console.log("[SCRAPER] Starting new crawl cycle...\n");
    }

    let cycleCount = 0;
    const maxCycles = 1000; // Safety limit to prevent infinite loops

    while (this.queue.size > 0 && this.isRunning && cycleCount < maxCycles) {
      const batch = Array.from(this.queue).slice(0, CONFIG.concurrency);
      batch.forEach((url) => {
        this.queue.delete(url);
        this.visited.add(url);
      });

      if (batch.length === 0) break;

      cycleCount++;
      console.log(`[SCRAPER] Batch ${cycleCount}: ${batch.length} URLs | Queue: ${this.queue.size} | Visited: ${this.visited.size} | Jobs: ${this.jobsData.size}`);

      try {
        await Promise.all(batch.map((url) => this.processUrl(url)));
        await this.saveData();
        console.log(`[SCRAPER] Batch ${cycleCount} completed. Data saved.\n`);
      } catch (error) {
        console.error(`[SCRAPER] Error in batch ${cycleCount}:`, error.message);
      }
    }

    console.log(`[SCRAPER] Crawl cycle complete. Total jobs scraped: ${this.jobsData.size}`);
    await this.saveData();
    console.log(`[SCRAPER] Data saved to ${CONFIG.jobsFile}\n`);
  }

  scheduleNextCycle() {
    if (!this.isRunning) return;

    console.log(`[SCRAPER] Next cycle scheduled in ${CONFIG.scrapeInterval / 60000} minutes...\n`);
    setTimeout(async () => {
      if (this.isRunning) {
        await this.runCycle();
        this.scheduleNextCycle(); // Schedule the next cycle
      }
    }, CONFIG.scrapeInterval);
  }

  async stop() {
    console.log("[SCRAPER] Stopping scraper...");
    this.isRunning = false;
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    console.log("[SCRAPER] Scraper stopped.");
  }

  async processUrl(url) {
    let page = null;
    try {
      if (!this.browser) {
        console.error("[SCRAPER] Browser not initialized, reinitializing...");
        await this.init();
      }

      page = await this.browser.newPage();

      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (["image", "stylesheet", "font", "media"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setUserAgent(CONFIG.userAgent);
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      await page.goto(url, { waitUntil: "networkidle2", timeout: CONFIG.timeout });

      // 1. COMPREHENSIVE LINK DISCOVERY - only queue links not already scraped (incremental)
      const newLinks = await page.evaluate((baseUrl, baseHost) => {
        const links = new Set();
        document.querySelectorAll("a[href]").forEach((a) => {
          try {
            let href = a.href;
            if (!href || href === "#" || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
            if (!href.startsWith(baseUrl) && !href.includes(baseHost)) return;
            href = href.split("#")[0].replace(/\/$/, "") || href.split("#")[0];
            if (href.length > 5) links.add(href);
          } catch (_) {}
        });
        return Array.from(links);
      }, CONFIG.baseUrl, CONFIG.baseHost);

      newLinks.forEach((link) => {
        const norm = link.split("#")[0].replace(/\/$/, "") || link;
        if (!this.visited.has(norm) && !this.queue.has(norm) && this.queue.size < CONFIG.maxQueueSize) {
          this.queue.add(norm);
        }
      });

      // 2. JOB PAGE DETECTION - Skip category pages
      if (isCategoryPage(url)) return;

      const isJob = await this.isJobPage(page);
      if (isJob) {
        const normalizedUrl = url.split("#")[0].replace(/\/$/, "") || url;
        if (!this.jobsData.has(normalizedUrl)) {
          const scrapedAt = new Date().toISOString();
          const jobData = await this.scrapeJobDetails(page, url, scrapedAt);
          if (jobData && jobData.title) {
            this.jobsData.set(normalizedUrl, jobData);
            console.log(`  [✓] Scraped: ${jobData.title.substring(0, 55)}...`);
          }
        }
      }
    } catch (err) {
      console.error(`[SCRAPER] Error processing ${url}:`, err.message);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore page close errors
        }
      }
    }
  }

  async isJobPage(page) {
    return await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return false;

      const bodyText = document.body.innerText.toLowerCase();
      const hasImportantLinks = bodyText.includes("important link") || bodyText.includes("apply online");
      const hasVacancy = bodyText.includes("vacancy") || bodyText.includes("post name") || bodyText.includes("eligibility");
      const hasApplyLink = !!document.querySelector('a[href*="apply"], a[href*="login"], a[href*="registration"]');

      return hasImportantLinks || hasVacancy || hasApplyLink;
    });
  }

  async scrapeJobDetails(page, url, scrapedAt) {
    return await page.evaluate((currentUrl, scrapedAtDate, baseUrl) => {
      const clean = (t) => (t ? String(t).replace(/\s+/g, " ").trim() : "");
      const $ = (sel, ctx = document) => ctx.querySelector(sel);
      const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

      const title = clean($("h1")?.innerText) || "";

      let category = "Latest Jobs";
      const lower = title.toLowerCase();
      if (lower.includes("result")) category = "Result";
      else if (lower.includes("admit card")) category = "Admit Card";
      else if (lower.includes("answer key")) category = "Answer Key";
      else if (lower.includes("syllabus")) category = "Syllabus";
      else if (lower.includes("admission")) category = "Admission";

      const job = {
        title,
        scrapedAt: scrapedAtDate || "",
        category,
        postDate: "",
        shortInfo: "",
        importantDates: {},
        applicationFee: {},
        applicationFeeBullets: [],
        ageLimit: {},
        ageLimitBullets: [],
        vacancyDetails: [],
        salary: [],
        selectionProcess: [],
        howToApply: [],
        importantLinks: [],
        faqs: [],
        educationalQualification: "",
        applyOnline: "",
        downloadNotification: "",
        officialWebsite: "",
        officialLink: currentUrl,
        allTables: [],
        rawBulletSections: {},
      };

      // --- POST DATE ---
      const bodyText = document.body.innerText;
      const dateMatch = bodyText.match(/(?:Post Date|Updated on|Notification Date|Published)\s*[:\/]\s*([^\n]+)/i);
      if (dateMatch) job.postDate = clean(dateMatch[1]);

      // --- SHORT INFO (first meaningful paragraph after intro) ---
      const shortEl = $$("p").find((p) => {
        const t = p.innerText.trim();
        return t.length > 80 && t.length < 800 && !t.toLowerCase().includes("join our");
      });
      if (shortEl) job.shortInfo = clean(shortEl.innerText);

      // --- EXTRACT ALL BULLET LISTS (preserve format) ---
      const extractBulletList = (ulOrOl) => {
        if (!ulOrOl || !(ulOrOl.tagName === "UL" || ulOrOl.tagName === "OL")) return [];
        return $$("li", ulOrOl).map((li) => clean(li.innerText)).filter((t) => t.length > 1);
      };

      // Get all tables for extraction
      const tables = $$("table");

      // --- EXTRACT IMPORTANT DATES TABLE ---
      let datesTable = null;
      for (const table of tables) {
        const tableText = table.innerText.toLowerCase();
        if (tableText.includes("important date") || tableText.includes("important dates") || 
            tableText.includes("application start") || tableText.includes("last date") ||
            tableText.includes("exam date") || tableText.includes("admit card date")) {
          datesTable = table;
          break;
        }
      }

      if (datesTable) {
        const dateRows = Array.from(datesTable.querySelectorAll("tr"));
        dateRows.forEach(row => {
          const cols = row.querySelectorAll("td, th");
          if (cols.length >= 2) {
            const label = clean(cols[0].innerText).toLowerCase();
            const value = clean(cols[1].innerText);
            
            if (value && value.length > 0) {
              // Map common date labels to structured fields
              if (label.includes("application start") || label.includes("online registration start") || label.includes("apply start")) {
                job.importantDates.applicationStart = value;
              } else if (label.includes("application end") || label.includes("last date") || label.includes("apply end") || label.includes("closing date")) {
                job.importantDates.applicationEnd = value;
              } else if (label.includes("exam date") || label.includes("examination date") || label.includes("test date")) {
                job.importantDates.examDate = value;
              } else if (label.includes("admit card") || label.includes("hall ticket")) {
                job.importantDates.admitCardDate = value;
              } else if (label.includes("result") || label.includes("result date")) {
                job.importantDates.resultDate = value;
              } else if (label.includes("answer key") || label.includes("answer key date")) {
                job.importantDates.answerKeyDate = value;
              } else {
                // Store any other dates in a generic format
                job.importantDates[label] = value;
              }
            }
          }
        });
      }

      // --- EXTRACT APPLICATION FEE TABLE ---
      let feeTable = null;
      for (const table of tables) {
        const tableText = table.innerText.toLowerCase();
        if (tableText.includes("application fee") || tableText.includes("exam fee") || 
            tableText.includes("fee") && (tableText.includes("general") || tableText.includes("obc") || tableText.includes("sc") || tableText.includes("st"))) {
          feeTable = table;
          break;
        }
      }

      if (feeTable) {
        const feeRows = Array.from(feeTable.querySelectorAll("tr"));
        feeRows.forEach(row => {
          const cols = row.querySelectorAll("td, th");
          if (cols.length >= 2) {
            const label = clean(cols[0].innerText).toLowerCase();
            const value = clean(cols[1].innerText);
            
            if (value && value.length > 0) {
              // Extract fee by category
              if (label.includes("general") || label.includes("ur") || label.includes("unreserved")) {
                job.applicationFee.general = value;
              } else if (label.includes("obc")) {
                job.applicationFee.obc = value;
              } else if (label.includes("sc")) {
                job.applicationFee.sc = value;
              } else if (label.includes("st")) {
                job.applicationFee.st = value;
              } else if (label.includes("ews")) {
                job.applicationFee.ews = value;
              } else if (label.includes("ph") || label.includes("pwd") || label.includes("disabled")) {
                job.applicationFee.ph = value;
              } else if (label.includes("fee") || label.includes("amount")) {
                job.applicationFee.other = value;
              }
            }
          }
        });
        
        // Also extract fee bullets if present
        const feeBullets = [];
        feeRows.forEach(row => {
          const text = clean(row.innerText);
          if (text && text.length > 5 && (text.includes("fee") || text.includes("rs") || text.includes("rupee"))) {
            feeBullets.push(text);
          }
        });
        if (feeBullets.length > 0) {
          job.applicationFeeBullets = feeBullets;
        }
      }

      // --- EXTRACT AGE LIMIT TABLE ---
      let ageTable = null;
      for (const table of tables) {
        const tableText = table.innerText.toLowerCase();
        if (tableText.includes("age limit") || tableText.includes("age") && (tableText.includes("minimum") || tableText.includes("maximum") || tableText.includes("year"))) {
          ageTable = table;
          break;
        }
      }

      if (ageTable) {
        const ageRows = Array.from(ageTable.querySelectorAll("tr"));
        ageRows.forEach(row => {
          const cols = row.querySelectorAll("td, th");
          if (cols.length >= 2) {
            const label = clean(cols[0].innerText).toLowerCase();
            const value = clean(cols[1].innerText);
            
            if (value && value.length > 0) {
              if (label.includes("minimum") || label.includes("min")) {
                job.ageLimit.minimum = value;
              } else if (label.includes("maximum") || label.includes("max")) {
                job.ageLimit.maximum = value;
              } else if (label.includes("age") && !label.includes("relaxation")) {
                job.ageLimit.general = value;
              }
            }
          }
        });
        
        // Also extract age limit bullets if present
        const ageBullets = [];
        ageRows.forEach(row => {
          const text = clean(row.innerText);
          if (text && text.length > 5 && (text.includes("age") || text.includes("year"))) {
            ageBullets.push(text);
          }
        });
        if (ageBullets.length > 0) {
          job.ageLimitBullets = ageBullets;
        }
      }

      // Find sections by header proximity (for other sections)
      const sectionHeaders = ["selection process", "how to apply", "how to"];

      const allSections = [];
      $$("h2, h3, h4, strong, b").forEach((el) => {
        const text = el.innerText?.trim().toLowerCase() || "";
        const match = sectionHeaders.find((h) => text.includes(h));
        if (match && text.length < 80) {
          let container = el.closest("td") || el.closest("div") || el.parentElement;
          if (!container) container = el;
          let next = el.nextElementSibling;
          if (!next) next = container.nextElementSibling;

          const bullets = [];
          [next, next?.nextElementSibling, next?.nextElementSibling?.nextElementSibling].forEach((n) => {
            if (n && (n.tagName === "UL" || n.tagName === "OL")) {
              extractBulletList(n).forEach((b) => bullets.push(b));
            } else if (n && n.tagName === "TABLE") {
              $$("tr", n).forEach((row) => {
                const cells = $$("td, th", row);
                cells.forEach((c) => {
                  const t = clean(c.innerText);
                  if (t && t.length > 2) bullets.push(t);
                });
              });
            }
          });

          allSections.push({ name: match, bullets });
        }
      });

      // Process extracted sections
      allSections.forEach(section => {
        if (section.name === "selection process" && section.bullets.length > 0) {
          job.selectionProcess = section.bullets;
        } else if (section.name.includes("how to apply") && section.bullets.length > 0) {
          job.howToApply = section.bullets;
        }
      });

      // --- VACANCY TABLES ---
      $$("table").forEach((table) => {
        const headers = $$("th, td", $("tr", table)).map((c) => c.innerText.trim().toLowerCase());
        const hasPost = headers.some((h) => h.includes("post") || h.includes("post name"));
        const hasTotal = headers.some((h) => h.includes("total") || h.includes("vacancy"));
        const hasEligibility = headers.some((h) => h.includes("eligibility") || h.includes("qualification"));

        const isMetaTable = headers.some((h) => h.includes("important link") || h.includes("important date") || h.includes("application fee") || h.includes("age limit"));
        if ((hasPost || hasEligibility) && !isMetaTable) {
          const rows = $$("tr", table).slice(1);
          rows.forEach((row) => {
            const cols = $$("td", row);
            if (cols.length < 2) return;
            const rowData = {};
            headers.forEach((h, i) => {
              if (cols[i]) rowData[h || "col" + i] = clean(cols[i].innerText);
            });
            if (Object.keys(rowData).length > 0) job.vacancyDetails.push(rowData);
          });
        }
      });

      // Educational qualification from vacancy or dedicated section
      const qualKeys = ["eligibility", "qualification", "educational"];
      job.vacancyDetails.forEach((row) => {
        Object.keys(row).forEach((k) => {
          if (qualKeys.some((q) => k.toLowerCase().includes(q)) && row[k]?.length > 10) {
            const post = row["post name"] || row["post"] || "";
            job.educationalQualification += (post ? post + ": " : "") + row[k] + "\n";
          }
        });
      });
      job.educationalQualification = job.educationalQualification.trim();

      // --- IMPORTANT LINKS TABLE ---
      let linksTable = null;
      
      // Strategy 1: Iterate through tables and find one containing "important link"
      for (const table of tables) {
          if (table.innerText.toLowerCase().includes("important link") || 
              table.innerText.toLowerCase().includes("useful link")) {
              linksTable = table;
              break;
          }
          let prev = table.previousElementSibling;
          while(prev && prev.tagName !== 'TABLE') {
              if (prev.innerText && prev.innerText.toLowerCase().includes("important link")) {
                  linksTable = table;
                  break;
              }
              prev = prev.previousElementSibling;
          }
          if (linksTable) break;
      }
      
      // Strategy 2: Look for table with specific keywords
      if (!linksTable) {
          for (const table of tables) {
              const text = table.innerText.toLowerCase();
              if ((text.includes("apply online") || text.includes("download result")) && text.includes("official website")) {
                  linksTable = table;
                  break;
              }
          }
      }
      
      // Strategy 3: Fallback to last table if it has links
      if (!linksTable && tables.length > 0) {
           const lastTable = tables[tables.length - 1];
           if (lastTable?.querySelectorAll('a').length > 2) {
               linksTable = lastTable;
           }
      }

      if (linksTable) {
           const rows = Array.from(linksTable.querySelectorAll("tr"));
           rows.forEach(row => {
               const cols = row.querySelectorAll("td");
               if (cols.length >= 2) {
                   let label = cols[0].innerText.trim();
                   label = label.replace(/[:\-\s]+$/, "");
                   
                   const anchor = cols[1].querySelector("a");
                   if (anchor) {
                       const linkUrl = anchor.href;
                       
                       if (!linkUrl || linkUrl === "" || linkUrl === "#" || linkUrl.includes("javascript:")) return;
                       if (linkUrl === window.location.href) return;
                       if (baseUrl && (linkUrl === baseUrl || linkUrl === baseUrl + "/")) return;

                       job.importantLinks.push({
                           label: label,
                           url: linkUrl
                       });
                       
                       const lowerLabel = label.toLowerCase();
                       if (lowerLabel.includes("apply") && (lowerLabel.includes("online") || lowerLabel.includes("registration") || lowerLabel.includes("login"))) {
                           if (!job.applyOnline) job.applyOnline = linkUrl;
                       }
                       else if (lowerLabel.includes("notification") || lowerLabel.includes("advertisement") || lowerLabel.includes("brochure")) {
                           if (!job.downloadNotification) job.downloadNotification = linkUrl;
                       }
                       else if (lowerLabel.includes("official") && (lowerLabel.includes("website") || lowerLabel.includes("site"))) {
                           if (!job.officialWebsite) job.officialWebsite = linkUrl;
                       }
                   }
               }
           });
      }

      // Clean redundant empty arrays and objects
      if (job.applicationFeeBullets && job.applicationFeeBullets.length === 0) delete job.applicationFeeBullets;
      if (job.ageLimitBullets && job.ageLimitBullets.length === 0) delete job.ageLimitBullets;
      if (job.selectionProcess && job.selectionProcess.length === 0) delete job.selectionProcess;
      if (job.howToApply && job.howToApply.length === 0) delete job.howToApply;
      if (job.salary && job.salary.length === 0) delete job.salary;
      if (job.faqs && job.faqs.length === 0) delete job.faqs;
      if (job.rawBulletSections && Object.keys(job.rawBulletSections).length === 0) delete job.rawBulletSections;
      if (job.importantDates && Object.keys(job.importantDates).length === 0) delete job.importantDates;
      if (job.applicationFee && Object.keys(job.applicationFee).length === 0) delete job.applicationFee;
      if (job.ageLimit && Object.keys(job.ageLimit).length === 0) delete job.ageLimit;

      return job;
    }, url, scrapedAt, CONFIG.baseUrl);
  }

  async saveData() {
    try {
      let data = Array.from(this.jobsData.values());
      
      // Ensure we have valid data
      if (!Array.isArray(data)) {
        data = [];
      }

      // Sort by scrapedAt (oldest first)
      data.sort((a, b) => {
        const da = a?.scrapedAt || "";
        const db = b?.scrapedAt || "";
        return da.localeCompare(db);
      });

      // Trim to max lines by removing oldest jobs first
      while (data.length > 0) {
        const str = JSON.stringify(data, null, 2);
        const lineCount = str.split("\n").length;
        if (lineCount <= CONFIG.maxJsonLines) break;
        const removed = data.shift();
        if (removed && removed.officialLink) {
          const norm = removed.officialLink.split("#")[0].replace(/\/$/, "") || removed.officialLink;
          this.jobsData.delete(norm);
        }
      }

      // Ensure directories exist
      const dataDir = path.dirname(CONFIG.jobsFile);
      await fs.ensureDir(dataDir);
      const publicDataDir = path.dirname(CONFIG.jobsFilePublic);
      await fs.ensureDir(publicDataDir);

      // Save data to both locations
      await fs.writeJson(CONFIG.jobsFile, data, { spaces: 2 });
      await fs.writeJson(CONFIG.jobsFilePublic, data, { spaces: 2 });
      console.log(`[SCRAPER] Saved ${data.length} jobs to ${CONFIG.jobsFile} and ${CONFIG.jobsFilePublic}`);
    } catch (error) {
      console.error("[SCRAPER] Error saving data:", error.message);
      throw error;
    }
  }
}

// Export for use in the app
let scraperInstance = null;

module.exports = {
  BackgroundScraper,
  startScraper: async () => {
    console.log("[SCRAPER] Background scraper service starting...");
    try {
      if (!scraperInstance) {
        scraperInstance = new BackgroundScraper();
        scraperInstance.start().catch((error) => {
          console.error("[SCRAPER] Fatal error in scraper:", error);
          scraperInstance = null;
        });
      } else {
        console.log("[SCRAPER] Scraper already running.");
      }
    } catch (error) {
      console.error("[SCRAPER] Error starting scraper:", error.message);
      scraperInstance = null;
    }
  },
  stopScraper: async () => {
    if (scraperInstance) {
      await scraperInstance.stop();
      scraperInstance = null;
    }
  },
};
