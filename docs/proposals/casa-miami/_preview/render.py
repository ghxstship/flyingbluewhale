#!/usr/bin/env python3
"""Render Casa Miami proposal markdown to styled standalone HTML previews."""
import sys, os, re
import markdown

CSS = """
:root{--bg:#0A0A0C;--card:#1C1C20;--line:#2a2a30;--ink:#ECECEE;--mut:#9a9aa3;
--red:#dc2626;--accent:#f97316;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
font:16px/1.65 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
.wrap{max-width:1040px;margin:0 auto;padding:64px 40px 120px}
h1{font:800 40px/1.1 "Big Shoulders Display",Inter,sans-serif;letter-spacing:-.01em;
margin:0 0 8px;text-transform:uppercase}
h2{font:700 26px/1.2 "Big Shoulders Display",Inter,sans-serif;margin:56px 0 16px;
padding-top:24px;border-top:1px solid var(--line);letter-spacing:.01em}
h3{font:700 18px/1.3 Inter,sans-serif;margin:32px 0 10px;color:#fff}
h2:first-of-type{border-top:none}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
p,li{color:var(--ink)}
blockquote{margin:20px 0;padding:14px 22px;border-left:3px solid var(--red);
background:#141417;color:var(--mut);font-style:italic;border-radius:0 8px 8px 0}
table{border-collapse:collapse;width:100%;margin:18px 0;font-size:14px;
background:var(--card);border-radius:10px;overflow:hidden}
th{background:#232329;text-align:left;font-weight:700;font-size:12.5px;
text-transform:uppercase;letter-spacing:.03em;color:#cfcfd6}
th,td{padding:9px 13px;border-bottom:1px solid var(--line);vertical-align:top}
td:last-child,th:last-child{text-align:right}
tr:last-child td{border-bottom:none}
tbody tr:hover{background:#202026}
strong{color:#fff}
code{background:#232329;padding:2px 6px;border-radius:5px;font-size:13px;
font-family:"JetBrains Mono",ui-monospace,monospace}
pre{background:#141417;padding:16px;border-radius:10px;overflow:auto;
border:1px solid var(--line)}
pre code{background:none;padding:0}
hr{border:none;border-top:1px solid var(--line);margin:40px 0}
.tag{display:inline-block;background:var(--red);color:#fff;font:700 11px/1 Inter;
text-transform:uppercase;letter-spacing:.08em;padding:6px 12px;border-radius:99px;
margin-bottom:18px}
.meta{color:var(--mut);font-size:13px;margin:-4px 0 24px}
"""

def render(md_path, out_path, tag):
    with open(md_path) as f:
        text = f.read()
    html = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists"])
    title = re.search(r"^#\s+(.+)$", text, re.M)
    title = title.group(1) if title else os.path.basename(md_path)
    doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body><div class="wrap">
<div class="tag">{tag} · Casa Spotify Miami · Tigre Sound System × G H X S T S H I P</div>
{html}</div></body></html>"""
    with open(out_path, "w") as f:
        f.write(doc)
    return out_path

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.dirname(os.path.abspath(__file__))
    jobs = [
        ("04-tier-4-xl-template.md", "tier-4-template.html", "Tier 4 Template — XL / Open Brief"),
        ("04-tier-4-xl-calle-casa.md", "tier-4-calle-casa.html", "Tier 4 Instance — Calle Casa Vol. 01"),
    ]
    for src, dst, tag in jobs:
        p = render(os.path.join(base, src), os.path.join(out, dst), tag)
        print(p)
