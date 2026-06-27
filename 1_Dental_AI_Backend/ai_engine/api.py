import os
import uuid
from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)
from fastapi import FastAPI, UploadFile, File, Form
import shutil
import uvicorn

from process_image import load_models, analyze_image
app = FastAPI(title="Dental AI API")

print("Loading AI Models into memory... This might take a few minutes.")
cls_model, yolo_model, nlp_engine, device = load_models()
print("Models loaded successfully! Server is lightning fast now.")
@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...), medical_history: str = Form("None")):
    unique_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
    temp_image_path = os.path.join(os.getcwd(), unique_filename)
    with open(temp_image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        result = analyze_image(
            image_path=temp_image_path,
            cls_model=cls_model,
            yolo_model=yolo_model,
            nlp_engine=nlp_engine,
            device=device,
            medical_history=medical_history
        )
        return result
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)