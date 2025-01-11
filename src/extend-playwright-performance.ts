import { PerformanceOptions, playwrightPerformance } from './performance-fixture';

function extendPlaywrightPerformance(customOptions: Partial<PerformanceOptions> = {}): any {
    return {
        performance: playwrightPerformance.performance,
        performanceOptions: [customOptions, { scope: 'worker' }],
        worker: [playwrightPerformance.worker, { scope: 'worker', auto: true }]
    }
}
export default extendPlaywrightPerformance;





