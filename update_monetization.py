import glob
import re
import os

html_files = glob.glob('*.html')

pro_link = '            <a href="#" class="pro-link">✦ Upgrade to Pro</a>\n        </div>\n    </div>'
ad_block = '<!-- Ad Placement Scaffolding -->\n    <div class="ad-scaffold">\n        <span class="ad-label">Sponsored Placement</span>\n    </div>\n\n    <footer>'
bmc_text = '&copy; 2025 Cryptic Fox &nbsp;|&nbsp; <a href=\'https://ko-fi.com/S6S81YLIDM\' target=\'_blank\'><img height=\'36\' style=\'border:0px;height:36px;\' src=\'https://storage.ko-fi.com/cdn/kofi6.png?v=6\' border=\'0\' alt=\'Buy Me a Coffee at ko-fi.com\' /></a></p>'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Update dropdown
    if 'class="pro-link"' not in content and 'dropdown-content' in content:
        if '        </div>\n    </div>' in content:
            content = content.replace('        </div>\n    </div>', pro_link)
            modified = True
            
    # 2. Add ad scaffold
    if '<footer>' in content and 'ad-scaffold' not in content:
        content = content.replace('<footer>', ad_block)
        modified = True
        
    # 3. Add Buy Me a Coffee
    if '&copy; 2025 Cryptic Fox</p>' in content and 'Buy Me a Coffee' not in content:
        content = content.replace('&copy; 2025 Cryptic Fox</p>', bmc_text)
        modified = True

    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
