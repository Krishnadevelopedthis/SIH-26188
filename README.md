DOCSCREEN — AI-Assisted Passport \& Document Screening



SIH 2026 — Problem Statement SIH26188



DOCSCREEN is an AI-assisted document screening system designed for high-volume immigration and airport checkpoints.



The system performs rapid passport verification using:



OCR-based passport text extraction



MRZ extraction and check-digit validation



Passport expiry validation



Forensic image analysis



Machine-learning-based tampering/anomaly detection



Explainable risk scoring



CLEAR / REVIEW / HIGH-RISK classification



Officer verification dashboard



Verification history



Important: DOCSCREEN is a proof-of-concept screening system. It provides an explainable risk assessment and prioritizes suspicious documents for human inspection. It does not claim to autonomously determine that a passport is genuine or fraudulent.



System Architecture



&#x20;                PASSPORT IMAGE

&#x20;                      │

&#x20;                      ▼

&#x20;             ┌─────────────────┐

&#x20;             │  Image Upload   │

&#x20;             └────────┬────────┘

&#x20;                      │

&#x20;                      ▼

&#x20;             ┌─────────────────┐

&#x20;             │     OCR         │

&#x20;             │   PaddleOCR     │

&#x20;             └────────┬────────┘

&#x20;                      │

&#x20;                      ▼

&#x20;             ┌─────────────────┐

&#x20;             │  MRZ Extraction │

&#x20;             │ + Validation     │

&#x20;             └────────┬────────┘

&#x20;                      │

&#x20;            ┌─────────┴──────────┐

&#x20;            ▼                    ▼

&#x20;     Expiry Validation      Forensic ML

&#x20;                                 │

&#x20;                                 ▼

&#x20;                        Tampering Signal

&#x20;            └─────────┬──────────┘

&#x20;                      │

&#x20;                      ▼

&#x20;             ┌─────────────────┐

&#x20;             │   Risk Engine   │

&#x20;             └────────┬────────┘

&#x20;                      │

&#x20;         ┌────────────┼────────────┐

&#x20;         ▼            ▼            ▼

&#x20;      CLEAR         REVIEW     HIGH-RISK

&#x20;         │            │            │

&#x20;         ▼            ▼            ▼

&#x20;     Auto-clear   Human review   Escalation



Project Structure



SIH-26188/

│

├── backend/

│   ├── app/

│   │   ├── api/

│   │   ├── models/

│   │   ├── schemas/

│   │   ├── services/

│   │   └── main.py

│   │

│   ├── requirements.txt

│   └── README.md

│

├── frontend/

│   ├── src/

│   │   ├── api/

│   │   ├── components/

│   │   ├── hooks/

│   │   └── pages/

│   │

│   ├── package.json

│   └── README.md

│

├── ml/

│   ├── src/

│   │   ├── features/

│   │   ├── inference/

│   │   ├── training/

│   │   └── evaluation/

│   │

│   ├── models/

│   │   └── tampering\_random\_forest.joblib

│   │

│   └── requirements.txt

│

├── data/

│   ├── demo\_dataset/

│   │   ├── genuine/

│   │   └── tampered/

│   │

│   └── README.md

│

├── docs/

│

└── README.md



Requirements



Software



Recommended environment:



Software



Version



Python



3.12.x



Node.js



18+



npm



Comes with Node.js



Git



Current version



OS



Windows / Linux / macOS



The current development environment has been tested with Python 3.12.



Hardware



A GPU is not required.



The OCR pipeline is configured to run on CPU using lightweight PaddleOCR models.



If PaddleOCR has not downloaded its models before, the first OCR execution may take longer while the required models are downloaded/cached.



1\. Clone the Repository



Clone the repository:



git clone https://github.com/mishra-codes/SIH-26188.git

cd SIH-26188



Switch to the shared integration branch:



git checkout feature/integration



Pull the latest version:



git pull origin feature/integration



2\. Backend + ML Setup



From the repository root:



python --version



Make sure Python 3.12.x is being used.



Create a virtual environment:



python -m venv .venv



Activate it on Windows:



.venv\\Scripts\\activate



You should see something similar to:



