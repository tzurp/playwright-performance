import { PerformanceLogEntry } from "./entities/performance-log-entry";
import { PerformanceResult } from "./entities/performance-result";
import calculator from "./helpers/calculator";
import { FileWriter } from "./helpers/file-writer";
import helperMethods from "./helpers/group";
import ObjectsToCsv from 'objects-to-csv';
import { variables } from "./constants/variables";
import { Options } from "./entities/options";

export class PerformanceAnalyzer {
    _performanceResults: Array<PerformanceResult>;

    constructor() {
        this._performanceResults = new Array<PerformanceResult>();
    }

    async analyze(options: Options, workerIndex: number): Promise<void> {
        const fileWriter = FileWriter.getInstance();
        const resultsDir = (global as any)._playwrightPerformanceResultsDir;
        const logFilePath = fileWriter.getFilePath(resultsDir, variables.logFileName);
        const saveDataFilePath = fileWriter.getFilePath(resultsDir, options.performanceResultsFileName as string);

        let performanceLogEntries = await this.deserializeData(logFilePath);
        let groupedResults: PerformanceLogEntry[][];

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

        console.log(`\nPlaywright-performance results(worker[${workerIndex}]):\n`);

        console.table(picked);

        await this.serializeData(saveDataFilePath);

        console.log(`\nPlaywright-performance results saved to: ${saveDataFilePath}.csv/json\n`);
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