// cancer.js
import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
} from "./sharedState.js";

import { updateAQIBarGraph, updateAQILineGraph } from "./aqi.js";
import { getChartDimensions } from "./main.js";

const csvPath = "./dataset/癌症發生統計_utf8.csv";

// 更新癌症長條圖
export function updateCancerBarGraph(year, width, height) {
  // 清除所有 tooltip
  d3.selectAll("#tooltip").remove();

  d3.csv(csvPath)
    .then((data) => {
      const filteredData = data.filter(
        (d) =>
          d["癌症診斷年"]?.toString().trim() == year &&
          d["癌症別"]?.toString().trim()?.includes("肺、支氣管及氣管")
      );

      if (filteredData.length === 0) {
        console.error("無符合條件的資料。");
        return;
      }

      const groupedData = aggregateCancerData(filteredData);
      drawCancerBarGraph(groupedData, width, height);

      displayCurrentSelection();
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}

function aggregateCancerData(data) {
  const result = {};

  data.forEach((d) => {
    const county = d["縣市別"]?.toString().trim();
    const incidence = parseFloat(
      d["年齡標準化發生率  WHO 2000世界標準人口 (每10萬人口)"].replace(
        /[^0-9.]/g,
        ""
      ) || "0"
    );
    const gender = d["性別"]?.toString().trim();

    if (!result[county]) {
      result[county] = { total: 0, male: 0, female: 0 };
    }

    if (gender === "男") result[county].male += incidence;
    else if (gender === "女") result[county].female += incidence;
    else result[county].total += incidence;
  });

  return Object.entries(result).sort((a, b) => b[1].total - a[1].total);
}

function drawCancerBarGraph(data, width, height) {
  const padding = 40;
  d3.select("#cancer-bar-chart").selectAll("svg").remove();

  // Tooltip 定義
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

  // 將全國移到最左邊，其他縣市依照數據排序
  const sortedData = [
    ...data.filter(([county]) => county === "全國"),
    ...data
      .filter(([county]) => county !== "全國")
      .sort((a, b) => b[1].total - a[1].total),
  ];

  const svg = d3
    .select("#cancer-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(sortedData.map(([county]) => county))
    .range([padding, width - padding])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(sortedData, ([, values]) =>
        Math.max(values.total, values.male, values.female)
      ),
    ])
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

  sortedData.forEach(([county, { total, male, female }]) => {
    const barWidth = x.bandwidth() / 3;

    // 繪製紅色邊框
    svg
      .append("rect")
      .attr("x", x(county))
      .attr("y", y(Math.max(total, male, female)))
      .attr("width", x.bandwidth())
      .attr("height", height - padding - y(Math.max(total, male, female)))
      .attr("fill", "none")
      .attr("stroke", county === lastSelectedCounty ? "red" : "none")
      .attr("stroke-width", 3);

    [
      { value: total, color: "gray", label: "全" },
      { value: male, color: "blue", label: "男" },
      { value: female, color: "red", label: "女" },
    ].forEach(({ value, color, label }, i) => {
      svg
        .append("rect")
        .attr("x", x(county) + barWidth * i)
        .attr("y", y(value))
        .attr("width", barWidth)
        .attr("height", height - padding - y(value))
        .attr("fill", color)
        .attr("data-county", county)
        .on("mouseover", (event) => {
          tooltip
            .style("display", "block")
            .html(
              `<strong>縣市:</strong> ${county}<br>` +
                `<strong>類別:</strong> ${label}<br>` +
                `<strong>發生率:</strong> ${value.toFixed(2)}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        .on("click", () => {
          // 隱藏 tooltip 並重新繪製圖表
          tooltip.style("display", "none");
          setLastSelectedCounty(county);
          updateCancerBarGraph(lastSelectedYear, width, height);
          const cancerlinechartsize = getChartDimensions("#cancer-line-chart");
          updateCancerLineGraph(
            lastSelectedCounty,
            cancerlinechartsize.width,
            cancerlinechartsize.height
          );
          const aqibargraph = getChartDimensions("#aqi-bar-chart");
          updateAQIBarGraph(
            lastSelectedYear,
            aqibargraph.width,
            aqibargraph.height
          );
        });
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

// 更新癌症折線圖
export function updateCancerLineGraph(county, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      // 過濾符合條件的資料
      const filteredData = data.filter(
        (d) =>
          d["癌症別"]?.toString().trim()?.includes("肺、支氣管及氣管") &&
          d["縣市別"]?.toString().trim() === county
      );

      if (filteredData.length === 0) {
        console.error("無符合條件的資料。");
        return;
      }

      // 分組資料，依性別與總體數據整理
      const groupedData = { total: [], male: [], female: [] };
      filteredData.forEach((d) => {
        const year = parseInt(d["癌症診斷年"]);
        const incidence = parseFloat(
          d["年齡標準化發生率  WHO 2000世界標準人口 (每10萬人口)"].replace(
            /[^0-9.]/g,
            ""
          ) || "0"
        );
        const gender = d["性別"]?.toString().trim();

        if (gender === "男") groupedData.male.push({ year, incidence });
        else if (gender === "女") groupedData.female.push({ year, incidence });
        else groupedData.total.push({ year, incidence });
      });

      // 呼叫繪製函數
      drawCancerLineGraph(groupedData, width, height, county);
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}

function drawCancerLineGraph(groupedData, width, height, county) {
  const padding = 50;

  // 清除之前的圖表
  d3.select("#cancer-line-chart").selectAll("svg").remove();

  const svg = d3
    .select("#cancer-line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // 定義比例尺
  const x = d3
    .scaleLinear()
    .domain([
      d3.min(groupedData.total, (d) => d.year),
      d3.max(groupedData.total, (d) => d.year),
    ])
    .range([padding, width - padding]);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        [...groupedData.total, ...groupedData.male, ...groupedData.female],
        (d) => d.incidence
      ),
    ])
    .nice()
    .range([height - padding, padding]);

  // 繪製 X 軸和 Y 軸
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg
    .append("g")
    .attr("transform", `translate(${padding}, 0)`)
    .call(d3.axisLeft(y));

  // 定義折線
  const lineGenerator = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.incidence))
    .curve(d3.curveMonotoneX);

  const colors = { total: "black", male: "blue", female: "red" };

  // 繪製折線和數據點
  ["total", "male", "female"].forEach((key) => {
    const data = groupedData[key];

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors[key])
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);

    svg
      .selectAll(`.${key}-dots`)
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y(d.incidence))
      .attr("r", 4)
      .attr("fill", colors[key])
      .append("title")
      .text((d) => `年份: ${d.year}\n發生率: ${d.incidence.toFixed(2)}`);
  });

  // 可拖曳的垂直線
  let currentX = x(lastSelectedYear); // 初始直線位置
  const dragLine = svg
    .append("line")
    .attr("x1", currentX)
    .attr("x2", currentX)
    .attr("y1", padding)
    .attr("y2", height - padding)
    .attr("stroke", "orange")
    .attr("stroke-width", 4) // 寬度加大，便於拖曳
    .attr("stroke-dasharray", "4,4")
    .style("cursor", "ew-resize");

  const yearLabel = svg
    .append("text")
    .attr("x", currentX + 5)
    .attr("y", padding - 10)
    .attr("fill", "orange")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(`Year: ${lastSelectedYear}`);

  // 定義拖曳行為
  const drag = d3
    .drag()
    .on("drag", (event) => {
      // 限制拖曳範圍並計算最接近的年份
      const mouseX = Math.max(padding, Math.min(width - padding, event.x));
      const nearestYear = Math.round(x.invert(mouseX)); // 轉換座標並取最接近的年份
      currentX = x(nearestYear); // 將年份映射回 X 軸的座標

      // 更新直線和標籤
      dragLine.attr("x1", currentX).attr("x2", currentX);
      yearLabel.attr("x", currentX + 5).text(`Year: ${nearestYear}`);

      // 更新 lastSelectedYear
      setLastSelectedYear(nearestYear);
    })
    .on("end", () => {
      // 拖曳結束時，更新其他圖表
      updateCancerLineGraph(county, width, height);
      const cancerBarChartSize = getChartDimensions("#cancer-bar-chart");
      updateCancerBarGraph(
        lastSelectedYear,
        cancerBarChartSize.width,
        cancerBarChartSize.height
      );
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
    .text(`縣市: ${county} - 各年份癌症發生率折線圖`);
}
