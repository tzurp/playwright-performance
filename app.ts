import test from "@playwright/test";
import {playwrightPerformance, PlaywrightPerformance, PerformanceOptions } from "./src/performance-fixture";
import { PerformanceMain } from "./src/performance-main";

export {playwrightPerformance};

export type {PlaywrightPerformance, PerformanceOptions};

test.afterAll(async ({})=> {
    const performance = new PerformanceMain();
    // TODO: need to pass options
    await performance.analyzeResults();
})