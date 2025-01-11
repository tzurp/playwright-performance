import extendPlaywrightPerformance, {PerformanceOptions, PerformanceWorker, PlaywrightPerformance} from '../app';
import { test as base, expect } from '@playwright/test';


const options: PerformanceOptions = {
  // Specify only the options you need. Unspecified options will use default values.
  disableAppendToExistingFile: false,  // Optional: Default is false
  dropResultsFromFailedTest: false,    // Optional: Default is false
  analyzeByBrowser: false,             // Optional: Default is false
  performanceResultsDirectoryName: "performance-results", // Optional: Default is "performance-results"
  performanceResultsFileName: "performance-results",      // Optional: Default is "performance-results"
  suppressConsoleResults: false,       // Optional: Default is false
  recentDays: 0,                       // Optional: Default is 0
};

const test = base.extend<PlaywrightPerformance, PerformanceOptions & PerformanceWorker>(extendPlaywrightPerformance(options));

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
