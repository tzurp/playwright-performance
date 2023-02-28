import { TestInfo, WorkerInfo } from "@playwright/test";
import { Options } from "./entities/options";
import {PerformanceMain} from "./performance-main";

const _playwrightPerformance = {
    performance: async({browserName}: any, use: (arg0: PerformanceMain) => any, testInfo: TestInfo) => {
        const performance = new PerformanceMain();

        await use(performance);

        await performance.finalizeTest(browserName, testInfo);
    },
    worker: async ({ performanceOptions }: any, use:any, workerInfo: WorkerInfo) => {
        const performance = new PerformanceMain(performanceOptions as Options);
        
        await performance.initialize();
        
        await use();

        await performance.analyzeResults(workerInfo.workerIndex);
      }
}

export const playwrightPerformance = _playwrightPerformance;
export type PlaywrightPerformance = {performance: PerformanceMain};
export type PerformanceWorker = {worker: PerformanceMain};
export type PerformanceOptions = {performanceOptions: Options };