(.venv) PS C:\\Dev\\SIH-26188>



Upgrade pip:



python -m pip install --upgrade pip



Install ML Dependencies



Run:



pip install -r ml\\requirements.txt



This installs the dependencies required for:



PaddleOCR



PaddlePaddle



OpenCV



Pillow



pandas



scikit-learn



joblib



forensic feature extraction



ML inference



Install Backend Dependencies



Run:



pip install -r backend\\requirements.txt



3\. Verify the ML Model



The repository contains the trained PoC model:



ml/models/tampering\_random\_forest.joblib



You do not need to retrain the model to run the application.



The backend automatically loads this model during verification.



On Windows PowerShell, check that it exists:



Test-Path ml\\models\\tampering\_random\_forest.joblib



Expected:



True



4\. Start the Backend



Make sure the virtual environment is activated.



From the repository root:



uvicorn backend.app.main:app --reload --port 8000



Expected output will contain something similar to:



Uvicorn running on http://127.0.0.1:8000



Keep this terminal running.



5\. Test the Backend



Open a second terminal.



Activate the virtual environment again:



cd SIH-26188

.venv\\Scripts\\activate



Open:



http://localhost:8000/health



The response should be:



{

&#x20; "status": "ok",

&#x20; "service": "document-screening-api"

}



6\. Backend API



The main verification endpoint is:



POST /verify



Full URL:



http://localhost:8000/verify



The endpoint accepts:



JPEG



PNG



Example request:



POST /verify

Content-Type: multipart/form-data

file=<passport image>



Example response:



{

&#x20; "status": "REVIEW",

&#x20; "risk\_score": 30,

&#x20; "document": {

&#x20;   "document\_type": "passport",

&#x20;   "passport\_number": "S4528425",

&#x20;   "name": "JORDAN TESTOV",

&#x20;   "nationality": "SYN",

&#x20;   "date\_of\_birth": "1969-09-25",

&#x20;   "date\_of\_expiry": "2028-03-22",

&#x20;   "issuing\_country": "SYN"

&#x20; },

&#x20; "checks": {

&#x20;   "ocr": "PASS",

&#x20;   "mrz": "PASS",

&#x20;   "expiry": "PASS",

&#x20;   "tampering": "SUSPICIOUS",

&#x20;   "face": "NOT\_RUN",

&#x20;   "consistency": "NOT\_RUN"

&#x20; }

}



7\. Frontend Setup



Open another terminal.



From the repository root:



cd frontend



Install dependencies:



npm install



Start the development server:



npm run dev



You should get a URL similar to:



http://localhost:5173



Open it in your browser.



8\. Run the Complete Application



You need two terminals running simultaneously.



Terminal 1 — Backend



cd SIH-26188

.venv\\Scripts\\activate

uvicorn backend.app.main:app --reload --port 8000



Terminal 2 — Frontend



cd SIH-26188\\frontend

npm run dev



Then open:



http://localhost:5173



9\. Verify a Passport



From the dashboard:



Dashboard

&#x20;   ↓

Verify

&#x20;   ↓

Upload passport image

&#x20;   ↓

Verify Document



The system will perform:



OCR Extraction

&#x20;     ↓

MRZ Validation

&#x20;     ↓

Expiry Check

&#x20;     ↓

Forensic ML

&#x20;     ↓

Risk Fusion

&#x20;     ↓

Final Decision



The UI displays:



Passport preview



Passport number



Full name



Nationality



Date of birth



Date of expiry



Issuing country



OCR status



MRZ status



Expiry status



Tampering status



Risk score



Risk factors



Verification history



10\. Risk Classification



The current risk engine uses three decision levels:



0–29

&#x20; ↓

CLEAR



30–69

&#x20; ↓

REVIEW



70–100

&#x20; ↓

HIGH-RISK



CLEAR



The document passes the available checks and has a sufficiently low combined risk score.



REVIEW



The system detects an anomaly or suspicious signal and recommends human inspection.



HIGH-RISK



Multiple verification failures and/or strong suspicious signals result in a high combined risk score.



11\. Demo Dataset



A controlled synthetic dataset is included in:



data/demo\_dataset/



