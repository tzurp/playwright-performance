import { TestInfo } from "@playwright/test";
import { Options } from "./entities/options";
import {PerformanceMain} from "./performance-main";

const _playwrightPerformance = {
    performance: async({performanceOptions, browserName}: any, use: (arg0: PerformanceMain) => any, workerInfo: TestInfo) => {
    
        const performance = new PerformanceMain(performanceOptions);

        await performance.initialize((performanceOptions as Options).disableAppendToExistingFile);

        await use(performance);

        console.log("FINALIZE STARTED >>>>>");
        await performance.finalize(browserName, workerInfo);
        console.log("FINALIZE ENDED <<<<<");
    }
}

export const playwrightPerformance = _playwrightPerformance;
export type PlaywrightPerformance = {performance: PerformanceMain};
export type PerformanceOptions = {performanceOptions: Options };

