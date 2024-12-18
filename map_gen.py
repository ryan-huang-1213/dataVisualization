import geopandas as gpd
import folium
from branca.colormap import LinearColormap

# 讀取 GeoJSON 文件
taiwan = gpd.read_file("./dataset/taiwan.json")

# 初始化 Folium 地圖 (中心設為台灣經緯度)
m = folium.Map(location=[23.5, 121], zoom_start=7, tiles="CartoDB positron")

# 定義分層資料
layer_data = {
    "AQI 指數": {
        "data": {
            "基隆市": 100, "台北市": 150, "新北市": 200,
            "桃園市": 250, "台中市": 300, "高雄市": 310
        },
        "color": "YlOrRd",
    },
    "癌症發生率": {
        "data": {
            "基隆市": 90, "台北市": 120, "新北市": 180,
            "桃園市": 150, "台中市": 210, "高雄市": 250
        },
        "color": "BuPu",
    },
}

# 添加每個圖層
def add_layer(data, color_scale, label):
    colormap = LinearColormap(
        colors=["#FFFFFF", color_scale], vmin=min(data.values()), vmax=max(data.values())
    )
    folium.GeoJson(
        taiwan,
        name=label,
        style_function=lambda feature: {
            "fillColor": colormap(data.get(feature["properties"]["COUNTYNAME"], 0)),
            "color": "black",
            "weight": 1,
            "fillOpacity": 0.7,
        },
        tooltip=folium.GeoJsonTooltip(
            fields=["COUNTYNAME"],
            aliases=[f"{label}："],
            localize=True,
        ),
    ).add_to(m)

# 添加所有圖層
for label, props in layer_data.items():
    add_layer(props["data"], props["color"], label)

# 添加圖層控制器
folium.LayerControl().add_to(m)

# 保存地圖為 HTML
m.save("taiwan_map.html")
print("互動式地圖已保存為 taiwan_map.html")
