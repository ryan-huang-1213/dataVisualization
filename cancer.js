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
export function updateCancerLineGraph(county, width, height) {
  d3.csv(csvPath)
    .then((data) => {
      const filteredData = data.filter(
        (d) =>
          d["癌症別"]?.toString().trim()?.includes("肺、支氣管及氣管") &&
          d["縣市別"]?.toString().trim() === county
      );

      if (filteredData.length === 0) {
        console.error("無符合條件的資料。");
        return;
      }

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
        .domain([0, 70])
        .range([height - 40, 40]);

      svgCanvas
        .append("g")
        .attr("transform", `translate(0, ${height - 40})`)
        .call(d3.axisBottom(x));

      svgCanvas
        .append("g")
        .attr("transform", `translate(40, 0)`)
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

      const lineGenerator = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => y(d.incidence));

      ["total", "male", "female"].forEach((key, index) => {
        const color =
          key === "total" ? "black" : key === "male" ? "blue" : "red";
        const groupData = groupedData[key];

        svgCanvas
          .append("path")
          .datum(groupData)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("d", lineGenerator);

        svgCanvas
          .selectAll(`.${key}-dots`)
          .data(groupData)
          .enter()
          .append("circle")
          .attr("cx", (d) => x(d.year))
          .attr("cy", (d) => y(d.incidence))
          .attr("r", 4)
          .attr("fill", color)
          .on("mouseover", (event, d) => {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`)
              .style("display", "block")
              .html(
                `<strong>年份: ${
                  d.year
                }</strong><br>發生率: ${d.incidence.toFixed(2)}`
              );
          })
          .on("mouseout", () => tooltip.style("display", "none"))
          .on("click", (event, d) => {
            setLastSelectedYear(d.year);
            updateCancerBarGraph(lastSelectedYear, width, height);
            updateCancerLineGraph(lastSelectedCounty, width, height);
          });
      });
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}