It contains:



genuine/

&#x20;   DOC001

&#x20;   DOC002

&#x20;   ...

&#x20;   DOC020



tampered/

&#x20;   DOC001\_copy\_paste

&#x20;   DOC001\_portrait

&#x20;   DOC001\_region

&#x20;   DOC001\_text

&#x20;   ...



The tampered dataset contains four controlled manipulation categories:



copy\_paste

portrait

region

text



The dataset is intended for:



Development



Testing



Model evaluation



Demonstration



Reproducible experimentation



12\. Recommended Demo Samples



For the SIH demonstration, use the synthetic controlled dataset rather than relying exclusively on arbitrary real-world passports.



The system has been tested to demonstrate:



🟢 CLEAR

&#x20;     ↓

Low-risk document



🟠 REVIEW

&#x20;     ↓

Suspicious/anomalous signal



🔴 HIGH-RISK

&#x20;     ↓

Multiple verification failures



This demonstrates the complete decision pipeline.



13\. Important ML Limitation



The forensic ML model is a PoC model trained using controlled synthetic document data.



Therefore:



A high forensic model score does not automatically mean that a real passport is fraudulent.



Real-world passports can have different:



layouts



printing characteristics



image quality



compression



security backgrounds



lighting



scanning/camera characteristics



document designs



The system therefore treats forensic ML as one risk signal rather than an autonomous final decision.



Production deployment would require:



larger representative datasets



genuine and fraudulent real-world samples



model calibration



broader document coverage



threshold validation



additional identity/document consistency checks



operational security testing



14\. Current PoC Scope



Implemented



Passport image upload



OCR



MRZ extraction



MRZ check-digit validation



Passport number extraction



Name extraction



Nationality extraction



Date of birth extraction



Expiry extraction



Expiry validation



Forensic feature extraction



Random Forest tampering classifier



Risk fusion



CLEAR / REVIEW / HIGH-RISK



Explainable risk factors



Verification history



Officer dashboard



Controlled demo dataset



Planned / Future



Face verification



Cross-document consistency



Advanced document forensics



Larger real-world training dataset



Model calibration



Production deployment



Database-backed persistent history



15\. Running Tests



Backend tests:



pytest backend



ML tests:



pytest ml



Run all tests:



pytest



16\. Frontend Commands



From:



cd frontend



Development



npm run dev



Production build



npm run build



Lint



npm run lint



Preview production build



npm run preview



17\. Git Workflow for the Team



Do not directly develop on main.



The shared working branch is:



feature/integration



Before starting work:



git checkout feature/integration

git pull origin feature/integration



Create your own feature branch:



git checkout -b feature/<your-feature>



Example:



git checkout -b feature/face-verification



After making changes:



git status

git add <specific-files>

git commit -m "feat: add face verification"

git push origin feature/face-verification



Then create a Pull Request:



feature/<your-feature>

&#x20;       ↓

feature/integration



After review and testing, changes can eventually be merged into:



main



Important



Avoid:



git add .



unless you have checked exactly what will be committed.



Never commit:



.venv/

\_\_pycache\_\_/

API keys

passwords

secrets

real passport images

personal identity documents



18\. Quick Start



For teammates who just want the shortest setup:



Clone



git clone https://github.com/mishra-codes/SIH-26188.git

cd SIH-26188

git checkout feature/integration



Python environment



python -m venv .venv

.venv\\Scripts\\activate

python -m pip install --upgrade pip

pip install -r ml\\requirements.txt

pip install -r backend\\requirements.txt



Start backend



uvicorn backend.app.main:app --reload --port 8000



New terminal → frontend



cd SIH-26188\\frontend

npm install

npm run dev



Open



http://localhost:5173



That's it.



SIH Project Objective



DOCSCREEN aims to reduce manual workload at high-volume immigration checkpoints by performing rapid first-line document screening.



The core principle is:



Automatically clear low-risk documents while prioritizing suspicious cases for human inspection.



The system is designed as an AI-assisted screening layer, not a replacement for immigration officers or official document-issuing authorities.



Team



SIH 2026 — SIH26188



AI-Assisted Fake Identity \& Document Screening System

