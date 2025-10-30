import { FileWriter } from "../helpers/file-writer";

interface PerfResult {
  name: string;
  brName: string;       // "chromium" | "firefox" | "webkit"
  avgTime: number;
  sem: number;
  repeats: number;
  minValue: number;
  maxValue: number;
  earliestTime: string;
  latestTime: string;
}

export async function generatePerformanceChart(
  jsonPath: string,
  resultHtmlPath: string
): Promise<void> {
  const fileWriter = FileWriter.getInstance();
  const raw = await fileWriter.readFile(jsonPath);
  let results: PerfResult[] = JSON.parse(raw);

  // Sort results by avgTime descending
  results = results.sort((a, b) => b.avgTime - a.avgTime);

  const labels = results.map((r) => r.name);
  const avgTimes = results.map((r) => r.avgTime);

  const sems = results.map((r) => r.sem);
  const repeats = results.map((r) => r.repeats);
  const browsers = results.map((r) => r.brName);
  const minValues = results.map((r) => r.minValue);
  const maxValues = results.map((r) => r.maxValue);

  const now = new Date();
  const timestamp = now.toLocaleString();

  const browserColors: Record<string, string> = {
    chromium: "rgba(66, 133, 244, 0.6)", // blue
    firefox: "rgba(255, 99, 71, 0.6)",   // orange/red
    webkit: "rgba(76, 175, 80, 0.6)",    // green
    Default: "rgba(152, 251, 152, 0.6)"  // mint green fallback
  };

  const backgroundColors = results.map(
    (r) => browserColors[r.brName] || browserColors.Default
  );
  const borderColors = backgroundColors.map((c) => c.replace("0.6", "1"));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Performance Results - ${timestamp}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
</head>
<body>
  <h2>Playwright-performance Results - ${timestamp}</h2>
  <canvas id="myChart" width="800" height="400"></canvas>
  <script>
    const ctx = document.getElementById('myChart').getContext('2d');
    const sems = ${JSON.stringify(sems)};
    const repeats = ${JSON.stringify(repeats)};
    const browsers = ${JSON.stringify(browsers)};
    const minValues = ${JSON.stringify(minValues)};
    const maxValues = ${JSON.stringify(maxValues)};
    const backgroundColors = ${JSON.stringify(backgroundColors)};
    const borderColors = ${JSON.stringify(borderColors)};

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: 'Average Time (ms)',
          data: ${JSON.stringify(avgTimes)},
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          clip: false
        }]
      },
      options: {
        responsive: true,
        layout: { padding: { top: 80 } },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { size: 10 },
            formatter: function(value, context) {
              const i = context.dataIndex;
              return [
                value + " ms",
                "±" + sems[i] + " ms",
                "Repeats: " + repeats[i],
                "Browser: " + browsers[i],
                "Min: " + minValues[i],
                "Max: " + maxValues[i]
              ].join("\\n");
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                const avg = context.dataset.data[context.dataIndex];
                return "Avg: " + avg + " ms";
              },
              afterLabel: function(context) {
                const i = context.dataIndex;
                return [
                  "±" + sems[i] + " ms (SEM)",
                  "Repeats: " + repeats[i],
                  "Browser: " + browsers[i],
                  "Min: " + minValues[i] + " ms",
                  "Max: " + maxValues[i] + " ms"
                ];
              }
            }
          }
        },
        scales: { y: { beginAtZero: true } }
      },
      plugins: [ChartDataLabels]
    });
  </script>
</body>
</html>
`;

  await fileWriter.writeToFile(resultHtmlPath, html);
}