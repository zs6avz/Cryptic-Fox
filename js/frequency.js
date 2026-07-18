// frequency.js

const ENGLISH_FREQ = {
    'A': 8.17, 'B': 1.49, 'C': 2.78, 'D': 4.25, 'E': 12.70, 'F': 2.23, 'G': 2.02, 'H': 6.09, 'I': 6.97,
    'J': 0.15, 'K': 0.77, 'L': 4.03, 'M': 2.41, 'N': 6.75, 'O': 7.51, 'P': 1.93, 'Q': 0.10, 'R': 5.99,
    'S': 6.33, 'T': 9.06, 'U': 2.76, 'V': 0.98, 'W': 2.36, 'X': 0.15, 'Y': 1.97, 'Z': 0.07
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let ciphertext = "";
let currentMap = {}; // CipherChar -> UserInput
let chart = null;
let letterModeCorpusHints = {}; // Store word suggestions for resolved text

function processUserInput() {
    // Get user input from textarea
    const input = document.getElementById("letter-cipher-input");
    if (!input) return;
    
    ciphertext = input.value.toUpperCase().trim();
    
    if (!ciphertext) {
        alert("Please enter ciphertext to analyze.");
        return;
    }
    
    // Reset current mapping
    currentMap = {};
    
    // Display ciphertext
    const ciphertextElement = document.getElementById("ciphertext");
    ciphertextElement.textContent = ciphertext;
    ciphertextElement.classList.remove("empty-state");
    
    // Update resolved text placeholder
    const resolvedElement = document.getElementById("resolvedText");
    resolvedElement.classList.remove("empty-state");
    
    // Populate mapping grid
    const grid = document.getElementById("mappingGrid");
    grid.innerHTML = "";
    
    // Get unique characters from ciphertext and sort by frequency
    const charCounts = {};
    ciphertext.split("").forEach(char => {
        if (alphabet.includes(char)) {
            charCounts[char] = (charCounts[char] || 0) + 1;
        }
    });
    
    const presentChars = Object.keys(charCounts).sort((a, b) => charCounts[b] - charCounts[a]);
    
    presentChars.forEach(char => {
        currentMap[char] = ""; // Initialize map
        const card = document.createElement("div");
        card.className = "map-card";
        card.innerHTML = `
            <label>${char}</label>
            <input type="text" maxlength="1" data-char="${char}" oninput="handleMapInput(this)">
        `;
        grid.appendChild(card);
    });
    
    updateResolvedText();
    initChart(presentChars);
}

function handleMapInput(input) {
    const cipherChar = input.getAttribute("data-char");
    const val = input.value.toUpperCase();
    input.value = val;
    currentMap[cipherChar] = val;
    updateResolvedText();
    updateCorpusHints(); // Update word suggestions
}

function updateResolvedText() {
    const resolved = ciphertext.split("").map(char => {
        if (!alphabet.includes(char)) return char;
        const userChar = currentMap[char];
        return userChar ? userChar : "_";
    }).join("");

    const resolvedElement = document.getElementById("resolvedText");
    resolvedElement.textContent = resolved;
    
    // Add corpus highlighting if words are recognized
    if (wordModeInitialized) {
        highlightRecognizedWords(resolvedElement, resolved);
    }
}

function initChart(presentChars) {
    const ctx = document.getElementById('freqChart').getContext('2d');

    // Calculate ciphertext frequencies
    const counts = {};
    let totalAlpha = 0;
    ciphertext.split("").forEach(char => {
        if (alphabet.includes(char)) {
            counts[char] = (counts[char] || 0) + 1;
            totalAlpha++;
        }
    });

    const cipherFreqs = presentChars.map(char => {
        return ((counts[char] || 0) / totalAlpha * 100).toFixed(2);
    });

    // We don't know which English letter maps to which ciphertext letter yet for the "Target" label, 
    // so we just show the English distribution sorted by frequency next to the Ciphertext distribution sorted?
    // No, standard practice is to show English reference.

    const englishRef = presentChars.map(char => {
        // This is tricky. We'll just show the English values for the solution if we want to help, 
        // OR just show the list of English frequencies in general.
        // Let's show English freq for the letter the user MIGHT THINK it is?
        return ENGLISH_FREQ[char] || 0;
    });

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: presentChars,
            datasets: [
                {
                    label: 'Ciphertext Frequency (%)',
                    data: cipherFreqs,
                    backgroundColor: 'rgba(235, 63, 123, 0.6)',
                    borderColor: 'rgba(235, 63, 123, 1)',
                    borderWidth: 1
                },
                {
                    label: 'English Standard (%)',
                    data: alphabet.map(c => ENGLISH_FREQ[c]).sort((a, b) => b - a), // Sorted for reference? 
                    // No, let's just use the Alphabet order for the second set to let them compare shapes if they want
                    // but it's better to show them side-by-side.
                    // Actually, a separate "Reference" dataset is better.
                    data: presentChars.map(() => 0), // Placeholder
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });

    // Add a second chart or dataset for reference
    addEnglishReference(chart);
}

function addEnglishReference(chart) {
    // Show top English letters for comparison
    const sortedEnglish = Object.entries(ENGLISH_FREQ).sort((a, b) => b[1] - a[1]);
    const labels = sortedEnglish.map(e => e[0]);
    const data = sortedEnglish.map(e => e[1]);

    // Let's just create a static reference chart below or as a separate dataset on a different axis?
    // User wants "similar to English"
    // I'll add a section in the UI for English frequency reference instead of a cluttered chart.
}

document.addEventListener("DOMContentLoaded", () => {
    // Don't auto-initialize letter mode - wait for user input
    initWordMode();          // Eager init so suggestions work before mode is clicked
    checkForSuggestedWords(); // Pick up terms sent from Forensic Index
    // Mode buttons and actions (replaces onclick= in frequency.html)
    const bnd = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    bnd('processInputBtn', () => typeof processUserInput === 'function' && processUserInput());
    bnd('refreshCorpusBtn', () => typeof refreshCorpus  === 'function' && refreshCorpus());
    // mode-letter / mode-word IDs replace the onclick=setMode('letter'/'word') already on those elements,
    // but setMode may already be called by existing id-based code — only add if not already wired
    if (document.getElementById('mode-letter') && !document.getElementById('mode-letter')._modeWired) {
        bnd('mode-letter', () => typeof setMode === 'function' && setMode('letter'));
        bnd('mode-word',   () => typeof setMode === 'function' && setMode('word'));
        const ml = document.getElementById('mode-letter'); if (ml) ml._modeWired = true;
    }

});

// ============================================================================
// MODE SWITCHING
// ============================================================================

let currentMode = 'letter';

function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.getElementById('mode-letter').classList.toggle('active', mode === 'letter');
    document.getElementById('mode-word').classList.toggle('active', mode === 'word');
    
    // Update content visibility
    document.getElementById('letter-mode-content').classList.toggle('active', mode === 'letter');
    document.getElementById('word-mode-content').classList.toggle('active', mode === 'word');
    
    // Update description
    const descriptions = {
        letter: 'Analyze substitution ciphers by mapping encrypted letters to their plaintext equivalents using frequency distribution and corpus-based word hints.',
        word: 'Solve messages with missing words using corpus-based pattern matching and contextual analysis.'
    };
    document.getElementById('mode-description').textContent = descriptions[mode];
    
    // Initialize word mode if switching to it
    if (mode === 'word' && !wordModeInitialized) {
        initWordMode();
    }
}

