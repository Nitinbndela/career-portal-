#!/usr/bin/env node

/**
 * Verify Integration Setup
 * Checks if all necessary files and dependencies are in place
 */

const fs = require("fs");
const path = require("path");

console.log("\n========================================");
console.log("  INTEGRATION VERIFICATION CHECK");
console.log("========================================\n");

let allGood = true;

// Check functions
function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log("✓ " + name);
    return true;
  } else {
    console.log("✗ " + name + " (MISSING)");
    allGood = false;
    return false;
  }
}

function checkContent(filePath, searchString, name) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes(searchString)) {
      console.log("✓ " + name);
      return true;
    } else {
      console.log("✗ " + name + " (NOT FOUND)");
      allGood = false;
      return false;
    }
  } catch (e) {
    console.log("✗ " + name + " (ERROR: " + e.message + ")");
    allGood = false;
    return false;
  }
}

// Check files
console.log("FILES:");
checkFile(path.join(__dirname, "src/services/scraper.js"), "src/services/scraper.js");
checkFile(path.join(__dirname, "scripts/start-with-scraper.js"), "scripts/start-with-scraper.js");
checkFile(path.join(__dirname, "scripts/scraper-only.js"), "scripts/scraper-only.js");
checkFile(path.join(__dirname, "src/data/jobs.json"), "src/data/jobs.json");

// Check package.json
console.log("\nPACKAGE.JSON:");
checkContent(
  path.join(__dirname, "package.json"),
  '"puppeteer"',
  "puppeteer dependency"
);
checkContent(
  path.join(__dirname, "package.json"),
  '"fs-extra"',
  "fs-extra dependency"
);
checkContent(
  path.join(__dirname, "package.json"),
  '"start": "node scripts/start-with-scraper.js"',
  "npm start script updated"
);

// Check App.js
console.log("\nAPP.JS:");
checkContent(
  path.join(__dirname, "src/App.js"),
  "useEffect",
  "useEffect imported"
);
checkContent(
  path.join(__dirname, "src/App.js"),
  "initScraper",
  "Scraper initialization in useEffect"
);

// Check scraper config
console.log("\nSCRAPER CONFIG:");
checkContent(
  path.join(__dirname, "src/services/scraper.js"),
  "10 * 60 * 1000",
  "Scrape interval set to 10 minutes"
);
checkContent(
  path.join(__dirname, "src/services/scraper.js"),
  "../data/jobs.json",
  "Jobs file path correctly set to src/data/jobs.json"
);

// Final status
console.log("\n========================================");
if (allGood) {
  console.log("  ✓ ALL CHECKS PASSED!");
  console.log("  Ready to run: npm install && npm start");
} else {
  console.log("  ✗ Some checks failed");
  console.log("  Please fix the MISSING items above");
}
console.log("========================================\n");

process.exit(allGood ? 0 : 1);
