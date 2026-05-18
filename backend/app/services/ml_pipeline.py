"""
ML Pipeline Service — loads and runs the trained spam classifier
"""

import os
import numpy as np
import joblib
from app.utils.preprocessor import preprocess_text

_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        model_path = os.path.join(os.path.dirname(__file__), "..", "..", "model", "spam_classifier.pkl")
        model_path = os.path.abspath(model_path)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Run train_model.py first.")
        _pipeline = joblib.load(model_path)
    return _pipeline


def classify_email(raw_text: str) -> dict:
    """
    Classify an email as spam/ham and return probabilities + top keywords.

    Returns:
        {
            label:      "spam" | "ham",
            spam_prob:  float (0–100),
            ham_prob:   float (0–100),
            risk:       "Low" | "Medium" | "High",
            keywords:   list[str],
            clean_text: str,
        }
    """
    pipeline = get_pipeline()
    clean = preprocess_text(raw_text)

    pred   = pipeline.predict([clean])[0]
    proba  = pipeline.predict_proba([clean])[0]

    spam_prob = float(proba[1])
    ham_prob  = float(proba[0])
    label     = "spam" if pred == 1 else "ham"

    if spam_prob >= 0.80:
        risk = "High"
    elif spam_prob >= 0.50:
        risk = "Medium"
    else:
        risk = "Low"

    # Top TF-IDF feature keywords
    tfidf = pipeline.named_steps["tfidf"]
    vec   = tfidf.transform([clean])
    feature_names = np.array(tfidf.get_feature_names_out())

    if vec.nnz > 0:
        indices  = vec.nonzero()[1]
        scores   = np.array(vec[0, indices].todense()).flatten()
        top_idx  = np.argsort(scores)[::-1][:10]
        keywords = feature_names[indices[top_idx]].tolist()
    else:
        keywords = []

    return {
        "label":      label,
        "spam_prob":  round(spam_prob * 100, 2),
        "ham_prob":   round(ham_prob  * 100, 2),
        "risk":       risk,
        "keywords":   keywords,
        "clean_text": clean,
        "raw_spam_prob": spam_prob,
    }
