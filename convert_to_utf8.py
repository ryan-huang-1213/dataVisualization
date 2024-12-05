# 這是一個將兩個 .csv 檔案轉換成 utf-8 格式的檔案
# 政府的東西真的很老，都在用 big5 :(
import cchardet

def detect_encoding(file_path):
    with open(file_path, 'rb') as file:
        raw_data = file.read(1024)  # 讀取前 1KB 數據
        result = cchardet.detect(raw_data)
        encoding = result['encoding']
        confidence = result['confidence']
        return encoding, confidence

def convert_to_utf8(input_file, output_file):
    detected_encoding, confidence = detect_encoding(input_file)
    if detected_encoding:
        print(f"Detected encoding: {detected_encoding} (Confidence: {confidence:.2f})")
        with open(input_file, 'r', encoding=detected_encoding) as infile:
            content = infile.read()
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.write(content)
        print(f"File converted to UTF-8 and saved as: {output_file}")
    else:
        print("Encoding could not be detected.")

if __name__ == "__main__":
    # 檔案路徑
    files_to_convert = [
        "./dataset/18歲以上人口目前吸菸率.csv",
        "./dataset/癌症發生統計.csv"
    ]

    for file_path in files_to_convert:
        output_path = file_path.replace(".csv", "_utf8.csv")  # 轉換後文件的名稱
        convert_to_utf8(file_path, output_path)
