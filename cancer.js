// cancer.js

const csvPath = "./dataset/癌症發生統計_utf8.csv"; // 指定檔案路徑
let selectedCounty = null; // 儲存被點擊選中的縣市

// Function to load and update the cancer bar graph based on year, width, and height
export function updateCancerBarGraph(year, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      // console.log("Raw Data:", data); // 查看原始資料

      // 確認欄位名稱
      // console.log("Keys in Data:", Object.keys(data[0]));

      // Filter for lung, bronchus, and trachea cancer data
      const filteredData = data.filter(
        (d) =>
          d["癌症診斷年"]?.toString().trim() == year &&
          d["癌症別"]?.toString().trim()?.includes("肺、支氣管及氣管")
      );

      // console.log("Filtered Data:", filteredData);

      if (filteredData.length === 0) {
        console.error("No data found for the specified year and cancer type.");
        return;
      }

      const groupedData = aggregateCancerData(filteredData);
      // console.log("Grouped Data:", groupedData);
      drawCancerBarGraph(groupedData, width, height);
    })
    .catch((error) => {
      console.error("Error loading CSV file:", error);
    });
}

// Function to aggregate cancer data by county
function aggregateCancerData(data) {
  const result = {};

  data.forEach((d) => {
    const county = d["縣市別"]?.toString().trim();
    const incidenceRaw = d[
      "年齡標準化發生率  WHO 2000世界標準人口 (每10萬人口)"
    ]
      .toString()
      .trim();
    const incidence = parseFloat(incidenceRaw.replace(/[^0-9.]/g, "") || "0");
    const gender = d["性別"]?.toString().trim();

    if (isNaN(incidence)) {
      console.warn(`Invalid incidence value for county ${county}:`, incidence);
      return;
    }

    if (!result[county]) {
      result[county] = { total: 0, male: 0, female: 0 };
    }

    result[county].total += incidence;
    if (gender === "男") result[county].male += incidence;
    if (gender === "女") result[county].female += incidence;
  });

  // 排序：全國固定最左，其他依照 total 遞減排序
  const sortedResult = Object.entries(result).sort(
    ([countyA, valuesA], [countyB, valuesB]) => {
      if (countyA === "全國") return -1; // 全國固定最左
      if (countyB === "全國") return 1;
      return valuesB.total - valuesA.total; // 依 total 遞減排列
    }
  );

  return sortedResult;
}

