#!/usr/bin/env node

/**
 * Run just the background scraper (without React server)
 * Useful for server deployments or standalone scraping
 */

const { BackgroundScraper } = require("../src/services/scraper");

console.log("==========================================");
console.log("  SARKARI RESULT - BACKGROUND SCRAPER");
console.log("==========================================\n");

// Start the scraper
const scraper = new BackgroundScraper();
scraper.start().catch((error) => {
  console.error("[SCRAPER] Fatal error:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n[SCRAPER] Shutting down gracefully...");
  scraper.isRunning = false;
  if (scraper.browser) {
    await scraper.browser.close();
  }
  process.exit(0);
});
