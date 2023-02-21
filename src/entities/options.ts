export interface Options {
    disableAppendToExistingFile: boolean;
    dropResultsFromFailedTest: boolean;
    analyzeByBrowser: boolean;
    performanceResultsDirectory?: string;
    performanceResultsFileName?: string;
}