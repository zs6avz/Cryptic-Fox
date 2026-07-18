// ── Blog page logic ─────────────────────────────────────────────────
let allPosts = [];
let filteredPosts = [];
const postsPerPage = 6;
let currentPage = 1;
let currentCategory = 'All';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    const container  = document.getElementById('blogPosts');
    const pagination = document.getElementById('blogPagination');
    const searchInput = document.getElementById('blogSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function renderPosts() {
        container.textContent = '';

        const matches = allPosts.filter(post => {
            const catMatch    = currentCategory === 'All' || post.category === currentCategory;
            const searchMatch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
            return catMatch && searchMatch;
        });

        filteredPosts = matches;

        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        const start = (currentPage - 1) * postsPerPage;
        const paginatedPosts = filteredPosts.slice(start, start + postsPerPage);

        if (paginatedPosts.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--color-text-muted);margin-top:40px;';
            p.textContent = 'No dossiers match your criteria.';
            container.appendChild(p);
        } else {
            paginatedPosts.forEach(post => {
                // Build card with DOM API — no onclick= attribute, uses click listener
                const card = document.createElement('div');
                card.className = 'feature-card';
                card.style.cssText = 'cursor:pointer;display:flex;flex-direction:column;height:auto;';
                card.addEventListener('click', () => { window.location.href = post.link; });

                const inner = document.createElement('div');

                const imgSrc = post.thumbnail.startsWith('http') ? post.thumbnail : 'images/' + post.thumbnail;
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = post.title;
                img.loading = 'lazy';
                img.style.cssText = 'width:100%;height:180px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:15px;';
                inner.appendChild(img);

                const meta = document.createElement('div');
                meta.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
                const cat = document.createElement('span');
                cat.style.cssText = 'font-size:0.75rem;background:var(--color-primary);color:white;padding:2px 8px;border-radius:var(--radius-pill);';
                cat.textContent = post.category;
                const date = document.createElement('span');
                date.style.cssText = 'color:var(--color-text-muted);font-size:0.75rem;';
                date.textContent = post.date;
                meta.appendChild(cat); meta.appendChild(date);
                inner.appendChild(meta);

                const h3 = document.createElement('h3');
                h3.style.cssText = 'font-size:1.3rem;margin-bottom:10px;line-height:1.3;';
                h3.textContent = post.title;
                inner.appendChild(h3);

                const excerpt = document.createElement('p');
                excerpt.style.cssText = 'color:var(--color-text-muted);font-size:0.95rem;line-height:1.5;margin-bottom:10px;';
                excerpt.textContent = post.excerpt;
                inner.appendChild(excerpt);

                card.appendChild(inner);

                const footer = document.createElement('div');
                footer.style.cssText = 'margin-top:auto;padding-top:15px;';
                const link = document.createElement('a');
                link.href = post.link;
                link.className = 'card-link';
                link.textContent = 'Read Post ';
                const arrow = document.createElement('span');
                arrow.textContent = '→';
                link.appendChild(arrow);
                footer.appendChild(link);
                card.appendChild(footer);

                container.appendChild(card);
            });
        }

        renderPagination(totalPages, renderPosts);
    }

    function renderPagination(totalPages, renderFn) {
        pagination.textContent = '';
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                currentPage = i;
                renderFn();
                window.scrollTo({ top: 400, behavior: 'smooth' });
            });
            pagination.appendChild(btn);
        }
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            currentPage = 1;
            renderPosts();
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            currentPage = 1;
            renderPosts();
        });
    });

    // Fetch and parse XML
    fetch('xml/blog-posts.xml')
        .then(r => r.text())
        .then(str => (new DOMParser()).parseFromString(str, 'text/xml'))
        .then(data => {
            const posts = data.getElementsByTagName('post');
            for (const post of posts) {
                allPosts.push({
                    title:     post.getElementsByTagName('title')[0].textContent,
                    date:      post.getElementsByTagName('date')[0].textContent,
                    category:  post.getElementsByTagName('category')[0].textContent,
                    thumbnail: post.getElementsByTagName('thumbnail')[0].textContent,
                    excerpt:   post.getElementsByTagName('excerpt')[0].textContent,
                    link:      'blog-posts/' + post.getElementsByTagName('link')[0].textContent,
                    timestamp: new Date(post.getElementsByTagName('date')[0].textContent).getTime()
                });
            }
            allPosts.sort((a, b) => b.timestamp - a.timestamp);
            filteredPosts = [...allPosts];
            renderPosts();
        })
        .catch(err => console.error('Failed to load blog posts:', err));
});