// ============================================================================
// WORD-LEVEL SOLVER - CORPUS & DICTIONARY
// ============================================================================

let wordModeInitialized = false;
let wordFrequency = {};
let patternIndex = {};
let lengthIndex = {};
let vocabularySize = 0;
let corpusMode = 'fallback';
let documentCount = 0;

// Top 5000 most common English words (fallback dictionary)
const COMMON_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with",
    "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if",
    "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him",
    "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than",
    "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two",
    "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give",
    "day", "most", "us", "is", "was", "are", "been", "has", "had", "were", "said", "did", "having", "may",
    "should", "am", "being", "ought", "might", "does", "must", "shall", "doing", "done", "made", "make",
    "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "hello", "world", "test", "example", "word",
    "text", "message", "cipher", "code", "secret", "hidden", "mystery", "puzzle", "solve", "find", "search",
    "through", "under", "where", "before", "between", "same", "each", "feel", "seem", "hand", "eye", "place",
    "case", "tell", "own", "leave", "ask", "man", "old", "right", "mean", "keep", "let", "begin", "help",
    "talk", "turn", "start", "show", "hear", "play", "run", "move", "live", "believe", "hold", "bring",
    "happen", "write", "provide", "sit", "stand", "lose", "pay", "meet", "include", "continue", "set",
    "learn", "change", "lead", "understand", "watch", "follow", "stop", "create", "speak", "read", "allow",
    "add", "spend", "grow", "open", "walk", "win", "offer", "remember", "love", "consider", "appear",
    "buy", "wait", "serve", "die", "send", "expect", "build", "stay", "fall", "cut", "reach", "kill",
    "remain", "suggest", "raise", "pass", "sell", "require", "report", "decide", "pull", "break", "pick",
    "wear", "catch", "choose", "fly", "return", "hope", "carry", "draw", "produce", "eat", "force", "throw",
    "such", "every", "much", "own", "while", "still", "try", "another", "great", "little", "large", "big",
    "small", "long", "early", "young", "important", "few", "public", "bad", "same", "able", "woman", "here",
    "national", "human", "both", "far", "present", "next", "social", "past", "possible", "true", "certain",
    "ever", "real", "full", "available", "whole", "likely", "economic", "hard", "strong", "necessary",
    "clear", "common", "recent", "simple", "main", "political", "personal", "sure", "ready", "similar",
    "easy", "serious", "wrong", "fine", "less", "dark", "several", "close", "professional", "special",
    "free", "dead", "military", "able", "current", "happy", "white", "black", "red", "blue", "green",
    "room", "house", "home", "family", "door", "water", "food", "book", "paper", "name", "number", "part",
    "line", "area", "money", "story", "fact", "month", "lot", "study", "business", "issue", "side", "kind",
    "head", "mother", "father", "power", "country", "able", "top", "whole", "end", "point", "member",
    "law", "car", "city", "community", "change", "information", "history", "party", "result", "morning",
    "reason", "research", "girl", "guy", "moment", "air", "teacher", "force", "education", "foot", "boy",
    "age", "policy", "everything", "love", "process", "music", "including", "art", "company", "president",
    "until", "record", "million", "ago", "difference", "management", "control", "upon", "although", "within",
    "during", "without", "toward", "upon", "once", "enough", "almost", "phone", "might", "away", "around",
    "something", "actually", "nothing", "thought", "perhaps", "rather", "quite", "especially", "else",
    "ever", "course", "someone", "around", "simply", "itself", "often", "please", "therefore", "whether"
];

