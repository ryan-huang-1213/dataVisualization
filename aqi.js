import { 
    lastSelectedYear, 
    lastSelectedCounty, 
    setLastSelectedYear, 
    setLastSelectedCounty 
} from "./sharedState.js";

const csvPath = "./dataset/aqi_merged_utf8_processed.csv";

// 更新 AQI 長條圖
export function updateAQIBarGraph(year, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      // 過濾出選定年份的數據
      const filteredData = data.filter(
        (d) => d["日期"].startsWith(year) && !isNaN(d["01"]) // 只取數字
      );

      if (filteredData.length === 0) {
        console.error("無符合條件的資料。");
        return;
      }

      const groupedData = aggregateAQIData(filteredData);
      drawAQIBarGraph(groupedData, width, height);

      displayCurrentSelection();
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}

function aggregateAQIData(data) {
  const result = {};

  data.forEach((d) => {
    const county = d["county"]?.toString().trim();
    const values = [
      ...Array.from({ length: 24 }, (_, i) => parseFloat(d[(i + 1).toString().padStart(2, "0")] || "0"))
    ];
    const maxAQI = Math.max(...values);

    if (!result[county]) {
      result[county] = 0;
    }

    result[county] = Math.max(result[county], maxAQI);
  });

  return Object.entries(result).sort((a, b) => b[1] - a[1]);
}

function drawAQIBarGraph(data, width, height) {
  const padding = 40;
  d3.select("#aqi-bar-chart").selectAll("svg").remove();

  const svg = d3
    .select("#aqi-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(data.map(([county]) => county))
    .range([padding, width - padding])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, ([, value]) => value)])
    .nice()
    .range([height - padding, padding]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dx", "-0.8em")
    .attr("dy", "-0.5em")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${padding}, 0)`)
    .call(d3.axisLeft(y));

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("display", "none");

  data.forEach(([county, value]) => {
    svg
      .append("rect")
      .attr("x", x(county))
      .attr("y", y(value))
      .attr("width", x.bandwidth())
      .attr("height", height - padding - y(value))
      .attr("fill", "steelblue")
      .attr("data-county", county)
      .on("mouseover", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .style("display", "block")
          .html(`<strong>縣市: ${county}</strong><br>AQI: ${value.toFixed(2)}`);
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .on("click", () => {
        setLastSelectedCounty(county); // 使用 setter
        updateAQIBarGraph(lastSelectedYear, width, height);
        updateAQILineGraph(lastSelectedCounty, width, height);
      });
  });
}

function displayCurrentSelection() {
  const selectionDiv = d3.select("#current-selection");
  if (selectionDiv.empty()) {
    d3.select("body")
      .append("div")
      .attr("id", "current-selection")
      .style("position", "absolute")
      .style("top", "10px")
      .style("right", "10px")
      .style("background-color", "#f0f0f0")
      .style("padding", "10px")
      .style("border", "1px solid #ccc");
  }
  d3.select("#current-selection").html(
    `目前選擇: 縣市 - ${lastSelectedCounty}，年份 - ${lastSelectedYear}`
  );
}

// 更新 AQI 折線圖
export function updateAQILineGraph(county, width, height) {
    d3.csv(csvPath)
        .then((data) => {
            // 過濾出符合年份和縣市的數據
            const filteredData = data.filter((d) => {
                const date = new Date(d["日期"]);
                return (
                    d["county"] &&
                    (!county || d["county"] === county) &&
                    date.getFullYear() === parseInt(lastSelectedYear)
                );
            });

            if (filteredData.length === 0) {
                console.error("無符合條件的資料。");
                return;
            }

            const groupedData = groupAQIDataByStationOrCounty(filteredData, county);
            drawAQILineGraph(groupedData, width, height, county);
        })
        .catch((error) => {
            console.error("載入 CSV 檔案失敗：", error);
        });
}

function groupAQIDataByStationOrCounty(data, county) {
    const result = {};

    data.forEach((d) => {
        const key = county ? d["測站"] : d["county"];
        const date = new Date(d["日期"]);
        const month = date.getMonth(); // 0-11 表示 1-12 月
        const values = Array.from({ length: 24 }, (_, i) => parseFloat(d[(i + 1).toString().padStart(2, "0")]) || 0);
        const dailyAvg = values.reduce((sum, value) => sum + value, 0) / values.length;

        if (!result[key]) {
            result[key] = Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
        }

        result[key][month].sum += dailyAvg;
        result[key][month].count++;
    });

    return Object.entries(result).map(([key, monthlyData]) => ({
        key,
        values: monthlyData.map(({ sum, count }, month) => ({
            month,
            avg: count > 0 ? sum / count : 0,
        })),
    }));
}

function drawAQILineGraph(data, width, height, county) {
    const padding = 50;
    const colors = d3.schemeCategory10;

    d3.select("#aqi-line-chart").selectAll("svg").remove();

    const svg = d3
        .select("#aqi-line-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3
        .scaleLinear()
        .domain([0, 11]) // 0 表示 1 月，11 表示 12 月
        .range([padding, width - padding]);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data.flatMap((d) => d.values.map((v) => v.avg)))])
        .nice()
        .range([height - padding, padding]);

    const xAxis = d3.axisBottom(x).tickFormat((d) => `${d + 1}月`);
    const yAxis = d3.axisLeft(y);

    svg
        .append("g")
        .attr("transform", `translate(0, ${height - padding})`)
        .call(xAxis);

    svg
        .append("g")
        .attr("transform", `translate(${padding}, 0)`)
        .call(yAxis);

    const line = d3
        .line()
        .x((d) => x(d.month))
        .y((d) => y(d.avg))
        .curve(d3.curveMonotoneX);

    data.forEach((dataset, index) => {
        svg
            .append("path")
            .datum(dataset.values)
            .attr("fill", "none")
            .attr("stroke", colors[index % colors.length])
            .attr("stroke-width", 2)
            .attr("d", line);

        svg
            .append("text")
            .attr("x", width - padding)
            .attr("y", y(dataset.values[11]?.avg || 0))
            .attr("fill", colors[index % colors.length])
            .text(dataset.key);
    });
}