import glob
import re
import os

html_files = glob.glob('*.html') + glob.glob('blog-posts/*.html')

csp_tag = '''
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' blob:; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://storage.ko-fi.com; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self' blob:;">'''

frame_buster = '''
    <!-- Clickjacking Defense (Frame-Busting) -->
    <style id="antiClickjack">body{display:none !important;}</style>
    <script type="text/javascript">
        if (self === top) {
            var antiClickjack = document.getElementById("antiClickjack");
            if (antiClickjack) antiClickjack.parentNode.removeChild(antiClickjack);
        } else {
            top.location = self.location;
        }
    </script>'''

def fix_links(html):
    def replacer(match):
        tag = match.group(0)
        if 'target="_blank"' in tag or "target='_blank'" in tag:
            if 'noopener' not in tag:
                # remove existing rel attribute to avoid duplicates
                tag = re.sub(r'\s*rel=(["\'])[^\1]*\1', '', tag)
                if 'target="_blank"' in tag:
                    tag = tag.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"')
                else:
                    tag = tag.replace("target='_blank'", "target='_blank' rel=\"noopener noreferrer\"")
        return tag
    return re.sub(r'<a\s+[^>]+>', replacer, html)

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Use regex to find and replace existing CSP tag if it exists, otherwise add it
    if '<meta http-equiv="Content-Security-Policy"' in content:
        content = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', csp_tag.strip(), content)
        modified = True
    else:
        content = content.replace('<head>', '<head>' + csp_tag + frame_buster)
        modified = True

    new_content = fix_links(content)
    if new_content != content:
        content = new_content
        modified = True

    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
