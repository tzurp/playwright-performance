import { PerformanceLogEntry } from "./entities/performance-log-entry";
import { PerformanceResult } from "./entities/performance-result";
import calculator from "./helpers/calculator";
import { FileWriter } from "./helpers/file-writer";
import helperMethods from "./helpers/group";
import ObjectsToCsv from "objects-to-csv";
import { variables } from "./constants/variables";
import { Options } from "./entities/options";
import Logger from "./helpers/logger";

export class PerformanceAnalyzer {
    _performanceResults: Array<PerformanceResult>;

    constructor() {
        this._performanceResults = new Array<PerformanceResult>();
    }

    private bytesToMB(bytes: number): number {
        return parseFloat((bytes / (1024 * 1024)).toFixed(2));
    }

    private microsecondsToMs(microseconds: number): number {
        return parseFloat((microseconds / 1000).toFixed(2));
    }

    async analyze(options: Options, workerIndex: number): Promise<void> {
        const logger = new Logger(options.suppressConsoleResults as boolean);
        let recentDaysMessage = '';
        const fileWriter = FileWriter.getInstance();
        const resultsDir = (global as any)._playwrightPerformanceResultsDir;
        const logFilePath = fileWriter.getFilePath(resultsDir, variables.logFileName);
        const saveDataFilePath = fileWriter.getFilePath(resultsDir, options.performanceResultsFileName as string);

        let performanceLogEntries = await this.deserializeData(logFilePath);
        let groupedResults: PerformanceLogEntry[][];

        if(options.recentDays) {
            recentDaysMessage = `[Recent days:${options.recentDays}]`;
        }

        if (options.dropResultsFromFailedTest || options.recentDays) {
            const cutoffDate = Date.now() - ((options.recentDays || 0) * 24 * 60 * 60 * 1000);
            const filteredEntries = performanceLogEntries.filter((e) => {
                if (options.recentDays && e.startTime < cutoffDate) {
                    return false;
                }
                if (options.dropResultsFromFailedTest) {
                    return e.isTestPassed;
                }
                
                return true;
            });
            performanceLogEntries = filteredEntries;
        }

        if (!performanceLogEntries || performanceLogEntries.length == 0) {
            return;
        }

        groupedResults = !options.analyzeByBrowser ? helperMethods.groupBy(performanceLogEntries, p => [p.name]) : helperMethods.groupBy(performanceLogEntries, p => [p.name, p.brName]);

        groupedResults.forEach(group => {
            const durationList = group.map(t => t.duration);
            const memoryList = group.map(t => t.memoryDifference);
            const cpuList = group.map(t => t.cpuDifference);
            const performanceResult = new PerformanceResult();

            const avgAndSte = calculator.getAverageAndStandardDeviation(durationList);
            const avgMemory = memoryList.reduce((a, b) => a + b, 0) / memoryList.length;
            const avgCpu = cpuList.reduce((a, b) => a + b, 0) / cpuList.length;

            performanceResult.name = group[0].name;
            performanceResult.brName = options.analyzeByBrowser ? group[0].brName : "general";
            performanceResult.earliestTime = group[0].startDisplayTime;
            performanceResult.latestTime = group[group.length - 1].startDisplayTime;
            performanceResult.avgTime = avgAndSte[0];
            performanceResult.sem = avgAndSte[1];
            performanceResult.repeats = durationList.length;
            performanceResult.minValue = Math.min(...durationList);
            performanceResult.maxValue = Math.max(...durationList);
            performanceResult.avgMemory = this.bytesToMB(avgMemory);
            performanceResult.minMemory = this.bytesToMB(Math.min(...memoryList));
            performanceResult.maxMemory = this.bytesToMB(Math.max(...memoryList));
            performanceResult.avgCpu = this.microsecondsToMs(avgCpu);
            performanceResult.minCpu = this.microsecondsToMs(Math.min(...cpuList));
            performanceResult.maxCpu = this.microsecondsToMs(Math.max(...cpuList));

            this._performanceResults.push(performanceResult);
        });

        const picked = this._performanceResults.map(({ name, brName, avgTime, sem, repeats, minValue, maxValue, avgMemory, minMemory, maxMemory, avgCpu, minCpu, maxCpu }) => ({ name, brName, avgTime, sem, repeats, minValue, maxValue, avgMemory, minMemory, maxMemory, avgCpu, minCpu, maxCpu }));
        
        logger.info(`\nPlaywright-performance results${recentDaysMessage}(worker[${workerIndex}]):\n`, false);

        logger.info(picked, false, true);
        
        await this.serializeData(saveDataFilePath);
        
        logger.info(`\nPlaywright-performance results saved to: ${saveDataFilePath}.csv/json\n`, true);
    }

    private async serializeData(saveDataFilePath: string) {
        const fileWriter = FileWriter.getInstance();

        await fileWriter.writeToFile(saveDataFilePath + ".json", JSON.stringify(this._performanceResults));

        const csv = new ObjectsToCsv(this._performanceResults);

        const csvString = await csv.toString(true);

        await fileWriter.writeToFile(saveDataFilePath + ".csv", csvString);
    }

    private async deserializeData(fileName: string): Promise<Array<PerformanceLogEntry>> {
        const fileWriter = FileWriter.getInstance();
        const resultsArray = new Array<PerformanceLogEntry>();

        const textResultsArray = await fileWriter.readAllLines(fileName);

        textResultsArray.forEach(textResult => {
            if (textResult != "") {
                const performanceResult = JSON.parse(textResult) as PerformanceLogEntry;

                if (performanceResult.id !== undefined) {
                    resultsArray.push(performanceResult);
                }
            }
        });

        return resultsArray;
    }
}
