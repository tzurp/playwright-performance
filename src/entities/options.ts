export interface Options {
    disableAppendToExistingFile?: boolean;
    dropResultsFromFailedTest?: boolean;
    analyzeByBrowser?: boolean;
    performanceResultsDirectoryName?: string;
    performanceResultsFileName?: string;
    suppressConsoleResults?: boolean;
    recentDays?: number;
}

const defaultOptions: Options = {
    disableAppendToExistingFile: false,
    dropResultsFromFailedTest: false,
    analyzeByBrowser: false,
    performanceResultsDirectoryName: "performance-results",
    performanceResultsFileName: "performance-results",
    suppressConsoleResults: false,
    recentDays: 0
};

let currentOptions: Options = { ...defaultOptions };

export function setOptions(options: Partial<Options>): void {
    currentOptions = { ...currentOptions, ...options };
}

export function getOptions(): Options {
    return currentOptions;
}

export function resetOptions(): void {
    currentOptions = { ...defaultOptions };
}

export const performanceResultsDirectoryPath = "";
