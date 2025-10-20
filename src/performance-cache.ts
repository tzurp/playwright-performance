import { PartialLogEntry, StepType } from "./entities/partial-log-entry";
import { PerformanceLogEntry } from "./entities/performance-log-entry";
import { FileWriter } from "./helpers/file-writer";
import { StepSuffix } from "./constants/step-suffix";
import { IdGenerator } from "./helpers/id-generator";

export class PerformanceCache {
    _startLogEntries: Array<PartialLogEntry>;
    _endLogEntries: Array<PartialLogEntry>;
    _performanceEntries: Array<PerformanceLogEntry>;

    constructor() {
        this._startLogEntries = new Array<PartialLogEntry>();
        this._endLogEntries = new Array<PartialLogEntry>();
        this._performanceEntries = new Array<PerformanceLogEntry>();
    }

    public sampleStart(stepName: string, instanceId: string): void {
        const logEntry = this.setSample(StepType.Start, stepName, instanceId);

        this._startLogEntries.unshift(logEntry);
    }

    public sampleEnd(stepName: string, instanceId: string): void {
        const logEntry = this.setSample(StepType.End, stepName, instanceId);

        this._endLogEntries.push(logEntry);
    }

    public getSampleTime(stepName: string): number {
        return this.getPerformanceEntryTime(stepName);
    }

    public async flush(fileName: string, browser: any, isTestPassed: boolean) {
        this.createPerformanceEntries(isTestPassed, browser);

        await this.writePerformanceDataToFile(fileName);
    }

    private setSample(stepType: StepType, stepName: string, instanceId: string): PartialLogEntry {
        let id = "";
        const logEntry = new PartialLogEntry();

        if (stepType as number === StepType.Start as number) {
            id = new IdGenerator().getId();
        }
        else {
            id = this.getStartIdByStepName(stepName, instanceId);
        }

        logEntry.id = id;
        logEntry.instanceId = instanceId;
        logEntry.name = stepName;
        logEntry.type = StepType.Start;
        logEntry.time = new Date().getTime();
        logEntry.displayTime = new Date().toLocaleString();
        logEntry.memoryUsage = this.getMemoryUsage();
        logEntry.cpuUsage = this.getCpuUsage();

        return logEntry;
    }

    private getMemoryUsage(): number {
        try {
            // Access process through globalThis to avoid TypeScript errors
            const proc = (globalThis as any).process;
            if (proc && proc.memoryUsage) {
                const memUsage = proc.memoryUsage();
                // Return heap used in bytes
                return memUsage.heapUsed;
            }
        } catch (e) {
            // If process is not available, return 0
        }
        return 0;
    }

    private getCpuUsage(): number {
        try {
            // Access process through globalThis to avoid TypeScript errors
            const proc = (globalThis as any).process;
            if (proc && proc.cpuUsage) {
                const cpuUsage = proc.cpuUsage();
                // Return total CPU time in microseconds (user + system)
                return cpuUsage.user + cpuUsage.system;
            }
        } catch (e) {
            // If process is not available, return 0
        }
        return 0;
    }

    private getPerformanceEntryTime(stepName: string): number {
        let duration = 0;

        const startEntry = this._startLogEntries.find(e => e.name == stepName + StepSuffix.used);

        if (startEntry) {
            const endEntry = this._endLogEntries.find(e => e.id == startEntry.id);

            if (endEntry) {
                duration = endEntry.time - startEntry.time;
            }
        }

        return duration;
    }

    private createPerformanceEntries(isTestPassed: boolean, browser: string): void {
        const revStartEntries = this._startLogEntries.reverse();

        revStartEntries.forEach(startEntry => {
            const tempPerformanceEntry = new PerformanceLogEntry();

            const correspondedEndEntry = this._endLogEntries.find((e) => e.id == startEntry.id);

            if (correspondedEndEntry) {
                tempPerformanceEntry.id = startEntry.id;
                tempPerformanceEntry.instanceId = startEntry.instanceId;
                tempPerformanceEntry.name = correspondedEndEntry.name;
                tempPerformanceEntry.brName = browser ?? "";
                tempPerformanceEntry.startDisplayTime = startEntry.displayTime;
                tempPerformanceEntry.startTime = startEntry.time;
                tempPerformanceEntry.endTime = correspondedEndEntry.time;
                tempPerformanceEntry.duration = tempPerformanceEntry.getDuration();
                tempPerformanceEntry.isTestPassed = isTestPassed;
                tempPerformanceEntry.startMemoryUsage = startEntry.memoryUsage;
                tempPerformanceEntry.endMemoryUsage = correspondedEndEntry.memoryUsage;
                tempPerformanceEntry.memoryDifference = tempPerformanceEntry.getMemoryDifference();
                tempPerformanceEntry.startCpuUsage = startEntry.cpuUsage;
                tempPerformanceEntry.endCpuUsage = correspondedEndEntry.cpuUsage;
                tempPerformanceEntry.cpuDifference = tempPerformanceEntry.getCpuDifference();

                this._performanceEntries.push(tempPerformanceEntry);
            }
        });
    }

    private getStartIdByStepName(stepName: string, instanceId: string): string {
        let id = "";

        const startEntry = this._startLogEntries.find((e) => e.name == stepName && e.instanceId == instanceId);

        if (startEntry) {
            id = startEntry.id;

            startEntry.name += StepSuffix.used;
        }

        return id;
    }

    private clearData(): void {
        this._startLogEntries = [];

        this._endLogEntries = [];

        this._performanceEntries = [];
    }

    private async writePerformanceDataToFile(fileName: string): Promise<void> {

        for (const performanceEntry of this._performanceEntries) {
            await FileWriter.getInstance().appendLineToFile(fileName, `${JSON.stringify(performanceEntry)}\n`);
        }

        this.clearData();
    }
}
