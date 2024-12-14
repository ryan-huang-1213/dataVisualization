import os
import pandas as pd
import chardet

def find_files_with_pattern(root_dir, pattern):
    """遞歸搜索目錄，找到符合模式的檔案"""
    matching_files = []
    for root, _, files in os.walk(root_dir):
        for file in files:
            if pattern in root and (file.endswith(".xls") or file.endswith(".csv")):
                matching_files.append(os.path.join(root, file))
    return matching_files

def detect_file_encoding(file_path):
    """檢測文件編碼"""
    with open(file_path, 'rb') as f:
        raw_data = f.read()
    result = chardet.detect(raw_data)
    if result['encoding'] == 'GB2312': result['encoding'] = 'GB18030'
    return result['encoding']

def convert_xls_to_csv(xls_file):
    """將 .xls 文件轉換為 .csv 格式，返回對應的 CSV 文件路徑"""
    output_csv_file = xls_file.replace(".xls", ".csv")
    try:
        df = pd.read_excel(xls_file)
        df.to_csv(output_csv_file, index=False, encoding="utf-8")
        print(f"Converted: {xls_file} -> {output_csv_file}")
    except Exception as e:
        print(f"Failed to convert {xls_file}: {e}")
    return output_csv_file

def process_and_merge_files(root_dir, output_file):
    """處理所有 .xls 和 .csv 檔案並合併為單一 CSV 文件"""
    # 遞歸找到所有符合條件的檔案
    all_files = find_files_with_pattern(root_dir, "_HOUR_00")
    all_data = []

    if not all_files:
        print("No matching files found in the specified directory.")
        return

    for file in all_files:
        try:
            if file.endswith(".xls"):
                file = convert_xls_to_csv(file)  # 轉換為 CSV
            # 檢測文件編碼
            encoding = detect_file_encoding(file)
            print(f"Detected encoding for {file}: {encoding}")
            # 讀取 CSV 檔案
            df = pd.read_csv(file, encoding=encoding)
            print(f"Processing file: {file}")
            all_data.append(df)
        except Exception as e:
            print(f"Error processing {file}: {e}")

    # 合併所有資料
    if all_data:
        merged_data = pd.concat(all_data, ignore_index=True)
        merged_data.to_csv(output_file, index=False, encoding="utf-8")
        print(f"All files merged into: {output_file}")
    else:
        print("No data to merge.")

if __name__ == "__main__":
    # 根目錄路徑
    root_directory = "./dataset/AQI/"
    # 輸出的合併 CSV 文件
    output_csv = "./dataset/AQI_merged_utf8.csv"

    process_and_merge_files(root_directory, output_csv)
