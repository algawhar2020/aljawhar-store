#!/usr/bin/env python3
"""Make Open Graph links absolute after publishing (needed for WhatsApp link previews).
Usage:  python3 set_site_url.py https://USERNAME.github.io/aljawhar-store
"""
import re, sys, pathlib
if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
    sys.exit(__doc__)
base = sys.argv[1].rstrip("/")
p = pathlib.Path(__file__).with_name("index.html")
s = p.read_text(encoding="utf-8")
s = re.sub(r'(<meta property="og:url" content=")[^"]*(")', rf'\g<1>{base}/\2', s)
s = re.sub(r'((?:property="og:image"|name="twitter:image") content=")[^"]*(")', rf'\g<1>{base}/assets/og-image.jpg\2', s)
p.write_text(s, encoding="utf-8")
print("OK — Open Graph URLs now point to", base)
