import urllib.request
import re

url = "https://graffitifonts.com/free_fonts/paintcans_free"
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    links = re.findall(r'href=[\'"](.*?(?:\.zip|\.ttf|\.otf))[\'"]', html, re.IGNORECASE)
    print("Found links:", links)
    
    download_links = re.findall(r'href=[\'"](.*?)[\'"][^>]*>.*?download.*?</a', html, re.IGNORECASE | re.DOTALL)
    print("Download links:", download_links)
except Exception as e:
    print("Error:", e)