// Function to draw the cancer bar graph
function drawCancerBarGraph(data, width, height) {
  const padding = 40;
  d3.select("#cancer-bar-chart").selectAll("svg").remove();

  const svg = d3
    .select("#cancer-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const counties = data.map(([county]) => county);

  const x = d3
    .scaleBand()
    .domain(counties)
    .range([padding, width - padding])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, ([, values]) => values.total)])
    .nice()
    .range([height - padding, padding]);

  const xAxis = d3
    .axisBottom(x)
    .tickFormat((d) => d)
    .tickSizeOuter(0)
    .tickPadding(10);

  const yAxis = d3.axisLeft(y).ticks(10).tickFormat(d3.format("~s"));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("dy", "-1.3em")
    .attr("dx", "-0.5em");

  svg.append("g").attr("transform", `translate(${padding}, 0)`).call(yAxis);

  data.forEach(([county, { total, male, female }]) => {
    const barWidth = x.bandwidth() / 3;

    if (!isNaN(total)) {
      svg
        .append("rect")
        .attr("class", "bar-total")
        .attr("x", x(county))
        .attr("y", y(total))
        .attr("width", barWidth)
        .attr("height", height - padding - y(total))
        .attr("fill", "lightgray")
        .attr("data-county", county)
        .attr("data-total", total)
        .attr("data-male", male)
        .attr("data-female", female);
    }

    if (!isNaN(male)) {
      svg
        .append("rect")
        .attr("class", "bar-male")
        .attr("x", x(county) + barWidth)
        .attr("y", y(male))
        .attr("width", barWidth)
        .attr("height", height - padding - y(male))
        .attr("fill", "blue")
        .attr("data-county", county)
        .attr("data-total", total)
        .attr("data-male", male)
        .attr("data-female", female);
    }

    if (!isNaN(female)) {
      svg
        .append("rect")
        .attr("class", "bar-female")
        .attr("x", x(county) + barWidth * 2)
        .attr("y", y(female))
        .attr("width", barWidth)
        .attr("height", height - padding - y(female))
        .attr("fill", "red")
        .attr("data-county", county)
        .attr("data-total", total)
        .attr("data-male", male)
        .attr("data-female", female);
    }
  });

  // 圖例
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 150}, ${padding})`);

  const legendData = [
    { label: "全", color: "lightgray" },
    { label: "男", color: "blue" },
    { label: "女", color: "red" },
  ];

  legendData.forEach((d, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d.color);

    legendRow
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("text-anchor", "start")
      .style("font-size", "12px")
      .text(d.label);
  });
}

// 處理滑鼠移動的函式
export function handleCancerMouseHover(mouseX, mouseY) {
  const svg = d3.select("#cancer-bar-chart svg");
  const barElements = svg.selectAll("rect");

  // 獲取 SVG 的位移資訊
  const svgRect = svg.node().getBoundingClientRect();
  const svgOffsetX = svgRect.left;
  const svgOffsetY = svgRect.top;
  const svgWidth = svgRect.width;
  const svgHeight = svgRect.height;

  // 判斷滑鼠是否在 SVG 範圍內
  if (
    mouseX + svgOffsetX < svgOffsetX || // 左側超出
    mouseX + svgOffsetX > svgOffsetX + svgWidth || // 右側超出
    mouseY + svgOffsetY < svgOffsetY || // 上側超出
    mouseY + svgOffsetY > svgOffsetY + svgHeight // 下側超出
  ) {
    // 隱藏 Tooltip
    d3.select("#tooltip").style("opacity", 0);
    return;
  }

  // 檢查滑鼠是否位於任一長條圖內
  let isHovering = false;
  barElements.each(function () {
    const rect = d3.select(this);
    const x = parseFloat(rect.attr("x"));
    const y = parseFloat(rect.attr("y"));
    const width = parseFloat(rect.attr("width"));
    const height = parseFloat(rect.attr("height"));

    if (
      mouseX >= x &&
      mouseX <= x + width &&
      mouseY >= y &&
      mouseY <= y + height
    ) {
      const county = rect.attr("data-county");
      const total = parseFloat(rect.attr("data-total")).toFixed(2); // 限制到兩位小數
      const male = parseFloat(rect.attr("data-male")).toFixed(2); // 限制到兩位小數
      const female = parseFloat(rect.attr("data-female")).toFixed(2); // 限制到兩位小數

      // 顯示 Tooltip，並加上 SVG 的位移
      d3.select("#tooltip")
        .style("left", `${mouseX + svgOffsetX + 10}px`)
        .style("top", `${mouseY + svgOffsetY - 10}px`)
        .style("opacity", 1)
        .html(
          `<strong>${county}</strong><br>
          全: ${total}<br>
          男: ${male}<br>
          女: ${female}`
        );

      isHovering = true;
    }
  });

  // 如果滑鼠不在任何長條圖上，隱藏 Tooltip
  if (!isHovering) {
    d3.select("#tooltip").style("opacity", 0);
  }
}

// 處理滑鼠點擊的函式
// 處理滑鼠點擊的函式，檢查滑鼠是否位於圖表內，並更新垂直線位置與選擇縣市
export function handleCancerMouseClick(mouseX, mouseY) {
  let clickedYear = null;
  let clickedCounty = null;

  const lineChartSvg = d3.select("#cancer-line-chart svg");
  const lineChartRect = lineChartSvg.node()?.getBoundingClientRect();

  const isInsideLineChart =
    lineChartRect &&
    mouseX + lineChartRect.left >= lineChartRect.left &&
    mouseX + lineChartRect.left <= lineChartRect.right &&
    mouseY + lineChartRect.top >= lineChartRect.top &&
    mouseY + lineChartRect.top <= lineChartRect.bottom;

  if (isInsideLineChart) {
    const x = d3
      .scaleLinear()
      .domain([lineChartRect.left, lineChartRect.right])
      .range([40, lineChartRect.width - 40]);

    clickedYear = Math.round(x.invert(mouseX + lineChartRect.left));

    let verticalLine = lineChartSvg.select(".vertical-line");
    if (verticalLine.empty()) {
      verticalLine = lineChartSvg
        .append("line")
        .attr("class", "vertical-line")
        .attr("stroke", "gray")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4 4");
    }

    verticalLine
      .attr("x1", x(clickedYear))
      .attr("x2", x(clickedYear))
      .attr("y1", 40)
      .attr("y2", lineChartRect.height - 40);
  }

  const barChartSvg = d3.select("#cancer-bar-chart svg");
  const barChartRect = barChartSvg.node()?.getBoundingClientRect();

  const isInsideBarChart =
    barChartRect &&
    mouseX + barChartRect.left >= barChartRect.left &&
    mouseX + barChartRect.left <= barChartRect.right &&
    mouseY + barChartRect.top >= barChartRect.top &&
    mouseY + barChartRect.top <= barChartRect.bottom;

  if (isInsideBarChart) {
    const barElements = barChartSvg.selectAll("rect");
    barElements.each(function () {
      const rect = d3.select(this);
      const x = parseFloat(rect.attr("x"));
      const y = parseFloat(rect.attr("y"));
      const width = parseFloat(rect.attr("width"));
      const height = parseFloat(rect.attr("height"));

      if (
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= y &&
        mouseY <= y + height
      ) {
        clickedCounty = rect.attr("data-county");
      }
    });

    if (clickedCounty && clickedCounty !== "全國") {
      barChartSvg.selectAll(".highlight").remove();
      const relatedBars = barChartSvg.selectAll(
        `rect[data-county='${clickedCounty}']`
      );
      let xMin = Infinity;
      let xMax = -Infinity;
      let totalHeight = 0;
      let totalY = Infinity;

      relatedBars.each(function () {
        const rect = d3.select(this);
        const x = parseFloat(rect.attr("x"));
        const y = parseFloat(rect.attr("y"));
        const width = parseFloat(rect.attr("width"));
        const height = parseFloat(rect.attr("height"));

        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x + width);
        totalHeight = Math.max(totalHeight, height);
        totalY = Math.min(totalY, y);
      });

      barChartSvg
        .append("rect")
        .attr("class", "highlight")
        .attr("x", xMin)
        .attr("y", totalY)
        .attr("width", xMax - xMin)
        .attr("height", totalHeight)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("data-county", clickedCounty);
    }
  }

  return { year: clickedYear, county: clickedCounty };
}

// 肺癌折線圖繪製函數
export function updateCancerLineGraph(county, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      // 篩選符合條件的資料
      const filteredData = data.filter(
        (d) =>
          d["癌症別"]?.toString().trim()?.includes("肺、支氣管及氣管") &&
          d["縣市別"]?.toString().trim() === county
      );

      if (filteredData.length === 0) {
        console.error("指定縣市無符合條件的癌症資料。");
        return;
      }

      // 整理資料，分別處理全、男、女的資料
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

        if (gender === "男") {
          groupedData.male.push({ year, incidence });
        } else if (gender === "女") {
          groupedData.female.push({ year, incidence });
        } else {
          groupedData.total.push({ year, incidence });
        }
      });

      // 確保每組資料按年份排序
      Object.keys(groupedData).forEach((key) => {
        groupedData[key].sort((a, b) => a.year - b.year);
      });

      // 設定圖表範圍
      const svg = d3.select("#cancer-line-chart").selectAll("svg").remove();

      const svgCanvas = d3
        .select("#cancer-line-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      const x = d3
        .scaleLinear()
        .domain(d3.extent(groupedData.total, (d) => d.year))
        .range([40, width - 40]);

      const y = d3
        .scaleLinear()
        .domain([0, 70]) // 固定 y 軸範圍為 0 到 70
        .range([height - 40, 40]);

      const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"));
      const yAxis = d3.axisLeft(y).ticks(15).tickFormat(d3.format("~s"));

      svgCanvas
        .append("g")
        .attr("transform", `translate(0, ${height - 40})`)
        .call(xAxis);

      svgCanvas.append("g").attr("transform", `translate(40, 0)`).call(yAxis);

      // 繪製折線圖
      const lineGenerator = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => y(d.incidence));

      ["total", "male", "female"].forEach((key, index) => {
        const color =
          key === "total" ? "black" : key === "male" ? "blue" : "red";
        const shape =
          key === "total" ? "circle" : key === "male" ? "square" : "triangle";

        svgCanvas
          .append("path")
          .datum(groupedData[key])
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("d", lineGenerator);

        svgCanvas
          .selectAll(`.${key}-dots`)
          .data(groupedData[key])
          .enter()
          .append("path")
          .attr(
            "d",
            d3
              .symbol()
              .type(
                d3[`symbol${shape.charAt(0).toUpperCase() + shape.slice(1)}`]
              )
              .size(64)
          )
          .attr("fill", color)
          .attr("transform", (d) => `translate(${x(d.year)},${y(d.incidence)})`)
          .on("mouseover", (event, d) => {
            d3.select("#tooltip")
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`)
              .style("opacity", 1)
              .html(`${county}<br>年份: ${d.year}<br>發生率: ${d.incidence}`);
          })
          .on("mouseout", () => {
            d3.select("#tooltip").style("opacity", 0);
          })
          .on("click", (event, d) => {
            console.log(`選取年份: ${d.year}, 發生率: ${d.incidence}`);
          });
      });

      // 添加圖例
      const legend = svgCanvas
        .append("g")
        .attr("transform", `translate(${width - 150}, 20)`);
      const legendData = [
        { label: "全", color: "black" },
        { label: "男", color: "blue" },
        { label: "女", color: "red" },
      ];

      legendData.forEach((d, i) => {
        const legendRow = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow
          .append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", d.color);

        legendRow
          .append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .text(d.label);
      });

      console.log(
        "完成肺癌發生率折線圖繪製，包括全、男、女三條線。並新增互動功能。"
      );
    })
    .catch((error) => {
      console.error("讀取 CSV 檔案失敗：", error);
    });
}
