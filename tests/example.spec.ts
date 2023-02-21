import base, { expect } from '@playwright/test';
import type {PerformanceOptions, PlaywrightPerformance} from "../src/performance-fixture";
import {playwrightPerformance} from "../src/performance-fixture";
import { PerformanceMain } from '../src/performance-main';

const test = base.extend<PerformanceOptions & PlaywrightPerformance>({
  performanceOptions: [{
    disableAppendToExistingFile: false,
    dropResultsFromFailedTest: false, analyzeByBrowser: false, 
    performanceResultsDirectory: "performance-results"}, 
    {option: true}],
  
  performance: playwrightPerformance.performance,
})

test.afterAll(async ({page})=> {
  await page.pause();
  console.log("*** FROM AFTERALL ****");
  const performance = new PerformanceMain();
  // TODO: need to pass options
  await performance.analyzeResults();
})
  
test('startup performance1', async ({ page, performance }) => {
  performance.sampleStart("startup");
  await page.goto('https://konaworld.com/');
  performance.sampleEnd("startup");
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/KONA/);
});




