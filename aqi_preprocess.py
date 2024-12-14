import pandas as pd
import re

# 讀取檔案
input_file = "./dataset/空氣品質監測站基本資料_processed.csv"
aqi_file = "./dataset/AQI_merged_utf8.csv"
output_file = "./dataset/AQI_merged_utf8_processed.csv"

# 載入基本資料檔案
try:
    basic_data = pd.read_csv(input_file)
except Exception as e:
    print(f"讀取基本資料檔案時發生錯誤: {e}")
    exit()

# 保留所需欄位
required_columns = ["sitename", "county", "township"]
try:
    basic_data = basic_data[required_columns]
except KeyError as e:
    print(f"基本資料檔案中缺少必要的欄位: {e}")
    exit()

# 載入 AQI 資料檔案
try:
    aqi_data = pd.read_csv(aqi_file)
except Exception as e:
    print(f"讀取 AQI 資料檔案時發生錯誤: {e}")
    exit()

# 將基本資料中的 sitename 與 county 建立對應字典
site_to_county = dict(zip(basic_data["sitename"], basic_data["county"]))

# 新增縣市別欄位
try:
    aqi_data["county"] = aqi_data["測站"].map(site_to_county)
except KeyError as e:
    print(f"AQI 資料檔案中缺少必要的欄位: {e}")
    exit()

# 篩選測項為 PM2.5 的資料
try:
    pm10_data = aqi_data[aqi_data["測項"] == "PM10"]
except KeyError as e:
    print(f"AQI 資料檔案中缺少必要的欄位: {e}")
    exit()

def format_date(date):
    return re.sub(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', lambda m: f"{m.group(1)}/{int(m.group(2)):02}/{int(m.group(3)):02}", date)

pm10_data['日期'] = pm10_data['日期'].apply(format_date)

# 保留指定欄位
columns_to_keep = ['日期', '測站', '測項', 'county'] + [f'{i:02}' for i in range(1, 25)]
pm10_data = pm10_data[columns_to_keep]

# 判斷 01~24 欄位值是否包含 #, *, x, NR, 空白，並將其替換為 -1
for col in [f'{i:02}' for i in range(1, 25)]:
    pm10_data[col] = pm10_data[col].apply(lambda x: -1 if isinstance(x, str) and re.search(r'[#\*\sxNR\s]', x) else x)

# 將處理後的資料輸出
try:
    pm10_data.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"資料處理完成，已輸出至 {output_file}")
except Exception as e:
    print(f"輸出檔案時發生錯誤: {e}")
