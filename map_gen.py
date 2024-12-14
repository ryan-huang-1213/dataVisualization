import geopandas as gpd
import folium

# 讀取 GeoJSON 文件
taiwan = gpd.read_file("./dataset/taiwan.json")

# 初始化 Folium 地圖 (中心設為台灣經緯度)
m = folium.Map(location=[23.5, 121], zoom_start=7, tiles="CartoDB positron")

# 添加 GeoJSON 層
folium.GeoJson(
    taiwan,
    name="台灣縣市",
    style_function=lambda feature: {
        "fillColor": "orange",
        "color": "black",
        "weight": 1,
        "fillOpacity": 0.5,
    },
    tooltip=folium.GeoJsonTooltip(
        fields=["COUNTYNAME"], aliases=["縣市名稱："]
    ),
).add_to(m)

# 添加圖層控制器
folium.LayerControl().add_to(m)

# 保存地圖為 HTML
m.save("taiwan_map.html")
print("互動式地圖已保存為 taiwan_map.html")