function initWordMode() {
    wordModeInitialized = true;
    loadCorpus();
}

function loadCorpus() {
    try {
        const corpusData = localStorage.getItem('crypticfox_corpus');
        if (corpusData) {
            const corpus = JSON.parse(corpusData);
            if (corpus.documents && corpus.documents.length > 0) {
                buildCorpusIndex(corpus.documents);
                return;
            }
        }
    } catch (e) {
        console.warn('Could not load corpus from localStorage:', e);
    }
    
    // Fallback to common words dictionary
    buildFallbackDictionary();
}

function buildCorpusIndex(documents) {
    corpusMode = 'corpus';
    documentCount = documents.length;
    wordFrequency = {};
    
    // Check if Porter Stemmer is available
    const useStemming = typeof PorterStemmer !== 'undefined';
    let stemmer = null;
    if (useStemming) {
        stemmer = new PorterStemmer();
        console.log('[Word Solver] Building index with Porter Stemmer');
    }
    
    // Tokenize all documents and count word frequencies
    documents.forEach(doc => {
        const tokens = tokenize(doc.text);
        tokens.forEach(token => {
            // Store both original and stemmed versions for better matching
            wordFrequency[token] = (wordFrequency[token] || 0) + 1;
            
            // Also index stemmed version if available
            if (useStemming && stemmer) {
                const stemmed = stemmer.stem(token);
                if (stemmed !== token) {
                    // Create a link between stemmed and original forms
                    wordFrequency[stemmed] = (wordFrequency[stemmed] || 0) + 1;
                }
            }
        });
    });
    
    buildIndexes();
    updateCorpusStatus();
}

function buildFallbackDictionary() {
    corpusMode = 'fallback';
    documentCount = 0;
    wordFrequency = {};
    
    // Assign decreasing frequency values to common words
    COMMON_WORDS.forEach((word, index) => {
        wordFrequency[word.toLowerCase()] = COMMON_WORDS.length - index;
    });
    
    buildIndexes();
    updateCorpusStatus();
}

function buildIndexes() {
    patternIndex = {};
    lengthIndex = {};
    vocabularySize = Object.keys(wordFrequency).length;
    
    // Build pattern and length indexes
    Object.keys(wordFrequency).forEach(word => {
        const len = word.length;
        
        // Length index
        if (!lengthIndex[len]) lengthIndex[len] = [];
        lengthIndex[len].push(word);
        
        // Pattern index (full word pattern)
        const pattern = '_'.repeat(len);
        if (!patternIndex[pattern]) patternIndex[pattern] = [];
        patternIndex[pattern].push(word);
    });
    
    // Sort by frequency
    Object.keys(lengthIndex).forEach(len => {
        lengthIndex[len].sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    });
}

