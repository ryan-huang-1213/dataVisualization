import pandas as pd

# Load the CSV file
file_path = './dataset/AQI_merged_utf8_cleaned.csv'
output_path = './dataset/AQI_merged_utf8_cleaned.csv'

# Read the CSV file
df = pd.read_csv(file_path)

# Modify the '日期' column by removing '/' characters
df.loc[df["測站"] == '三民', 'county'] = '高雄市'
df.loc[df["測站"] == '台中', 'county'] = '台中市'
df.loc[df["測站"] == '泰山', 'county'] = '新北市'

# Save the cleaned dataframe to a new CSV file
df.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"Processed file saved to {output_path}")
