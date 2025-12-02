#!/usr/bin/env tsx

/**
 * Performance measurement script for ContextFlow
 *
 * Captures bundle size metrics from build output.
 * For load time and memory metrics, use manual measurement
 * as documented in docs/PERFORMANCE_BASELINE.md
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';

interface BundleMetrics {
  file: string;
  rawSize: number;
  gzipSize: number;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function measureBundleSize(): BundleMetrics | null {
  const distDir = path.join(process.cwd(), 'dist', 'assets');

  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/assets directory not found. Run `npm run build` first.');
    return null;
  }

  // Find the main JS bundle (index-*.js)
  const files = fs.readdirSync(distDir);
  const mainBundle = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

  if (!mainBundle) {
    console.error('❌ Main bundle (index-*.js) not found in dist/assets');
    return null;
  }

  const bundlePath = path.join(distDir, mainBundle);
  const content = fs.readFileSync(bundlePath);
  const rawSize = content.length;
  const gzipSize = gzipSync(content).length;

  return {
    file: mainBundle,
    rawSize,
    gzipSize,
  };
}

function main() {
  console.log('🔍 Measuring ContextFlow Performance\n');

  // Check if build exists
  const distExists = fs.existsSync(path.join(process.cwd(), 'dist'));

  if (!distExists) {
    console.log('📦 Building production bundle...\n');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log();
    } catch (error) {
      console.error('❌ Build failed');
      process.exit(1);
    }
  }

  // Measure bundle size
  const metrics = measureBundleSize();

  if (!metrics) {
    process.exit(1);
  }

  console.log('📊 Bundle Size Metrics\n');
  console.log(`File: ${metrics.file}`);
  console.log(`Raw:     ${formatBytes(metrics.rawSize)}`);
  console.log(`Gzipped: ${formatBytes(metrics.gzipSize)}`);
  console.log();

  // Check against thresholds
  const GZIP_THRESHOLD_KB = 250;
  const gzipKB = metrics.gzipSize / 1024;

  if (gzipKB > GZIP_THRESHOLD_KB) {
    console.log(`⚠️  Bundle size (${gzipKB.toFixed(2)} KB) exceeds threshold (${GZIP_THRESHOLD_KB} KB)`);
  } else {
    console.log(`✅ Bundle size within acceptable range (< ${GZIP_THRESHOLD_KB} KB)`);
  }

  console.log();
  console.log('💡 For load time and memory metrics, see docs/PERFORMANCE_BASELINE.md');
}

main();
