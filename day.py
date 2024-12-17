import pandas as pd

# Load the CSV file
file_path = './dataset/AQI_merged_utf8_processed.csv'
output_path = './dataset/AQI_merged_utf8_cleaned.csv'

# Read the CSV file
df = pd.read_csv(file_path)

# Modify the '日期' column by removing '/' characters
df['日期'] = df['日期'].str.replace('/', '', regex=False)

# Save the cleaned dataframe to a new CSV file
df.to_csv(output_path, index=False, encoding='utf-8-sig')

print(f"Processed file saved to {output_path}")
