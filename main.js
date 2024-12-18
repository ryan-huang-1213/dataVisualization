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
    lastSelectedYear,
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
  // updateCharts();
  displayCurrentSelection();
  // d3.select("#cancer-bar-chart").on("click", handleCancerChartClick);
  // d3.select("#cancer-line-chart").on("click", handleCancerChartClick);
});
