import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
} from "./sharedState.js";

const csvPath = "./dataset/aqi_merged_utf8_cleaned.csv";

// 更新 AQI 長條圖
export function updateAQIBarGraph(year, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      // 檢查日期格式並修正
      data.forEach((d) => {
        if (d["日期"] && d["日期"].includes("/")) {
          d["日期"] = d["日期"].replace(/\//g, ""); // 移除 "/"
        }
      });

      // 過濾出選定年份的數據
      const filteredData = data.filter(
        (d) => d["日期"]?.startsWith(year) && !isNaN(parseFloat(d["01"])) // 確保數值有效
      );

      if (filteredData.length === 0) {
        console.error(`無符合條件的資料。年份: ${year}`);
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
      ...Array.from({ length: 24 }, (_, i) =>
        parseFloat(d[(i + 1).toString().padStart(2, "0")] || "0")
      ),
    ];
    const maxAQI = Math.max(...values.filter((v) => !isNaN(v)));

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
      // 過濾出指定縣市的數據，並提取年份
      const filteredData = data.filter((d) => {
        return d["county"] && d["county"] === county;
      });

      if (filteredData.length === 0) {
        console.error("無符合條件的資料。");
        return;
      }

      // 分組並計算每年平均 AQI
      const yearlyData = groupAQIDataByYear(filteredData);

      // 排序年份
      const sortedData = Object.entries(yearlyData)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([year, avg]) => ({ year: parseInt(year), avg }));

      // 繪製折線圖
      drawAQILineGraphByYear(sortedData, width, height, county);
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}

// 分組並計算每年平均 AQI
function groupAQIDataByYear(data) {
  const result = {};

  data.forEach((d) => {
    const year = d["日期"].substring(0, 4); // 提取年份
    const values = Array.from(
      { length: 24 },
      (_, i) => parseFloat(d[(i + 1).toString().padStart(2, "0")]) || 0
    );
    const dailyAvg = values.reduce((sum, v) => sum + v, 0) / values.length;

    if (!result[year]) {
      result[year] = { sum: 0, count: 0 };
    }

    result[year].sum += dailyAvg;
    result[year].count++;
  });

  // 計算每年的平均值
  Object.keys(result).forEach((year) => {
    result[year] = result[year].sum / result[year].count;
  });

  return result;
}

// 繪製折線圖 (以年份為 X 軸)
function drawAQILineGraphByYear(data, width, height, county) {
  const padding = 50;

  d3.select("#aqi-line-chart").selectAll("svg").remove();

  const svg = d3
    .select("#aqi-line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year)) // X 軸範圍: 最小年到最大年
    .range([padding, width - padding]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.avg)]) // Y 軸範圍: 最大 AQI 平均值
    .nice()
    .range([height - padding, padding]);

  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d")).ticks(data.length); // 每年顯示一次
  const yAxis = d3.axisLeft(y);

  // 添加 X 軸
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding})`)
    .call(xAxis);

  // 添加 Y 軸
  svg.append("g").attr("transform", `translate(${padding}, 0)`).call(yAxis);

  // 定義折線
  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.avg))
    .curve(d3.curveMonotoneX);

  // 繪製折線
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // 添加數據點
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.year))
    .attr("cy", (d) => y(d.avg))
    .attr("r", 4)
    .attr("fill", "red")
    .append("title")
    .text((d) => `年份: ${d.year}\n平均 AQI: ${d.avg.toFixed(2)}`);

  // 添加標題
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", padding / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`縣市: ${county} - 各年份平均 AQI`);
}
