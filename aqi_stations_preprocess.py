import pandas as pd

input_file = './dataset/空氣品質監測站基本資料.csv'
output_file = './dataset/空氣品質監測站基本資料_processed.csv'

# 載入 CSV 資料
try:
    data = pd.read_csv(input_file)
except Exception as e:
    print(f"讀取檔案時發生錯誤: {e}")
    exit()

# 保留所需欄位
required_columns = ["sitename", "county", "township", "twd97lon", "twd97lat"]
try:
    filtered_data = data[required_columns]
except KeyError as e:
    print(f"資料中缺少必要的欄位: {e}")
    exit()

# 將處理後的資料輸出
try:
    filtered_data.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"資料處理完成，已輸出至 {output_file}")
except Exception as e:
    print(f"輸出檔案時發生錯誤: {e}")
