import pandas as pd

# 讀取 CSV 文件
file_path = './dataset/18歲以上人口目前吸菸率_utf8.csv'
data = pd.read_csv(file_path)

data.rename(columns={data.columns[0]: 'year'}, inplace=True)

if '類別' in data.columns:
    data = data[data['類別'].str.contains('年齡別=|整體', na=False)]

# 修改「類別」欄位，移除「年齡別=」和「歲」，並將空格改為連字號
if '類別' in data.columns:
    data['類別'] = data['類別'].str.replace('年齡別=', '', regex=False).str.replace('歲', '', regex=False)
    data['類別'] = data['類別'].str.replace('以上', ' up', regex=False)
    data['類別'] = data['類別'].str.replace('整體', 'All', regex=False)

# 儲存修改後的結果到新的 CSV 文件
output_path = './dataset/updated_smoking_rate_data.csv'
data.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"已成功處理並儲存到 {output_path}")
