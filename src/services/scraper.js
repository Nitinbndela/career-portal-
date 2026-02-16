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
  jobsFile: path.join(__dirname, "../data/jobs.json"),
  concurrency: 2,
  timeout: 60000,
  scrapeInterval: 2 * 60 * 1000, // 10 minutes
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
    console.log("[SCRAPER] Initializing Background Scraper Service...");

    try {
      if (await fs.pathExists(CONFIG.jobsFile)) {
        const existing = await fs.readJson(CONFIG.jobsFile);
        existing.forEach((job) => {
          if (job.officialLink) {
            const norm = job.officialLink.split("#")[0].replace(/\/$/, "") || job.officialLink;
            this.jobsData.set(norm, job);
            this.visited.add(norm);
          }
        });
        console.log(`[SCRAPER] Loaded ${this.jobsData.size} existing jobs from cache.`);
      }
    } catch (e) {
      console.log("[SCRAPER] Starting with fresh database.");
    }

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
  }

  async start() {
    await this.init();
    this.isRunning = true;
    console.log("[SCRAPER] Starting comprehensive crawl cycle...\n");

    while (this.queue.size > 0 && this.isRunning) {
      const batch = Array.from(this.queue).slice(0, CONFIG.concurrency);
      batch.forEach((url) => {
        this.queue.delete(url);
        this.visited.add(url);
      });

      if (batch.length === 0) break;

      console.log(`[SCRAPER] Batch: ${batch.length} | Queue: ${this.queue.size} | Visited: ${this.visited.size}`);

      await Promise.all(batch.map((url) => this.processUrl(url)));
      await this.saveData();
    }

    console.log("[SCRAPER] Crawl cycle complete.");
    await this.saveData();
    await this.browser.close();

    console.log(`[SCRAPER] Next update in ${CONFIG.scrapeInterval / 60000} minutes...`);
    // Schedule next cycle
    setTimeout(() => new BackgroundScraper().start(), CONFIG.scrapeInterval);
  }

  async processUrl(url) {
    let page = null;
    try {
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
      if (isJob && !this.jobsData.has(url)) {
        const scrapedAt = new Date().toISOString();
        const jobData = await this.scrapeJobDetails(page, url, scrapedAt);
        if (jobData && jobData.title) {
          this.jobsData.set(url, jobData);
          console.log(`  [✓] ${jobData.title.substring(0, 55)}...`);
        }
      }
    } catch (err) {
      // Silent fail for individual URLs
    } finally {
      if (page) await page.close();
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

      // Find sections by header proximity
      const sectionHeaders = ["important dates", "application fee", "exam fee", "age limit", "selection process", "how to apply", "how to"];

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
      const tables = $$("table");
      
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

      // Clean redundant empty arrays
      if (job.applicationFeeBullets.length === 0) delete job.applicationFeeBullets;
      if (job.ageLimitBullets.length === 0) delete job.ageLimitBullets;
      if (job.selectionProcess.length === 0) delete job.selectionProcess;
      if (job.howToApply.length === 0) delete job.howToApply;
      if (job.salary.length === 0) delete job.salary;
      if (job.faqs.length === 0) delete job.faqs;
      if (job.rawBulletSections && Object.keys(job.rawBulletSections).length === 0) delete job.rawBulletSections;

      return job;
    }, url, scrapedAt, CONFIG.baseUrl);
  }

  async saveData() {
    let data = Array.from(this.jobsData.values());
    // Sort by scrapedAt (oldest first)
    data.sort((a, b) => {
      const da = a.scrapedAt || "";
      const db = b.scrapedAt || "";
      return da.localeCompare(db);
    });
    // Trim to max lines by removing oldest jobs first
    while (data.length > 0) {
      const str = JSON.stringify(data, null, 2);
      const lineCount = str.split("\n").length;
      if (lineCount <= CONFIG.maxJsonLines) break;
      const removed = data.shift();
      if (removed && removed.officialLink) this.jobsData.delete(removed.officialLink);
    }
    await fs.writeJson(CONFIG.jobsFile, data, { spaces: 2 });
  }
}

// Export for use in the app
module.exports = {
  BackgroundScraper,
  startScraper: async () => {
    console.log("[SCRAPER] Background scraper service starting...");
    try {
      new BackgroundScraper().start();
    } catch (error) {
      console.error("[SCRAPER] Error starting scraper:", error.message);
    }
  },
};
