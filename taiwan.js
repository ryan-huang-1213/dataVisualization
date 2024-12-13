import * as d3 from "https://cdn.jsdelivr.net/npm/d3@6/+esm";

function drawTaiwanMap() {
  // 取得 .taiwan 的寬度與高度
  const container = document.querySelector(".taiwan");
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const projection = d3
    .geoMercator()
    .center([120.97, 23.5]) // 台灣中心點
    .scale(8000) // 縮放比例（可調整以適配大小）
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // 建立 SVG 並參考 .taiwan 的大小
  const svg = d3
    .select("#taiwan-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  const url = "./dataset/COUNTY_MOI_1130718.json"; // GeoJSON 的路徑

  d3.json(url).then((geometry) => {
    if (!geometry.features || geometry.features.length === 0) {
      console.error("GeoJSON 無有效 features");
      return;
    }

    svg
      .selectAll("path")
      .data(geometry.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", (d) => "city" + d.properties.COUNTYCODE)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#fff")
      .on("click", (event, d) => {
        // 點擊更新中文與英文名稱
        document.getElementById("county-name").textContent =
          d.properties.COUNTYNAME;
        document.getElementById("county-eng").textContent =
          d.properties.COUNTYENG;

        // 移除舊的 .active 樣式
        d3.select(".active").classed("active", false);

        // 為當前選中的 path 加上 .active 樣式
        d3.select(event.target).classed("active", true);
      });
  });
}

document.addEventListener("DOMContentLoaded", drawTaiwanMap);
