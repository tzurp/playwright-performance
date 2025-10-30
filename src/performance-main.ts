import path from "path";
import { FileWriter } from "./helpers/file-writer";
import { IdGenerator } from "./helpers/id-generator";
import { TestInfo } from "@playwright/test";
import { getOptions, Options, setOptions } from "./entities/options";
import { PerformanceAnalyzer } from "./performance-analyzer";
import { PerformanceCache } from "./performance-cache";
import { variables } from "./constants/variables";

export class PerformanceMain {
    private _options: Options;
    private _instanceid: string;
    private logFileName = variables.logFileName;
    private performanceCache: PerformanceCache;

    constructor();
    constructor(options: Options)
    constructor(options?: Options) {
        this._instanceid = new IdGenerator().getId("inst");

        this.performanceCache = new PerformanceCache();

        if (options) {
            setOptions(options);
            this._options = getOptions();
        }
        else {
            this._options = getOptions();
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
        let resultsDir = "";
        const fileWriter = FileWriter.getInstance();

        if (!(global as any)._playwrightPerformanceResultsDir) {
            resultsDir = await fileWriter.createResultsDirIfNotExist(this._options.performanceResultsDirectoryName);

            (global as any)._playwrightPerformanceResultsDir = resultsDir;
        }
        else {
            resultsDir = (global as any)._playwrightPerformanceResultsDir;
        }

        const initObj = JSON.stringify({ "startDisplayTime": new Date().toLocaleString(), "instanceID": this._instanceid });

        const fileName = path.join(resultsDir, this.logFileName);

        if (this._options.disableAppendToExistingFile) {
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
        await this.performanceCache.flush(FileWriter.getInstance().getFilePath((global as any)._playwrightPerformanceResultsDir, variables.logFileName), browser, workerInfo.status == 'passed');
    }

    /**
     * @deprecated Don't use this method directly.
     */
    async analyzeResults(workerIndex: number): Promise<void> {
        const analyzer = new PerformanceAnalyzer();

        await analyzer.analyze(this._options, workerIndex);
    }
}
