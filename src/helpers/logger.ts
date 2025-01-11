export default class Logger {
    private _suppressConsoleResults: boolean;

    constructor(suppressConsoleResults: boolean) {
        this._suppressConsoleResults = suppressConsoleResults;
    }

    info(message: string | object, isMandatory: boolean, isTable = false) {
        if (!this._suppressConsoleResults || isMandatory) {
            if (!isTable)
                console.log(message);
            else
                console.table(message);
        }
    }

    error(message: string | object, isMandatory: boolean) {
        if (!this._suppressConsoleResults || isMandatory) {
            console.error(`Playwright-Performance error: ${message}`);
        }
    }
}