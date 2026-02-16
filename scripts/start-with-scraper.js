#!/usr/bin/env node

/**
 * Career Portal with Integrated Scraper
 * This script starts both the React development server AND the background scraper
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Cross-platform path handling
const isWindows = process.platform === "win32";

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
    shell: isWindows,  // Use shell on Windows to handle paths with spaces
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
  // On Windows with shell: true, we need to quote paths with spaces
  const reactServerArgs = ["react-scripts", "start"];
  const reactServer = spawn("npx", reactServerArgs, {
    stdio: "inherit",
    shell: isWindows,  // Use shell on Windows to handle paths with spaces
    cwd: projectRoot,
    env: { ...process.env, PORT: process.env.PORT || 3000 },
  });

  let scraperProcess = null;

  // Give React a moment to start, then initialize scraper as completely separate process
  setTimeout(() => {
    console.log("\n[LAUNCHER] Starting background scraper service...\n");
    
    // Get absolute path to scraper script (properly resolved to handle spaces)
    const scraperScriptPath = path.resolve(__dirname, "scraper-only.js");
    
    // Spawn scraper as completely separate Node.js process
    // On Windows, use shell: true and quote paths to handle spaces
    // On Unix, use shell: false with absolute path
    if (isWindows) {
      // Windows: Use shell with properly quoted paths
      // Escape quotes in paths if needed
      const execPathQuoted = `"${process.execPath.replace(/"/g, '\\"')}"`;
      const scriptPathQuoted = `"${scraperScriptPath.replace(/"/g, '\\"')}"`;
      scraperProcess = spawn(`${execPathQuoted} ${scriptPathQuoted}`, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
        cwd: projectRoot,
        detached: false,
      });
    } else {
      // Unix: Use direct execPath without shell
      scraperProcess = spawn(process.execPath, [scraperScriptPath], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        cwd: projectRoot,
        detached: false,
      });
    }

    // Forward scraper output to console
    scraperProcess.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    scraperProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    scraperProcess.on("error", (err) => {
      console.error("[LAUNCHER] Failed to start scraper:", err);
    });

    scraperProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[LAUNCHER] Scraper process exited with code ${code}`);
      }
    });
  }, 3000);

  reactServer.on("error", (err) => {
    console.error("[LAUNCHER] Failed to start React server:", err);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("\n[LAUNCHER] Shutting down...");
    if (scraperProcess) {
      scraperProcess.kill("SIGINT");
    }
    reactServer.kill("SIGINT");
    process.exit(0);
  });
}
