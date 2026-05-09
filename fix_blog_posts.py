import os
import re

blog_dir = r'c:\Users\4nn4v\OneDrive\Desktop\Personal projects\Cryptic-Fox\blog-posts'
files = [f for f in os.listdir(blog_dir) if f.endswith('.html')]

for filename in files:
    filepath = os.path.join(blog_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Step 1.2: Fix Canonical and OG URL
    # Replace https://cryptic-fox.com/blog-post-X.html with https://cryptic-fox.com/blog-posts/blog-post-X.html
    content = re.sub(r'href="https://cryptic-fox\.com/(blog-post-\d+\.html)"', 
                     r'href="https://cryptic-fox.com/blog-posts/\1"', content)
    content = re.sub(r'content="https://cryptic-fox\.com/(blog-post-\d+\.html)"', 
                     r'content="https://cryptic-fox.com/blog-posts/\1"', content)
    
    # Step 1.5: Fix og:image path if pointing to root
    content = content.replace('content="https://cryptic-fox.com/Fox-Thumbnail.png"', 
                              'content="https://cryptic-fox.com/images/Fox-Thumbnail.png"')
    
    # Extra: Update copyright
    content = content.replace('&copy; 2025 Cryptic Fox', '&copy; 2025–2026 Cryptic Fox')
    content = content.replace('&copy; 2026 Cryptic Fox', '&copy; 2025–2026 Cryptic Fox')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filename}")

# Also fix root files copyright
root_dir = r'c:\Users\4nn4v\OneDrive\Desktop\Personal projects\Cryptic-Fox'
root_files = [f for f in os.listdir(root_dir) if f.endswith('.html')]
for filename in root_files:
    filepath = os.path.join(root_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = content.replace('&copy; 2025 Cryptic Fox', '&copy; 2025–2026 Cryptic Fox')
    content = content.replace('&copy; 2026 Cryptic Fox', '&copy; 2025–2026 Cryptic Fox')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed root {filename}")
