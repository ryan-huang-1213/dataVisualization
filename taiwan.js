// taiwan.js
import { lastSelectedCounty, setLastSelectedCounty } from "./sharedState.js";

let taiwanData = null; // 用於儲存 taiwan.json 資料
const cancerCsv = "./dataset/癌症發生統計_utf8.csv";
const aqiCsv = "./dataset/AQI_merged_utf8_cleaned.csv";

// 繪製地圖函數
export function drawTaiwan(county, year, width, height) {
  if (!taiwanData) {
    d3.json("./dataset/taiwan.json")
      .then((data) => {
        taiwanData = data; // 儲存資料供後續使用
        console.log("Taiwan data loaded:", taiwanData);
        renderMap(county, year, width, height);
      })
      .catch((error) => {
        console.error("Failed to load taiwan.json:", error);
      });
  } else {
    renderMap(county, year, width, height);
  }
}

function renderMap(county, year, width, height) {
  // 地圖投影與路徑產生器
  var projection = d3.geoMercator().fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    taiwanData
  );

  var geoGenerator = d3.geoPath().projection(projection);

  // 清空舊地圖
  var svg = d3
    .select("#map")
    .attr("width", width)
    .attr("height", height)
    .selectAll("*")
    .remove();

  svg = d3.select("#map");

  // 設置 Tooltip
  var tooltip = d3
    .select("#taiwan")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ddd")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("pointer-events", "none");

  // 添加圖層
  const layers = svg.append("g").attr("class", "layers");
  const layer1 = layers.append("g").attr("class", "layer1"); // 地圖選擇器
  const layer3 = layers.append("g").attr("class", "layer3"); // 癌症發生率
  const layer2 = layers.append("g").attr("class", "layer2"); // 各測站AQI

  var activePath = null;

  // 繪製地圖
  layer1
    .selectAll("path")
    .data(taiwanData.features) // 使用預先載入的資料
    .enter()
    .append("path")
    .attr("stroke", "white")
    .attr("fill", "steelblue")
    .attr("d", geoGenerator)
    .on("mouseover", function (event, d) {
      const name = d.properties?.NAME_2014 || "未知地區";
      tooltip.style("display", "block").html(`${name} (${year} 年)`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .on("click", function (event, d) {
      if (activePath && activePath.node() === this) {
        activePath.attr("stroke", "white").attr("stroke-width", 1);
        svg.select("rect.selection-box").remove();
        activePath = null;
        return;
      }

      if (activePath) {
        activePath.attr("stroke", "white").attr("stroke-width", 1);
        svg.select("rect.selection-box").remove();
      }

      activePath = d3.select(this);
      setLastSelectedCounty(d.properties.NAME_2014);

      const bounds = geoGenerator.bounds(d);
      drawSelectionBox(svg, bounds);
    });

  // 檢查外部選擇狀態
  const preSelectedFeature = taiwanData.features.find(
    (f) => f.properties.NAME_2014 === lastSelectedCounty
  );

  if (preSelectedFeature) {
    const bounds = geoGenerator.bounds(preSelectedFeature);
    drawSelectionBox(svg, bounds);
  }

  function drawSelectionBox(svg, bounds) {
    const [x0, y0] = bounds[0];
    const [x1, y1] = bounds[1];

    svg
      .append("rect")
      .attr("class", "selection-box")
      .attr("x", x0)
      .attr("y", y0)
      .attr("width", x1 - x0)
      .attr("height", y1 - y0)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("vector-effect", "non-scaling-stroke");
  }

  d3.csv(aqiCsv).then((data) => {
    const filteredData = data.filter( (d) =>
      d["日期"]?.startsWith(year)
    );
    const result = {};

    filteredData.forEach((d) => {
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

    const averageResult = Object.entries(result).map(([county, { sum, count }]) => {
      return [county, count > 0 ? sum / count : 0];
    });
  
    // 按平均值降序排列
    averageResult.sort((a, b) => b[1] - a[1]);

    averageResult.forEach(([county, avgAQI]) => {
      const matchingFeature = taiwanData.features.find(
        (f) => f.properties.NAME_2014 === county
      );

      if (matchingFeature) {
        const centroid = geoGenerator.centroid(matchingFeature);
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

        layer2
          .append("circle")
          .attr("cx", centroid[0])
          .attr("cy", centroid[1])
          .attr("r", 5)
          .attr("fill", d3.scaleSequential(d3.interpolateReds).domain([0, 100])(avgAQI))
          .on("mouseover", function () {
            tooltip.style("display", "block").html(
              `<strong>${county}</strong><br>平均 AQI: ${avgAQI.toFixed(2)}`
            );
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY + 10 + "px");
          })
          .on("mouseout", function () {
            tooltip.style("display", "none");
          });
      }
    });
  });

  // 從 CSV 檔案讀取癌症發生資料
  d3.csv(cancerCsv).then((data) => {
    const filteredData = data.filter(
      (d) =>
        d["癌症診斷年"]?.toString().trim() == year &&
        d["性別"]?.toString().trim() === "全" &&
        d["癌症別"]?.toString().trim().includes("肺、支氣管及氣管") &&
        d["縣市別"]?.toString().trim() !== "全國"
    );

    filteredData.forEach((d) => {
      const county = d["縣市別"].trim();
      const rate = parseFloat(
        d["年齡標準化發生率  WHO 2000世界標準人口 (每10萬人口)"].replace(
          /[^0-9.]/g,
          ""
        ) || "0"
      );

      const matchingFeature = taiwanData.features.find(
        (f) => f.properties.NAME_2014 === county
      );

      if (matchingFeature) {
        layer3
          .append("path")
          .attr("d", geoGenerator(matchingFeature))
          .attr("fill", d3.interpolateReds(rate / 100))
          .attr("stroke", "white")
          .on("mouseover", function (event) {
            tooltip
              .style("display", "block")
              .html(
                `<strong>縣市:</strong> ${county}<br><strong>發生率:</strong> ${rate.toFixed(
                  2
                )}`
              );
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY + 10 + "px");
          })
          .on("mouseout", () => tooltip.style("display", "none"));
      }
    });
  });

  var checkboxContainer = svg
    .append("foreignObject")
    .attr("x", width - 130)
    .attr("y", 10)
    .attr("width", 120)
    .attr("height", 80)
    .append("xhtml:div")
    .attr("class", "checkbox-container")
    .style("background", "#fff")
    .style("padding", "10px")
    .style("border", "1px solid #ccc")
    .style("font-size", "12px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.3)");

  checkboxContainer
    .append("label")
    .text("台灣地圖 ")
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .on("change", function () {
      layer1.style("display", this.checked ? "block" : "none");
    });
  checkboxContainer.append("br");
  checkboxContainer
    .append("label")
    .text("各縣市AQI ")
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .on("change", function () {
      layer2.style("display", this.checked ? "block" : "none");
    });
  checkboxContainer.append("br");
  checkboxContainer
    .append("label")
    .text("癌症發生率 ")
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .on("change", function () {
      layer3.style("display", this.checked ? "block" : "none");
    });

  // console.log(`Taiwan map updated for ${county} (${year})`);
  }