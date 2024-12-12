//main.js

import {
  updateCancerBarGraph,
  handleCancerMouseHover,
  handleCancerMouseClick,
} from "./cancer.js";

// 癌症發生率長條圖 確保取得正確的寬高，並提供預設值
const cancerBarChartWidth =
  document.querySelector("#cancer-bar-chart").clientWidth;
const cancerBarChartHeight =
  document.querySelector("#cancer-bar-chart").clientHeight;
const year = 1979;

// 癌症發生率長條圖 更新長條圖
updateCancerBarGraph(year, cancerBarChartWidth, cancerBarChartHeight);

// 癌症發生率長條圖 添加滑鼠移動事件
const barChart = d3.select("#cancer-bar-chart");
barChart.on("mousemove", (event) => {
  const [mouseX, mouseY] = d3.pointer(event);
  handleCancerMouseHover(mouseX, mouseY);
});

// 癌症發生率長條圖 添加滑鼠點擊事件
barChart.on("click", (event) => {
  const [mouseX, mouseY] = d3.pointer(event);
  const selectedCounty = handleCancerMouseClick(mouseX, mouseY);

  // 根據選取的縣市進行處理
  // 你可以在這裡進行相關同步，比如 update
  console.log(`選取的縣市: ${selectedCounty}`);

  // 其他處理邏輯，例如更新其他部分的圖表或顯示選取資訊
  if (selectedCounty === "全國") {
    console.log("未選擇具體縣市，顯示全國資料");
  } else {
    console.log(`已選擇縣市: ${selectedCounty}`);
  }
});

// 癌症發生率折線圖 暫時處理折線圖邏輯
const lineChartWidth =
  document.querySelector("#cancer-line-chart").clientWidth || 800;
const lineChartHeight =
  document.querySelector("#cancer-line-chart").clientHeight || 600;

// 癌症發生率折線圖 保留折線圖繪製邏輯的占位函式
d3.select("#cancer-line-chart").call(() => {
  console.log(
    "Line chart placeholder, dimensions:",
    lineChartWidth,
    lineChartHeight
  );
  // drawLineGraph(sampleLineData, lineChartWidth, lineChartHeight);
});
