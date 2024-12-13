//main.js

import {
  updateCancerBarGraph,
  updateCancerLineGraph,
  handleCancerMouseHover,
  handleCancerMouseClick,
} from "./cancer.js";

// 癌症發生率長條圖 確保取得正確的寬高，並提供預設值
const cancerBarChartWidth =
  document.querySelector("#cancer-bar-chart").clientWidth;
const cancerBarChartHeight =
  document.querySelector("#cancer-bar-chart").clientHeight;
const cancerLineChartWidth =
  document.querySelector("#cancer-line-chart").clientWidth;
const cancerLineChartHeight =
  document.querySelector("#cancer-line-chart").clientHeight;
const year = 1979;

// 癌症發生率長條圖 更新長條圖
updateCancerBarGraph(year, cancerBarChartWidth, cancerBarChartHeight);

// 癌症發生率長條圖和折線圖 添加滑鼠點擊事件
const barChart = d3.select("#cancer-bar-chart");
const lineChart = d3.select("#cancer-line-chart");

function handleCancerChartClick(event) {
  const [mouseX, mouseY] = d3.pointer(event);
  const { year: selectedYear, county: selectedCounty } = handleCancerMouseClick(
    mouseX,
    mouseY
  );

  if (selectedYear !== null) {
    console.log(`選取年份: ${selectedYear}`);
  }

  if (selectedCounty && selectedCounty !== "全國") {
    updateCancerLineGraph(
      selectedCounty,
      cancerLineChartWidth,
      cancerLineChartHeight
    );
    console.log(`已選擇縣市: ${selectedCounty}`);
  }
}

// 添加滑鼠點擊事件到兩個圖表
barChart.on("click", handleCancerChartClick);
lineChart.on("click", handleCancerChartClick);

// 癌症發生率長條圖 添加滑鼠移動事件
barChart.on("mousemove", (event) => {
  const [mouseX, mouseY] = d3.pointer(event);
  handleCancerMouseHover(mouseX, mouseY);
});
