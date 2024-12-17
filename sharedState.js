export let lastSelectedYear = 2000;
export let lastSelectedCounty = "全國";
import { updateCharts } from "./main.js";

export function setLastSelectedYear(year) {
  lastSelectedYear = year;
  displayCurrentSelection();
}

export function setLastSelectedCounty(county) {
  lastSelectedCounty = county;
  displayCurrentSelection();
}

export function displayCurrentSelection() {
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
  updateCharts();
}
