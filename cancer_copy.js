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
    // 確保欄位名稱及數值格式處理
    const county = d["縣市別"]?.toString().trim();
    const incidenceRaw = d[
      "年齡標準化發生率  WHO 2000世界標準人口 (每10萬人口)"
    ]
      .toString()
      .trim();
    const incidence = parseFloat(incidenceRaw.replace(/[^0-9.]/g, "") || "0");
    const gender = d["性別"]?.toString().trim();

    /*
    console.log(
      `Processing County: ${county}, Incidence: ${incidence}, Gender: ${gender}`
    );
    */
    // Skip invalid or NaN values
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

  return Object.entries(result);
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
}

// 處理滑鼠移動的函式
export function handleMouseHover(mouseX, mouseY) {
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
export function handleMouseClick(mouseX, mouseY) {
  const svg = d3.select("#cancer-bar-chart svg");
  if (svg.empty()) {
    console.warn("SVG not found for #cancer-bar-chart");
    return;
  }

  const barElements = svg.selectAll("rect");
  let clickedCounty = null;

  // 找到滑鼠點擊的縣市
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
      clickedCounty = rect.attr("data-county"); // 獲取縣市名稱
    }
  });

  if (clickedCounty) {
    selectedCounty = clickedCounty;

    // 移除先前的框選
    svg.selectAll(".highlight").remove();

    // 選取該縣市的三個長條
    const relatedBars = svg.selectAll(`rect[data-county='${clickedCounty}']`);
    let xMin = Infinity;
    let xMax = -Infinity;
    let totalHeight = 0;
    let totalY = Infinity;

    // 計算紅色框的位置與大小
    relatedBars.each(function () {
      const rect = d3.select(this);
      const x = parseFloat(rect.attr("x"));
      const y = parseFloat(rect.attr("y"));
      const width = parseFloat(rect.attr("width"));
      const height = parseFloat(rect.attr("height"));

      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x + width);
      totalHeight = Math.max(totalHeight, height); // 取「全」的高度
      totalY = Math.min(totalY, y); // 取最上方的 Y 值
    });

    // 繪製紅色框
    svg
      .append("rect")
      .attr("class", "highlight")
      .attr("x", xMin) // 最左側位置
      .attr("y", totalY) // 「全」的頂部位置
      .attr("width", xMax - xMin) // 包含三條長條的總寬度
      .attr("height", totalHeight) // 使用「全」的高度
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("data-county", clickedCounty); // 繼承原值，便於 Tooltip 顯示

    // 修正 Tooltip 顯示
    const total = relatedBars.filter(".bar-total").attr("data-total"); // 提取全的值
    const male = relatedBars.filter(".bar-male").attr("data-male"); // 提取男的值
    const female = relatedBars.filter(".bar-female").attr("data-female"); // 提取女的值

    d3.select("#tooltip")
      .style("opacity", 1)
      .html(
        `<strong>${clickedCounty}</strong><br>
        全: ${parseFloat(total).toFixed(2)}<br>
        男: ${parseFloat(male).toFixed(2)}<br>
        女: ${parseFloat(female).toFixed(2)}`
      );
  } else {
    // 點擊的不是任何長條，移除紅色框並隱藏 Tooltip
    svg.selectAll(".highlight").remove();
    d3.select("#tooltip").style("opacity", 0);
    selectedCounty = null; // 重置選取的縣市
  }
}
