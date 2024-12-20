// cancer.js
import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
} from "./sharedState.js";

const csvPath = "./dataset/癌症發生統計_utf8.csv";

// 更新癌症長條圖
export function updateCancerBarGraph(year, width, height) {
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
    const maxBarHeight = Math.min(y(total), y(male), y(female));

    svg
      .append("rect")
      .attr("x", x(county))
      .attr("y", maxBarHeight)
      .attr("width", x.bandwidth())
      .attr("height", height - padding - maxBarHeight)
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
        .on("click", () => {
          setLastSelectedCounty(county); // 使用 setter
          updateCancerBarGraph(lastSelectedYear, width, height);
          updateCancerLineGraph(lastSelectedCounty, width, height);
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

  // 定義 Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ddd")
    .style("padding", "5px")
    .style("display", "none")
    .style("pointer-events", "none");

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
      .on("mouseover", (event, d) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .style("display", "block")
          .html(
            `<strong>年份: ${d.year}</strong><br>發生率: ${d.incidence.toFixed(
              2
            )}`
          );
      })
      .on("mouseout", () => tooltip.style("display", "none"));
  });

  // 添加可拖曳垂直線
  const dragLine = svg
    .append("line")
    .attr("x1", x(groupedData.total[0].year))
    .attr("x2", x(groupedData.total[0].year))
    .attr("y1", padding)
    .attr("y2", height - padding)
    .attr("stroke", "gray")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");

  // 拖曳行為
  const dragBehavior = d3
    .drag()
    .on("drag", function (event) {
      const mouseX = Math.max(padding, Math.min(width - padding, event.x));
      const selectedYear = Math.round(x.invert(mouseX));

      // 移動垂直線
      dragLine.attr("x1", mouseX).attr("x2", mouseX);

      // 更新 Tooltip
      tooltip
        .style("left", `${event.sourceEvent.pageX + 10}px`)
        .style("top", `${event.sourceEvent.pageY - 10}px`)
        .style("display", "block")
        .html(`<strong>選擇年份: ${selectedYear}</strong>`);
    })
    .on("end", function (event) {
      const selectedYear = Math.round(x.invert(event.x));
      tooltip.style("display", "none");
      setLastSelectedYear(selectedYear);
      updateCancerBarGraph(selectedYear, width, height);
    });

  svg.call(dragBehavior);

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
