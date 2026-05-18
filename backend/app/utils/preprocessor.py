"""
Text Preprocessing Utilities
"""

import re
import ssl
import string
import nltk

# Fix SSL for NLTK downloads on some systems
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

for resource in ["stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{resource}")
    except LookupError:
        nltk.download(resource, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

STOP_WORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

# Suspicious patterns for threat scoring
PHISHING_KEYWORDS = {
    "verify", "account", "suspended", "click", "urgent", "immediately",
    "password", "login", "bank", "credit", "wire", "transfer", "confirm",
    "update", "security", "alert", "winner", "prize", "congratulations",
    "free", "offer", "limited", "expire", "suspend", "unusual", "activity",
    "social security", "irs", "refund", "invoice", "payment", "overdue",
}

URL_SHORTENERS = {"bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly", "buff.ly", "short.link"}


def preprocess_text(text: str) -> str:
    """Clean and normalize email text for ML input."""
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)          # strip HTML tags
    text = re.sub(r"http\S+|www\S+", " url ", text)  # replace URLs
    text = re.sub(r"\d+", " num ", text)            # replace digits
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens
              if t not in STOP_WORDS and len(t) > 1]
    return " ".join(tokens)


def extract_urls(text: str) -> list[str]:
    """Extract all URLs from raw email text."""
    pattern = r"https?://\S+|www\.\S+"
    return re.findall(pattern, text, re.IGNORECASE)


def has_url_shortener(urls: list[str]) -> bool:
    """Check if any URL uses a known shortener service."""
    for url in urls:
        for shortener in URL_SHORTENERS:
            if shortener in url.lower():
                return True
    return False


def count_phishing_keywords(text: str) -> int:
    """Count how many phishing keywords appear in the email."""
    text_lower = text.lower()
    return sum(1 for kw in PHISHING_KEYWORDS if kw in text_lower)
