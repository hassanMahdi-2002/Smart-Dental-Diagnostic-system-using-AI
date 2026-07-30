# 🦷 Intelligent Dental AI System

## 📌 Project Overview
A comprehensive, full-stack AI-powered platform designed to assist in dental diagnostics and clinical reporting. This graduation project integrates state-of-the-art computer vision models for object detection and image classification with a robust backend and natural language processing for automated medical report generation. 

Our goal is to empower dentists with high-precision AI tools that enhance diagnostic accuracy, streamline patient record management, and generate patient-friendly clinical reports.

## 🚀 Key Features
* **Multi-Disease Classification:** Accurately classifies 8 different conditions, including Caries, Gingivitis, Ulcers, Tooth Discoloration, Calculus, Hypodontia, Oral Cancer, and Healthy teeth.
* **Precise Object Detection:** Localizes affected areas (e.g., cavities, calculus) using bounding boxes for immediate clinical focus.
* **Smart Clinical Reports:** Utilizes Large Language Models (LLMs) to generate detailed, structured, and easy-to-understand diagnostic reports based on the AI's visual findings.
* **Secure Patient Management:** Full RESTful API connected to a secure database to handle patient histories and clinical data seamlessly.

## 🛠️ Tech Stack
* **Frontend:** React.js, HTML, CSS, JavaScript (MERN Stack Environment)
* **Backend:** Node.js, Express.js, MongoDB
* **AI & Machine Learning:** Python, PyTorch, Ultralytics YOLOv8 (Detection), ResNet50 (Classification)
* **NLP Engine:** Google Gemini AI

## 📊 AI Performance & Clinical Safety
Ensuring clinical reliability was our top priority. Our models were trained, validated, and tested on a meticulously curated dataset of over 15,000 images.

* **Classification Model (ResNet50):** 
  * Achieved an overall F1-Score of **90%** on the unseen test set. 
  * **Clinical Safety Highlight:** The model is highly sensitive to critical cases, achieving a **96% Recall for Oral Cancer** and **99% Recall for Mouth Ulcers**, drastically minimizing false negatives.
* **Detection Model (YOLOv8m):** 
  * Achieved an overall mAP@0.5 of **74.5%**.
  * Showcased peak precision in Ulcer detection with a 93.2% mAP.

### 📈 Visualizing AI Performance

**Classification ROC Curves (ResNet50):**
![Classification ROC Curves](images/Test_ROC_Curves.png)

**Detection Precision-Recall Curve (YOLOv8m):**
![Detection Precision-Recall](images/BoxPR_curve.png)

##  Developer
Developed as a 2026 Graduation Project for the **Modern Academy for Engineering and Technology**.

* **Hassan Mahdi Hassan Diab** (Full-Stack & AI Integration)

*This repository contains the AI engine and the system configuration files. Future updates will include advanced handling for class imbalances (e.g., Gingivitis) and dynamic UI improvements.*

## ⚙️ Backend Architecture (Node.js & Express)

The backend is built with a clean MVC (Model-View-Controller) architecture, ensuring scalability and secure data handling. It acts as the orchestrator between the client, the database, and the AI engine.

### Core Features:
* **Robust AI Engine Communication:** Utilizes `axios` and `FormData` to securely stream patient images to the Python FastAPI server. Features a built-in **3-retry mechanism** to handle AI server timeouts or heavy loads gracefully.
* **Smart AI Chat Agent:** Integrates Google Gemini 2.5 Flash via `@google/generative-ai`. The agent is equipped with custom Tool Calling (`get_patient_diagnosis`) allowing it to fetch patient medical history directly from the MongoDB database for context-aware responses.
* **Centralized Error Handling:** A global error middleware intercepts Mongoose validation errors, MongoDB duplicate keys (e.g., duplicate emails), and Multer file size limits (max 5MB), returning unified JSON error responses.
* **Security & Auth:** Secure endpoints using JWT authentication and Bcrypt password hashing.

### Database Models (MongoDB):
* `Patient`: Stores user demographics and medical history.
* `Diagnosis`: Stores the generated image paths, AI confidence scores, and analysis status.
* `MedicalReport`: Relational data linked to a specific diagnosis, containing generated medical advice and urgency levels.
* `ChatSession`: Maintains context and history for patient-AI conversational sessions.

### 📡 API Endpoints Reference
Here is a summary of the core RESTful APIs available:

**Authentication (`/api/auth`)**
* `POST /register`: Register a new patient.
* `POST /login`: Authenticate and receive a JWT token.
* `GET /profile`: Get logged-in user details (Protected).
* `PATCH /profile`: Update user information (Protected).

**Diagnosis & AI (`/api/diagnoses`)**
* `POST /predict`: Upload a dental image for AI analysis (Protected).
* `GET /history`: Fetch patient's diagnosis history with pagination (Protected).
* `GET /:id`: Retrieve details of a specific diagnosis (Protected).
* `DELETE /:id`: Delete a diagnosis and its associated files (Protected).
* `GET /report/:id`: Fetch the AI-generated medical report (Protected).

**AI Chat Agent (`/api/diagnoses/agent-chat`)**
* `POST /`: Send a message to the Gemini AI Agent with contextual awareness (Protected).
* `GET /:diagnosisId`: Retrieve chat history for a specific diagnosis session (Protected).

## 💻 Frontend Architecture (React.js)

The user interface is built with React.js, focusing on a seamless, responsive, and clinic-ready user experience. It consumes the RESTful APIs to bring the AI dental analysis to life.

### Core Features:
* **Dynamic AI Visualization:** Intelligently maps YOLOv8 bounding boxes onto the uploaded intra-oral images using relative percentage calculations, ensuring accurate defect localization across all screen sizes.
* **Interactive AI Chat Interface:** A dedicated chat UI (`ChatSession`) that maintains context via `localStorage`, allowing patients or doctors to discuss specific generated reports directly with the Gemini AI agent.
* **Print-Ready Medical Reports:** Custom CSS print media queries (`@media print`) and a dedicated `ReportView` component allow doctors to instantly export and print clean, professional PDF reports for their patients.
* **Responsive Dashboard & Profile:** Fully responsive CSS grid/flex layouts ensuring perfect rendering on both desktop and mobile. Includes a complete patient profile to track historical scans, confidence scores, and urgency levels.
* **Secure State Management:** Handles JWT-based authentication flows, protecting routes and managing user sessions gracefully.
