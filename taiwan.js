// taiwan.js
import { lastSelectedCounty, setLastSelectedCounty } from "./sharedState.js";

let taiwanData = null; // 用於儲存 taiwan.json 資料

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
  const layer1 = layers.append("g").attr("class", "layer1");
  const layer2 = layers.append("g").attr("class", "layer2");

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

  var customData = [
    { name: "站點A", coord: [121.5654, 25.033], value: 300, year: 1995 },
    { name: "站點B", coord: [120.6736, 24.1478], value: 150, year: 1990 },
    { name: "站點C", coord: [120.3014, 23.147], value: 220, year: 2000 },
  ];

  layer2
    .selectAll("circle")
    .data(customData)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection(d.coord)[0])
    .attr("cy", (d) => projection(d.coord)[1])
    .attr("r", 5)
    .attr("fill", (d) => d3.interpolateReds(d.value / 300))
    .append("title")
    .text((d) => `${d.name}: ${d.value}`);

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
    .text("Layer 1")
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .on("change", function () {
      layer1.style("display", this.checked ? "block" : "none");
    });

  checkboxContainer.append("br");

  checkboxContainer
    .append("label")
    .text("Layer 2")
    .append("input")
    .attr("type", "checkbox")
    .attr("checked", true)
    .on("change", function () {
      layer2.style("display", this.checked ? "block" : "none");
    });

  console.log(`Taiwan map updated for ${county} (${year})`);
}
