import path from "path";
import fileWriter from "./helpers/file-writer";
import { IdGenerator } from "./helpers/id-generator";
import { TestInfo } from "@playwright/test";
import { Options } from "./entities/options";
import { PerformanceAnalyzer } from "./performance-analyzer";
import { PerformanceCache } from "./performance-cache";

export class PerformanceMain {
    // TODO: remove all options and replace with envvariable
    private _instanceid: string;
    private _resultsDir = "";
    private logFileName = "performance-log.txt";
    //private _performanceResultsFileName = "performance-results";
    private performanceCache: PerformanceCache;

    constructor();
    constructor(options: Options)
    constructor(options?: Options) {
        this._instanceid = new IdGenerator().getId("inst");

        this.performanceCache = new PerformanceCache();

        
        if (options) {
            // TODO define options as global variables only if options are true
            (global as any)._performanceResultsFileName = options.performanceResultsFileName;
            (global as any)._performanceResultsDirectory = options.performanceResultsDirectory;
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
     * @param disableAppendToExistingFile If true, existing performance data will be overwritten for each test suite.
     */
    async initialize(disableAppendToExistingFile: boolean, performanceResultsDirectory?: string): Promise<void> {
        //this._resultsDir = await this.createResultsDirIfNotExist(performanceResultsDirectory);
        this._resultsDir = await fileWriter.createResultsDirIfNotExist(performanceResultsDirectory);

        (global as any)._resultsDir = this._resultsDir;

        const initObj = JSON.stringify({ "startDisplayTime": new Date().toLocaleString(), "instanceID": this._instanceid });

        const fileName = path.join(this._resultsDir, this.logFileName);

        if (disableAppendToExistingFile) {
            await fileWriter.writeToFile(fileName, `${initObj}\n`);
        }
        else {
            await fileWriter.appendLineToFile(fileName, `${initObj}\n`);
        }
    }

    /**
     * @deprecated Don't use this method directly.
     * @param isTestPassed 
     */
    async finalize(browser: any, workerInfo: TestInfo): Promise<void> {
        await this.performanceCache.flush(fileWriter.getFilePath(this._resultsDir, this.logFileName ), browser, workerInfo.status == 'passed');
    }

    /**
     * @deprecated Don't use this method directly.
     * @param performanceResultsFileName The result output file name w/o extension.
     * @param dropResultsFromFailedTest If true - performance analysis will not includ failed tests.
     * @param analyzeByBrowser If true - performance analysis by browser would be
     */
    async analyzeResults(): Promise<void> {
        // let resultsFileName = this._performanceResultsFileName;

        // if (performanceResultsFileName) {
        //     resultsFileName = performanceResultsFileName;
        // }
        
        // TODO: use env variable as options;
        const performanceResultsFileName = (global as any)._performanceResultsFileName || "performance-results";
        //const performanceResultsDirectory = (global as any)._performanceResultsDirectory || "performance-results";
        //const disableAppendToExistingFile = (global as any)._disableAppendToExistingFile;
        const dropResultsFromFailedTest = (global as any)._dropResultsFromFailedTest;
        const analyzeByBrowser = (global as any)._analyzeByBrowser;
        const resultsDir = (global as any)._resultsDir
        //
        const analyzer = new PerformanceAnalyzer();

        await analyzer.analyze(fileWriter.getFilePath(resultsDir, this.logFileName), fileWriter.getFilePath(resultsDir, performanceResultsFileName), dropResultsFromFailedTest, analyzeByBrowser);
    }
}

// interface initializeParams {
//     performanceResultsFileName?: string; 
//     dropResultsFromFailedTest?: boolean;
//     analyzeByBrowser?: boolean
// }