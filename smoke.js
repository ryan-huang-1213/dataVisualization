// 將 D3 繪圖功能封裝並匯出
export function updateSmokeChart(container, dataUrl) {
    // 設定圖表寬度、高度與邊距
    const margin = {top: 20, right: 30, bottom: 50, left: 70},
          width = 800 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    // 清空容器，避免重複渲染
    d3.select(container).selectAll("*").remove();

    // 創建SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 讀取CSV文件
    d3.csv(dataUrl).then(function(data) {
        // 資料處理: 只取年齡層資料
        const filteredData = data.filter(d => d["類別"].includes("年齡別"));

        // 提取年齡層與吸菸率（男女）
        const ageGroups = filteredData.map(d => d["類別"].split("=")[1]);
        const maleRates = filteredData.map(d => +d["男 Male (%)"]);
        const femaleRates = filteredData.map(d => +d["女 Female (%)"]);

        // 設定比例尺
        const y = d3.scaleBand()
            .domain(ageGroups)
            .range([0, height])
            .padding(0.3);

        const xMale = d3.scaleLinear()
            .domain([0, d3.max(maleRates)])
            .range([width / 2, 0]);

        const xFemale = d3.scaleLinear()
            .domain([0, d3.max(femaleRates)])
            .range([width / 2, width]);

        // 加入X軸與Y軸
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xFemale).ticks(5));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("g")
            .attr("transform", `translate(${width / 2},0)`)
            .call(d3.axisBottom(xMale).ticks(5));

        // 男性吸菸率長條圖
        svg.selectAll(".bar-male")
            .data(filteredData)
            .enter().append("rect")
            .attr("class", "bar-male")
            .attr("x", d => xMale(+d["男 Male (%)"]))
            .attr("y", d => y(d["類別"].split("=")[1]))
            .attr("width", d => width / 2 - xMale(+d["男 Male (%)"]))
            .attr("height", y.bandwidth())
            .attr("fill", "steelblue");

        // 女性吸菸率長條圖
        svg.selectAll(".bar-female")
            .data(filteredData)
            .enter().append("rect")
            .attr("class", "bar-female")
            .attr("x", width / 2)
            .attr("y", d => y(d["類別"].split("=")[1]))
            .attr("width", d => xFemale(+d["女 Female (%)"]) - width / 2)
            .attr("height", y.bandwidth())
            .attr("fill", "orange");

        // 標示標題
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("不同年齡層吸菸率金字塔圖");

        // 男性與女性標籤
        svg.append("text")
            .attr("x", 10)
            .attr("y", height + 40)
            .text("男性吸菸率 (%)");

        svg.append("text")
            .attr("x", width - 150)
            .attr("y", height + 40)
            .text("女性吸菸率 (%)");
    });
}