function tokenize(text) {
    return text.toLowerCase().match(/\b[a-z]+\b/g) || [];
}

function updateCorpusStatus() {
    document.getElementById('corpus-mode').textContent = corpusMode === 'corpus' ? 'Corpus' : 'Fallback';
    document.getElementById('corpus-vocab').textContent = vocabularySize.toLocaleString();
    document.getElementById('corpus-docs').textContent = documentCount.toString();
}

function refreshCorpus() {
    loadCorpus();
    if (currentTokens.length > 0) {
        updateAllSuggestions();
    }
}

// ============================================================================
// TOKEN PARSING & STATE MANAGEMENT
// ============================================================================

let currentTokens = [];
let tokenMap = {};
let cipherInput = '';

function parseTokens() {
    if (!wordModeInitialized) initWordMode(); // Safety net
    cipherInput = document.getElementById('word-cipher-input').value;
    
    // Extract all [WORDn] tokens
    const tokenPattern = /\[WORD(\d+)\]/g;
    const foundTokens = new Set();
    let match;
    
    while ((match = tokenPattern.exec(cipherInput)) !== null) {
        foundTokens.add(match[0]);
    }
    
    currentTokens = Array.from(foundTokens).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
    });
    
    // Initialize token map
    currentTokens.forEach(token => {
        if (!tokenMap[token]) {
            tokenMap[token] = {
                pattern: '',
                solution: '',
                suggestions: []
            };
        }
    });
    
    // Remove tokens that are no longer in the input
    Object.keys(tokenMap).forEach(token => {
        if (!currentTokens.includes(token)) {
            delete tokenMap[token];
        }
    });
    
    renderTokenGrid();
    updateResolvedWordText();
    updateAllSuggestions();
}

