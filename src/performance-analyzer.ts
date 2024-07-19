import { PerformanceLogEntry } from "./entities/performance-log-entry";
import { PerformanceResult } from "./entities/performance-result";
import calculator from "./helpers/calculator";
import { FileWriter } from "./helpers/file-writer";
import helperMethods from "./helpers/group";
import ObjectsToCsv from 'objects-to-csv';
import { variables } from "./constants/variables";
import { Options } from "./entities/options";
import Logger from "./helpers/logger";

export class PerformanceAnalyzer {
    _performanceResults: Array<PerformanceResult>;

    constructor() {
        this._performanceResults = new Array<PerformanceResult>();
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
            const currentTime = new Date().getTime();

            const entriesWithRecentDays = performanceLogEntries.filter((r) => calculator.daysBetweenDates(currentTime, r.startTime) <= (options.recentDays as number));
            
            performanceLogEntries = entriesWithRecentDays;
        }

        if (options.dropResultsFromFailedTest) {
            const entriesWithTestPass = performanceLogEntries.filter((e) => e.isTestPassed == true);

            performanceLogEntries = entriesWithTestPass;
        }

        if (!performanceLogEntries || performanceLogEntries.length == 0) {
            return;
        }

        groupedResults = !options.analyzeByBrowser ? helperMethods.groupBy(performanceLogEntries, p => [p.name]) : helperMethods.groupBy(performanceLogEntries, p => [p.name, p.brName]);

        groupedResults.forEach(group => {
            const durationList = group.map(t => t.duration);
            const performanceResult = new PerformanceResult();

            const avgAndSte = calculator.getAverageAndStandardDeviation(durationList);

            performanceResult.name = group[0].name;
            performanceResult.brName = options.analyzeByBrowser ? group[0].brName : "general";
            performanceResult.earliestTime = group[0].startDisplayTime;
            performanceResult.latestTime = group[group.length - 1].startDisplayTime;
            performanceResult.avgTime = avgAndSte[0];
            performanceResult.sem = avgAndSte[1];
            performanceResult.repeats = durationList.length;
            performanceResult.minValue = Math.min(...durationList);
            performanceResult.maxValue = Math.max(...durationList);

            this._performanceResults.push(performanceResult);
        });

        const picked = this._performanceResults.map(({ name, brName, avgTime, sem, repeats, minValue, maxValue }) => ({ name, brName, avgTime, sem, repeats, minValue, maxValue }));
        
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