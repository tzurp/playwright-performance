import {test as base, expect } from '@playwright/test';
import type { PerformanceOptions, PlaywrightPerformance, PerformanceWorker } from "../src/performance-fixture";
import { playwrightPerformance } from "../src/performance-fixture";

const test = base.extend<PlaywrightPerformance, PerformanceOptions & PerformanceWorker>({
  performance: playwrightPerformance.performance,
  performanceOptions: [{
    disableAppendToExistingFile: false,
    dropResultsFromFailedTest: false,
    analyzeByBrowser: false,
    performanceResultsDirectoryName: "performance-results-dir",
    performanceResultsFileName: `performance-results_${new Date().getHours()}`,
    suppressConsoleResults: false,
    recentDays:0,
  }, { scope: 'worker' }],
  worker: [playwrightPerformance.worker, { scope: 'worker', auto: true }]
});

for (let i = 0; i < 3; i++) {
  test('startup performance ' + i, async ({ page, performance }) => {
    await page.goto("http://www.microsoft.com");

    performance.sampleStart("startup_SF");
    await page.goto('https://sourceforge.net/');
    performance.sampleEnd("startup_SF");

    performance.sampleStart("startup_GH");
    await page.goto('http://github.com/');
    performance.sampleEnd("startup_GH");

    const message = performance.getSampleTime("startup_GH") < performance.getSampleTime("startup_SF") ? "GitHub is faster" : "SourceForge is faster";

    console.log(message);

    expect(typeof performance.getSampleTime("startup_GH")).toBe("number");
  });
};
