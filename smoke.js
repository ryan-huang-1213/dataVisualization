import { lastSelectedYear } from './sharedState.js';
import { getChartDimensions } from './main.js';

const csvPath = "./dataset/18歲以上人口目前吸菸率_utf8.csv";

// 更新吸菸金字塔圖
export function updateSmokeChart() {
  d3.csv(csvPath)
    .then((data) => {
      const filteredData = data.filter((d) => d["依年度別分 by year"] == lastSelectedYear);
      
      if (filteredData.length === 0) {
        console.error(`無符合條件的資料。年份: ${lastSelectedYear}`);
        return;
      }

      drawSmokeChart(filteredData);
    })
    .catch((error) => {
      console.error("載入 CSV 檔案失敗：", error);
    });
}

function drawSmokeChart(data) {
  const { width, height } = getChartDimensions("#smoking-chart");
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  d3.select("#smoking-chart").html("");

  const svg = d3
    .select("#smoking-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const ageGroups = Array.from(new Set(data.map((d) => d.AgeGroup)));
  const maxRate = d3.max(data, (d) => Math.max(+d.MaleRate, +d.FemaleRate));

  const xScale = d3.scaleLinear().domain([0, maxRate]).range([0, chartWidth / 2]);
  const yScale = d3
    .scaleBand()
    .domain(ageGroups)
    .range([0, chartHeight])
    .padding(0.1);

  // 男性吸菸率 (左側)
  svg
    .selectAll(".male-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "male-bar")
    .attr("x", (d) => chartWidth / 2 - xScale(+d.MaleRate))
    .attr("y", (d) => yScale(d.AgeGroup))
    .attr("width", (d) => xScale(+d.MaleRate))
    .attr("height", yScale.bandwidth())
    .attr("fill", "#1f77b4");

  // 女性吸菸率 (右側)
  svg
    .selectAll(".female-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "female-bar")
    .attr("x", chartWidth / 2)
    .attr("y", (d) => yScale(d.AgeGroup))
    .attr("width", (d) => xScale(+d.FemaleRate))
    .attr("height", yScale.bandwidth())
    .attr("fill", "#ff7f0e");

  // 年齡層標籤
  svg
    .selectAll(".age-label")
    .data(ageGroups)
    .enter()
    .append("text")
    .attr("class", "age-label")
    .attr("x", chartWidth / 2)
    .attr("y", (d) => yScale(d) + yScale.bandwidth() / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .text((d) => d);

  // 標示軸標題
  svg
    .append("text")
    .attr("x", chartWidth / 4)
    .attr("y", chartHeight + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("男性吸菸率 (%)");

  svg
    .append("text")
    .attr("x", (chartWidth / 4) * 3)
    .attr("y", chartHeight + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("女性吸菸率 (%)");
}
