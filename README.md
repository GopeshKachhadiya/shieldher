# 🛡️ ShieldHer — Cyber-Integrated Safety Platform for Women

> Empowering women with a digital shield — bridging physical emergency response and proactive digital safety through an integrated Cyber Crime Platform.

![ShieldHer Platform](https://img.shields.io/badge/Status-Active-brightgreen)
![Hackathon](https://img.shields.io/badge/KanadShield-Hackathon-blue)
![Problem Statement](https://img.shields.io/badge/PS-69EEFD950B72D-orange)
![Tech Stack](https://img.shields.io/badge/React-19-blue)
![Tech Stack](https://img.shields.io/badge/Python-FastAPI-teal)

## 📌 Project Overview

**ShieldHer** is a Unified Cyber-Physical Safety Platform designed specifically for women. Acting as a Single Point of Contact (SPOC), it bridges the gap between emergency response (ERSS 112), cybercrime reporting, and proactive digital safety mechanisms. 

It was built as part of the **KanadShield Hackathon (Problem Statement: PS-69EEFD950B72D)** in collaboration with the Cyber Crime Branch, Ahmedabad City.

## ✨ Key Features

### For Users
- **🚨 One-Touch SOS & Silent Panic Mode**: Instantly alert police and trusted guardians with live location tracking. 
- **🕵️‍♀️ Cybercrime Reporting**: Report stalking, harassment, or financial fraud with structured evidence upload (tamper-proof hashes).
- **🛡️ AI Threat Detection**: Real-time link and domain scanning to prevent phishing and identify fraudulent URLs.
- **📍 Safety Heatmaps & Unsafe Zone Alerts**: Identify high-risk geographical areas based on past incident reports.

### For Police & Cyber Cell
- **🗺️ Live Command Center**: Real-time incident map showing active SOS calls with automatic prioritization.
- **📁 Case Management Dashboard**: Efficiently review incoming cyber complaints and evidence.
- **📈 Analytics**: Monitor crime trends, response times, and hotspot areas.

---

## 🛠️ Technology Stack

### Frontend (Web Application)
- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM
- **Icons & UI**: Lucide React, Framer Motion
- **Data Visualization**: Recharts

### Backend / AI Engine (Python)
- **Framework**: FastAPI (Python 3)
- **ML Models**: Random Forest Classifier for Phishing/Malware Detection
- **Feature Extraction**: Real-time URL and domain parsing heuristics
- **Data Toolkit**: scikit-learn, joblib, urllib

---

## 📂 Project Structure

```text
📦 shieldher
 ┣ 📂 shieldher-ai/        # Machine Learning & AI Backend
 ┃ ┣ 📂 data/              # Dataset generation tools
 ┃ ┣ 📂 features/          # ML Feature extractors
 ┃ ┣ 📂 models/            # Model inference logic
 ┃ ┣ 📂 saved_models/      # Trained .pkl models
 ┃ ┣ 📜 main.py            # FastAPI Server entry point
 ┃ ┗ 📜 train.py           # Model training script
 ┣ 📂 src/                 # React Frontend Client
 ┃ ┣ 📂 components/        # Reusable UI elements (SOS, Maps, Navs)
 ┃ ┣ 📂 data/              # Mock databases & translations
 ┃ ┣ 📂 pages/             # App views (User + Police dashboards)
 ┃ ┣ 📜 App.tsx            # Main Application router
 ┃ ┗ 📜 index.css          # Global Tailwind styles
 ┣ 📜 README.md            # This documentation file
 ┗ 📜 package.json         # Node.js dependencies
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/GopeshKachhadiya/shieldher.git
cd shieldher
```

### 2. Setup the Frontend (React / Vite)
Open a terminal in the root directory:
```bash
# Install Node modules
npm install

# Start the development server
npm run dev
```
The application will run on `http://localhost:5173`.

### 3. Setup the AI Backend (FastAPI)
Open a separate terminal and navigate to the AI directory:
```bash
cd shieldher-ai

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The AI safety agent will be live at `http://localhost:8000`. You can access the interactive API docs at `http://localhost:8000/docs`.

---

## 🤖 Machine Learning Agent Details

The built-in ML Agent continuously monitors links submitted by users in the "Safety Hub". It extracts features from the URLs (e.g., domain length, presence of '@', multiple subdomains, HTTPS usage) and passes them through a pre-trained **Random Forest** model. It returns an instant risk score and categorization:
- **Safe**
- **Suspicious**
- **Phishing/Malware**

*(Note: Raw domain inputs like `www.amazon.in` are automatically normalized, and a whitelist is implemented to prevent false positives on highly trusted global domains).*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for women's safety.*
