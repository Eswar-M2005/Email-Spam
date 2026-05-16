# Email Spam Detection System

> Python · Flask · Scikit-learn · TF-IDF · Naïve Bayes

A real-time email spam classifier with a premium web interface.

---

## Project Structure

```
emailspam/
├── app.py               # Flask API server
├── train_model.py       # Model training script
├── requirements.txt     # Python dependencies
├── Procfile             # Deployment (Render/Heroku)
├── model/
│   └── spam_classifier.pkl   # Trained pipeline (generated)
├── templates/
│   └── index.html       # Main HTML page
└── static/
    ├── style.css        # Premium UI stylesheet
    └── script.js        # Frontend logic
```

---

## Setup & Run

### 1 — Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2 — Install dependencies
```bash
pip install -r requirements.txt
```

### 3 — Train the model
```bash
python train_model.py
```
This outputs `model/spam_classifier.pkl`.

### 4 — Start the Flask server
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

---

## API

| Method | Endpoint   | Description              |
|--------|-----------|--------------------------|
| POST   | `/predict` | Classify email text      |
| GET    | `/health`  | Server health check      |

### `/predict` Request
```json
{ "email": "Congratulations! You won £900. Call now!" }
```

### `/predict` Response
```json
{
  "label":      "spam",
  "spam_prob":  97.32,
  "ham_prob":   2.68,
  "risk":       "High",
  "keywords":   ["won", "congratulations", "call", "prize"],
  "clean_text": "congratulations won num call"
}
```

---

## ML Pipeline

| Step | Detail |
|------|--------|
| Preprocessing | Lowercase → strip HTML/URLs → remove punctuation/numbers → lemmatize → remove stopwords |
| Vectorization | TF-IDF, unigrams + bigrams, 10 000 features, sublinear TF |
| Classifier    | Multinomial Naïve Bayes (α = 0.1) |
| Evaluation    | 5-fold CV F1, accuracy, ROC-AUC, confusion matrix |

---

## Deploy to Render

1. Push repo to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Build command: `pip install -r requirements.txt && python train_model.py`
4. Start command: `gunicorn app:app`
