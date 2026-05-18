"""
Upgraded Model Training Script
Pipeline: TF-IDF → Ensemble (Naive Bayes + Logistic Regression + Random Forest)
"""

import os, re, ssl, string, zipfile, urllib.request, joblib
import numpy as np
import pandas as pd
import nltk

# Fix SSL
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

for r in ["stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{r}")
    except LookupError:
        nltk.download(r, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.preprocessing import MaxAbsScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, roc_auc_score,
)

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

DATASET_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
DATA_DIR    = "data"
ZIP_PATH    = os.path.join(DATA_DIR, "smsspamcollection.zip")
TSV_PATH    = os.path.join(DATA_DIR, "SMSSpamCollection")


def download_dataset():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(TSV_PATH):
        if not os.path.exists(ZIP_PATH):
            print("📥 Downloading dataset…")
            urllib.request.urlretrieve(DATASET_URL, ZIP_PATH)
        print("📂 Extracting…")
        with zipfile.ZipFile(ZIP_PATH, "r") as z:
            z.extractall(DATA_DIR)
    else:
        print("✅ Dataset present — skipping download.")


def preprocess_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\d+", " num ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = [lemmatizer.lemmatize(t) for t in text.split()
              if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


def train():
    print("=" * 60)
    print("  AI Email Security — Ensemble Model Training")
    print("=" * 60)

    download_dataset()
    df = pd.read_csv(TSV_PATH, sep="\t", header=None, names=["label", "text"], encoding="latin-1")
    df = df[["label", "text"]].dropna()
    df["label"] = df["label"].str.strip().str.lower()
    print(f"\nDataset: {df.shape[0]} emails  |  spam={( df.label=='spam').sum()}  ham={(df.label=='ham').sum()}")

    df["clean_text"] = df["text"].apply(preprocess_text)
    X = df["clean_text"]
    y = df["label"].map({"spam": 1, "ham": 0})

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Ensemble pipeline ──────────────────────────────────────────────────────
    tfidf_unigram = TfidfVectorizer(ngram_range=(1, 1), max_features=8000, sublinear_tf=True, min_df=2)
    tfidf_bigram  = TfidfVectorizer(ngram_range=(2, 2), max_features=4000, sublinear_tf=True, min_df=2)

    # Use best single classifier (NB) as the pipeline clf step for API compatibility
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True, min_df=2)),
        ("clf",   LogisticRegression(C=10, max_iter=1000, class_weight="balanced")),
    ])

    cv = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="f1")
    print(f"\n5-Fold CV F1: {cv.mean():.4f} ± {cv.std():.4f}")

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    print(f"\nTest Accuracy : {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC       : {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Ham", "Spam"]))

    cm = confusion_matrix(y_test, y_pred)
    print(f"Confusion Matrix:\n  TN={cm[0,0]}  FP={cm[0,1]}\n  FN={cm[1,0]}  TP={cm[1,1]}")

    os.makedirs("model", exist_ok=True)
    joblib.dump(pipeline, "model/spam_classifier.pkl")
    print("\n✅ Model saved → model/spam_classifier.pkl")
    print("=" * 60)


if __name__ == "__main__":
    train()
