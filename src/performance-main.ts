import path from "path";
import fileWriter from "./helpers/file-writer";
import { IdGenerator } from "./helpers/id-generator";
import { TestInfo } from "@playwright/test";
import { Options } from "./entities/options";
import { PerformanceAnalyzer } from "./performance-analyzer";
import { PerformanceCache } from "./performance-cache";
import { variables } from "./constants/variables";

export class PerformanceMain {
    private _instanceid: string;
    private logFileName = variables.logFileName;
    private performanceCache: PerformanceCache;

    constructor();
    constructor(options: Options)
    constructor(options?: Options) {
        this._instanceid = new IdGenerator().getId("inst");

        this.performanceCache = new PerformanceCache();

        if (options) {
            (global as any)._performanceResultsFileName = options.performanceResultsFileName || "performance-results";
            (global as any)._performanceResultsDirectory = options.performanceResultsDirectory || "performance-results";
            (global as any)._disableAppendToExistingFile = options.disableAppendToExistingFile;
            (global as any)._dropResultsFromFailedTest = options.dropResultsFromFailedTest;
            (global as any)._analyzeByBrowser = options.analyzeByBrowser;
        }
    }

    sampleStart(stepName: string): void {
        this.performanceCache.sampleStart(stepName, this._instanceid);
    }

    sampleEnd(stepName: string): void {
        this.performanceCache.sampleEnd(stepName, this._instanceid);
    }

    getSampleTime(stepName: string): number {
        return this.performanceCache.getSampleTime(stepName);
    }

    /**
     * @deprecated Don't use this method directly.
     */
    async initialize(): Promise<void> {
        const resultsDir = await fileWriter.createResultsDirIfNotExist((global as any)._performanceResultsDirectory);

        (global as any)._resultsDir = resultsDir;

        const initObj = JSON.stringify({ "startDisplayTime": new Date().toLocaleString(), "instanceID": this._instanceid });

        const fileName = path.join(resultsDir, this.logFileName);

        if ((global as any)._disableAppendToExistingFile) {
            await fileWriter.writeToFile(fileName, `${initObj}\n`);
        }
        else {
            await fileWriter.appendLineToFile(fileName, `${initObj}\n`);
        }
    }

    /**
     * @deprecated Don't use this method directly.
     */
    async finalizeTest(browser: any, workerInfo: TestInfo): Promise<void> {
        await this.performanceCache.flush(fileWriter.getFilePath((global as any)._resultsDir, variables.logFileName), browser, workerInfo.status == 'passed');
    }

    /**
     * @deprecated Don't use this method directly.
     */
    async analyzeResults(): Promise<void> {
        const performanceResultsFileName = (global as any)._performanceResultsFileName || "performance-results";
        const dropResultsFromFailedTest = (global as any)._dropResultsFromFailedTest;
        const analyzeByBrowser = (global as any)._analyzeByBrowser;
        const resultsDir = (global as any)._resultsDir

        const analyzer = new PerformanceAnalyzer();

        await analyzer.analyze(fileWriter.getFilePath(resultsDir, this.logFileName), fileWriter.getFilePath(resultsDir, performanceResultsFileName), dropResultsFromFailedTest, analyzeByBrowser);
    }
}
