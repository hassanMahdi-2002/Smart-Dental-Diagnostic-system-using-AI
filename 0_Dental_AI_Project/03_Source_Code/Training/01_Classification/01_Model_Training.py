import os
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import numpy as np

TRAIN_CSV = r"D:\Dental_AI_Project\01_Data\03_Classification Data\01_Final CSV\Train_dataset.csv"
VAL_CSV   = r"D:\Dental_AI_Project\01_Data\03_Classification Data\01_Final CSV\Val_dataset.csv"

TRAIN_IMG_DIR = r"D:\Dental_AI_Project\01_Data\03_Classification Data\02_Presentation_Data\Train_Set_Final"
VAL_IMG_DIR   = r"D:\Dental_AI_Project\01_Data\03_Classification Data\02_Presentation_Data\Val_Set_Final"

SAVE_MODEL_DIR = r"D:\Dental_AI_Project\02_Models\02_Classification"
os.makedirs(SAVE_MODEL_DIR, exist_ok=True)
SAVE_MODEL_PATH = os.path.join(SAVE_MODEL_DIR, "Dental_Model_Final.pth")

BATCH_SIZE = 32
LEARNING_RATE = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class DentalDataset(Dataset):
    def __init__(self, csv_file, root_dir, transform=None):
        self.annotations = pd.read_csv(csv_file, sep=';')
        self.root_dir = root_dir
        self.transform = transform
        self.labels_cols = [c for c in self.annotations.columns if c != 'filename']

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
# Data Augmentation 
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
}
def train_engine():
    print("Loading Datasets...")
    
    if not os.path.exists(TRAIN_CSV) or not os.path.exists(VAL_CSV):
        print("Error: CSV files not found. Please run 00_Data_Splitting.py first.")
        return

    train_dataset = DentalDataset(TRAIN_CSV, TRAIN_IMG_DIR, transform=data_transforms['train'])
    val_dataset = DentalDataset(VAL_CSV, VAL_IMG_DIR, transform=data_transforms['val'])
    
    BATCH_SIZE = 32
    LEARNING_RATE = 1e-4
    df_train = pd.read_csv(TRAIN_CSV, sep=';')
    label_cols = [c for c in df_train.columns if c != 'filename']
    
    pos_counts = df_train[label_cols].sum().values
    neg_counts = len(df_train) - pos_counts
    pos_weights = torch.FloatTensor(neg_counts / (pos_counts + 1e-6)).to(DEVICE)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    num_classes = len(label_cols)
    
    print(f"Initializing ResNet50 for {num_classes} classes...")
    model = models.resnet50(weights='IMAGENET1K_V1')
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(DEVICE)
    
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weights)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print("Starting Training Loop...")
    NUM_EPOCHS = 10
    best_acc = 0.0

    for epoch in range(NUM_EPOCHS):
        print(f"\nEpoch {epoch+1}/{NUM_EPOCHS}")
        print("-" * 10)

        # --- Training Phase ---
        model.train()
        running_loss = 0.0
        
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)

        epoch_loss = running_loss / len(train_dataset)
        print(f"Train Loss: {epoch_loss:.4f}")
        
        model.eval()
        val_loss = 0.0
        correct_predictions = 0
        total_predictions = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                preds = torch.sigmoid(outputs) > 0.5
                correct_predictions += (preds == labels).sum().item()
                total_predictions += labels.numel() 
                
        epoch_val_loss = val_loss / len(val_dataset) 
        epoch_acc = correct_predictions / total_predictions
        print(f"Val Loss: {epoch_val_loss:.4f} | Val Accuracy: {epoch_acc:.4f}")
        
        if epoch_acc > best_acc:
            best_acc = epoch_acc
            torch.save(model.state_dict(), SAVE_MODEL_PATH)
            print(" Model Improved & Saved!")
            
    print(f"\n Training Complete! Best Accuracy: {best_acc:.4f}")
    print(f" Model saved to: {SAVE_MODEL_PATH}")
    
if __name__ == '__main__':
    train_engine()
    