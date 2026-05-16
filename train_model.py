"""
Email Spam Detection — Model Training Script
Uses the UCI SMS Spam Collection dataset (auto-downloaded).
Pipeline: TF-IDF (unigrams+bigrams) → Multinomial Naive Bayes
"""

import os
import re
import ssl
import string
import zipfile
import urllib.request
import joblib
import numpy as np
import pandas as pd
import nltk

# ── Fix Mac SSL certificate issue ─────────────────────────────────────────────
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# ── NLTK downloads ────────────────────────────────────────────────────────────
for resource in ["stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, roc_auc_score,
)

STOP_WORDS  = set(stopwords.words("english"))
lemmatizer  = WordNetLemmatizer()

# ── Dataset download ──────────────────────────────────────────────────────────
DATASET_URL  = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
DATA_DIR     = "data"
ZIP_PATH     = os.path.join(DATA_DIR, "smsspamcollection.zip")
TSV_PATH     = os.path.join(DATA_DIR, "SMSSpamCollection")


def download_dataset():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(TSV_PATH):
        if not os.path.exists(ZIP_PATH):
            print("📥  Downloading UCI SMS Spam Collection dataset…")
            urllib.request.urlretrieve(DATASET_URL, ZIP_PATH)
            print("    ✅  Downloaded.")
        print("📂  Extracting…")
        with zipfile.ZipFile(ZIP_PATH, "r") as z:
            z.extractall(DATA_DIR)
        print("    ✅  Extracted.")
    else:
        print("✅  Dataset already present — skipping download.")


def load_dataset() -> pd.DataFrame:
    download_dataset()
    df = pd.read_csv(
        TSV_PATH,
        sep="\t",
        header=None,
        names=["label", "text"],
        encoding="latin-1",
    )
    # Keep only needed columns (some versions have extra cols)
    df = df[["label", "text"]].dropna()
    df["label"] = df["label"].str.strip().str.lower()
    return df


# ── Text preprocessing ────────────────────────────────────────────────────────

def preprocess_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)               # strip HTML
    text = re.sub(r"http\S+|www\S+", " url ", text)    # replace URLs
    text = re.sub(r"\d+", " num ", text)                # replace digits
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


# ── Training ──────────────────────────────────────────────────────────────────

def train():
    print("=" * 60)
    print("  Email Spam Detection — Model Training")
    print("=" * 60)

    df = load_dataset()
    print(f"\nDataset shape : {df.shape}")
    print(f"Spam samples  : {(df.label == 'spam').sum()}")
    print(f"Ham  samples  : {(df.label == 'ham').sum()}")

    df["clean_text"] = df["text"].apply(preprocess_text)

    X = df["clean_text"]
    y = df["label"].map({"spam": 1, "ham": 0})

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain size : {len(X_train)} | Test size : {len(X_test)}")

    # ── Pipeline ──────────────────────────────────────────────────────────────
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10_000,
            sublinear_tf=True,
            min_df=2,
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])

    # ── Cross-validation ──────────────────────────────────────────────────────
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="f1")
    print(f"\n5-Fold CV F1  : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Fit & evaluate ────────────────────────────────────────────────────────
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    print(f"\nTest Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC       : {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Ham", "Spam"]))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  TN={cm[0,0]}  FP={cm[0,1]}")
    print(f"  FN={cm[1,0]}  TP={cm[1,1]}")

    # ── Save model ────────────────────────────────────────────────────────────
    os.makedirs("model", exist_ok=True)
    joblib.dump(pipeline, "model/spam_classifier.pkl")
    print("\n✅  Model saved → model/spam_classifier.pkl")
    print("=" * 60)


if __name__ == "__main__":
    train()
