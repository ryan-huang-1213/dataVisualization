import { lastSelectedYear } from './sharedState.js';

const csvPath = "./dataset/updated_smoking_rate_data.csv";

// 更新吸菸金字塔圖
export function updateSmokeChart(year, width, height) {
  d3.csv(csvPath).then((data) => {
    // 使用 forEach 進行篩選
    const filteredData = [];
    data.forEach((d) => {
      if (d.year == lastSelectedYear) {
        filteredData.push(d);
      }
    });

    if (filteredData.length === 0) {
      console.error(`無符合條件的資料。年份: ${lastSelectedYear}`);
      d3.select("#smoking-chart").selectAll("svg").remove();
      return;
    }

    drawSmokeChart(filteredData, width, height);
  }).catch((error) => {
    console.error("載入 CSV 檔案失敗：", error);
  });
}

function drawSmokeChart(data, width, height) {
  const margin = { top: 20, right: 40, bottom: 60, left: 40 };
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

  const ageGroups = data.map((d) => d["類別"]);
  const maxRate = d3.max(data, (d) => Math.max(+d["男 Male (%)"], +d["女 Female (%)"]));

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
    .attr("x", (d) => chartWidth / 2 - xScale(+d["男 Male (%)"]))
    .attr("y", (d) => yScale(d["類別"]))
    .attr("width", (d) => xScale(+d["男 Male (%)"]))
    .attr("height", yScale.bandwidth())
    .attr("fill", "#87CEEB");

  // 女性吸菸率 (右側)
  svg
    .selectAll(".female-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "female-bar")
    .attr("x", chartWidth / 2)
    .attr("y", (d) => yScale(d["類別"]))
    .attr("width", (d) => xScale(+d["女 Female (%)"]))
    .attr("height", yScale.bandwidth())
    .attr("fill", "#FFC0CB");

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
    .style("font-size", "10px")
    .text((d) => d);

  // 中心軸
  svg
    .append("line")
    .attr("x1", chartWidth / 2)
    .attr("y1", 0)
    .attr("x2", chartWidth / 2)
    .attr("y2", chartHeight)
    .attr("stroke", "black")
    .attr("stroke-width", 1);

  // 男性橫軸
  svg
    .append("g")
    .attr("class", "x-axis-male")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xScale.copy().range([chartWidth / 2, 0])).ticks(5))
    .selectAll("text")
    .style("text-anchor", "middle");

  // 女性橫軸
  svg
    .append("g")
    .attr("class", "x-axis-female")
    .attr("transform", `translate(${chartWidth / 2}, ${chartHeight})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .selectAll("text")
    .style("text-anchor", "middle");

  // 標題
  svg
    .append("text")
    .attr("x", chartWidth / 4)
    .attr("y", chartHeight + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text("男性吸菸率 (%)");

  svg
    .append("text")
    .attr("x", (chartWidth / 4) * 3)
    .attr("y", chartHeight + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text("女性吸菸率 (%)");
}
