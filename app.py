"""
Email Spam Detection — Flask API
"""

import os
import re
import ssl
import string
import joblib
import numpy as np
import nltk

# Fix Mac SSL certificate issue for NLTK downloads
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# ─────────────────────────── NLTK setup ──────────────────────────────────────
for resource in ["stopwords", "punkt", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

STOP_WORDS  = set(stopwords.words("english"))
lemmatizer  = WordNetLemmatizer()

# ─────────────────────────── Preprocessing ───────────────────────────────────

def preprocess_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\d+", " num ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in STOP_WORDS]
    return " ".join(tokens)

# ─────────────────────────── Flask app ───────────────────────────────────────

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "spam_classifier.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        "Model not found. Run `python train_model.py` first."
    )

pipeline = joblib.load(MODEL_PATH)
print("✅  Model loaded successfully.")

# ─────────────────────────── Routes ──────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    email_text = data.get("email", "").strip()

    if not email_text:
        return jsonify({"error": "No email text provided."}), 400

    clean   = preprocess_text(email_text)
    pred    = pipeline.predict([clean])[0]
    proba   = pipeline.predict_proba([clean])[0]

    spam_prob = float(proba[1])
    ham_prob  = float(proba[0])
    label     = "spam" if pred == 1 else "ham"

    # Confidence-based risk level
    if spam_prob >= 0.80:
        risk = "High"
    elif spam_prob >= 0.50:
        risk = "Medium"
    else:
        risk = "Low"

    # Top contributing TF-IDF features
    tfidf   = pipeline.named_steps["tfidf"]
    clf     = pipeline.named_steps["clf"]
    vec     = tfidf.transform([clean])
    feature_names = np.array(tfidf.get_feature_names_out())

    if vec.nnz > 0:
        indices  = vec.nonzero()[1]
        scores   = np.array(vec[0, indices].todense()).flatten()
        top_idx  = np.argsort(scores)[::-1][:8]
        keywords = feature_names[indices[top_idx]].tolist()
    else:
        keywords = []

    return jsonify({
        "label":      label,
        "spam_prob":  round(spam_prob * 100, 2),
        "ham_prob":   round(ham_prob  * 100, 2),
        "risk":       risk,
        "keywords":   keywords,
        "clean_text": clean,
    })


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": "spam_classifier_tfidf_nb"})


# ─────────────────────────── Entry point ─────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
