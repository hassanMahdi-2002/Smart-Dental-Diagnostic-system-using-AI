from ultralytics import YOLO
import torch
def train_model():
    if torch.cuda.is_available():
        print(f"Graphics card detected: {torch.cuda.get_device_name(0)}")
        device = 0
    else:
        print("Warning: The training will run on the CPU (it will be very slow).")
        device = 'cpu'
        
        
    model = YOLO('yolov8m.pt')  
    print("Run 5 (The Big One) training has begun...")
    results = model.train(
        data=r"D:\Dental_AI_Project\01_Data\02_Detection Data\dataset_final\data.yaml",
        epochs=100,
        imgsz=640,
        batch=16,
        name='Run5_Final_5Classes',
        patience=25,
        device=device,
        workers=2,
        save=True,
        save_period=5
    )
    print("Training completed successfully!")
    
    
if __name__ == '__main__':
    train_model()