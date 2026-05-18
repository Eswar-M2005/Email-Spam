"""
MailGuard AI — Standalone Backend Server
Runs on port 5001, handles /api/predict, /api/analytics/demo, /api/ai/explain
Works without Firebase/Gmail credentials.
"""

import os, re, ssl, string, joblib, numpy as np, nltk
from flask import Flask, request, jsonify
from flask_cors import CORS

# Fix SSL
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

# NLTK downloads
for r in ["stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{r}")
    except LookupError:
        nltk.download(r, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

PHISHING_KEYWORDS = {
    "verify","account","suspended","click","urgent","immediately","password","login",
    "bank","credit","wire","transfer","confirm","update","security","alert","winner",
    "prize","congratulations","free","offer","limited","expire","suspend","unusual",
    "activity","refund","invoice","payment","overdue","irs","claim",
}
URGENCY_PATTERNS = [
    r"act now", r"limited time", r"expires? (today|soon|immediately)",
    r"respond immediately", r"within \d+ (hours?|days?)",
    r"(last|final) (chance|warning|notice)",
]
URL_SHORTENERS = {"bit.ly","tinyurl","goo.gl","t.co","ow.ly"}


def preprocess(text):
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http\S+|www\S+", " url ", text)
    text = re.sub(r"\d+", " num ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    return " ".join(lemmatizer.lemmatize(t) for t in text.split()
                    if t not in STOP_WORDS and len(t) > 1)


def extract_urls(text):
    return re.findall(r"https?://\S+|www\.\S+", text, re.I)


def score_threat(text, sender, subject, spam_prob, has_att=False):
    score, factors = 0, []

    score += int(spam_prob * 50)
    if spam_prob > 0.7:
        factors.append("ML model flagged high spam probability")

    urls = extract_urls(text)
    if urls:
        score += 5
        factors.append(f"Contains {len(urls)} external URL(s)")
        if any(s in u for u in urls for s in URL_SHORTENERS):
            score += 10
            factors.append("Uses URL shortening service (common in phishing)")

    combined = (text + " " + subject).lower()
    kw = sum(1 for k in PHISHING_KEYWORDS if k in combined)
    if kw:
        score += min(kw * 3, 15)
        factors.append(f"Contains {kw} phishing-related keyword(s)")

    urgency = sum(1 for p in URGENCY_PATTERNS if re.search(p, combined))
    if urgency:
        score += min(urgency * 5, 10)
        factors.append("Uses urgent/pressure language")

    if has_att:
        score += 5
        factors.append("Email contains attachment(s)")

    score = min(score, 100)

    if score >= 80:   level, ttype, rec = "critical", "Phishing / Scam", "Do not click any links. Mark as phishing and delete immediately."
    elif score >= 60: level, ttype, rec = "high",     "Spam / Suspicious", "Avoid interacting. Move to spam folder."
    elif score >= 40: level, ttype, rec = "medium",   "Potential Spam", "Verify sender identity before responding."
    elif score >= 20: level, ttype, rec = "low",      "Low Risk", "Email appears mostly safe. Exercise normal caution."
    else:             level, ttype, rec = "safe",      "Clean", "Email appears legitimate."

    return {
        "threat_score":   score,
        "threat_level":   level,
        "threat_type":    ttype,
        "factors":        factors or ["No significant threat indicators found"],
        "recommendation": rec,
    }


# ── Flask ────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins="*")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "spam_classifier.pkl")
pipeline = joblib.load(MODEL_PATH)
print("✅ Model loaded")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "version": "2.0.0"})


@app.route("/api/predict/", methods=["POST"])
def predict():
    data    = request.get_json(silent=True) or {}
    email   = data.get("email", "").strip()
    sender  = data.get("sender", "unknown")
    subject = data.get("subject", "")
    has_att = data.get("has_attachments", False)

    if not email:
        return jsonify({"error": "No email text provided."}), 400

    clean     = preprocess(email)
    pred      = pipeline.predict([clean])[0]
    proba     = pipeline.predict_proba([clean])[0]
    spam_prob = float(proba[1])
    ham_prob  = float(proba[0])
    label     = "spam" if pred == 1 else "ham"
    risk      = "High" if spam_prob >= 0.80 else "Medium" if spam_prob >= 0.50 else "Low"

    tfidf = pipeline.named_steps["tfidf"]
    vec   = tfidf.transform([clean])
    fnames = np.array(tfidf.get_feature_names_out())
    if vec.nnz > 0:
        idx  = vec.nonzero()[1]
        sc   = np.array(vec[0, idx].todense()).flatten()
        top  = np.argsort(sc)[::-1][:10]
        keywords = fnames[idx[top]].tolist()
    else:
        keywords = []

    threat = score_threat(email, sender, subject, spam_prob, has_att)

    return jsonify({
        "label": label, "spam_prob": round(spam_prob*100,2),
        "ham_prob": round(ham_prob*100,2), "risk": risk,
        "keywords": keywords, "clean_text": clean,
        "raw_spam_prob": spam_prob,
        **threat,
    })


@app.route("/api/analytics/demo")
def analytics_demo():
    return jsonify({
        "total": 1247, "spam": 312, "ham": 935,
        "high_risk": 89, "spam_rate": 25.0,
        "trend": [
            {"date": "Mon", "spam": 45, "ham": 132},
            {"date": "Tue", "spam": 52, "ham": 118},
            {"date": "Wed", "spam": 38, "ham": 141},
            {"date": "Thu", "spam": 67, "ham": 103},
            {"date": "Fri", "spam": 49, "ham": 127},
            {"date": "Sat", "spam": 31, "ham": 152},
            {"date": "Sun", "spam": 30, "ham": 162},
        ],
        "threat_levels": {
            "critical": 12, "high": 77, "medium": 143, "low": 80, "safe": 935,
        },
    })


@app.route("/api/ai/explain", methods=["POST"])
def explain():
    data = request.get_json(silent=True) or {}
    level   = data.get("threat_level", "medium")
    ttype   = data.get("threat_type", "Spam")
    factors = data.get("factors", [])
    subject = data.get("subject", "")

    if level in ("critical", "high"):
        msg = (f"This email '{subject}' has been classified as {ttype} with a HIGH risk score. "
               f"Key indicators: {', '.join(factors[:3])}. "
               "Do not click any links or share personal information.")
    elif level == "medium":
        msg = (f"This email shows suspicious characteristics ({', '.join(factors[:2])}). "
               "Verify the sender's identity before responding or clicking any links.")
    else:
        msg = "This email appears legitimate based on our AI analysis. No significant threat indicators were found."

    return jsonify({"explanation": msg})


@app.route("/api/ai/summarize", methods=["POST"])
def summarize():
    data = request.get_json(silent=True) or {}
    return jsonify({"summary": f"{data.get('subject','')}: {data.get('body','')[:120]}..."})


@app.route("/api/gmail/connect")
def gmail_connect():
    return jsonify({"error": "Gmail integration requires backend credentials setup"}), 501


@app.route("/api/gmail/status")
def gmail_status():
    return jsonify({"connected": False})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 MailGuard AI backend running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
