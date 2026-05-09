"""
Batch fix script for Cryptic-Fox issues:
1. Fix og:image path (Fox-Thumbnail.png → images/Fox-Thumbnail.png) in root HTML files
2. Fix blog post canonical URLs and og:url (add blog-posts/ path segment)
3. Update copyright year from 2025 to 2025-2026
"""
import glob
import re

# --- Fix 1: og:image path in root HTML files ---
root_html = glob.glob('*.html')
for file in root_html:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Fix og:image and twitter:image — only if pointing to root Fox-Thumbnail
    content = content.replace(
        'content="https://cryptic-fox.com/Fox-Thumbnail.png"',
        'content="https://cryptic-fox.com/images/Fox-Thumbnail.png"'
    )
    
    # Update copyright
    content = content.replace('© 2025 Cryptic Fox', '© 2025–2026 Cryptic Fox')
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file}")

# --- Fix 2: Blog post canonical URLs + og:url + copyright ---
blog_files = glob.glob('blog-posts/*.html')
for file in blog_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix canonical: cryptic-fox.com/blog-post-X.html → cryptic-fox.com/blog-posts/blog-post-X.html
    content = re.sub(
        r'href="https://cryptic-fox\.com/(blog-post-\d+\.html)"',
        r'href="https://cryptic-fox.com/blog-posts/\1"',
        content
    )
    
    # Fix og:url same pattern
    content = re.sub(
        r'content="https://cryptic-fox\.com/(blog-post-\d+\.html)"',
        r'content="https://cryptic-fox.com/blog-posts/\1"',
        content
    )
    
    # Fix og:image path
    content = content.replace(
        'content="https://cryptic-fox.com/Fox-Thumbnail.png"',
        'content="https://cryptic-fox.com/images/Fox-Thumbnail.png"'
    )
    
    # Update copyright
    content = content.replace('© 2025 Cryptic Fox', '© 2025–2026 Cryptic Fox')
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file}")

print("\nDone! All og:image paths, canonical URLs, and copyright years updated.")
