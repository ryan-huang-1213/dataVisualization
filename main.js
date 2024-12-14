// main.js
import { updateCancerBarGraph, updateCancerLineGraph } from "./cancer.js";
import { updateAQIBarGraph, updateAQILineGraph } from "./aqi.js";
import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
} from "./sharedState.js";

function getChartDimensions(selector) {
  const chart = document.querySelector(selector);
  return { width: chart.clientWidth, height: chart.clientHeight };
}

function isMouseInsideChart(mouseX, mouseY, chartSelector) {
  const chartRect = d3.select(chartSelector).node()?.getBoundingClientRect();
  return (
    chartRect &&
    mouseX >= chartRect.left &&
    mouseX <= chartRect.right &&
    mouseY >= chartRect.top &&
    mouseY <= chartRect.bottom
  );
}

function handleCancerChartClick(event) {
  const [mouseX, mouseY] = d3.pointer(event);
  const barChartSelector = "#cancer-bar-chart svg";
  const lineChartSelector = "#cancer-line-chart svg";

  if (isMouseInsideChart(mouseX, mouseY, barChartSelector)) {
    d3.select(barChartSelector)
      .selectAll("rect")
      .each(function (d, i, nodes) {
        const rect = d3.select(nodes[i]);
        let county = rect.attr("data-county");
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
          setLastSelectedCounty(county); // 使用 setter
        }
      });
  }

  if (isMouseInsideChart(mouseX, mouseY, lineChartSelector)) {
    d3.select(lineChartSelector)
      .selectAll("circle")
      .each(function (d, i, nodes) {
        const circle = d3.select(nodes[i]);
        let year = parseInt(circle.attr("data-year"));
        const cx = parseFloat(circle.attr("cx"));
        const cy = parseFloat(circle.attr("cy"));
        const r = parseFloat(circle.attr("r"));

        if (
          mouseX >= cx - r &&
          mouseX <= cx + r &&
          mouseY >= cy - r &&
          mouseY <= cy + r
        ) {
          setLastSelectedYear(new Date().getFullYear()); // 使用 setter
        }
      });
  }

  updateCharts();
}

function updateCharts() {
  const barChartSize = getChartDimensions("#cancer-bar-chart");
  const lineChartSize = getChartDimensions("#cancer-line-chart");
  const aqiBarChartSize = getChartDimensions("#aqi-bar-chart");
  const aqiLineChartSize = getChartDimensions("#aqi-line-chart");

  updateCancerBarGraph(
    lastSelectedYear,
    barChartSize.width,
    barChartSize.height
  );
  updateCancerLineGraph(
    lastSelectedCounty,
    lineChartSize.width,
    lineChartSize.height
  );
  updateAQIBarGraph(
    lastSelectedYear,
    aqiBarChartSize.width,
    aqiBarChartSize.height
  );
  updateAQILineGraph(
    lastSelectedCounty,
    aqiLineChartSize.width,
    aqiLineChartSize.height
  );
}

document.querySelectorAll('input[name="map"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value === "1") {
      console.log("顯示 AQI 資料");
    } else if (value === "2") {
      console.log("顯示 吸菸人數 資料");
    } else if (value === "3") {
      console.log("顯示 罹癌人數 資料");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  updateCharts();

  d3.select("#cancer-bar-chart").on("click", handleCancerChartClick);
  d3.select("#cancer-line-chart").on("click", handleCancerChartClick);
});
