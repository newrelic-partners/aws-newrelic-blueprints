#!/usr/bin/env python3
"""
Checks that all src= and non-external href= references in index.html exist on disk.
"""
import re, sys
from pathlib import Path

html = Path('index.html').read_text()

errors = []
for attr in ('src', 'href'):
    for m in re.finditer(rf'{attr}=["\']([^"\']+)["\']', html):
        val = m.group(1)
        # Skip external URLs, data URIs, and fragment-only refs
        if val.startswith(('http://', 'https://', 'data:', '#', '//')):
            continue
        if not Path(val).exists():
            errors.append(f"{attr}='{val}' → file not found")

if errors:
    for e in errors:
        print(f"ERROR: {e}")
    sys.exit(1)

print("OK — all internal file references exist.")
