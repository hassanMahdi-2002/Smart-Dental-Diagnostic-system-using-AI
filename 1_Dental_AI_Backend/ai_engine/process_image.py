import sys
import json
import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np
from ultralytics import YOLO

os.environ["YOLO_VERBOSE"] = "False"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

current_dir = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(current_dir, "weights")

CLASS_MODEL_PATH = os.path.join(WEIGHTS_DIR, "Dental_Model_Final.pth")
YOLO_MODEL_PATH = os.path.join(WEIGHTS_DIR, "best.pt")

CLASS_NAMES = [
    'Tooth Discoloration', 'Gingivitis', 'Healthy', 
    'Hypodontia', 'Mouth Ulcer', 'Calculus', 
    'cancer', 'Caries'
]

def load_models():
    """تحميل الموديلات مرة واحدة فقط عند تشغيل api.py"""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    cls_model = models.resnet50(weights=None)
    cls_model.fc = nn.Linear(cls_model.fc.in_features, len(CLASS_NAMES))
    
    try:
        state_dict = torch.load(CLASS_MODEL_PATH, map_location=device)
        cls_model.load_state_dict(state_dict)
        cls_model = cls_model.to(device)
        cls_model.eval()
    except Exception as e:
        print(f"Error loading ResNet: {e}")
        return None, None, None, str(e)
        
    try:
        yolo_model = YOLO(YOLO_MODEL_PATH)
    except Exception as e:
        print(f"Error loading YOLO: {e}")
        return None, None, None, str(e)
    
    from nlp_engine import DentalNLP
    API_KEY = os.environ.get("GOOGLE_API_KEY")
    nlp = DentalNLP(api_key=API_KEY)
    
    return cls_model, yolo_model, nlp, device

def analyze_image(image_path, cls_model, yolo_model, nlp_engine, device, medical_history="None"):
    """الفانكشن دي بتستلم الموديلات جاهزة من api.py وبتحلل فوراً"""
    try:
        pil_image = Image.open(image_path).convert("RGB")
        np_image = np.array(pil_image)

        # 1. Classification (ResNet)
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        img_tensor = transform(pil_image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = cls_model(img_tensor)
            probs = torch.sigmoid(outputs).squeeze().cpu().numpy()

        found_diseases = []
        highest_prob = 0
        primary_disease = "Healthy"

        for i, prob in enumerate(probs):
            name = CLASS_NAMES[i]
            percentage = float(prob) * 100
            if percentage > 50.0:
                found_diseases.append({"disease": name, "confidence": round(percentage, 2)})
                if percentage > highest_prob:
                    highest_prob = percentage
                    primary_disease = name

        if not found_diseases:
            found_diseases.append({"disease": "Healthy", "confidence": 0.0})

        # 2. Detection (YOLO)
        yolo_results = yolo_model(np_image, verbose=False)
        detections = []
        for box in yolo_results[0].boxes:
            coords = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            label = yolo_results[0].names[int(box.cls[0])]
            detections.append({
                "box": [round(c) for c in coords],
                "label": label,
                "confidence": round(conf, 2)
            })

        ai_report = nlp_engine.generate_ai_report(found_diseases, primary_disease, medical_history)

        return {
            "classification": found_diseases,
            "primary_diagnosis": primary_disease,
            "detection": detections,
            "nlp_reports": [ai_report] 
        }
    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}