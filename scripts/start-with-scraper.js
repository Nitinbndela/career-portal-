#!/usr/bin/env node

/**
 * Career Portal with Integrated Scraper
 * This script starts both the React development server AND the background scraper
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const isProductionBuild = args.includes("--build");

// Get project root (parent directory of scripts folder)
const projectRoot = path.join(__dirname, "..");

console.log("==========================================");
console.log("  CAREER PORTAL WITH INTEGRATED SCRAPER");
console.log("==========================================\n");

if (isProductionBuild) {
  console.log("[LAUNCHER] Building for production...\n");
  const build = spawn("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
    cwd: projectRoot,
  });

  build.on("close", (code) => {
    if (code === 0) {
      console.log("\n[LAUNCHER] Build completed successfully!");
      process.exit(0);
    } else {
      console.error("[LAUNCHER] Build failed!");
      process.exit(1);
    }
  });
} else {
  // Development mode: start React + Scraper
  console.log("[LAUNCHER] Starting development server and background scraper...\n");

  // Start React development server
  const reactServer = spawn("npx", ["react-scripts", "start"], {
    stdio: "inherit",
    shell: true,
    cwd: projectRoot,
    env: { ...process.env, PORT: process.env.PORT || 3000 },
  });

  // Give React a moment to start, then initialize scraper as completely separate process
  setTimeout(() => {
    console.log("\n[LAUNCHER] Starting background scraper service...\n");
    
    // Spawn scraper as completely separate Node.js process
    const scraperProcess = spawn("node", [path.join(__dirname, "scraper-only.js")], {
      stdio: "inherit",
      shell: true,
      cwd: projectRoot,
      detached: true,  // Allow scraper to run independently
    });

    // Allow scraper process to run independently
    scraperProcess.unref();
  }, 3000);

  reactServer.on("error", (err) => {
    console.error("[LAUNCHER] Failed to start React server:", err);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("\n[LAUNCHER] Shutting down...");
    reactServer.kill();
    process.exit(0);
  });
}
