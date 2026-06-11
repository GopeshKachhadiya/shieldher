import re
import tldextract
from urllib.parse import urlparse
import math
from collections import Counter

# Based on the architecture doc
URL_SHORTENERS = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'buff.ly',
    'adf.ly', 'is.gd', 'cli.gs', 'yfrog.com', 'migre.me', 'ff.im',
    'tiny.cc', 'url4.eu', 'twit.ac', 'su.pr', 'twurl.nl', 'snipurl.com',
    'short.to', 'budurl.com', 'ping.fm', 'post.ly', 'just.as', 'bkite.com',
    'snipr.com', 'fic.kr', 'loopt.us', 'doiop.com', 'short.ie', 'kl.am',
}

SUSPICIOUS_TLDS = {
    'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'club', 'online',
    'site', 'website', 'info', 'biz', 'work', 'link', 'click', 'download',
}

PHISHING_KEYWORDS = [
    'login', 'signin', 'log-in', 'sign-in', 'verify', 'verification', 'confirm',
    'secure', 'security', 'update', 'upgrade', 'account', 'password', 'passwd', 'credential',
    'bank', 'banking', 'payment', 'pay', 'suspend', 'suspended', 'locked', 'unlock',
    'alert', 'warning', 'urgent', 'immediately', 'free', 'prize', 'winner', 'congratulations',
    'click-here', 'claim', 'reward', 'lucky', 'webscr', 'cmd', 'dispatch',
    'wp-login', 'admin', 'cpanel',
]

MAJOR_BRANDS = {
    'paypal', 'amazon', 'google', 'facebook', 'microsoft', 'apple',
    'netflix', 'instagram', 'whatsapp', 'twitter', 'linkedin',
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes', 'pnb',
    'paytm', 'phonepe', 'gpay', 'googlepay', 'bhim', 'upi',
    'irctc', 'aadhaar', 'epfo', 'incometax', 'gst',
    'flipkart', 'swiggy', 'zomato', 'ola', 'uber', 'myntra',
}

def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = Counter(s)
    probs = [float(c) / len(s) for c in counts.values()]
    return -sum(p * math.log(p, 2) for p in probs)

class FeatureExtractor:
    def extract_features(self, url: str) -> dict:
        parsed = urlparse(url)
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}".lower()
        
        url_lower = url.lower()
        
        features = {}
        
        # Group A: URL String Features
        features['url_length'] = len(url)
        features['domain_length'] = len(domain)
        features['path_length'] = len(parsed.path)
        features['query_length'] = len(parsed.query)
        
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = domain.count('-')
        features['num_underscores'] = url.count('_')
        features['num_slashes'] = url.count('/')
        features['num_question_marks'] = url.count('?')
        features['num_equal_signs'] = url.count('=')
        features['num_at_symbols'] = url.count('@')
        features['num_percent_signs'] = url.count('%')
        features['num_ampersands'] = url.count('&')
        
        features['num_digits_in_domain'] = sum(c.isdigit() for c in domain)
        features['num_digits_in_path'] = sum(c.isdigit() for c in parsed.path)
        features['num_subdomains'] = ext.subdomain.count('.') + 1 if ext.subdomain else 0
        features['subdomain_length'] = len(ext.subdomain)
        
        ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
        features['has_ip_address'] = 1 if re.search(ip_pattern, parsed.netloc) else 0
        
        features['has_at_before_domain'] = 1 if '@' in parsed.netloc else 0
        features['has_double_slash_redirect'] = 1 if '//' in parsed.path else 0
        features['has_https'] = 1 if parsed.scheme == 'https' else 0
        
        features['url_entropy'] = shannon_entropy(url)
        features['domain_entropy'] = shannon_entropy(domain)
        
        words = re.split(r'[\.\-\_]', domain)
        features['longest_word_length'] = max((len(w) for w in words), default=0)
        features['avg_word_length'] = sum(len(w) for w in words) / max(len(words), 1)
        
        features['is_url_shortened'] = 1 if ext.registered_domain in URL_SHORTENERS else 0
        features['has_suspicious_tld'] = 1 if ext.suffix in SUSPICIOUS_TLDS else 0
        features['tld_length'] = len(ext.suffix)
        
        features['num_suspicious_keywords'] = sum(1 for kw in PHISHING_KEYWORDS if kw in url_lower)
        
        features['has_brand_name_in_subdomain'] = 0
        for brand in MAJOR_BRANDS:
            if brand in ext.subdomain.lower() and brand not in ext.domain.lower():
                features['has_brand_name_in_subdomain'] = 1
                break
                
        features['has_brand_name_mismatch'] = 0
        path_query = (parsed.path + '?' + parsed.query).lower()
        for brand in MAJOR_BRANDS:
            if brand in path_query and brand not in domain:
                features['has_brand_name_mismatch'] = 1
                break
                
        features['num_params'] = url.count('&') + (1 if url.count('?') else 0)
        features['path_depth'] = parsed.path.strip('/').count('/') if parsed.path else 0
        
        features['has_port_in_url'] = 1 if ':' in parsed.netloc else 0
        
        # Rule-based specific reasons extraction
        reasons = []
        if features['has_ip_address']:
            reasons.append("IP address used instead of domain name")
        if features['is_url_shortened']:
            reasons.append("URL shortener service used")
        if features['has_suspicious_tld']:
            reasons.append(f"Suspicious top-level domain: .{ext.suffix}")
        if features['has_at_before_domain']:
            reasons.append("'@' symbol used to hide real domain")
        if features['num_suspicious_keywords'] > 0:
            matched = [kw for kw in PHISHING_KEYWORDS if kw in url_lower]
            reasons.append(f"Suspicious keywords found: {', '.join(matched[:3])}")
        if features['has_brand_name_in_subdomain']:
            reasons.append("Attempts to impersonate brand in subdomain")
        if features['has_brand_name_mismatch']:
            reasons.append("Brand name mentioned in path, but domain does not match")
        if features['url_entropy'] > 4.5:
            reasons.append("URL looks randomly generated (high entropy)")
            
        return {
            'features': features,
            'reasons': reasons
        }

FEATURE_NAMES = [
    'url_length', 'domain_length', 'path_length', 'query_length', 'num_dots', 
    'num_hyphens', 'num_underscores', 'num_slashes', 'num_question_marks', 
    'num_equal_signs', 'num_at_symbols', 'num_percent_signs', 'num_ampersands', 
    'num_digits_in_domain', 'num_digits_in_path', 'num_subdomains', 
    'subdomain_length', 'has_ip_address', 'has_at_before_domain', 
    'has_double_slash_redirect', 'has_https', 'url_entropy', 'domain_entropy', 
    'longest_word_length', 'avg_word_length', 'is_url_shortened', 
    'has_suspicious_tld', 'tld_length', 'num_suspicious_keywords', 
    'has_brand_name_in_subdomain', 'has_brand_name_mismatch', 'num_params', 
    'path_depth', 'has_port_in_url'
]
