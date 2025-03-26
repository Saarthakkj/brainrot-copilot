#!/usr/bin/env node

/**
 * Chrome Extension Build Script
 * 
 * This script:
 * 1. Builds the extension using Vite
 * 2. Copies the manifest.json and icon files to the dist folder
 * 3. Performs any necessary post-processing
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');
const PUBLIC_DIR = resolve(ROOT_DIR, 'public');

// Run a command and return a promise
const run = (cmd) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);
    exec(cmd, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        if (stdout) console.log(`stdout: ${stdout}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`stdout: ${stdout}`);
      }
      resolve();
    });
  });
};

// Copy files from public to dist
const copyPublicFiles = async () => {
  try {
    // Make sure dist directory exists
    await fs.mkdir(DIST_DIR, { recursive: true });
    
    // Copy manifest.json
    await fs.copyFile(
      resolve(PUBLIC_DIR, 'manifest.json'),
      resolve(DIST_DIR, 'manifest.json')
    );
    
    // Copy icon files
    const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
    for (const iconFile of iconFiles) {
      try {
        await fs.copyFile(
          resolve(PUBLIC_DIR, iconFile),
          resolve(DIST_DIR, iconFile)
        );
      } catch (err) {
        console.warn(`Warning: Could not copy ${iconFile}: ${err.message}`);
      }
    }

    // Copy subway.mp4
    try {
      await fs.copyFile(
        resolve(PUBLIC_DIR, 'subway.mp4'),
        resolve(DIST_DIR, 'subway.mp4')
      );
    } catch (err) {
      console.warn(`Warning: Could not copy subway.mp4: ${err.message}`);
    }

    console.log('Public files copied to dist directory');
  } catch (err) {
    console.error(`Error copying public files: ${err.message}`);
    throw err;
  }
};

// Main build process
const build = async () => {
  try {
    console.log('🚀 Building Chrome Extension...');
    
    // Clean dist directory if it exists
    try {
      await fs.rm(DIST_DIR, { recursive: true, force: true });
      console.log('Cleaned dist directory');
    } catch (err) {
      // Ignore errors if directory doesn't exist
    }
    
    // Build content script first
    console.log('Building content script...');
    await run('tsc -p tsconfig.content.json');
    
    // Run TypeScript compiler for the rest
    await run('tsc -b');
    
    // Run Vite build
    await run('vite build');
    
    // Copy public files
    await copyPublicFiles();
    
    console.log('✅ Chrome Extension built successfully in dist/ directory');
    console.log('🔍 To install in Chrome:');
    console.log('1. Open chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select the dist/ directory');
    
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
};

// Run the build process
build(); 