export class PartialLogEntry {
    name: string;
    id: string;
    type: StepType;
    time: number;
    displayTime: string;
    instanceId: string;
    brName: string;
    memoryUsage: number;
    cpuUsage: number;

    constructor() {
        this.name = "";
        this.id = "";
        this.type = StepType.Start;
        this.time = 0;
        this.displayTime = "";
        this.instanceId = "";
        this.brName = "";
        this.memoryUsage = 0;
        this.cpuUsage = 0;
    }
}

export enum StepType {
    Start,
    End
}
