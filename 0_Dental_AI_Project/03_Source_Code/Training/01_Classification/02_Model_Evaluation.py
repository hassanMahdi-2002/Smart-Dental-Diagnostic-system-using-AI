import torch
import torch.nn as nn
from torchvision import transforms, models
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import pandas as pd
import numpy as np
import os
from sklearn.metrics import classification_report, multilabel_confusion_matrix, roc_curve, auc
import matplotlib.pyplot as plt
import seaborn as sns

TEST_CSV = r"D:\Dental_AI_Project\01_Data\03_Classification Data\01_Final CSV\Test_dataset.csv"
TEST_IMG_DIR = r"D:\Dental_AI_Project\01_Data\03_Classification Data\02_Presentation_Data\Test_Set_Final"
MODEL_PATH = r"D:\Dental_AI_Project\02_Models\02_Classification\Dental_Model_Final.pth"
OUTPUT_DIR = r"D:\Dental_AI_Project\04_Results\02_Classification\Results_Test"
os.makedirs(OUTPUT_DIR, exist_ok=True)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BATCH_SIZE = 32

class DentalDataset(Dataset):
    def __init__(self, csv_path, root_dir, transform=None):
        self.annotations = pd.read_csv(csv_path, sep=';')
        self.root_dir = root_dir
        self.transform = transform
        self.labels_cols = [c for c in self.annotations.columns if c != 'filename']
        self.class_names = self.labels_cols
        
    def __len__(self): return len(self.annotations)
    
    def __getitem__(self, index):
        raw_path = str(self.annotations.iloc[index, 0])
        file_name = os.path.basename(raw_path)
        img_path = os.path.join(self.root_dir, file_name)
        
        try:
            image = Image.open(img_path).convert("RGB")
        except:
            print(f"Warning: Could not open {img_path}, using black image.")
            image = Image.new('RGB', (224, 224))
            
        labels = torch.tensor(self.annotations.iloc[index][self.labels_cols].values.astype(float), dtype=torch.float32)
        
        if self.transform: image = self.transform(image)
        return image, labels
test_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
print("Loading Test Data...")
if not os.path.exists(TEST_CSV):
    raise FileNotFoundError(f" Error: Test CSV not found at {TEST_CSV}")

dataset = DentalDataset(TEST_CSV, TEST_IMG_DIR, transform=test_transforms)
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)
class_names = dataset.class_names
num_classes = len(class_names)
print(f"Classes Detected: {class_names}")

# Load Model
print("Loading Model...")
model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()

print("Running Inference on Test Set...")
all_preds = []
all_labels = []

with torch.no_grad():
    for inputs, labels in loader:
        inputs = inputs.to(DEVICE)
        outputs = model(inputs)
        probs = torch.sigmoid(outputs)
        
        all_preds.append(probs.cpu().numpy())
        all_labels.append(labels.numpy())

y_pred_probs = np.vstack(all_preds)
y_true = np.vstack(all_labels)
y_pred = (y_pred_probs > 0.5).astype(int)

print(f"Inference Complete. Processed {len(y_true)} images.")

print("Saving Classification Report (Text)...")
report = classification_report(y_true, y_pred, target_names=class_names, zero_division=0)
with open(os.path.join(OUTPUT_DIR, "Final_Test_Report.txt"), "w") as f:
    f.write(report)
print(report) 

print("Saving Detailed Metrics (CSV)...")
mcm = multilabel_confusion_matrix(y_true, y_pred)
metrics_data = []

for i, name in enumerate(class_names):
    tn, fp, fn, tp = mcm[i].ravel()
    
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    f1 = 2 * (precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0
    
    metrics_data.append({
        "Disease": name,
        "TP": tp, "TN": tn, "FP": fp, "FN": fn,
        "Sensitivity (Recall)": round(sensitivity, 4),
        "Specificity": round(specificity, 4),
        "Precision": round(precision, 4),
        "F1-Score": round(f1, 4)
    })

pd.DataFrame(metrics_data).to_csv(os.path.join(OUTPUT_DIR, "Test_Detailed_Metrics.csv"), index=False)

# --- C. ROC Curves ---
print("Plotting ROC Curves...")
plt.figure(figsize=(10, 8))
for i, name in enumerate(class_names):
    fpr, tpr, _ = roc_curve(y_true[:, i], y_pred_probs[:, i])
    roc_auc = auc(fpr, tpr)
    plt.plot(fpr, tpr, lw=2, label=f'{name} (AUC = {roc_auc:.2f})')

plt.plot([0, 1], [0, 1], 'k--', lw=2)
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curves')
plt.legend(loc="lower right")
plt.grid(alpha=0.3)
plt.savefig(os.path.join(OUTPUT_DIR, "Test_ROC_Curves.png"), dpi=300)
plt.close()

print("Plotting Confusion Matrix Grid...")
rows = (len(class_names) + 3) // 4
cols = 4 if len(class_names) >= 4 else len(class_names)
fig, axes = plt.subplots(rows, cols, figsize=(20, 5 * rows))
if rows * cols > 1:
    axes = axes.flatten()
else:
    axes = [axes] 

for i, (matrix, name) in enumerate(zip(mcm, class_names)):
    sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues', ax=axes[i], annot_kws={"size": 14, "weight": "bold"}, cbar=False)
    axes[i].set_title(f"{name}", fontsize=14, fontweight='bold')
    axes[i].set_xlabel('Predicted')
    axes[i].set_ylabel('Actual')
    axes[i].set_xticklabels(['No', 'Yes'])
    axes[i].set_yticklabels(['No', 'Yes'])

for j in range(i + 1, len(axes)): 
    axes[j].axis('off')
    
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "Confusion_Matrix_Grid.png"), dpi=300)
plt.close()

print("Saving Report Table Image...")
report_dict = classification_report(y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0)
df_report = pd.DataFrame(report_dict).transpose()
df_report = df_report.round(2)

plt.figure(figsize=(12, 8))
ax = plt.subplot(111, frame_on=False) 
ax.xaxis.set_visible(False) 
ax.yaxis.set_visible(False)
table = pd.plotting.table(ax, df_report, loc='center', cellLoc='center')
table.auto_set_font_size(False)
table.set_fontsize(12)
table.scale(1.2, 1.2)
plt.title("FINAL CLASSIFICATION REPORT", fontsize=16, weight='bold', pad=20)
plt.savefig(os.path.join(OUTPUT_DIR, "Report_Table_Image.png"), dpi=300, bbox_inches='tight')
plt.close()

print(f"\n ALL DONE! Results saved to: {OUTPUT_DIR}")