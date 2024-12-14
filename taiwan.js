// taiwan.js

// 假設的分層設色資料，22 個縣市
const countyData = {
  基隆市: 100,
  台北市: 150,
  新北市: 200,
  桃園市: 250,
  新竹市: 180,
  新竹縣: 220,
  苗栗縣: 160,
  台中市: 300,
  彰化縣: 270,
  南投縣: 190,
  雲林縣: 210,
  嘉義市: 170,
  嘉義縣: 230,
  台南市: 260,
  高雄市: 310,
  屏東縣: 240,
  宜蘭縣: 140,
  花蓮縣: 120,
  台東縣: 130,
  澎湖縣: 110,
  金門縣: 105,
  連江縣: 90,
};

// 設定顏色範圍與比例尺
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([90, 310]); // 最小和最大值

// 繪製地圖上的各縣市
function drawChoroplethMap(geoJsonData) {
  const map = L.map("map_be06e6e0f04213affe7b2679b592aba8").setView(
    [23.5, 121],
    7
  );

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    }
  ).addTo(map);

  // 加入 GeoJSON 圖層
  L.geoJson(geoJsonData, {
    style: (feature) => {
      const countyName = feature.properties.COUNTYNAME;
      const value = countyData[countyName] || 0;
      return {
        fillColor: colorScale(value),
        weight: 1,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    },
    onEachFeature: (feature, layer) => {
      const countyName = feature.properties.COUNTYNAME;
      const value = countyData[countyName] || "無資料";
      layer.bindPopup(`${countyName}: ${value}`);
    },
  }).addTo(map);
}

// 載入地理資料並繪製地圖
fetch("./dataset/taiwan.json")
  .then((response) => response.json())
  .then((data) => drawChoroplethMap(data))
  .catch((error) => console.error("無法載入地圖資料:", error));
