export class PerformanceLogEntry {
    name: string;
    id: string;
    instanceId: string;
    startTime: number;
    endTime: number;
    startDisplayTime: string;

    duration: number;
    isTestPassed: boolean;
    brName: string;

    startMemoryUsage: number;
    endMemoryUsage: number;
    memoryDifference: number;

    startCpuUsage: number;
    endCpuUsage: number;
    cpuDifference: number;

    constructor() {
        this.name = "";
        this.brName = "";
        this.id = "";
        this.instanceId = "";
        this.startTime = 0;
        this.endTime = 0;
        this.startDisplayTime = "";
        this.duration = 0;
        this.isTestPassed = true;
        this.startMemoryUsage = 0;
        this.endMemoryUsage = 0;
        this.memoryDifference = 0;
        this.startCpuUsage = 0;
        this.endCpuUsage = 0;
        this.cpuDifference = 0;
    }

    getDuration(): number {
        return this.endTime - this.startTime;
    }

    getMemoryDifference(): number {
        return this.endMemoryUsage - this.startMemoryUsage;
    }

    getCpuDifference(): number {
        return this.endCpuUsage - this.startCpuUsage;
    }
}
