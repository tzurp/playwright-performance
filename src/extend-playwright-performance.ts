import { PerformanceOptions, playwrightPerformance } from './performance-fixture';

function extendPlaywrightPerformance(customOptions: PerformanceOptions = {}): any {
    return {
        performance: playwrightPerformance.performance,
        performanceOptions: [customOptions, { scope: 'worker' }],
        worker: [playwrightPerformance.worker, { scope: 'worker', auto: true }]
    }
}
export default extendPlaywrightPerformance;