function renderTokenGrid() {
    const grid = document.getElementById('token-grid');
    
    if (currentTokens.length === 0) {
        grid.innerHTML = '<div class="no-tokens-message">Enter ciphertext with [WORDn] tokens above to see suggestions.</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    currentTokens.forEach(token => {
        const card = document.createElement('div');
        card.className = 'token-card';
        
        const patternDisplay = tokenMap[token].pattern || '___';
        
        const safeId = token.replace(/[\[\]]/g, '_'); // e.g. [WORD1] -> _WORD1_
        card.innerHTML = `
            <div class="token-header">
                <span class="token-label">${token}</span>
                <span class="token-pattern">Pattern: ${patternDisplay}</span>
            </div>
            <div class="token-input-wrapper">
                <input type="text" 
                       class="token-input" 
                       placeholder="Enter word or pattern (e.g., TH_)"
                       value="${tokenMap[token].solution}"
                       oninput="handleTokenInput('${token}', this.value)"
                       data-token="${token}">
            </div>
            <div class="suggestions-list" id="suggestions-${safeId}">
                <div style="color: var(--color-text-muted); font-size: 0.85rem; font-style: italic;">Calculating suggestions...</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function handleTokenInput(token, value) {
    const normalized = value.trim().toUpperCase();
    tokenMap[token].solution = normalized;
    
    // Detect pattern from input (e.g., "TH_" or "T_E")
    if (normalized.includes('_')) {
        tokenMap[token].pattern = normalized;
    } else if (normalized.length > 0) {
        tokenMap[token].pattern = normalized;
    }
    
    updateResolvedWordText();
    updateSuggestions(token);
}

function updateResolvedWordText() {
    let resolved = cipherInput;
    
    currentTokens.forEach(token => {
        const solution = tokenMap[token].solution;
        if (solution && !solution.includes('_')) {
            resolved = resolved.replace(new RegExp('\\' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), solution);
        } else {
            resolved = resolved.replace(new RegExp('\\' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '______');
        }
    });
    
    document.getElementById('word-resolved-text').textContent = resolved || 'Your decoded message will appear here...';
}

// ============================================================================
// PATTERN MATCHING & SUGGESTIONS
// ============================================================================

function updateAllSuggestions() {
    currentTokens.forEach(token => updateSuggestions(token));
}

function updateSuggestions(token) {
    const data = tokenMap[token];
    const pattern = data.pattern;
    
    // Get candidates based on pattern
    let candidates = [];
    
    if (pattern && pattern !== '') {
        candidates = getWordsByPattern(pattern);
    } else {
        // No pattern - suggest by length or most common words
        candidates = Object.keys(wordFrequency)
            .sort((a, b) => wordFrequency[b] - wordFrequency[a])
            .slice(0, 20);
    }
    
    // Apply context-aware ranking
    candidates = rankByContext(token, candidates);
    
    // Store top suggestions
    tokenMap[token].suggestions = candidates.slice(0, 20);
    
    // Render suggestions
    renderSuggestions(token);
}

function getWordsByPattern(pattern) {
    const patternLower = pattern.toLowerCase();
    const length = pattern.length;
    const candidates = [];
    
    // Get all words of the same length
    const wordsOfLength = lengthIndex[length] || [];
    
    wordsOfLength.forEach(word => {
        if (matchesPattern(word, patternLower)) {
            candidates.push(word);
        }
    });
    
    // Sort by frequency
    candidates.sort((a, b) => (wordFrequency[b] || 0) - (wordFrequency[a] || 0));
    
    return candidates;
}

function matchesPattern(word, pattern) {
    if (word.length !== pattern.length) return false;
    
    for (let i = 0; i < word.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== word[i]) {
            return false;
        }
    }
    return true;
}

function rankByContext(token, candidates) {
    // Extract context words around the token
    const context = extractContext(token);
    
    if (context.length === 0) {
        return candidates; // No context available
    }
    
    // Calculate context similarity scores
    const scored = candidates.map(candidate => {
        const score = calculateContextScore(candidate, context);
        return { word: candidate, score: score };
    });
    
    // Sort by context score (higher is better)
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(s => s.word);
}

function extractContext(token) {
    const words = cipherInput.split(/\s+/);
    const tokenIndex = words.findIndex(w => w.includes(token));
    
    if (tokenIndex === -1) return [];
    
    const context = [];
    
    // Get 2 words before
    for (let i = Math.max(0, tokenIndex - 2); i < tokenIndex; i++) {
        const word = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (word && !word.includes('word')) {
            context.push(word);
        }
    }
    
    // Get 2 words after
    for (let i = tokenIndex + 1; i < Math.min(words.length, tokenIndex + 3); i++) {
        const word = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (word && !word.includes('word')) {
            context.push(word);
        }
    }
    
    return context;
}

function calculateContextScore(candidate, contextWords) {
    // Simple co-occurrence scoring
    // In a full implementation, this would use TF-IDF and cosine similarity
    // For now, we'll use a simplified frequency-based approach
    
    let score = wordFrequency[candidate] || 0;
    
    // Boost score if candidate appears near context words in our vocabulary
    // This is a simplified heuristic
    contextWords.forEach(contextWord => {
        if (wordFrequency[contextWord]) {
            // Words with similar frequencies tend to co-occur
            const freqDiff = Math.abs(wordFrequency[candidate] - wordFrequency[contextWord]);
            const maxFreq = Math.max(wordFrequency[candidate], wordFrequency[contextWord]);
            if (maxFreq > 0) {
                const similarity = 1 - (freqDiff / maxFreq);
                score += similarity * 100;
            }
        }
    });
    
    return score;
}

function renderSuggestions(token) {
    const safeId = token.replace(/[\[\]]/g, '_');
    const container = document.getElementById(`suggestions-${safeId}`);
    if (!container) return;
    
    const suggestions = tokenMap[token].suggestions.slice(0, 5);
    
    if (suggestions.length === 0) {
        container.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; font-style: italic;">No suggestions found</div>';
        return;
    }
    
    container.innerHTML = '';
    
    suggestions.forEach(word => {
        const freq = wordFrequency[word] || 0;
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.onclick = () => acceptSuggestion(token, word);
        btn.innerHTML = `
            ${word.toUpperCase()}
            <span class="suggestion-badge">${Math.min(freq, 999)}</span>
        `;
        container.appendChild(btn);
    });
}

function acceptSuggestion(token, word) {
    tokenMap[token].solution = word.toUpperCase();
    tokenMap[token].pattern = word.toUpperCase();
    
    // Use attribute matching instead of querySelector to avoid CSS selector issues
    // with brackets in token names like [WORD1]
    const input = Array.from(document.querySelectorAll('.token-input'))
        .find(el => el.getAttribute('data-token') === token);
    if (input) {
        input.value = word.toUpperCase();
    }
    
    updateResolvedWordText();
    updateSuggestions(token); // Refresh suggestions after accepting one
}

// ============================================================================
// FORENSIC INDEX INTEGRATION
// ============================================================================

/**
 * Check localStorage for terms sent from the Forensic Index page.
 * Boosts those terms to the top of suggestion lists.
 */
function checkForSuggestedWords() {
    try {
        const raw = localStorage.getItem('crypticfox_word_suggestions');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.terms) || data.terms.length === 0) return;
        // Ignore stale data older than 5 minutes
        if (Date.now() - (data.timestamp || 0) > 300000) {
            localStorage.removeItem('crypticfox_word_suggestions');
            return;
        }
        localStorage.removeItem('crypticfox_word_suggestions');

        // Boost these terms so they appear first in suggestions
        data.terms.forEach(term => {
            const lower = term.toLowerCase();
            wordFrequency[lower] = (wordFrequency[lower] || 0) + 100000;
            // Ensure it appears in the length index
            const len = lower.length;
            if (!lengthIndex[len]) lengthIndex[len] = [];
            if (!lengthIndex[len].includes(lower)) lengthIndex[len].push(lower);
        });
        // Re-sort length indexes so boosted terms bubble to the top
        Object.keys(lengthIndex).forEach(len => {
            lengthIndex[len].sort((a, b) => (wordFrequency[b] || 0) - (wordFrequency[a] || 0));
        });

        // Switch to word mode and pre-populate the textarea
        setMode('word');
        const textarea = document.getElementById('word-cipher-input');
        if (textarea) {
            const tokens = data.terms.slice(0, 8).map((_, i) => `[WORD${i + 1}]`).join(' ');
            textarea.value = `Suspicious terms from Forensic Index:\n${tokens}`;
            parseTokens();
        }

        // Show a dismissible notice
        const notice = document.createElement('div');
        notice.style.cssText = 'background:rgba(33,150,243,0.12);border:1px solid #2196F3;border-radius:6px;' +
            'padding:10px 14px;margin-bottom:12px;color:#90CAF9;font-size:0.9rem;';
        notice.innerHTML = `<strong>📊 Forensic Index:</strong> Boosted terms: ${data.terms.slice(0, 8).join(', ')}`;
        const inputSection = document.querySelector('#word-mode-content .input-section');
        if (inputSection) inputSection.prepend(notice);
    } catch (e) {
        console.warn('checkForSuggestedWords error:', e);
    }
}

// ============================================================================
// LETTER-LEVEL CORPUS INTEGRATION
// ============================================================================

function updateCorpusHints() {
    if (!wordModeInitialized) return;
    
    const resolved = document.getElementById("resolvedText").textContent;
    if (!resolved || resolved.trim() === "") return;
    
    // Extract partial words from resolved text
    const words = resolved.split(/\s+/);
    letterModeCorpusHints = {};
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^A-Z_]/g, '');
        if (cleanWord.length > 0 && cleanWord.includes('_')) {
            // This is a partial word - find suggestions
            const pattern = cleanWord.toLowerCase();
            const suggestions = getWordsByPattern(pattern).slice(0, 5);
            if (suggestions.length > 0) {
                letterModeCorpusHints[cleanWord] = suggestions;
            }
        }
    });
}

function highlightRecognizedWords(element, resolved) {
    // Split into words and wrap recognized ones with styling
    const words = resolved.split(/\s+/);
    const highlighted = words.map(word => {
        const cleanWord = word.replace(/[^A-Z_]/g, '').toLowerCase();
        
        // Check if it's a complete word (no underscores)
        if (!cleanWord.includes('_') && cleanWord.length > 0) {
            // Check if word exists in corpus
            if (wordFrequency[cleanWord]) {
                return `<span style="color: #7bd389; font-weight: bold;" title="Recognized word">${word}</span>`;
            } else if (cleanWord.length > 2) {
                return `<span style="color: #ffa726; opacity: 0.8;" title="Unknown word">${word}</span>`;
            }
        } else if (cleanWord.includes('_') && cleanWord.length > 0) {
            // Partial word - show tooltip with suggestions if available
            const suggestions = letterModeCorpusHints[cleanWord.toUpperCase()];
            if (suggestions && suggestions.length > 0) {
                const suggestionText = suggestions.slice(0, 3).join(', ');
                return `<span style="border-bottom: 1px dotted #eb3f7b; cursor: help;" title="Suggestions: ${suggestionText}">${word}</span>`;
            }
        }
        
        return word;
    });
    
    element.innerHTML = highlighted.join(' ');
}
