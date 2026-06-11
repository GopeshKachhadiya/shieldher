import random
import pandas as pd
from features.extractor import FeatureExtractor

def generate_dummy_dataset(num_samples=5000):
    extractor = FeatureExtractor()
    data = []
    labels = []
    
    # Generate benign URLs
    benign_domains = ['google.com', 'facebook.com', 'youtube.com', 'amazon.com', 'wikipedia.org', 'instagram.com', 'linkedin.com', 'apple.com', 'microsoft.com', 'netflix.com']
    paths = ['', '/login', '/home', '/about', '/contact', '/user/profile', '/search?q=hello']
    
    for _ in range(num_samples // 2):
        domain = random.choice(benign_domains)
        path = random.choice(paths)
        url = f"https://www.{domain}{path}"
        
        extracted = extractor.extract_features(url)['features']
        data.append(extracted)
        labels.append(0) # 0 = safe
        
    # Generate phishing URLs
    phishing_tlds = ['.tk', '.ml', '.ga', '.xyz', '.online', '.site']
    phishing_keywords = ['login', 'verify', 'update', 'secure', 'account', 'banking']
    brands = ['paypal', 'amazon', 'netflix', 'apple', 'hdfc']
    
    for _ in range(num_samples // 2):
        brand = random.choice(brands)
        keyword = random.choice(phishing_keywords)
        tld = random.choice(phishing_tlds)
        
        # Typosquatting or brand in subdomain
        if random.random() > 0.5:
            domain = f"{brand}-{keyword}{tld}"
            url = f"http://{domain}/"
        else:
            domain = f"mysecurityupdate{tld}"
            url = f"http://{brand}.{domain}/{keyword}"
            
        # Add random parameters or IP sometimes
        if random.random() > 0.8:
            url += "?ref=12345&token=abcde"
        if random.random() > 0.9:
            url = f"http://192.168.{random.randint(1,255)}.{random.randint(1,255)}/{brand}"
            
        extracted = extractor.extract_features(url)['features']
        data.append(extracted)
        labels.append(1) # 1 = phishing
        
    df = pd.DataFrame(data)
    df['label'] = labels
    return df
