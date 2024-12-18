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
  const selectionDiv = d3.select("#now-select");

  if (selectionDiv.empty()) {
    d3.select("#now-select")
      .append("div")
      .attr("id", "current-selection")
      .style("background-color", "#f0f0f0")
      .style("padding", "10px")
      .style("border", "1px solid #ccc");
  }

  selectionDiv.html(
    `縣市 : ${lastSelectedCounty}   年份 : ${lastSelectedYear}`
  );

  updateCharts();
}
