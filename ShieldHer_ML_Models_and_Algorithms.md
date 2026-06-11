# 🧠 ShieldHer — Machine Learning Models & Algorithms
### Complete Reference | Phishing Detection · Deepfake · NER · Zone Prediction · Risk Scoring

---

## Table of Contents

1. [ML System Overview](#1-ml-system-overview)
2. [🔗 Phishing Link Detector — Full Deep Dive](#2--phishing-link-detector--full-deep-dive)
   - 2.1 [Problem Formulation](#21-problem-formulation)
   - 2.2 [Feature Engineering — All 67 Features](#22-feature-engineering--all-67-features)
   - 2.3 [Training Datasets](#23-training-datasets)
   - 2.4 [Model 1 — Rule-Based Engine (Layer 0)](#24-model-1--rule-based-engine-layer-0)
   - 2.5 [Model 2 — Random Forest (Layer 1)](#25-model-2--random-forest-layer-1)
   - 2.6 [Model 3 — XGBoost (Layer 1)](#26-model-3--xgboost-layer-1)
   - 2.7 [Model 4 — BiLSTM Character-Level (Layer 2)](#27-model-4--bilstm-character-level-layer-2)
   - 2.8 [Model 5 — Fine-Tuned BERT (Layer 3)](#28-model-5--fine-tuned-bert-layer-3)
   - 2.9 [Ensemble Strategy](#29-ensemble-strategy)
   - 2.10 [Training Pipeline](#210-training-pipeline)
   - 2.11 [Evaluation Metrics & Target Benchmarks](#211-evaluation-metrics--target-benchmarks)
   - 2.12 [FastAPI Deployment](#212-fastapi-deployment)
3. [🎭 Deepfake Image / Video Detector](#3--deepfake-image--video-detector)
4. [👤 Fake Profile Detector](#4--fake-profile-detector)
5. [🔍 NER — Entity Extractor](#5--ner--entity-extractor)
6. [⚠️ Complaint Risk Scorer](#6--complaint-risk-scorer)
7. [🗺️ Unsafe Zone Prediction (DBSCAN)](#7--unsafe-zone-prediction-dbscan)
8. [Complete ML Architecture](#8-complete-ml-architecture)
9. [Full Tech Stack for ML](#9-full-tech-stack-for-ml)
10. [Training Infrastructure & Requirements](#10-training-infrastructure--requirements)
11. [Model Registry & Versioning](#11-model-registry--versioning)

---

## 1. ML System Overview

ShieldHer contains **6 distinct ML systems**, each solving a different problem. They are all served through the **Python FastAPI AI service** (`shieldher-ai/`).

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHIELDHER ML SYSTEMS                             │
│                                                                     │
│  ┌──────────────────┐   Input: URL string                          │
│  │ 1. Phishing Link │ → Output: risk_score (0-1), reasons, verdict │
│  │    Detector      │   Latency target: < 2 seconds                │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌──────────────────┐   Input: Image / video frame                 │
│  │ 2. Deepfake      │ → Output: is_fake (bool), confidence, heatmap│
│  │    Detector      │   Latency target: < 10 seconds               │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌──────────────────┐   Input: Social media profile URL            │
│  │ 3. Fake Profile  │ → Output: fake_probability, red_flags        │
│  │    Detector      │   Latency target: < 5 seconds                │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌──────────────────┐   Input: Complaint text / evidence text      │
│  │ 4. NER Entity    │ → Output: phones[], emails[], handles[], URLs │
│  │    Extractor     │   Latency target: < 500ms                    │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌──────────────────┐   Input: Complaint category + description    │
│  │ 5. Risk Scorer   │ → Output: risk_level (low/med/high/urgent)   │
│  │                  │   Latency target: < 1 second                 │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌──────────────────┐   Input: Batch of GPS incident coordinates   │
│  │ 6. Zone Predictor│ → Output: cluster polygons, risk zones       │
│  │    (DBSCAN)      │   Runs: Nightly batch job (not real-time)    │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔗 Phishing Link Detector — Full Deep Dive

This is the **primary ML feature** shown in the Cyber Safety Hub (Link Scanner). A user pastes any URL — a WhatsApp link, payment portal, job offer link — and the system returns a risk verdict within 2 seconds.

### 2.1 Problem Formulation

**Task:** Binary classification + risk scoring
**Input:** A raw URL string (e.g. `http://secure-payment-verify.com/login?ref=hdfc`)
**Output:**
```json
{
  "url": "http://secure-payment-verify.com/login?ref=hdfc",
  "verdict": "DANGEROUS",
  "risk_score": 0.94,
  "risk_level": "dangerous",
  "confidence": 0.91,
  "reasons": [
    "Domain registered 3 days ago",
    "No HTTPS / invalid SSL",
    "Contains suspicious keyword: 'verify'",
    "Typosquatting: mimics 'hdfcbank.com'",
    "Flagged in PhishTank database"
  ],
  "domain_info": {
    "domain": "secure-payment-verify.com",
    "age_days": 3,
    "registrar": "Namecheap",
    "country": "Unknown",
    "has_ssl": false
  },
  "safe_to_visit": false
}
```

**Classes:**
| Label | Description | Examples |
|---|---|---|
| 0 — Safe | Legitimate websites | google.com, hdfc.com, amazon.in |
| 1 — Phishing | Credential harvesting pages | login-hdfc-verify.tk, secure-sbi-update.ml |
| 2 — Malware | Sites delivering malware/ransomware | free-antivirus-download.ga |
| 3 — Spam | Spam/scam landing pages | whatsapp-prize-winner.cf |

> **For simplicity in the first version, we treat this as binary: phishing=1, safe=0. Multi-class is v2.**

---

### 2.2 Feature Engineering — All 67 Features

Features are grouped into 4 categories. Each feature is extracted by the `FeatureExtractor` class **before any ML model runs**.

#### Group A: URL String Features (No network call — purely from the URL text)

```
Feature #   Name                          Type    Description
─────────────────────────────────────────────────────────────────────
F01         url_length                    int     Total character count of URL
F02         domain_length                 int     Character count of domain only
F03         path_length                   int     Character count of path (/login/verify)
F04         query_length                  int     Character count of query string (?ref=xxx)
F05         num_dots                      int     Count of '.' in full URL
F06         num_hyphens                   int     Count of '-' in domain
F07         num_underscores               int     Count of '_' in URL
F08         num_slashes                   int     Count of '/' in URL
F09         num_question_marks            int     Count of '?' in URL
F10         num_equal_signs               int     Count of '=' in URL (param key-val pairs)
F11         num_at_symbols                int     Count of '@' — often used to trick (user@evil.com/login)
F12         num_percent_signs             int     Count of '%' — URL-encoded obfuscation
F13         num_ampersands                int     Count of '&' in query string
F14         num_digits_in_domain          int     Count of digits in domain (suspicious: sbi123.com)
F15         num_digits_in_path            int     Count of digits in path
F16         num_subdomains                int     Count of subdomain labels (www.login.hdfc.verify.tk = 4)
F17         subdomain_length              int     Total character count of all subdomains combined
F18         has_ip_address                bool    Domain is raw IP (e.g. http://192.168.1.1/login)
F19         has_at_before_domain          bool    '@' appears before domain (user:pass@evil.com)
F20         has_double_slash_redirect     bool    '//' appears in path (redirect trick)
F21         has_https                     bool    Scheme is https://
F22         url_entropy                   float   Shannon entropy of URL string (random chars = high)
F23         domain_entropy                float   Entropy of domain name only
F24         longest_word_length           int     Max word length (split by [.-_]) in domain
F25         avg_word_length               float   Average word length in URL tokens
F26         is_url_shortened              bool    Domain in shortener list: bit.ly, tinyurl, t.co, etc.
F27         has_suspicious_tld            bool    TLD in risky list: .tk .ml .ga .cf .gq .xyz .top .club
F28         tld_length                    int     Character count of TLD
F29         num_suspicious_keywords       int     Count of keywords: login, verify, secure, update,
                                                  account, bank, confirm, payment, password, alert,
                                                  wallet, click, free, prize, winner, reset
F30         has_brand_name_in_subdomain   bool    Known brand (hdfc, sbi, paytm, amazon, google) in
                                                  subdomain but NOT in registered domain
F31         has_brand_name_mismatch       bool    Brand in path/query but domain doesn't match brand
F32         has_hex_obfuscation           bool    URL contains %XX hex encoding of letters
F33         num_params                    int     Count of query parameters
F34         path_depth                    int     Number of '/' levels in path
F35         has_port_in_url               bool    Non-standard port present (e.g. :8080, :4444)
```

#### Group B: Domain / WHOIS Features (Requires DNS + WHOIS lookup — ~200ms)

```
Feature #   Name                          Type    Description
─────────────────────────────────────────────────────────────────────
F36         domain_age_days               int     Days since domain was registered (WHOIS)
                                                  New domains (< 30 days) are highly suspicious
F37         domain_expiry_days            int     Days until domain expires (short = suspicious)
F38         registrar_is_suspicious       bool    Registrar in known-abused list (Namecheap free tier, etc.)
F39         has_valid_ssl                 bool    SSL certificate is valid and not expired
F40         ssl_issuer_trusted            bool    SSL issuer is a major CA (Let's Encrypt, DigiCert, etc.)
F41         ssl_age_days                  int     Age of SSL certificate (brand new = suspicious)
F42         has_dns_record                bool    Domain resolves (false = definitely suspicious)
F43         num_dns_records               int     Count of DNS records (more = established site)
F44         ip_country_code               str     Country of hosting server IP
F45         asn_reputation_score          float   Autonomous System Number reputation score (0-1)
                                                  Some ASNs host many phishing sites
F46         reverse_dns_match             bool    Reverse DNS hostname matches forward lookup
F47         num_redirects                 int     Number of HTTP redirects before landing
F48         final_url_different           bool    Final URL after redirects differs from input
F49         domain_in_alexa_top1m         bool    Domain appears in Alexa top 1 million (known-good)
F50         domain_in_phishtank           bool    Domain appears in PhishTank database (known-bad)
F51         domain_in_urlhaus             bool    Domain appears in URLhaus malware database
```

#### Group C: Content Features (Requires page fetch — ~500ms, only on non-blocklist URLs)

```
Feature #   Name                          Type    Description
─────────────────────────────────────────────────────────────────────
F52         has_login_form                bool    Page contains <form> with password input
F53         has_external_favicon          bool    Favicon loaded from different domain (brand spoofing)
F54         pct_external_links            float   % of links pointing to external domains
F55         pct_external_resources        float   % of CSS/JS/images from external domains
F56         num_iframes                   int     Count of iframes (often used to embed phishing)
F57         has_right_click_disabled      bool    JavaScript disables right-click (hiding source)
F58         has_popup_window              bool    Page opens popup (aggressive redirect)
F59         num_script_tags               int     Count of <script> tags
F60         page_title_brand_mismatch     bool    Page <title> mentions brand that doesn't match domain
F61         has_meta_refresh              bool    Meta-refresh redirect present
F62         has_obfuscated_js             bool    JavaScript appears obfuscated/minified unusually
```

#### Group D: Contextual / Behavioral Features

```
Feature #   Name                          Type    Description
─────────────────────────────────────────────────────────────────────
F63         url_submitted_before          bool    Same URL submitted by other users (in our DB)
F64         domain_in_our_blocklist       bool    Domain flagged by previous ShieldHer users
F65         similar_to_known_phishing     float   String similarity to known phishing URLs (Levenshtein)
F66         virustotal_positives          int     Number of AV engines flagging URL on VirusTotal API
F67         google_safe_browsing_flag     bool    Flagged by Google Safe Browsing API
```

---

### 2.3 Training Datasets

#### Dataset 1: PhishTank
- **Source:** https://www.phishtank.com/developer_info.php
- **Format:** CSV download (free, no API key required for bulk)
- **Size:** ~15,000–25,000 verified phishing URLs (updated daily)
- **Label:** phishing = 1
- **Fields:** `phish_id`, `url`, `phish_detail_url`, `submission_time`, `verified`, `verification_time`, `online`, `target`
- **Use in training:** All verified URLs (`verified == 'yes'`) used as positive class

#### Dataset 2: ISCX-URL-2016
- **Source:** Canadian Institute for Cybersecurity, University of New Brunswick
- **Download:** https://www.unb.ca/cic/datasets/url-2016.html
- **Format:** ARFF (convertible to CSV)
- **Size:** 36,400 URLs total
  - Benign: 7,781
  - Spam: 6,000
  - Phishing: 7,586
  - Malware: 6,712
  - Defacement: 7,930
- **Label:** Multi-class (benign=0, phishing=1 for binary use)
- **Comes with 79 pre-extracted features** — we use 30 overlapping + add our own

#### Dataset 3: Mendeley Phishing Dataset
- **Source:** https://data.mendeley.com/datasets/gdx3pkwp47/2
- **Alternate:** Kaggle "Malicious and Benign Websites"
- **Size:** 11,430 URLs with 87 features
- **Label:** phishing=1, legitimate=0
- **Key Features included:** Has_IP, URL_Length, Shortening_Service, Having_At_Symbol, Double_slash_redirecting, Prefix_Suffix, Having_Sub_Domain, SSLfinal_State, Domain_registeration_length

#### Dataset 4: OpenPhish Community Feed
- **Source:** https://openphish.com/phishing_feeds.html
- **Format:** Plain text, one URL per line
- **Size:** ~2,000 active phishing URLs (rotates)
- **Use:** Augment training data + live API check in production

#### Dataset 5: URLhaus by Abuse.ch
- **Source:** https://urlhaus.abuse.ch/downloads/csv_recent/
- **Format:** CSV
- **Size:** ~1,000–5,000 recently active malware URLs
- **Label:** malware = 1 (treated as phishing=1 in binary)

#### Dataset 6: Alexa Top 1 Million (Benign — Negative Examples)
- **Source:** https://s3.amazonaws.com/alexa-static/top-1m.csv.zip
- **Size:** 1,000,000 domains
- **Use:** Sample 30,000 URLs from top-ranked domains as benign (label=0)
- **Why:** Real-world benign class distribution

#### Dataset 7: Common Crawl (Benign Supplement)
- **Source:** https://commoncrawl.org/
- **Use:** Additional random benign URLs from indexed pages

#### Combined Training Set Summary

```
Source               Phishing  Benign   Total
─────────────────────────────────────────────
PhishTank            20,000    —        20,000
ISCX-URL-2016         7,586    7,781    15,367
Mendeley              5,715    5,715    11,430
OpenPhish (6 months) 12,000    —        12,000
URLhaus               4,000    —         4,000
Alexa Top Sites          —    30,000    30,000
Collected URLs        2,000    5,000     7,000
─────────────────────────────────────────────
TOTAL                51,301   48,496    99,797
─────────────────────────────────────────────
Class ratio:          51.4%   48.6%    ← near-balanced ✅
```

#### Data Preprocessing Steps

```python
# shieldher-ai/data/preprocessing.py

import pandas as pd
from sklearn.model_selection import train_test_split

def preprocess_dataset(df: pd.DataFrame) -> tuple:
    # 1. Remove duplicates
    df = df.drop_duplicates(subset=['url'])

    # 2. Remove invalid URLs
    df = df[df['url'].str.startswith(('http://', 'https://'))]

    # 3. Remove very short URLs (< 10 chars) and extremely long ones (> 2000 chars)
    df = df[df['url'].str.len().between(10, 2000)]

    # 4. Normalize labels to binary: 0=safe, 1=phishing
    df['label'] = df['label'].map({'benign': 0, 'phishing': 1, 'malware': 1, 'spam': 1, 'defacement': 1})
    df = df.dropna(subset=['label'])
    df['label'] = df['label'].astype(int)

    # 5. Stratified split: 70% train, 15% val, 15% test
    X_temp, X_test, y_temp, y_test = train_test_split(
        df['url'], df['label'],
        test_size=0.15, stratify=df['label'], random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp,
        test_size=0.176, stratify=y_temp, random_state=42  # 0.176 * 0.85 ≈ 0.15 of total
    )

    return X_train, X_val, X_test, y_train, y_val, y_test

# Final split:
# Train: 69,858 URLs (70%)
# Val:   14,970 URLs (15%)
# Test:  14,969 URLs (15%)
```

---

### 2.4 Model 1 — Rule-Based Engine (Layer 0)

**Purpose:** Instant blocklist check + obvious heuristics. Runs FIRST, before any ML model. If a definitive verdict is found here, we skip all heavy models.

**Latency:** < 50ms
**No training required**

```python
# shieldher-ai/app/services/phishing/rule_engine.py

import re
import tldextract
from urllib.parse import urlparse

# Known URL shortener domains
URL_SHORTENERS = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'buff.ly',
    'adf.ly', 'is.gd', 'cli.gs', 'yfrog.com', 'migre.me', 'ff.im',
    'tiny.cc', 'url4.eu', 'twit.ac', 'su.pr', 'twurl.nl', 'snipurl.com',
    'short.to', 'budurl.com', 'ping.fm', 'post.ly', 'just.as', 'bkite.com',
    'snipr.com', 'fic.kr', 'loopt.us', 'doiop.com', 'short.ie', 'kl.am',
}

# High-risk TLDs frequently used for phishing
SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq',     # Freenom free TLDs
    'xyz', 'top', 'club', 'online',
    'site', 'website', 'info', 'biz',  # frequently abused
    'work', 'link', 'click', 'download',
}

# Suspicious keywords that appear in phishing URLs
PHISHING_KEYWORDS = [
    'login', 'signin', 'log-in', 'sign-in',
    'verify', 'verification', 'confirm',
    'secure', 'security', 'update', 'upgrade',
    'account', 'password', 'passwd', 'credential',
    'bank', 'banking', 'payment', 'pay',
    'suspend', 'suspended', 'locked', 'unlock',
    'alert', 'warning', 'urgent', 'immediately',
    'free', 'prize', 'winner', 'congratulations',
    'click-here', 'claim', 'reward', 'lucky',
    'webscr', 'cmd', 'dispatch',     # PayPal phishing patterns
    'wp-login', 'admin', 'cpanel',   # WordPress admin spoofing
]

# Major brands that are commonly spoofed
MAJOR_BRANDS = {
    'paypal', 'amazon', 'google', 'facebook', 'microsoft', 'apple',
    'netflix', 'instagram', 'whatsapp', 'twitter', 'linkedin',
    # Indian brands
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes', 'pnb',
    'paytm', 'phonepe', 'gpay', 'googlepay', 'bhim', 'upi',
    'irctc', 'aadhaar', 'epfo', 'incometax', 'gst',
    'flipkart', 'swiggy', 'zomato', 'ola', 'uber', 'myntra',
}

class RuleEngine:
    def run(self, url: str) -> dict:
        result = {
            'verdict': None,     # 'safe', 'suspicious', 'dangerous', None (undecided)
            'confidence': 0.0,
            'reasons': [],
            'score_contribution': 0.0,
            'skip_ml': False,    # if True, verdict is definitive — skip ML
        }

        parsed = urlparse(url)
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}".lower()
        full_domain = url.lower()

        # ── RULE 1: Known blocklists (definitive) ──────────────────
        # (These are checked against Redis-cached blocklist, updated hourly)
        # Handled in the outer service — if in PhishTank → skip_ml=True, verdict=dangerous

        # ── RULE 2: IP address as domain ───────────────────────────
        ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
        if re.search(ip_pattern, parsed.netloc):
            result['reasons'].append('IP address used as domain instead of hostname')
            result['score_contribution'] += 0.4
            result['verdict'] = 'suspicious'

        # ── RULE 3: URL shortener ───────────────────────────────────
        if ext.registered_domain in URL_SHORTENERS:
            result['reasons'].append(f'URL shortener detected: {ext.registered_domain}')
            result['score_contribution'] += 0.2
            # Don't skip ML — shortened URL needs expansion + re-check

        # ── RULE 4: Suspicious TLD ─────────────────────────────────
        if ext.suffix in SUSPICIOUS_TLDS:
            result['reasons'].append(f'High-risk TLD: .{ext.suffix} (commonly used for phishing)')
            result['score_contribution'] += 0.25

        # ── RULE 5: @ before domain ────────────────────────────────
        if '@' in parsed.netloc:
            result['reasons'].append('@ symbol in domain (classic phishing trick)')
            result['score_contribution'] += 0.5
            result['verdict'] = 'dangerous'

        # ── RULE 6: Double slash redirect ──────────────────────────
        if '//' in parsed.path:
            result['reasons'].append('Double-slash redirect in path')
            result['score_contribution'] += 0.15

        # ── RULE 7: Suspicious keywords ────────────────────────────
        url_lower = url.lower()
        matched_keywords = [kw for kw in PHISHING_KEYWORDS if kw in url_lower]
        if matched_keywords:
            result['reasons'].append(f'Suspicious keywords in URL: {", ".join(matched_keywords[:3])}')
            result['score_contribution'] += min(0.15 * len(matched_keywords), 0.40)

        # ── RULE 8: Brand impersonation ────────────────────────────
        # Check if a known brand appears in subdomain but NOT in registered domain
        subdomain_lower = ext.subdomain.lower()
        path_query = (parsed.path + '?' + parsed.query).lower()

        for brand in MAJOR_BRANDS:
            if brand in subdomain_lower and brand not in ext.domain.lower():
                result['reasons'].append(
                    f'Brand impersonation: "{brand}" in subdomain but not in actual domain'
                )
                result['score_contribution'] += 0.55
                result['verdict'] = 'dangerous'
                break
            if brand in path_query and brand not in domain:
                result['reasons'].append(f'Brand name "{brand}" in URL path (possible spoofing)')
                result['score_contribution'] += 0.25

        # ── RULE 9: No HTTPS ───────────────────────────────────────
        if parsed.scheme == 'http':
            result['reasons'].append('No HTTPS encryption (plain HTTP)')
            result['score_contribution'] += 0.1

        # ── RULE 10: Extremely long URL ────────────────────────────
        if len(url) > 300:
            result['reasons'].append(f'Unusually long URL ({len(url)} characters)')
            result['score_contribution'] += 0.15

        # ── RULE 11: Many subdomains ───────────────────────────────
        if ext.subdomain.count('.') >= 3:
            result['reasons'].append(f'Excessive subdomains ({ext.subdomain.count(".") + 1})')
            result['score_contribution'] += 0.2

        # ── RULE 12: Hex/percent encoding of normal chars ──────────
        hex_pattern = r'%[0-9A-Fa-f]{2}'
        hex_matches = re.findall(hex_pattern, url)
        decoded_chars = [bytes.fromhex(m[1:]).decode('ascii', errors='ignore') for m in hex_matches]
        suspicious_encoded = [c for c in decoded_chars if c.isalpha()]  # encoding letters = suspicious
        if suspicious_encoded:
            result['reasons'].append('URL contains hex-encoded alphabetic characters (obfuscation)')
            result['score_contribution'] += 0.3

        return result
```

---

### 2.5 Model 2 — Random Forest (Layer 1)

**Algorithm:** Ensemble of Decision Trees with feature bagging
**Why Random Forest:**
- Handles mixed feature types (bool + int + float) without normalization
- Built-in feature importance → explainability
- Robust to noisy/missing features
- Fast training and inference (~3ms per URL)
- Good interpretability for debugging

**Algorithm Explanation:**

```
Random Forest builds N decision trees (N=200 in our case).
Each tree:
  1. Bootstraps a random sample of training data (with replacement)
  2. At each split, considers only √(67) ≈ 8 features (random subspace)
  3. Chooses the best split on those 8 features (max information gain / gini impurity)
  4. Grows until max_depth or min_samples_leaf is reached

Final prediction = majority vote across all 200 trees
Probability = fraction of trees voting for each class
```

**Gini Impurity (split criterion):**
```
Gini(S) = 1 - Σ(p_i²)
where p_i = fraction of class i in set S

Split chosen that maximizes:
ΔGini = Gini(parent) - (n_left/n * Gini(left) + n_right/n * Gini(right))
```

```python
# shieldher-ai/app/models/phishing/random_forest_model.py

from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import joblib
import numpy as np

class PhishingRandomForest:
    def __init__(self):
        self.model = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),   # handle missing WHOIS values
            ('clf', RandomForestClassifier(
                n_estimators=200,          # 200 trees (accuracy vs speed tradeoff)
                max_depth=20,              # prevent overfitting
                min_samples_split=10,
                min_samples_leaf=5,
                max_features='sqrt',       # √67 ≈ 8 features per split
                class_weight='balanced',   # handle any remaining imbalance
                n_jobs=-1,                 # use all CPU cores
                random_state=42,
                oob_score=True,            # out-of-bag validation
            ))
        ])
        self.calibrated_model = None  # will wrap with Platt scaling for better probabilities

    def train(self, X_train, y_train, X_val, y_val):
        self.model.fit(X_train, y_train)

        # Calibrate probabilities using Platt Scaling (sigmoid)
        # Raw RF probabilities are often poorly calibrated
        self.calibrated_model = CalibratedClassifierCV(
            self.model, method='sigmoid', cv='prefit'
        )
        self.calibrated_model.fit(X_val, y_val)

        print(f"OOB Score: {self.model['clf'].oob_score_:.4f}")

    def predict_proba(self, X) -> np.ndarray:
        return self.calibrated_model.predict_proba(X)

    def get_feature_importance(self) -> dict:
        importances = self.model['clf'].feature_importances_
        return dict(zip(FEATURE_NAMES, importances))

    def save(self, path: str):
        joblib.dump(self.calibrated_model, path)

    def load(self, path: str):
        self.calibrated_model = joblib.load(path)

# Top 10 expected most important features (from literature + domain knowledge):
# 1. domain_age_days               (new domain = high risk)
# 2. domain_in_phishtank            (direct blocklist hit)
# 3. has_suspicious_tld             (free TLDs)
# 4. has_ip_address                 (IP-based URLs)
# 5. has_at_before_domain           (classic trick)
# 6. num_suspicious_keywords        (verify, login, etc.)
# 7. has_brand_name_in_subdomain    (impersonation)
# 8. url_entropy                    (random characters)
# 9. num_subdomains                 (excessive nesting)
# 10. pct_external_links            (phishing pages link out heavily)
```

---

### 2.6 Model 3 — XGBoost (Layer 1)

**Algorithm:** Extreme Gradient Boosting — builds trees sequentially, each correcting errors of the previous

**Why XGBoost in addition to RF:**
- XGBoost often outperforms RF on tabular data with many features
- Handles missing values natively (no imputer needed)
- Regularization (L1 + L2) prevents overfitting
- We run RF and XGBoost in parallel — their outputs are averaged for better stability

**Algorithm Explanation:**

```
Gradient Boosting builds trees sequentially:
  F_0(x) = initial prediction (mean of labels)
  
For each round t = 1 to T:
  1. Compute residuals: r_i = y_i - F_{t-1}(x_i)
     (what the current model gets wrong)
  2. Fit a new decision tree h_t to minimize the residuals
  3. Update: F_t(x) = F_{t-1}(x) + η * h_t(x)
     where η = learning rate (shrinkage)

XGBoost improvements over vanilla GBM:
  - Uses 2nd-order Taylor expansion of loss (Newton-Raphson)
  - L1 (Lasso) + L2 (Ridge) regularization on tree weights
  - Parallel histogram-based tree building (fast)
  - Missing value handling built-in
```

**Loss function (log-loss for binary classification):**
```
L = -[y * log(p) + (1-y) * log(1-p)]

where:
  y = true label (0 or 1)
  p = predicted probability of phishing

Gradient: ∂L/∂p = p - y
Hessian:  ∂²L/∂p² = p(1-p)
```

```python
# shieldher-ai/app/models/phishing/xgboost_model.py

import xgboost as xgb
from sklearn.metrics import roc_auc_score
import numpy as np

class PhishingXGBoost:
    def __init__(self):
        self.model = xgb.XGBClassifier(
            n_estimators=500,
            learning_rate=0.05,        # low learning rate → more trees needed, better generalization
            max_depth=8,
            min_child_weight=5,
            subsample=0.8,             # 80% of data per tree (prevents overfitting)
            colsample_bytree=0.7,      # 70% of features per tree
            gamma=0.1,                 # minimum gain required for a split
            reg_alpha=0.1,             # L1 regularization
            reg_lambda=1.0,            # L2 regularization
            scale_pos_weight=1.0,      # balanced dataset — no reweighting needed
            eval_metric=['logloss', 'auc'],
            early_stopping_rounds=30,  # stop if no improvement for 30 rounds
            use_label_encoder=False,
            random_state=42,
            n_jobs=-1,
        )

    def train(self, X_train, y_train, X_val, y_val):
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=50,  # print every 50 rounds
        )

        val_preds = self.model.predict_proba(X_val)[:, 1]
        print(f"Validation AUC: {roc_auc_score(y_val, val_preds):.4f}")

    def predict_proba(self, X) -> np.ndarray:
        return self.model.predict_proba(X)
```

---

### 2.7 Model 4 — BiLSTM Character-Level (Layer 2)

**Why BiLSTM:**
- Processes the URL as a raw **character sequence** — no feature engineering needed
- Captures sequential patterns (e.g., `login-hdfc-verify` pattern in URL)
- Bidirectional: reads URL left-to-right AND right-to-left simultaneously
- Complements the feature-based models (catches patterns features miss)

**Architecture:**

```
Input:  Raw URL string, e.g. "http://hdfc-verify-login.tk/account/update"

Step 1: Character Tokenization
        Each character → integer ID (vocabulary of 80 chars)
        Padding/truncating to fixed length 200 characters

Step 2: Embedding Layer
        80 unique chars → 32-dimensional embedding vectors
        Learned during training

Step 3: Bidirectional LSTM
        Forward LSTM  → reads left to right  → h_forward (128 units)
        Backward LSTM → reads right to left  → h_backward (128 units)
        Concatenated:  → 256-dimensional hidden state at each timestep

Step 4: Global Max Pooling
        Takes maximum value across all timesteps for each dimension
        Output: 256-dimensional vector (captures most significant patterns)

Step 5: Dense Layers
        Dense(128, ReLU) → BatchNorm → Dropout(0.4)
        Dense(64,  ReLU) → Dropout(0.3)
        Dense(1, Sigmoid) → phishing probability
```

```python
# shieldher-ai/app/models/phishing/bilstm_model.py

import tensorflow as tf
from tensorflow.keras import layers, Model
import numpy as np

# Character vocabulary
CHARS = (
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    ".-_~:/?#[]@!$&'()*+,;=%"
)
CHAR_TO_IDX = {c: i+1 for i, c in enumerate(CHARS)}  # 0 = padding
VOCAB_SIZE = len(CHARS) + 1  # +1 for padding
MAX_URL_LENGTH = 200

def url_to_sequence(url: str) -> np.ndarray:
    """Convert URL string to integer sequence."""
    seq = [CHAR_TO_IDX.get(c, 0) for c in url[:MAX_URL_LENGTH]]
    # Pad with zeros to MAX_URL_LENGTH
    seq += [0] * (MAX_URL_LENGTH - len(seq))
    return np.array(seq)

def build_bilstm_model() -> Model:
    inputs = layers.Input(shape=(MAX_URL_LENGTH,), name='url_chars')

    # Character embedding
    x = layers.Embedding(
        input_dim=VOCAB_SIZE,
        output_dim=32,               # 32-dim character embeddings
        mask_zero=True,              # ignore padding tokens
        name='char_embedding'
    )(inputs)

    # Bidirectional LSTM
    x = layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, dropout=0.2),
        name='bilstm'
    )(x)

    # Global Max Pooling — captures most "alarming" pattern in URL
    x = layers.GlobalMaxPooling1D(name='global_max_pool')(x)

    # Dense classifier head
    x = layers.Dense(128, activation='relu', name='dense_1')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)

    x = layers.Dense(64, activation='relu', name='dense_2')(x)
    x = layers.Dropout(0.3)(x)

    outputs = layers.Dense(1, activation='sigmoid', name='output')(x)

    model = Model(inputs, outputs, name='PhishingBiLSTM')
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc'), 
                 tf.keras.metrics.Precision(name='precision'),
                 tf.keras.metrics.Recall(name='recall')]
    )
    return model

# Training config
TRAINING_CONFIG = {
    'epochs': 30,
    'batch_size': 512,
    'callbacks': [
        tf.keras.callbacks.EarlyStopping(monitor='val_auc', patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3),
        tf.keras.callbacks.ModelCheckpoint('best_bilstm.h5', monitor='val_auc', save_best_only=True),
    ]
}
```

---

### 2.8 Model 5 — Fine-Tuned BERT (Layer 3)

**Model Base:** `bert-base-uncased` (110M parameters) from Hugging Face, or alternatively `URLTran` (BERT pretrained on URLs)

**Why BERT for URLs:**
- URLs contain natural language segments: "secure-payment-verify", "hdfc-bank-login"
- Transformer attention captures long-range dependencies in URL structure
- Pre-trained on massive text corpus → already knows brand names, suspicious words
- Fine-tuning on our URL dataset takes only ~2 hours on a single GPU

**Architecture:**

```
Input: Raw URL string
       "http://hdfc-login-verify.tk/account/suspend?ref=alert"

Tokenization (WordPiece):
       [CLS] http : // hdfc - login - verify . tk / account / suspend ? ref = alert [SEP]
       → integer token IDs

BERT Encoder (12 transformer layers):
       Self-attention → captures relationships between all URL tokens simultaneously
       Each layer: MultiHeadAttention(12 heads, 768 dim) → FeedForward(3072) → LayerNorm

[CLS] token output: 768-dimensional sentence embedding

Classification Head:
       Dense(256, ReLU) → Dropout(0.3) → Dense(1, Sigmoid)

Output: phishing probability
```

```python
# shieldher-ai/app/models/phishing/bert_model.py

from transformers import (
    BertTokenizerFast,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer
)
from datasets import Dataset
import torch
import numpy as np

MODEL_NAME = "bert-base-uncased"  
# Alternative: "unitary/toxic-bert" or custom "url-bert"

class PhishingBERT:
    def __init__(self):
        self.tokenizer = BertTokenizerFast.from_pretrained(MODEL_NAME)
        self.model = BertForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=2,
            problem_type="single_label_classification"
        )
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def tokenize(self, urls: list[str]) -> dict:
        return self.tokenizer(
            urls,
            padding='max_length',
            truncation=True,
            max_length=128,       # 128 tokens is enough for most URLs
            return_tensors='pt'
        )

    def train(self, train_urls, train_labels, val_urls, val_labels):
        # Convert to HuggingFace Dataset
        train_dataset = Dataset.from_dict({
            'text': train_urls,
            'label': train_labels
        })
        val_dataset = Dataset.from_dict({
            'text': val_urls,
            'label': val_labels
        })

        def tokenize_function(batch):
            return self.tokenizer(
                batch['text'],
                padding='max_length',
                truncation=True,
                max_length=128
            )

        train_dataset = train_dataset.map(tokenize_function, batched=True)
        val_dataset = val_dataset.map(tokenize_function, batched=True)

        training_args = TrainingArguments(
            output_dir='./bert_phishing_checkpoints',
            num_train_epochs=4,           # 4 epochs usually enough for fine-tuning
            per_device_train_batch_size=32,
            per_device_eval_batch_size=64,
            warmup_steps=500,             # linear warmup
            weight_decay=0.01,            # L2 regularization
            learning_rate=2e-5,           # standard fine-tuning LR for BERT
            evaluation_strategy='epoch',
            save_strategy='epoch',
            load_best_model_at_end=True,
            metric_for_best_model='eval_f1',
            logging_steps=100,
            fp16=torch.cuda.is_available(),  # mixed precision for GPU
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=self.compute_metrics,
        )
        trainer.train()

    @staticmethod
    def compute_metrics(eval_pred):
        from sklearn.metrics import f1_score, roc_auc_score
        logits, labels = eval_pred
        probs = torch.softmax(torch.tensor(logits), dim=-1).numpy()[:, 1]
        preds = (probs > 0.5).astype(int)
        return {
            'eval_f1': f1_score(labels, preds),
            'eval_auc': roc_auc_score(labels, probs),
        }

    def predict_proba(self, urls: list[str]) -> np.ndarray:
        inputs = self.tokenize(urls).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1).cpu().numpy()
        return probs[:, 1]  # probability of class 1 (phishing)

    def save(self, path: str):
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)
```

---

### 2.9 Ensemble Strategy

All 3 ML models (RF, XGBoost, BiLSTM, BERT) run in a tiered fashion and their outputs are combined.

**Tier system (for latency optimization):**

```
URL received
     │
     ├─ TIER 0: Rule Engine (< 50ms)
     │   ├── Blocklist hit → return immediately (skip all ML)
     │   └── Compute rule_score + reasons
     │
     ├─ TIER 1: RF + XGBoost (< 300ms) — run in parallel
     │   ├── Extract all 67 features
     │   ├── RF → rf_prob
     │   └── XGB → xgb_prob
     │
     ├─ TIER 2: BiLSTM (< 500ms) — character-level
     │   └── bilstm_prob
     │
     └─ TIER 3: BERT (< 2000ms) — only if score from Tier 1+2 is ambiguous (0.3–0.7)
         └── bert_prob
```

**Final score calculation:**

```python
# shieldher-ai/app/services/phishing/ensemble.py

def compute_ensemble_score(
    rule_score: float,
    rf_prob: float,
    xgb_prob: float,
    bilstm_prob: float,
    bert_prob: float | None,
    is_in_blocklist: bool,
    rule_reasons: list[str],
) -> dict:

    # Blocklist = instant dangerous verdict
    if is_in_blocklist:
        return { 'risk_score': 1.0, 'verdict': 'DANGEROUS', 'confidence': 0.99 }

    # Weighted ensemble
    # Weights determined by validation set performance
    WEIGHTS = {
        'rules':   0.15,   # rule engine (lower weight — deterministic but limited)
        'rf':      0.20,   # Random Forest
        'xgb':     0.25,   # XGBoost (slightly better on tabular)
        'bilstm':  0.20,   # BiLSTM
        'bert':    0.20,   # BERT (highest accuracy but only runs sometimes)
    }

    if bert_prob is not None:
        # Full ensemble (BERT was run)
        final_score = (
            WEIGHTS['rules']  * rule_score +
            WEIGHTS['rf']     * rf_prob +
            WEIGHTS['xgb']    * xgb_prob +
            WEIGHTS['bilstm'] * bilstm_prob +
            WEIGHTS['bert']   * bert_prob
        )
    else:
        # Partial ensemble (no BERT — rescale weights)
        total_w = WEIGHTS['rules'] + WEIGHTS['rf'] + WEIGHTS['xgb'] + WEIGHTS['bilstm']
        final_score = (
            (WEIGHTS['rules']  / total_w) * rule_score +
            (WEIGHTS['rf']     / total_w) * rf_prob +
            (WEIGHTS['xgb']    / total_w) * xgb_prob +
            (WEIGHTS['bilstm'] / total_w) * bilstm_prob
        )

    # Classify verdict
    if final_score >= 0.80:   verdict = 'DANGEROUS';   risk_level = 'dangerous'
    elif final_score >= 0.55: verdict = 'SUSPICIOUS';  risk_level = 'suspicious'
    elif final_score >= 0.30: verdict = 'CAUTION';     risk_level = 'caution'
    else:                     verdict = 'SAFE';         risk_level = 'safe'

    return {
        'risk_score': round(final_score, 4),
        'risk_level': risk_level,
        'verdict': verdict,
        'confidence': round(1 - 2 * abs(final_score - 0.5), 4),  # 1 at extremes, 0 at 0.5
        'model_scores': {
            'rule_engine': round(rule_score, 3),
            'random_forest': round(rf_prob, 3),
            'xgboost': round(xgb_prob, 3),
            'bilstm': round(bilstm_prob, 3),
            'bert': round(bert_prob, 3) if bert_prob else 'not_run',
        }
    }
```

---

### 2.10 Training Pipeline

```python
# shieldher-ai/training/train_phishing.py
# Run this script to retrain all models

import os
import pandas as pd
import numpy as np
from feature_extractor import FeatureExtractor
from models.phishing import PhishingRandomForest, PhishingXGBoost, build_bilstm_model, PhishingBERT

def run_full_training_pipeline():
    print("=== SHIELDHER PHISHING DETECTION — TRAINING PIPELINE ===\n")

    # ─── Step 1: Load and merge all datasets ───────────────────────
    print("[1/7] Loading datasets...")
    dfs = []
    dfs.append(load_phishtank())         # phishing
    dfs.append(load_iscx_url_2016())     # mixed
    dfs.append(load_mendeley())          # mixed
    dfs.append(load_openphish())         # phishing
    dfs.append(load_urlhaus())           # malware
    dfs.append(load_alexa_benign(30000)) # benign
    df = pd.concat(dfs).drop_duplicates(subset=['url']).reset_index(drop=True)
    print(f"    Total samples: {len(df)} | Phishing: {df['label'].sum()} | Benign: {(1-df['label']).sum()}")

    # ─── Step 2: Split ─────────────────────────────────────────────
    print("[2/7] Splitting train/val/test...")
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess_dataset(df)

    # ─── Step 3: Extract features ──────────────────────────────────
    print("[3/7] Extracting features (67 features per URL)...")
    extractor = FeatureExtractor(enable_dns=True, enable_content=False)  # DNS yes, page fetch no (slow)
    X_train_feat = extractor.transform_batch(X_train.tolist())
    X_val_feat   = extractor.transform_batch(X_val.tolist())
    X_test_feat  = extractor.transform_batch(X_test.tolist())
    print(f"    Feature matrix shape: {X_train_feat.shape}")

    # ─── Step 4: Train Random Forest ───────────────────────────────
    print("[4/7] Training Random Forest...")
    rf_model = PhishingRandomForest()
    rf_model.train(X_train_feat, y_train, X_val_feat, y_val)
    rf_model.save('saved_models/random_forest.pkl')
    evaluate_model(rf_model, X_test_feat, y_test, name="Random Forest")

    # ─── Step 5: Train XGBoost ─────────────────────────────────────
    print("[5/7] Training XGBoost...")
    xgb_model = PhishingXGBoost()
    xgb_model.train(X_train_feat, y_train, X_val_feat, y_val)
    xgb_model.save('saved_models/xgboost.pkl')
    evaluate_model(xgb_model, X_test_feat, y_test, name="XGBoost")

    # ─── Step 6: Train BiLSTM ──────────────────────────────────────
    print("[6/7] Training BiLSTM (character-level)...")
    X_train_seq = np.array([url_to_sequence(u) for u in X_train])
    X_val_seq   = np.array([url_to_sequence(u) for u in X_val])
    X_test_seq  = np.array([url_to_sequence(u) for u in X_test])

    bilstm = build_bilstm_model()
    bilstm.fit(X_train_seq, y_train, validation_data=(X_val_seq, y_val), **TRAINING_CONFIG)
    bilstm.save('saved_models/bilstm.h5')

    # ─── Step 7: Fine-tune BERT ────────────────────────────────────
    print("[7/7] Fine-tuning BERT (this will take ~2 hours on CPU, ~20 min on GPU)...")
    bert_model = PhishingBERT()
    bert_model.train(X_train.tolist(), y_train.tolist(), X_val.tolist(), y_val.tolist())
    bert_model.save('saved_models/bert_phishing/')

    print("\n✅ Training complete! All models saved to saved_models/")
    evaluate_ensemble(X_test, X_test_feat, X_test_seq, y_test)

def evaluate_model(model, X_test, y_test, name="Model"):
    from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs > 0.5).astype(int)
    print(f"\n── {name} Test Set Performance ──")
    print(classification_report(y_test, preds, target_names=['Safe', 'Phishing']))
    print(f"AUC-ROC: {roc_auc_score(y_test, probs):.4f}")
    tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
    print(f"False Positive Rate: {fp/(fp+tn)*100:.2f}% (legitimate URLs flagged as phishing)")
    print(f"False Negative Rate: {fn/(fn+tp)*100:.2f}% (phishing URLs missed)")
```

---

### 2.11 Evaluation Metrics & Target Benchmarks

| Metric | Formula | Why Important | Target |
|---|---|---|---|
| **F1 Score** | 2·(P·R)/(P+R) | Balance between precision and recall | > 0.97 |
| **AUC-ROC** | Area under ROC curve | Overall discriminative ability | > 0.99 |
| **Precision** | TP/(TP+FP) | % of flagged URLs that are actually phishing | > 0.96 |
| **Recall** | TP/(TP+FN) | % of phishing URLs we catch | > 0.98 |
| **False Positive Rate** | FP/(FP+TN) | Legitimate URLs wrongly flagged | < 1% |
| **False Negative Rate** | FN/(FN+TP) | Phishing URLs we MISS (most dangerous) | < 2% |
| **Latency P99** | 99th percentile response time | User experience | < 2000ms |

**Why we optimize recall over precision:**
> Missing a phishing URL (False Negative) is far more dangerous than wrongly flagging a safe URL (False Positive). A woman clicking a phishing link could have her bank account emptied.

**Expected Per-Model Benchmarks (based on literature):**

| Model | AUC-ROC | F1 | Latency |
|---|---|---|---|
| Rule Engine only | ~0.85 | ~0.82 | 50ms |
| Random Forest | ~0.97 | ~0.96 | 250ms |
| XGBoost | ~0.98 | ~0.97 | 250ms |
| BiLSTM | ~0.97 | ~0.95 | 450ms |
| BERT fine-tuned | ~0.99 | ~0.98 | 2000ms |
| **Ensemble (all)** | **~0.995** | **~0.98** | **< 2s** |

---

### 2.12 FastAPI Deployment

```python
# shieldher-ai/app/routers/url_scan.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from app.services.phishing.phishing_service import PhishingService
import asyncio

router = APIRouter(prefix="/url-scan", tags=["URL Scan"])
service = PhishingService()   # loads all models at startup

class URLScanRequest(BaseModel):
    url: str
    fast_mode: bool = False   # True = only RF+XGB, skip BiLSTM+BERT

class URLScanResponse(BaseModel):
    url: str
    verdict: str
    risk_score: float
    risk_level: str
    confidence: float
    reasons: list[str]
    domain_info: dict
    model_scores: dict
    safe_to_visit: bool
    scan_duration_ms: int

@router.post("", response_model=URLScanResponse)
async def scan_url(request: URLScanRequest):
    import time
    start = time.time()

    # Basic URL validation
    if not (request.url.startswith('http://') or request.url.startswith('https://')):
        request.url = 'http://' + request.url

    if len(request.url) > 2000:
        raise HTTPException(400, "URL too long")

    result = await service.scan(request.url, fast_mode=request.fast_mode)

    result['scan_duration_ms'] = int((time.time() - start) * 1000)
    result['safe_to_visit'] = result['risk_score'] < 0.3

    return result
```

---

## 3. 🎭 Deepfake Image / Video Detector

### 3.1 Problem

Detect if an image/video has been artificially generated or manipulated using deepfake technology — critical for combating blackmail and non-consensual imagery.

### 3.2 Dataset

| Dataset | Size | Type | Source |
|---|---|---|---|
| **FaceForensics++** | 1,000 real + 4,000 fake videos (4 methods: DeepFakes, Face2Face, FaceSwap, NeuralTextures) | Video | https://github.com/ondyari/FaceForensics |
| **Celeb-DF v2** | 590 real + 5,639 fake videos | Video | GitHub: yuezunli/Celeb-DF |
| **DFDC (DeepFake Detection Challenge)** | 100,000+ videos | Video | Kaggle dataset |
| **OpenForensics** | 334,000 face crops | Image | NII Japan |
| **Real-world scraped faces** | 50,000 real | Image | FFHQ + LFW |

### 3.3 Architecture — EfficientNet-B4 Classifier

**Why EfficientNet-B4:**
- Best accuracy/computation tradeoff for image classification
- Pre-trained on ImageNet → great feature extractor from day 1
- Compound scaling: depth + width + resolution scaled together

```python
# shieldher-ai/app/models/deepfake/efficientnet_model.py

import torch
import torch.nn as nn
from torchvision import transforms
from efficientnet_pytorch import EfficientNet
import cv2
import numpy as np

class DeepfakeDetector(nn.Module):
    def __init__(self, pretrained=True):
        super().__init__()

        # Load EfficientNet-B4 pretrained on ImageNet
        self.backbone = EfficientNet.from_pretrained('efficientnet-b4')

        # Replace final classifier head
        in_features = self.backbone._fc.in_features  # 1792 for B4
        self.backbone._fc = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(p=0.3),
            nn.Linear(512, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.backbone(x)

# Image preprocessing
TRANSFORM = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((380, 380)),  # EfficientNet-B4 input size
    transforms.CenterCrop(380),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def detect_deepfake(image_bytes: bytes) -> dict:
    """
    Input:  Raw image bytes (from evidence upload)
    Output: deepfake_score (0=real, 1=fake), confidence, grad_cam_heatmap
    """
    model = DeepfakeDetector()
    model.load_state_dict(torch.load('saved_models/deepfake_efficientnet.pth'))
    model.eval()

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Face detection first — deepfake detection is per-face
    faces = detect_faces(img_rgb)  # using MTCNN or RetinaFace
    if not faces:
        return {'deepfake_score': None, 'reason': 'no_face_detected'}

    results = []
    for face_crop in faces:
        tensor = TRANSFORM(face_crop).unsqueeze(0)
        with torch.no_grad():
            score = model(tensor).item()
        results.append(score)

    # Return max score (most suspicious face region)
    return {
        'deepfake_score': round(max(results), 4),
        'is_likely_fake': max(results) > 0.7,
        'faces_analyzed': len(results),
        'per_face_scores': results,
    }
```

### 3.4 Training Config

```python
DEEPFAKE_TRAINING = {
    'optimizer': 'AdamW',
    'lr': 1e-4,
    'weight_decay': 1e-4,
    'epochs': 20,
    'batch_size': 32,
    'scheduler': 'CosineAnnealingLR',
    'loss': 'BCEWithLogitsLoss',
    'augmentation': [
        'RandomHorizontalFlip',
        'ColorJitter(brightness=0.2, contrast=0.2)',
        'GaussianNoise(std=0.01)',
        'JPEGCompression(quality=70-100)',  # simulate re-upload compression
    ],
    'class_weight': {0: 1.0, 1: 1.0},  # balanced dataset
}
```

---

## 4. 👤 Fake Profile Detector

### 4.1 Feature Groups

```
BEHAVIORAL FEATURES (from profile metadata):
  - account_age_days          → new accounts = suspicious
  - followers_count
  - following_count
  - followers_to_following_ratio  → fake: 0 followers, 5000 following
  - post_count
  - posts_per_day              → very low = inactive bot
  - bio_completeness           → no bio = suspicious
  - has_profile_photo
  - profile_photo_is_stock     → reverse image search result
  - has_custom_url
  - verified_badge

TEXT FEATURES (bio NLP):
  - bio_length
  - bio_language               → auto-detected
  - bio_contains_suspicious_keywords  → "earn money", "lottery", "click link"
  - bio_sentiment_score

NETWORK FEATURES (if available):
  - mutual_friends_with_reporter
  - friend_request_to_strangers_ratio
```

### 4.2 Models

```python
# Ensemble of 3 models:

# Model A: Gradient Boosting on behavioral features
from sklearn.ensemble import GradientBoostingClassifier
behavioral_model = GradientBoostingClassifier(n_estimators=100, max_depth=5)

# Model B: Logistic Regression on TF-IDF of bio text
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
bio_vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=5000)
bio_model = LogisticRegression(C=1.0, class_weight='balanced')

# Model C: ResNet-50 for profile photo (GAN-generated vs real)
# GAN-generated faces have artifacts at fine-grained level
# Trained on StyleGAN2 vs real face dataset
```

### 4.3 Dataset

| Dataset | Description |
|---|---|
| **Cresci-2017** | 3,474 genuine + 5,301 spambots on Twitter |
| **TwiBot-20** | 229,580 Twitter accounts with human/bot labels |
| **Instagram Fake** | Custom scraped dataset of flagged fake Instagram profiles |
| **Synthetic** | Generate fake profiles using GPT + realistic patterns |

---

## 5. 🔍 NER — Entity Extractor

**Purpose:** From complaint descriptions and uploaded evidence text, extract: phone numbers, emails, URLs, social handles, bank account numbers, location names.

### 5.1 Architecture

```
Input text: "The accused person contacted me on WhatsApp from +91 9876543210 
             and his Instagram handle is @badguy_xyz. He sent me a payment 
             link: http://fake-upi-pay.tk and asked me to transfer ₹50,000 
             to ICICI account 123456789012."

Pipeline:
  1. Rule-based regex for structured entities (phones, emails, URLs, account nos)
  2. spaCy NER for unstructured entities (PERSON, ORG, GPE/location)
  3. Custom pattern matcher for Indian-specific patterns

Output entities:
  phones:        ["+91 9876543210"]
  social_handles: ["@badguy_xyz"]
  urls:          ["http://fake-upi-pay.tk"]
  bank_accounts: ["123456789012"]
  orgs:          ["ICICI", "Instagram", "WhatsApp"]
  money:         ["₹50,000"]
```

### 5.2 Implementation

```python
# shieldher-ai/app/services/ner_extractor.py

import spacy
import re
from spacy.matcher import Matcher

nlp = spacy.load("en_core_web_sm")  # base model

# Regex patterns for Indian-specific entities
PATTERNS = {
    'phone_india': r'(?:\+91[-\s]?)?[6-9]\d{9}',
    'email':       r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b',
    'url':         r'https?://[^\s<>"{}|\\^`\[\]]+',
    'social_handle': r'@[A-Za-z0-9_]{3,30}',
    'bank_account': r'\b\d{9,18}\b',
    'upi_id':      r'\b[a-zA-Z0-9._\-]+@[a-zA-Z]{3,10}\b',  # name@upi
    'aadhaar':     r'\b\d{4}\s?\d{4}\s?\d{4}\b',
    'amount_inr':  r'(?:₹|Rs\.?|INR)\s?[\d,]+(?:\.\d{2})?',
}

def extract_entities(text: str) -> dict:
    entities = {
        'phones': [], 'emails': [], 'urls': [], 'social_handles': [],
        'bank_accounts': [], 'upi_ids': [], 'persons': [],
        'locations': [], 'organizations': [], 'amounts': [],
    }

    # Regex extraction
    entities['phones']          = list(set(re.findall(PATTERNS['phone_india'], text)))
    entities['emails']          = list(set(re.findall(PATTERNS['email'], text)))
    entities['urls']            = list(set(re.findall(PATTERNS['url'], text)))
    entities['social_handles']  = list(set(re.findall(PATTERNS['social_handle'], text)))
    entities['amounts']         = list(set(re.findall(PATTERNS['amount_inr'], text)))
    entities['upi_ids']         = list(set(re.findall(PATTERNS['upi_id'], text)))

    # spaCy NER for contextual entities
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == 'PERSON': entities['persons'].append(ent.text)
        elif ent.label_ in ('GPE', 'LOC'): entities['locations'].append(ent.text)
        elif ent.label_ == 'ORG': entities['organizations'].append(ent.text)

    # Deduplicate
    for key in entities:
        entities[key] = list(set(entities[key]))

    return entities
```

---

## 6. ⚠️ Complaint Risk Scorer

### 6.1 Purpose

Automatically assign a risk priority (low/medium/high/urgent) to every incoming complaint, so police officers can triage their queue effectively.

### 6.2 Features

```
Text features:    TF-IDF of description + complaint category
Keyword signals:  "death threat" > "harassment", "minor" → urgent
Category weights: blackmail/deepfake = high, phishing link = medium
Suspect info:     suspect has multiple prior complaints → risk+
Temporal:         filed at night → slightly higher risk
```

### 6.3 Model

```python
# Model: TF-IDF + Logistic Regression (fast, interpretable)
# For v2: fine-tuned BERT for better semantic understanding

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

# 4-class classification: low=0, normal=1, high=2, urgent=3
risk_scorer = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=10000,
        sublinear_tf=True,        # log(1+tf) scaling
        min_df=2,
    )),
    ('clf', LogisticRegression(
        C=1.0,
        class_weight={0: 1, 1: 2, 2: 3, 3: 5},  # urgents matter more
        multi_class='multinomial',
        solver='lbfgs',
        max_iter=1000,
    ))
])

# Training dataset:
# 1. Synthetic complaints generated using GPT-4 (2,000 examples per class)
# 2. Manually labeled sample complaints (500 examples)
# 3. Augmented via paraphrase and back-translation
```

---

## 7. 🗺️ Unsafe Zone Prediction (DBSCAN)

### 7.1 Algorithm: DBSCAN (Density-Based Spatial Clustering of Applications with Noise)

**Why DBSCAN over K-Means:**
- Does NOT require knowing K (number of clusters) in advance
- Handles arbitrary cluster shapes (not just circular)
- Labels low-density points as NOISE — perfect for sparse incident data
- Naturally handles geographic data with Haversine distance metric

**How DBSCAN works:**

```
Parameters:
  ε (epsilon): Maximum distance between two points to be considered neighbors
               For zones: ε = 500 meters (0.0000785 radians)
  MinPts:      Minimum number of points to form a dense region
               For zones: MinPts = 3 (at least 3 incidents to create a zone)

Algorithm:
  For each unvisited point P:
    1. Find all points within ε distance of P → call this N(P)
    
    2. If |N(P)| < MinPts:
       → Mark P as NOISE (isolated incident — not a zone)
    
    3. If |N(P)| >= MinPts:
       → P is a CORE POINT → start a new cluster
       → Expand cluster: for each point Q in N(P):
           if Q is NOISE → add to current cluster
           if Q is unvisited → add to cluster + expand Q's neighborhood
    
  Output: Each cluster = a danger zone
          Noise points = isolated incidents (don't form zones)
```

### 7.2 Implementation

```python
# shieldher-ai/app/services/zone_predictor.py

from sklearn.cluster import DBSCAN
import numpy as np
from datetime import datetime, timedelta

def run_zone_prediction(incidents: list[dict]) -> list[dict]:
    """
    incidents: list of { latitude, longitude, created_at, category, severity }
    returns: list of detected zone dicts ready for Supabase insert
    """
    if len(incidents) < 3:
        return []

    coords = np.array([[i['latitude'], i['longitude']] for i in incidents])

    # DBSCAN with Haversine metric (earth-surface distances)
    # ε = 500m / 6,371,000m (earth radius) = 0.0000785 radians
    eps_radians = 500 / 6_371_000
    coords_rad = np.radians(coords)

    db = DBSCAN(
        eps=eps_radians,
        min_samples=3,
        algorithm='ball_tree',
        metric='haversine'
    ).fit(coords_rad)

    labels = db.labels_
    unique_labels = [l for l in set(labels) if l != -1]  # -1 = noise

    zones = []
    for cluster_id in unique_labels:
        mask = labels == cluster_id
        cluster_points = coords[mask]
        cluster_incidents = [incidents[i] for i, m in enumerate(mask) if m]
        n = len(cluster_points)

        center_lat = float(np.mean(cluster_points[:, 0]))
        center_lng = float(np.mean(cluster_points[:, 1]))

        # Radius = max distance from center + 50m padding
        distances = [haversine_m(center_lat, center_lng, p[0], p[1]) for p in cluster_points]
        radius = int(max(distances) + 50)

        # Risk level based on incident count + severity
        severity_weights = {'sos': 2.0, 'blackmail': 1.8, 'harassment': 1.5, 'phishing': 1.0}
        weighted_count = sum(severity_weights.get(i.get('category', ''), 1.0) for i in cluster_incidents)

        if weighted_count >= 20:   risk_level = 5
        elif weighted_count >= 12: risk_level = 4
        elif weighted_count >= 7:  risk_level = 3
        elif weighted_count >= 4:  risk_level = 2
        else:                      risk_level = 1

        # Determine predominant time band
        hours = [datetime.fromisoformat(i['created_at']).hour for i in cluster_incidents]
        night_count = sum(1 for h in hours if h >= 21 or h <= 5)
        zone_type = 'time_based' if (night_count / n) > 0.6 else 'always_active'

        active_bands = None
        if zone_type == 'time_based':
            active_bands = [{"days": "all", "from": "21:00", "to": "06:00"}]

        zones.append({
            'name': f'AI Zone — Cluster {cluster_id + 1}',
            'description': f'AI-detected cluster with {n} incidents in 90 days.',
            'center_lat': round(center_lat, 8),
            'center_lng': round(center_lng, 8),
            'radius_meters': max(radius, 200),
            'risk_level': risk_level,
            'zone_type': zone_type,
            'active_bands': active_bands,
            'incident_count': n,
            'ai_generated': True,
            'expires_at': (datetime.now() + timedelta(hours=48)).isoformat(),
        })

    return zones
```

---

## 8. Complete ML Architecture

```
shieldher-ai/
│
├── app/
│   ├── main.py                  ← FastAPI app, startup model loading
│   ├── config.py                ← pydantic-settings
│   │
│   ├── routers/
│   │   ├── url_scan.py          ← POST /url-scan
│   │   ├── deepfake.py          ← POST /deepfake-detect
│   │   ├── profile_scan.py      ← POST /profile-scan
│   │   ├── ner.py               ← POST /extract-entities
│   │   ├── risk_score.py        ← POST /risk-score
│   │   └── zone_predict.py      ← POST /predict-zones (internal)
│   │
│   ├── services/
│   │   ├── phishing/
│   │   │   ├── feature_extractor.py     ← all 67 features
│   │   │   ├── rule_engine.py           ← Layer 0 rules
│   │   │   ├── ensemble.py              ← score combiner
│   │   │   └── phishing_service.py      ← orchestrates all layers
│   │   ├── deepfake_detector.py
│   │   ├── profile_scanner.py
│   │   ├── ner_extractor.py
│   │   ├── risk_scorer.py
│   │   └── zone_predictor.py
│   │
│   └── models/
│       ├── phishing/
│       │   ├── random_forest_model.py
│       │   ├── xgboost_model.py
│       │   ├── bilstm_model.py
│       │   └── bert_model.py
│       └── deepfake/
│           └── efficientnet_model.py
│
├── saved_models/                ← trained model files
│   ├── random_forest.pkl        ← ~5 MB
│   ├── xgboost.pkl              ← ~10 MB
│   ├── bilstm.h5                ← ~25 MB
│   ├── bert_phishing/           ← ~430 MB (BERT)
│   │   ├── config.json
│   │   ├── pytorch_model.bin
│   │   └── tokenizer/
│   ├── deepfake_efficientnet.pth ← ~75 MB
│   ├── risk_scorer.pkl          ← ~2 MB
│   └── spacy_ner/               ← ~15 MB
│
├── training/
│   ├── train_phishing.py        ← full phishing training pipeline
│   ├── train_deepfake.py
│   ├── train_risk_scorer.py
│   └── datasets/
│       ├── download_datasets.sh ← downloads all public datasets
│       └── merge_datasets.py
│
└── requirements.txt
```

---

## 9. Full Tech Stack for ML

```
Core ML/DL:
  torch==2.3.0                 ← PyTorch for EfficientNet, BiLSTM
  tensorflow==2.16.0           ← TensorFlow alternative for BiLSTM
  transformers==4.41.0         ← HuggingFace BERT
  datasets==2.19.0             ← HuggingFace datasets
  scikit-learn==1.5.0          ← Random Forest, XGBoost wrapper, preprocessing
  xgboost==2.0.3               ← XGBoost gradient boosting
  lightgbm==4.3.0              ← Alternative to XGBoost (faster on CPU)
  efficientnet-pytorch==0.7.1  ← EfficientNet implementation

NLP:
  spacy==3.7.4                 ← NER pipeline
  en_core_web_sm               ← spaCy English model
  nltk==3.8.1                  ← Tokenization, stopwords

Feature Engineering:
  tldextract==5.1.2            ← URL domain parsing
  python-whois==0.9.4          ← Domain WHOIS queries
  dnspython==2.6.1             ← DNS lookups
  requests==2.31.0             ← URL content fetching
  beautifulsoup4==4.12.3       ← HTML parsing for content features

Image Processing:
  opencv-python==4.9.0.80      ← Image decoding, face detection
  Pillow==10.3.0               ← Image manipulation
  facenet-pytorch==2.6.0       ← MTCNN face detection

Data:
  pandas==2.2.2                ← Dataset manipulation
  numpy==1.26.4                ← Numerical operations
  scipy==1.13.0                ← Statistical functions
  imbalanced-learn==0.12.2     ← SMOTE for class balancing

Clustering:
  hdbscan==0.8.36              ← Improved DBSCAN for zones
  geopy==2.4.1                 ← Geographic distance utilities

Explainability:
  shap==0.45.0                 ← SHAP values for model explanations
  lime==0.2.0.1                ← Local interpretable explanations

API:
  fastapi==0.110.2
  uvicorn==0.29.0
  pydantic==2.7.1

Serving:
  onnxruntime==1.18.0          ← ONNX runtime for faster inference
  tritonclient                 ← Optional: NVIDIA Triton for serving
  celery==5.3.6                ← Async task queue for heavy jobs
  redis==5.0.4                 ← Task queue broker
```

---

## 10. Training Infrastructure & Requirements

### Hardware Requirements

| Task | Minimum | Recommended |
|---|---|---|
| Rule Engine | Any CPU | Any CPU |
| Random Forest | 8 GB RAM, 4 cores | 16 GB RAM, 8 cores |
| XGBoost | 8 GB RAM, 4 cores | 16 GB RAM, 8 cores |
| BiLSTM | CPU: slow (4h), GPU: 30min | NVIDIA T4 or better |
| BERT fine-tuning | GPU 16GB VRAM (min) | NVIDIA A100 / RTX 4090 |
| EfficientNet | GPU 8GB VRAM (min) | NVIDIA V100 / A100 |

### Free Training Resources (Hackathon)

```
Google Colab Pro     → T4 GPU, 16GB RAM, free tier available
Kaggle Notebooks     → P100 GPU, 2x per week free
HuggingFace Spaces   → CPU, free hosting
Lightning.ai Studio  → Free GPU tier for training
```

### Training Time Estimates

| Model | Dataset Size | Hardware | Estimated Time |
|---|---|---|---|
| Random Forest | 100K URLs | CPU (8 core) | 15 minutes |
| XGBoost | 100K URLs | CPU (8 core) | 20 minutes |
| BiLSTM | 100K URLs | Colab T4 GPU | 45 minutes |
| BERT fine-tuning | 100K URLs | Colab T4 GPU | 3-4 hours |
| EfficientNet (deepfake) | 50K images | Colab T4 GPU | 6-8 hours |

---

## 11. Model Registry & Versioning

```python
# All models are versioned and stored with metadata
MODEL_REGISTRY = {
    'phishing_rf_v1.2': {
        'path': 'saved_models/random_forest_v1_2.pkl',
        'trained_on': '2024-06-01',
        'dataset_size': 99_797,
        'val_auc': 0.9712,
        'val_f1': 0.9634,
        'false_positive_rate': 0.021,
        'false_negative_rate': 0.018,
    },
    'phishing_bert_v1.0': {
        'path': 'saved_models/bert_phishing_v1_0/',
        'trained_on': '2024-06-03',
        'base_model': 'bert-base-uncased',
        'epochs': 4,
        'val_auc': 0.9913,
        'val_f1': 0.9804,
    },
    'deepfake_effnet_v1.0': {
        'path': 'saved_models/deepfake_efficientnet_v1_0.pth',
        'backbone': 'efficientnet-b4',
        'val_auc': 0.9650,
        'test_recall': 0.943,
    },
}
```

**Model Update Schedule:**
- Phishing models: retrain monthly (new phishing patterns emerge constantly)
- Deepfake model: retrain quarterly (new deepfake methods)
- Zone predictor: runs nightly (no model file — algorithm-based)
- Risk scorer: retrain as complaint data grows

---

*ShieldHer ML Documentation v1.0 | All Models & Algorithms | KanadShield Hackathon PS-69EEFD950B72D*
