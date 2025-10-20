export class PerformanceResult {
    name: string;
    brName: string;
    avgTime: number;
    sem: number;
    repeats: number;
    minValue: number;
    maxValue: number;
    earliestTime: string;
    latestTime: string;
    avgMemory: number;
    minMemory: number;
    maxMemory: number;
    avgCpu: number;
    minCpu: number;
    maxCpu: number;

    constructor() {
        this.name = "";
        this.brName = "";
        this.avgTime = 0;
        this.sem = 0;
        this.repeats = 0;
        this.minValue = 0;
        this.maxValue = 0;
        this.earliestTime = "";
        this.latestTime = "";
        this.avgMemory = 0;
        this.minMemory = 0;
        this.maxMemory = 0;
        this.avgCpu = 0;
        this.minCpu = 0;
        this.maxCpu = 0;
    }
}
