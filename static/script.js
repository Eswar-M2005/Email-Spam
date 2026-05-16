/* ── script.js — SpamShield AI ── */

const SAMPLES = {
  spam: `WINNER!! As a valued network customer you have been selected to receivea £900 prize reward! To claim call 09061701461. Claim code KL341. Valid 12 hours only. T&Cs apply. Reply STOP to opt out.`,
  ham: `Hey! Just wanted to check if we're still on for the team meeting tomorrow at 2pm. I've prepared the slides for the quarterly review and will share them on Slack before the call. Let me know if you need anything else in advance.`,
};

// ── DOM refs ───────────────────────────────────────────────────
const emailInput  = document.getElementById("emailInput");
const analyzeBtn  = document.getElementById("analyzeBtn");
const btnLabel    = document.getElementById("btnLabel");
const btnIcon     = document.querySelector(".btn-icon");
const charCount   = document.getElementById("charCount");
const resultCard  = document.getElementById("resultCard");

// ── Character counter ──────────────────────────────────────────
emailInput.addEventListener("input", () => {
  const len = emailInput.value.length;
  charCount.textContent = `${len} character${len !== 1 ? "s" : ""}`;
});

// ── Load sample emails ─────────────────────────────────────────
function loadSample(type) {
  emailInput.value = SAMPLES[type];
  emailInput.dispatchEvent(new Event("input"));
  emailInput.focus();
}

// ── Clear input ────────────────────────────────────────────────
function clearInput() {
  emailInput.value = "";
  emailInput.dispatchEvent(new Event("input"));
  resultCard.classList.add("hidden");
}

// ── Main analyze ───────────────────────────────────────────────
async function analyzeEmail() {
  const text = emailInput.value.trim();
  if (!text) {
    shakeTextarea();
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${res.status})`);
    }

    const data = await res.json();
    renderResult(data);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ── Render result ──────────────────────────────────────────────
function renderResult(data) {
  const isSpam = data.label === "spam";

  // Verdict banner
  const banner = document.getElementById("verdictBanner");
  banner.className = `verdict-banner ${isSpam ? "spam-verdict" : "ham-verdict"}`;

  document.getElementById("verdictIcon").textContent  = isSpam ? "🚨" : "✅";
  document.getElementById("verdictLabel").textContent = isSpam ? "SPAM DETECTED" : "LOOKS LEGIT";
  document.getElementById("verdictSub").textContent   = isSpam
    ? "High probability this is a spam email"
    : "This email appears to be legitimate";

  // Risk badge
  const riskBadge = document.getElementById("riskBadge");
  riskBadge.textContent  = `${data.risk} Risk`;
  riskBadge.className    = `risk-badge risk-${data.risk.toLowerCase()}`;

  // Prob bars (animate after a tick for CSS transition)
  setTimeout(() => {
    document.getElementById("spamBar").style.width = `${data.spam_prob}%`;
    document.getElementById("hamBar").style.width  = `${data.ham_prob}%`;
  }, 50);

  document.getElementById("spamPct").textContent = `${data.spam_prob}%`;
  document.getElementById("hamPct").textContent  = `${data.ham_prob}%`;

  // Keywords
  const chipsEl = document.getElementById("keywordChips");
  chipsEl.innerHTML = "";
  if (data.keywords && data.keywords.length > 0) {
    document.getElementById("keywordsSection").style.display = "";
    data.keywords.forEach((kw, i) => {
      const chip = document.createElement("span");
      chip.className = "keyword-chip";
      chip.textContent = kw;
      chip.style.animationDelay = `${i * 60}ms`;
      chipsEl.appendChild(chip);
    });
  } else {
    document.getElementById("keywordsSection").style.display = "none";
  }

  // Clean text preview
  document.getElementById("cleanTextPreview").textContent =
    data.clean_text || "(empty after preprocessing)";

  // Show & animate card
  resultCard.classList.remove("hidden", "animate-in");
  // Force reflow
  void resultCard.offsetWidth;
  resultCard.classList.add("animate-in");

  // Scroll into view smoothly
  setTimeout(() => resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
}

// ── Loading state ──────────────────────────────────────────────
function setLoading(on) {
  analyzeBtn.disabled = on;
  if (on) {
    analyzeBtn.innerHTML = `<span class="spinner"></span><span>Analyzing…</span>`;
  } else {
    analyzeBtn.innerHTML = `<span class="btn-icon">🔍</span><span id="btnLabel">Analyze Email</span>`;
  }
}

// ── Shake effect ───────────────────────────────────────────────
function shakeTextarea() {
  emailInput.style.borderColor = "var(--accent-red)";
  emailInput.style.boxShadow   = "0 0 0 3px rgba(239,68,68,0.15)";
  emailInput.classList.add("shake");
  setTimeout(() => {
    emailInput.style.borderColor = "";
    emailInput.style.boxShadow   = "";
  }, 600);
}

// Add shake keyframes dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  .shake { animation: shake 0.45s ease; }
`;
document.head.appendChild(style);

emailInput.addEventListener("animationend", () => emailInput.classList.remove("shake"));

// ── Error toast ────────────────────────────────────────────────
function showError(msg) {
  // simple banner approach
  let toast = document.getElementById("errorToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "errorToast";
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#1c0a0a; border:1px solid rgba(239,68,68,0.5);
      color:#fca5a5; padding:14px 24px; border-radius:12px;
      font-size:0.88rem; font-weight:500; z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
      animation:fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = `⚠️ ${msg}`;
  toast.style.display = "block";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = "none"; }, 4000);
}

// ── Keyboard shortcut ──────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    analyzeEmail();
  }
});
