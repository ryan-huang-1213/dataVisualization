import pandas as pd

# Define file paths
files = {
    "Cancer_Statistics": "./dataset/癌症發生統計_utf8.csv",
    "Smoking_Rates": "./dataset/18歲以上人口目前吸菸率_utf8.csv",
    "AQI_Merged": "./dataset/AQI_merged_utf8.csv"
}

analysis_results = {}

for file_name, file_path in files.items():
    try:
        # Load the CSV file
        df = pd.read_csv(file_path, encoding="utf-8", low_memory=False)  # Added low_memory=False
        
        # Record the number of rows
        num_rows = len(df)
        
        # Record the column names
        columns = df.columns.tolist()
        
        # Record possible values or ranges for each column
        column_details = {}
        for column in columns:
            unique_values = df[column].dropna().unique()
            if df[column].dropna().apply(lambda x: str(x).replace('.', '', 1).isdigit()).all():
                # Numeric column: record min and max values
                column_details[column] = {
                    "Type": "Numeric",
                    "Range": (df[column].min(), df[column].max())
                }
            else:
                # Non-numeric column: record unique values
                column_details[column] = {
                    "Type": "Categorical",
                    "Unique Values": unique_values[:10].tolist(),  # Show first 10 unique values
                    "Total Unique": len(unique_values)
                }
        
        # Save results
        analysis_results[file_name] = {
            "Number of Rows": num_rows,
            "Columns": columns,
            "Column Details": column_details
        }
    except Exception as e:
        analysis_results[file_name] = {"Error": str(e)}

# Display analysis results
for key, value in analysis_results.items():
    print(f"File: {key}")
    print(f"Number of Rows: {value.get('Number of Rows', 'N/A')}")
    print(f"Columns: {value.get('Columns', 'N/A')}")
    print("Column Details:")
    for col, details in value.get("Column Details", {}).items():
        print(f"  - {col}: {details}")
    print("\n")
