// main.js
import { updateCancerBarGraph, updateCancerLineGraph } from "./cancer.js";
import { updateAQIBarGraph, updateAQILineGraph } from "./aqi.js";
import { updateSmokeChart } from "./smoke.js";
import { drawTaiwan } from "./taiwan.js";
import {
  lastSelectedYear,
  lastSelectedCounty,
  setLastSelectedYear,
  setLastSelectedCounty,
  displayCurrentSelection,
} from "./sharedState.js";

document.getElementById("gender-select").addEventListener("change", updateCharts)

export function getChartDimensions(selector) {
  const chart = document.querySelector(selector);
  return { width: chart.clientWidth, height: chart.clientHeight };
}

export function updateCharts() {
  const cancerBarChartSize = getChartDimensions("#cancer-bar-chart");
  const cancerLineChartSize = getChartDimensions("#cancer-line-chart");
  const aqiBarChartSize = getChartDimensions("#aqi-bar-chart");
  const aqiLineChartSize = getChartDimensions("#aqi-line-chart");
  const smokeChartSize = getChartDimensions("#smoking-chart");
  const mapSize = getChartDimensions("#taiwan");

  const smokeValue = parseInt(
    document.getElementById("smoke-slider").value,
    10
  );
  const aqiValue = parseInt(document.getElementById("aqi-slider").value, 10);
  const cancerValue = parseInt(
    document.getElementById("cancer-slider").value,
    10
  );

  console.log("Smoke Value:", smokeValue);
  console.log("AQI Value:", aqiValue);
  console.log("Cancer Value:", cancerValue);

  updateCancerBarGraph(
    lastSelectedYear + cancerValue,
    cancerBarChartSize.width,
    cancerBarChartSize.height
  );
  updateCancerLineGraph(
    lastSelectedCounty,
    cancerLineChartSize.width,
    cancerLineChartSize.height
  );
  updateAQIBarGraph(
    lastSelectedYear + aqiValue,
    aqiBarChartSize.width,
    aqiBarChartSize.height
  );
  updateAQILineGraph(
    lastSelectedCounty,
    aqiLineChartSize.width,
    aqiLineChartSize.height
  );
  updateSmokeChart(
    lastSelectedYear + smokeValue,
    smokeChartSize.width,
    smokeChartSize.height
  );
  drawTaiwan(
    lastSelectedCounty,
    lastSelectedYear,
    mapSize.width,
    mapSize.height
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("smoke-slider")
    .addEventListener("input", updateCharts);
  document.getElementById("aqi-slider").addEventListener("input", updateCharts);
  document
    .getElementById("cancer-slider")
    .addEventListener("input", updateCharts);
  displayCurrentSelection();
});

document.addEventListener("DOMContentLoaded", () => {
  // updateCharts();
  displayCurrentSelection();
  // d3.select("#cancer-bar-chart").on("click", handleCancerChartClick);
  // d3.select("#cancer-line-chart").on("click", handleCancerChartClick);
});

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("smoke-slider")
    .addEventListener("input", updateCharts);
  document.getElementById("aqi-slider").addEventListener("input", updateCharts);
  document
    .getElementById("cancer-slider")
    .addEventListener("input", updateCharts);
  displayCurrentSelection();
});
