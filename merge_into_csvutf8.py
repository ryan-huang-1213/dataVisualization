import os
import pandas as pd

def find_ods_files(root_dir):
    """遞歸搜索目錄，找到所有的 .ods 文件"""
    ods_files = []
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".ods"):
                full_path = os.path.join(root, file)
                ods_files.append(full_path)
                print(f"Found ODS file: {full_path}")  # 新增的列印訊息
    return ods_files

def convert_ods_to_csv(ods_file, output_csv_file):
    """將 .ods 文件轉換為 .csv 格式"""
    try:
        # 使用 pandas 讀取 .ods 文件
        df = pd.read_excel(ods_file, engine="odf")
        # 移除第一列（假設是欄位名稱）
        df = df.iloc[1:]
        # 保存為 CSV 文件
        df.to_csv(output_csv_file, index=False, encoding="utf-8")
        print(f"Converted: {ods_file} -> {output_csv_file}")
    except Exception as e:
        print(f"Failed to convert {ods_file}: {e}")

def process_all_ods_files(root_dir, output_file):
    """處理所有 .ods 文件並合併為單一的 CSV 文件"""
    ods_files = find_ods_files(root_dir)
    all_data = []
    
    if not ods_files:
        print("No ODS files found in the specified directory.")
        return

    for ods_file in ods_files:
        try:
            # 讀取 .ods 文件
            df = pd.read_excel(ods_file, engine="odf")
            print(f"Processing file: {ods_file}")  # 新增的列印訊息
            # 移除第一列（假設是欄位名稱）
            df = df.iloc[1:]
            # 添加到總集合
            all_data.append(df)
        except Exception as e:
            print(f"Error processing {ods_file}: {e}")

    # 合併所有資料
    if all_data:
        merged_data = pd.concat(all_data, ignore_index=True)
        # 儲存為 UTF-8 編碼的 CSV 文件
        merged_data.to_csv(output_file, index=False, encoding="utf-8")
        print(f"All files merged into: {output_file}")
    else:
        print("No data to merge.")

if __name__ == "__main__":
    # 根目錄路徑
    root_directory = "./dataset/AQI/"
    # 輸出的合併 CSV 文件
    output_csv = "./dataset/AQI_merged_utf8.csv"
    
    process_all_ods_files(root_directory, output_csv)
