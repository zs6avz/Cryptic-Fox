document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Navigation
    const navPlaceholder = document.querySelector('[role="navigation"]');
    if (navPlaceholder) {
        // We assume the placeholder exists. In some files it's already there.
        // If we want to be robust, we could create it if missing.
        const isRoot = !window.location.pathname.includes('blog-posts/');
        const prefix = isRoot ? '' : '../';
        
        const navHtml = `
            <button class="dropbtn" aria-label="Navigation menu" aria-expanded="false">⨀Ξ〄⋑</button>
            <div class="dropdown-content">
                <a href="${prefix}index.html">Home</a>
                <a href="${prefix}about.html">About</a>
                <a href="${prefix}decrypt.html">Encrypt/Decrypt</a>
                <a href="${prefix}image-encrypt.html">Image Encryption</a>
                <a href="${prefix}audio-encrypt.html">Audio Encryption</a>
                <a href="${prefix}red.html">Steganalysis</a>
                <a href="${prefix}puzzles.html">Puzzles</a>
                <a href="${prefix}cryptography.html">Resources</a>
                <a href="${prefix}blog.html">Blog</a>
                <a href="${prefix}tepcipher.html">⌖Ξ⎔ ⚲∷⎔⍥Ξ⎐</a>
            </div>
        `;
        navPlaceholder.innerHTML = navHtml;

        // Re-attach dropdown toggle logic (extracted from script.js)
        const dropbtn = navPlaceholder.querySelector('.dropbtn');
        const dropdownContent = navPlaceholder.querySelector('.dropdown-content');
        
        dropbtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = dropbtn.getAttribute('aria-expanded') === 'true';
            dropbtn.setAttribute('aria-expanded', !isExpanded);
            dropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', () => {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
                dropbtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // 2. Inject Footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = `
            <p>&copy; 2025–2026 Cryptic Fox &nbsp;|&nbsp; 
                <a href='https://ko-fi.com/S6S81YLIDM' target='_blank' rel='noopener noreferrer'>
                    <img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' 
                        border='0' alt='Support me on Ko-fi' loading="lazy" />
                </a>
            </p>
        `;
    }
});
