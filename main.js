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
} from "./sharedState.js";

export function getChartDimensions(selector) {
  const chart = document.querySelector(selector);
  return { width: chart.clientWidth, height: chart.clientHeight };
}

export function updateCharts() {
  const cancerBarChartSize = getChartDimensions("#cancer-bar-chart");
  const cancerLineChartSize = getChartDimensions("#cancer-line-chart");
  const aqiBarChartSize = getChartDimensions("#aqi-bar-chart");
  const aqiLineChartSize = getChartDimensions("#aqi-line-chart");
  const mapSize = getChartDimensions("#taiwan");

  updateCancerBarGraph(
    lastSelectedYear,
    cancerBarChartSize.width,
    cancerBarChartSize.height
  );
  updateCancerLineGraph(
    lastSelectedCounty,
    cancerLineChartSize.width,
    cancerLineChartSize.height
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
  updateSmokeChart(
    ".smoking-graph",
    "./dataset/18歲以上人口目前吸菸率_utf8.csv"
  );
  drawTaiwan(
    lastSelectedCounty,
    lastSelectedYear,
    mapSize.width,
    mapSize.height
  );
}

document.addEventListener("DOMContentLoaded", () => {
  updateCharts();

  // d3.select("#cancer-bar-chart").on("click", handleCancerChartClick);
  // d3.select("#cancer-line-chart").on("click", handleCancerChartClick);
});
