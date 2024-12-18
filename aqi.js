import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
} from "./sharedState.js";

import { getChartDimensions } from "./main.js";

const csvPath = "./dataset/AQI_merged_utf8_cleaned.csv";

// 更新 AQI 長條圖
export function updateAQIBarGraph(year, width, height) {
  d3.selectAll("#tooltip").remove();

  d3.csv(csvPath)
    .then((data) => {
      // 檢查日期格式並修正
      data.forEach((d) => {
        if (d["日期"] && d["日期"].includes("/")) {
          d["日期"] = d["日期"].replace(/\//g, ""); // 移除 "/"
        }
      });

      // 過濾出選定年份的數據
      const filteredData = data.filter((d) => d["日期"]?.startsWith(year));

      if (filteredData.length === 0) {
        console.error(`無符合條件的資料。年份: ${year}`);
        d3.select("#aqi-bar-chart").selectAll("svg").remove();
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
    // 過濾出有效的 AQI 數值
    const validValues = values.filter((v) => !isNaN(v) && v > 0);
    const sum = validValues.reduce((acc, v) => acc + v, 0); // 加總有效值

    if (!result[county]) {
      result[county] = { sum: 0, count: 0 };
    }

    // 累加縣市的 AQI 值與數量
    result[county].sum += sum;
    result[county].count += validValues.length;
  });

  // 計算最終平均值
  const averageResult = Object.entries(result).map(
    ([county, { sum, count }]) => {
      return [county, count > 0 ? sum / count : 0];
    }
  );

  // 按平均值降序排列
  return averageResult.sort((a, b) => b[1] - a[1]);
}

function drawAQIBarGraph(data, width, height) {
  const padding = { top: 20, left: 30, bottom: 40, right: 20 };
  d3.select("#aqi-bar-chart").selectAll("svg").remove();

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ddd")
    .style("padding", "8px")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("box-shadow", "0 0 6px rgba(0, 0, 0, 0.2)");

  const svg = d3
    .select("#aqi-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(data.map(([county]) => county))
    .range([padding.left, width - padding.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, ([, value]) => value)])
    .nice()
    .range([height - padding.bottom, padding.top]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("dx", "-0.8em")
    .attr("dy", "-0.5em")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${padding.left}, 0)`)
    .call(d3.axisLeft(y));

  data.forEach(([county, value]) => {
    svg
      .append("rect")
      .attr("x", x(county))
      .attr("y", y(value))
      .attr("width", x.bandwidth())
      .attr("height", height - padding.bottom - y(value))
      .attr("fill", county === lastSelectedCounty ? "#F9701C" : "#9C10F6") // 根據選取狀態設置顏色
      .style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).attr("fill", "#DE9CEE");
        tooltip
          .style("display", "block")
          .html(
            `<strong>縣市:</strong> ${county}<br>` +
              `<strong>平均AQI:</strong> ${value.toFixed(2)}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
        d3.select(this).attr("fill", county === lastSelectedCounty ? "#F9701C" : "#9C10F6"); // 恢復狀態顏色
      })
      .on("click", function () {
        setLastSelectedCounty(county); // 更新選取的縣市
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
        console.error(`無符合條件的資料。縣市 : ${lastSelectedCounty}`);
        d3.select("#aqi-line-chart").selectAll("svg").remove();
        return;
      }

      // 分組並計算每年平均 AQI
      const yearlyData = groupAQIDataByYear(filteredData);
      const aqiValue = parseInt(
        document.getElementById("aqi-slider").value,
        10
      );

      if (yearlyData === null) {
        console.error(
          `無符合條件的資料。年份 : ${lastSelectedYear + aqiValue}`
        );
        d3.select("#aqi-line-chart").selectAll("svg").remove();
        return;
      }

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
  let yearMin = 10000;

  data.forEach((d) => {
    const year = d["日期"].substring(0, 4); // 提取年份
    if (parseInt(year) < yearMin) {
      yearMin = parseInt(year);
    }
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
  const aqiValue = parseInt(document.getElementById("aqi-slider").value, 10);

  if (lastSelectedYear + aqiValue < yearMin) {
    return null;
  }

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

  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10); // 每年顯示一次
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
    .attr("stroke", "black")
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
    .attr("fill", "#08B211")
    .append("title")
    .text((d) => `年份: ${d.year}\n平均 AQI: ${d.avg.toFixed(2)}`);

  // 可拖曳的垂直線
  const aqiValue = parseInt(document.getElementById("aqi-slider").value, 10);
  let currentX = x(lastSelectedYear + aqiValue); // 初始直線位置
  const dragLine = svg
    .append("line")
    .attr("x1", currentX)
    .attr("x2", currentX)
    .attr("y1", padding)
    .attr("y2", height - padding)
    .attr("stroke", "red")
    .attr("stroke-width", 3.5) // 寬度加大，便於拖曳
    .style("cursor", "ew-resize");

  const yearLabel = svg
    .append("text")
    .attr("x", currentX - 28)
    .attr("y", padding - 8)
    .attr("fill", "red")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(`Year: ${lastSelectedYear + aqiValue}`);

  // 定義拖曳行為
  var nearestYear = null;
  const drag = d3
    .drag()
    .on("drag", (event) => {
      // 限制拖曳範圍並計算最接近的年份
      const mouseX = Math.max(padding, Math.min(width - padding, event.x));
      nearestYear = Math.round(x.invert(mouseX)); // 轉換座標並取最接近的年份
      currentX = x(nearestYear); // 將年份映射回 X 軸的座標

      // 更新直線和標籤
      dragLine.attr("x1", currentX).attr("x2", currentX);
      yearLabel.attr("x", currentX - 28).text(`Year: ${nearestYear}`);
    })
    .on("end", () => {
      // 更新 lastSelectedYear
      setLastSelectedYear(nearestYear - aqiValue);
    });

  dragLine.call(drag);

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
