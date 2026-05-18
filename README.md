# MailGuard AI 🛡️

> **AI-Powered Email Security & Inbox Intelligence Platform**  
> Real-time spam detection, phishing analysis, Gmail monitoring, and threat analytics.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask)](https://flask.palletsprojects.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Firebase Auth** | Google Sign-In + Email/Password + Password Reset |
| 📧 **Gmail Integration** | OAuth2 read-only access — scans your real inbox |
| 🤖 **AI Email Scanner** | ML model (TF-IDF + Logistic Regression) + multi-factor threat engine |
| 📊 **Dashboard** | Live activity feed, area/pie charts, stat cards |
| 🎯 **Threat Center** | Radar chart, bar chart, searchable threat list with scores |
| 📈 **Analytics** | 7-day trends, hourly distribution, threat score history |
| 💡 **AI Insights** | Natural-language threat explanations |
| ⚙️ **Settings** | Gmail connect/disconnect, notification toggles |

---

## 🗂️ Project Structure

```
emailspam/
├── server.py              # Standalone Flask backend (port 5001)
├── backend/               # Modular backend (for production)
│   ├── app/
│   │   ├── routes/        # predict, analytics, gmail, ai, auth
│   │   ├── services/      # firebase, gmail, ml_pipeline, threat_engine
│   │   └── utils/         # preprocessor
│   ├── model/             # spam_classifier.pkl
│   ├── train_model.py
│   └── wsgi.py
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/         # Dashboard, Inbox, Threats, Analytics, AI, Settings
│   │   ├── components/    # Layout, Sidebar, ui, ProtectedRoute
│   │   ├── context/       # AuthContext (Firebase)
│   │   ├── hooks/         # useGmail
│   │   └── services/      # api.js, firebase.js, gmail.js
│   └── .env.example
└── data/                  # SMSSpamCollection dataset
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Firebase project](https://console.firebase.google.com) with Auth enabled

### 1. Backend

```bash
python3 -m venv venv_backend
source venv_backend/bin/activate
pip install flask flask-cors scikit-learn joblib nltk numpy

python server.py          # starts on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # fill in your Firebase credentials
npm install
npm run dev               # starts on http://localhost:5173
```

---

## 🔧 Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

---

## 🔒 Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Add `localhost` to **Authorized Domains**
4. Register a **Web App** and copy the config into `frontend/.env`

### Gmail Integration (Optional)

1. Enable **Gmail API** in Google Cloud Console
2. Add `https://www.googleapis.com/auth/gmail.readonly` to OAuth consent screen scopes
3. Add yourself as a **test user** (while app is in Testing mode)

---

## 🤖 ML Model

The spam classifier uses:
- **TF-IDF Vectorizer** — text feature extraction
- **Logistic Regression** — calibrated probability output
- **Multi-factor Threat Engine** — URL analysis, phishing keywords, urgency patterns, domain reputation

To retrain:
```bash
cd backend && python train_model.py
```

---

## 📦 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Axios, React Router v6  
**Backend:** Python, Flask, scikit-learn, NLTK, Flask-CORS  
**Auth & Cloud:** Firebase Authentication, Google OAuth 2.0, Gmail API  
**ML:** TF-IDF + Logistic Regression, custom threat scoring engine

---

## 📄 License

MIT — free to use, modify, and deploy.
