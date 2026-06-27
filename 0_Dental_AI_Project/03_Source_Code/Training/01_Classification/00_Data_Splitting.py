import os
import pandas as pd
from sklearn.model_selection import train_test_split
from pathlib import Path

SOURCE_IMAGES_DIR = r"D:\Dental_AI_Project\01_Data\03_Classification Data\00_Row_Data"
OUTPUT_CSV_DIR = r"D:\Dental_AI_Project\01_Data\03_Classification Data\01_Final CSV"
os.makedirs(OUTPUT_CSV_DIR, exist_ok=True)
TRAIN_RATIO = 0.60
VAL_RATIO   = 0.20
TEST_RATIO  = 0.20

print("Starting Data Splitting Pipeline...")
print("Scanning all images...")
data = []

for root, dirs, files in os.walk(SOURCE_IMAGES_DIR):
    for file in files:
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, SOURCE_IMAGES_DIR)
            label = os.path.basename(root)
            data.append({'filename': relative_path, 'label': label})
            
df_all = pd.DataFrame(data)
df_all = pd.get_dummies(df_all, columns=['label'], prefix='', prefix_sep='')
for col in df_all.columns:
    if col != 'filename':
        df_all[col] = df_all[col].astype(int)

print(f"Total Images Found: {len(df_all)}")
print(f"Columns Created: {list(df_all.columns)}")
print("Splitting Data (60% Train - 20% Val - 20% Test)...")

train_df, temp_df = train_test_split(df_all, test_size=(1 - TRAIN_RATIO), random_state=42, shuffle=True)
val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, shuffle=True)

print(f"Final Split Stats:")
print(f"Train Set: {len(train_df)} images")
print(f"Val Set:   {len(val_df)} images")
print(f"Test Set:  {len(test_df)} images")
print("Saving CSV files...")

train_df.to_csv(os.path.join(OUTPUT_CSV_DIR, "Train_dataset.csv"), index=False, sep=';')
val_df.to_csv(os.path.join(OUTPUT_CSV_DIR, "Val_dataset.csv"), index=False, sep=';')
test_df.to_csv(os.path.join(OUTPUT_CSV_DIR, "Test_dataset.csv"), index=False, sep=';')

print(f"🎉 Data Splitting Complete! Files saved to:\n{OUTPUT_CSV_DIR}")