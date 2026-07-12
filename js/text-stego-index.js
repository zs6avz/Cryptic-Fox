/**
 * Forensic Index Engine
 * Multi-document text steganography detection and ranking
 */

// Shared utility — origin: text-stego-detect.js
const FUNCTION_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "also", "about", "after", "again", "because", "been", "before", "being", "between", "both",
    "came", "come", "could", "did", "does", "each", "even", "few", "first", "found",
    "get", "give", "go", "going", "good", "got", "great", "had", "has", "here",
    "high", "how", "however", "if", "into", "its", "just", "know", "let", "like",
    "long", "look", "made", "make", "many", "may", "more", "most", "much", "must",
    "never", "no", "now", "off", "only", "other", "over", "own", "part", "place",
    "put", "right", "said", "same", "see", "seem", "should", "show", "since", "so",
    "some", "still", "such", "take", "tell", "than", "them", "then", "these", "thing",
    "think", "those", "through", "time", "too", "under", "up", "upon", "us", "very",
    "want", "well", "were", "which", "while", "who", "why", "work", "year", "yet"
];

// Shared utility — origin: text-stego-detect.js
function tokenize(text) {
    return text.toLowerCase().match(/\b[a-z]+\b/g) || [];
}

function calculateTF(tokens) {
    const tf = {};
    const total = tokens.length;
    tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
    });
    Object.keys(tf).forEach(term => {
        tf[term] = tf[term] / total;
    });
    return tf;
}

function calculateIDF(documentsTokens) {
    const idf = {};
    const totalDocs = documentsTokens.length;
    const termDocCount = {};
    
    documentsTokens.forEach(docTokens => {
        const uniqueTerms = new Set(docTokens);
        uniqueTerms.forEach(term => {
            termDocCount[term] = (termDocCount[term] || 0) + 1;
        });
    });
    
    Object.keys(termDocCount).forEach(term => {
        idf[term] = Math.log(totalDocs / termDocCount[term]);
    });
    
    return idf;
}

function cosineSimilarity(vec1, vec2) {
    const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    allTerms.forEach(term => {
        const v1 = vec1[term] || 0;
        const v2 = vec2[term] || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
    });
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function jaccardCoefficient(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(t => set2.has(t)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

function calculateStylometry(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = tokenize(text);
    const allTokens = text.match(/\S+/g) || [];
    
    const totalWords = words.length;
    const totalSentences = sentences.length;
    const uniqueWords = new Set(words).size;
    
    const wordLengths = words.map(w => w.length);
    const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / totalWords || 0;
    
    const sentenceLengths = sentences.map(s => (s.match(/\b[a-z]+\b/gi) || []).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / totalSentences || 0;
    
    const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;
    const functionWordCount = words.filter(w => FUNCTION_WORDS.includes(w)).length;
    const functionWordRatio = totalWords > 0 ? functionWordCount / totalWords : 0;
    
    const punctuation = text.match(/[.,;:!?-]/g) || [];
    const punctuationDensity = totalWords > 0 ? punctuation.length / totalWords : 0;
    
    const spaces = text.match(/ /g) || [];
    const multiSpaces = text.match(/ {2,}/g) || [];
    const avgSpacing = spaces.length / (allTokens.length - 1) || 1;
    const multiSpaceRatio = spaces.length > 0 ? multiSpaces.length / spaces.length : 0;
    
    const totalChars = text.length;
    const avgCharsPerWord = totalWords > 0 ? totalChars / totalWords : 0;
    const vocabularyRichness = Math.sqrt(uniqueWords / totalWords) || 0;
    
    return {
        totalWords,
        totalSentences,
        uniqueWords,
        avgWordLength,
        avgSentenceLength,
        lexicalDiversity,
        functionWordRatio,
        punctuationDensity,
        avgSpacing,
        multiSpaceRatio,
        vocabularyRichness
    };
}

// ============================================================================
// DATA MODELS
// ============================================================================

class DocumentCorpus {
    constructor() {
        this.documents = [];
        this.nextId = 1;
        this.loadFromStorage();
    }
    
    addDocument(name, text) {
        if (!text || text.trim() === '') return null;
        const doc = {
            id: this.nextId++,
            name: name || `Document ${this.nextId - 1}`,
            text: text,
            wordCount: tokenize(text).length,
            addedAt: new Date().toISOString()
        };
        this.documents.push(doc);
        this.saveToStorage();
        return doc;
    }
    
    removeDocument(id) {
        this.documents = this.documents.filter(d => d.id !== id);
        this.saveToStorage();
    }
    
    clear() {
        this.documents = [];
        this.nextId = 1;
        this.saveToStorage();
    }
    
    getDocument(id) {
        return this.documents.find(d => d.id === id);
    }
    
    getAllDocuments() {
        return [...this.documents];
    }
    
    saveToStorage() {
        try {
            const data = {
                documents: this.documents,
                nextId: this.nextId
            };
            localStorage.setItem('crypticfox_corpus', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save corpus to localStorage', e);
        }
    }
    
    loadFromStorage() {
        try {
            const dataStr = localStorage.getItem('crypticfox_corpus');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                this.documents = data.documents || [];
                this.nextId = data.nextId || 1;
            }
        } catch (e) {
            console.warn('Could not load corpus from localStorage', e);
            this.documents = [];
            this.nextId = 1;
        }
    }
}

class CorpusIndex {
    constructor(corpus) {
        this.corpus = corpus;
        this.idf = {};
        this.tfidfVectors = {}; 
        this.stylometrics = {}; 
        this.tokens = {};
        this.isBuilt = false;
        
        // Stats
        this.stats = {
            totalDocs: 0,
            vocabularySize: 0,
            avgDocLength: 0
        };
    }
    
    buildIndex() {
        const docs = this.corpus.getAllDocuments();
        this.stats.totalDocs = docs.length;
        if (docs.length === 0) return;
        
        const allTokensList = [];
        let totalWords = 0;
        
        // Tokenize and Stylometrics
        docs.forEach(doc => {
            const docTokens = tokenize(doc.text);
            this.tokens[doc.id] = docTokens;
            allTokensList.push(docTokens);
            totalWords += docTokens.length;
            this.stylometrics[doc.id] = calculateStylometry(doc.text);
        });
        
        this.stats.avgDocLength = Math.round(totalWords / docs.length);
        
        // IDF
        this.idf = calculateIDF(allTokensList);
        this.stats.vocabularySize = Object.keys(this.idf).length;
        
        // TF-IDF
        docs.forEach(doc => {
            const tf = calculateTF(this.tokens[doc.id]);
            const tfidf = {};
            Object.keys(tf).forEach(term => {
                if (this.idf[term] !== undefined) {
                    tfidf[term] = tf[term] * this.idf[term];
                }
            });
            this.tfidfVectors[doc.id] = tfidf;
        });
        
        this.isBuilt = true;
    }
    
    queryRank(queryText) {
        if (!this.isBuilt) return [];
        const qTokens = tokenize(queryText);
        const qTf = calculateTF(qTokens);
        const qTfidf = {};
        
        Object.keys(qTf).forEach(term => {
            if (this.idf[term] !== undefined) {
                qTfidf[term] = qTf[term] * this.idf[term];
            }
        });
        
        const results = this.corpus.getAllDocuments().map(doc => {
            const score = cosineSimilarity(qTfidf, this.tfidfVectors[doc.id]);
            return {
                docId: doc.id,
                name: doc.name,
                score: score,
                topTerms: this._getTopMatchingTerms(qTfidf, this.tfidfVectors[doc.id], 5)
            };
        });
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    baselineCompare(baselineText) {
        if (!this.isBuilt || this.corpus.getAllDocuments().length === 0) return [];
        
        const bTokens = tokenize(baselineText);
        const bTf = calculateTF(bTokens);
        const bTfidf = {};
        
        Object.keys(bTf).forEach(term => {
            if (this.idf[term] !== undefined) {
                bTfidf[term] = bTf[term] * this.idf[term];
            }
        });
        
        const bStylometry = calculateStylometry(baselineText);
        
        const results = this.corpus.getAllDocuments().map(doc => {
            const dTokens = this.tokens[doc.id];
            const cosine = cosineSimilarity(bTfidf, this.tfidfVectors[doc.id]);
            const jaccard = jaccardCoefficient(bTokens, dTokens);
            
            const dStylo = this.stylometrics[doc.id];
            let styloDev = 0;
            const metrics = ['avgWordLength', 'avgSentenceLength', 'lexicalDiversity', 'functionWordRatio'];
            metrics.forEach(m => {
                const baseVal = bStylometry[m] || 0.001; // prevent div by zero
                const dVal = dStylo[m] || 0;
                styloDev += Math.abs((dVal - baseVal) / baseVal);
            });
            styloDev = styloDev / metrics.length;
            
            // Formula requested: 0.5 * (1 - cosine) + 0.3 * (1 - jaccard) + 0.2 * stylometricDeviation
            // Normalize stylodev to approx 0-1 range for score addition.
            const normStyloDev = Math.min(styloDev, 1);
            const forensicScore = (0.5 * (1 - cosine)) + (0.3 * (1 - jaccard)) + (0.2 * normStyloDev);
            
            return {
                docId: doc.id,
                name: doc.name,
                cosine: cosine,
                jaccard: jaccard,
                forensicScore: forensicScore * 100, // as percentage
                stylometricDev: styloDev * 100
            };
        });
        
        // Sort descending (most suspicious first)
        return results.sort((a, b) => b.forensicScore - a.forensicScore);
    }
    
    anomalyRank() {
        if (!this.isBuilt || this.corpus.getAllDocuments().length === 0) return [];
        const docs = this.corpus.getAllDocuments();
        
        const metrics = ['avgWordLength', 'avgSentenceLength', 'lexicalDiversity', 'functionWordRatio', 'punctuationDensity', 'avgSpacing'];
        const corpusMeans = {};
        
        metrics.forEach(m => {
            let sum = 0;
            docs.forEach(d => { sum += this.stylometrics[d.id][m] || 0; });
            corpusMeans[m] = sum / docs.length;
        });
        
        const results = docs.map(doc => {
            let totalDev = 0;
            const deviations = {};
            metrics.forEach(m => {
                const mean = corpusMeans[m] || 0.001;
                const val = this.stylometrics[doc.id][m] || 0;
                const dev = Math.abs((val - mean) / mean);
                deviations[m] = dev * 100;
                totalDev += dev;
            });
            
            return {
                docId: doc.id,
                name: doc.name,
                deviationScore: (totalDev / metrics.length) * 100,
                deviations: deviations
            };
        });
        
        return results.sort((a, b) => b.deviationScore - a.deviationScore);
    }
    
    similarityMatrix() {
        if (!this.isBuilt || this.corpus.getAllDocuments().length === 0) return { labels: [], matrix: [] };
        
        const docs = this.corpus.getAllDocuments();
        const labels = docs.map(d => d.name);
        const matrix = [];
        
        for (let i = 0; i < docs.length; i++) {
            const row = [];
            for (let j = 0; j < docs.length; j++) {
                if (i === j) {
                    row.push(1);
                } else {
                    const sim = cosineSimilarity(this.tfidfVectors[docs[i].id], this.tfidfVectors[docs[j].id]);
                    row.push(sim);
                }
            }
            matrix.push(row);
        }
        
        return { labels, matrix };
    }
    
    _getTopMatchingTerms(queryVec, docVec, n) {
        const terms = Object.keys(queryVec).filter(t => docVec[t] !== undefined);
        const scoredTerms = terms.map(t => ({
            term: t,
            score: queryVec[t] * docVec[t]
        }));
        return scoredTerms.sort((a, b) => b.score - a.score).slice(0, n);
    }
}

// ============================================================================
// UI LOGIC
// ============================================================================

let corpus = new DocumentCorpus();
let corpusIndex = null;
let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
    refreshCorpusUI();
});

function addDocumentFromPaste() {
    const nameInput = document.getElementById('docName');
    const textInput = document.getElementById('docText');
    
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please paste some document text.');
        return;
    }
    
    corpus.addDocument(name, text);
    nameInput.value = '';
    textInput.value = '';
    refreshCorpusUI();
}

function addDocumentsFromBatch() {
    const input = document.getElementById('batchFiles');
    const files = input.files;
    if (!files || files.length === 0) return;
    
    let processed = 0;
    Array.from(files).forEach(file => {
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                corpus.addDocument(file.name.replace('.txt', ''), e.target.result);
                processed++;
                if (processed === files.length) {
                    refreshCorpusUI();
                    input.value = '';
                }
            };
            reader.readAsText(file);
        } else {
            processed++;
            if (processed === files.length) {
                refreshCorpusUI();
                input.value = '';
            }
        }
    });
}

function removeDocument(id) {
    corpus.removeDocument(id);
    refreshCorpusUI();
}

function clearCorpus() {
    if(confirm('Are you sure you want to clear the entire corpus?')) {
        corpus.clear();
        refreshCorpusUI();
        document.getElementById('indexStatsPanel').style.display = 'none';
        document.getElementById('queryPanel').style.display = 'none';
    }
}

function refreshCorpusUI() {
    const list = document.getElementById('corpusList');
    if (!list) return;
    
    const docs = corpus.getAllDocuments();
    if (docs.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted);">No documents in corpus. Add some text to get started.</p>';
        return;
    }
    
    list.innerHTML = docs.map(doc => `
        <div class="corpus-item">
            <div>
                <strong>${doc.name}</strong> 
                <span style="color: var(--color-text-muted); font-size: 12px; margin-left: 10px;">${doc.wordCount} words</span>
            </div>
            <button onclick="removeDocument(${doc.id})" title="Remove">✕</button>
        </div>
    `).join('');
}

function buildIndex() {
    if (corpus.getAllDocuments().length === 0) {
        alert('Corpus is empty.');
        return;
    }
    
    corpusIndex = new CorpusIndex(corpus);
    corpusIndex.buildIndex();
    
    document.getElementById('indexStatsPanel').style.display = 'block';
    document.getElementById('queryPanel').style.display = 'block';
    
    displayIndexStats();
}

function displayIndexStats() {
    const statsContainer = document.getElementById('indexStats');
    if (!statsContainer || !corpusIndex) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="value">${corpusIndex.stats.totalDocs}</div>
            <div class="label">Documents</div>
        </div>
        <div class="stat-card">
            <div class="value">${corpusIndex.stats.vocabularySize}</div>
            <div class="label">Unique Terms</div>
        </div>
        <div class="stat-card">
            <div class="value">${corpusIndex.stats.avgDocLength}</div>
            <div class="label">Avg Words / Doc</div>
        </div>
    `;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    const tabEl = document.getElementById('tab-' + tab);
    if(tabEl) tabEl.style.display = 'block';
    
    document.getElementById('rankingResults').innerHTML = '';
}

function runQuery() {
    const text = document.getElementById('queryText').value.trim();
    if (!text) return;
    const results = corpusIndex.queryRank(text);
    
    const container = document.getElementById('rankingResults');
    if (results.length === 0) {
        container.innerHTML = '<p>No results.</p>';
        return;
    }
    
    let html = '<h3>Query Ranking (Cosine Similarity)</h3>';
    results.forEach((r, idx) => {
        const pct = (r.score * 100).toFixed(1);
        const terms = r.topTerms.map(t => t.term).join(', ');
        html += `
            <div class="ranking-item" onclick="showDocumentDetail(${r.docId})">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>#${idx + 1} ${r.name}</strong>
                    <span style="color: var(--color-primary); font-weight: bold;">${pct}% match</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; margin-bottom: 5px;">
                    <div style="width: ${pct}%; height: 100%; background: var(--color-primary); border-radius: 3px;"></div>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted);">
                    Matching terms: ${terms || 'None'}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function runBaselineCompare() {
    const text = document.getElementById('baselineText').value.trim();
    if (!text) return;
    const results = corpusIndex.baselineCompare(text);
    
    const container = document.getElementById('rankingResults');
    let html = '<h3>Anomaly Ranking vs Baseline (Highest Divergence First)</h3>';
    results.forEach((r, idx) => {
        html += `
            <div class="ranking-item" onclick="showDocumentDetail(${r.docId})" style="border-left-color: ${r.forensicScore > 50 ? '#F44336' : r.forensicScore > 20 ? '#FFC107' : '#4CAF50'}">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>#${idx + 1} ${r.name}</strong>
                    <span style="font-weight: bold;">Divergence Score: ${r.forensicScore.toFixed(1)}</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; margin-bottom: 5px;">
                    <div style="width: ${Math.min(r.forensicScore, 100)}%; height: 100%; background: ${r.forensicScore > 50 ? '#F44336' : r.forensicScore > 20 ? '#FFC107' : '#4CAF50'}; border-radius: 3px;"></div>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted); display: flex; gap: 15px;">
                    <span>Cosine: ${(r.cosine*100).toFixed(1)}%</span>
                    <span>Jaccard: ${(r.jaccard*100).toFixed(1)}%</span>
                    <span>Stylo Dev: ${r.stylometricDev.toFixed(1)}%</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function runAnomalyRank() {
    const results = corpusIndex.anomalyRank();
    
    const container = document.getElementById('rankingResults');
    let html = '<h3>Corpus Outlier Ranking</h3>';
    results.forEach((r, idx) => {
        html += `
            <div class="ranking-item" onclick="showDocumentDetail(${r.docId})">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>#${idx + 1} ${r.name}</strong>
                    <span style="font-weight: bold; color: var(--color-primary);">Outlier Score: ${r.deviationScore.toFixed(1)}%</span>
                </div>
                <div style="font-size: 12px; color: var(--color-text-muted);">
                    Top dev: ${Object.entries(r.deviations).sort((a,b)=>b[1]-a[1])[0][0]} (${Object.entries(r.deviations).sort((a,b)=>b[1]-a[1])[0][1].toFixed(1)}%)
                </div>
            </div>
        `;
    });

    // Collect top TF-IDF terms from the 3 most anomalous documents
    const topTerms = [];
    results.slice(0, 3).forEach(r => {
        const vec = corpusIndex.tfidfVectors[r.docId];
        if (vec) {
            Object.entries(vec)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([term]) => {
                    if (!topTerms.includes(term)) topTerms.push(term);
                });
        }
    });

    if (topTerms.length > 0) {
        html += `
            <div style="margin-top: 20px; padding: 15px; background: rgba(33,150,243,0.08);
                        border: 1px solid #2196F3; border-radius: var(--radius-md);">
                <p style="margin: 0 0 8px; color: #90CAF9; font-size: 13px;">
                    <strong>💡 Top anomaly terms:</strong> ${topTerms.slice(0, 10).join(', ')}
                </p>
                <button class="primary-btn" onclick="sendToWordSolver(${JSON.stringify(topTerms.slice(0, 10))})" 
                        style="background: rgba(33,150,243,0.2); border-color: #2196F3;">
                    ↗ Send Terms to Word Solver
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Sends top TF-IDF terms to the Word Solver on frequency.html via localStorage.
 */
function sendToWordSolver(terms) {
    try {
        localStorage.setItem('crypticfox_word_suggestions', JSON.stringify({
            terms: terms,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn('Could not write word suggestions to localStorage', e);
    }
    window.open('frequency.html#word-mode', '_blank');
}

function showDocumentDetail(id) {
    const doc = corpus.getDocument(id);
    if (!doc || !corpusIndex) return;
    
    const stylo = corpusIndex.stylometrics[id];
    
    const html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h3>Document Info</h3>
                <p><strong>Name:</strong> ${doc.name}</p>
                <p><strong>Words:</strong> ${doc.wordCount}</p>
                <p><strong>Added:</strong> ${new Date(doc.addedAt).toLocaleString()}</p>
                
                <h3 style="margin-top: 20px;">Top TF-IDF Terms</h3>
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
                    ${Object.entries(corpusIndex.tfidfVectors[id])
                        .sort((a,b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(e => `<span style="display:inline-block; margin: 2px 5px; padding: 2px 8px; background: var(--color-primary); border-radius: 10px; font-size: 12px;">${e[0]} (${e[1].toFixed(3)})</span>`)
                        .join('')}
                </div>
                <button onclick="sendToWordSolver(${JSON.stringify(
                    Object.entries(corpusIndex.tfidfVectors[id])
                        .sort((a,b) => b[1] - a[1]).slice(0,10).map(e => e[0])
                )})" style="margin-top:10px; background: rgba(33,150,243,0.2); border:1px solid #2196F3; color:#90CAF9; padding:6px 14px; border-radius:var(--radius-sm); cursor:pointer; font-size:13px;">
                    ↗ Send Terms to Word Solver
                </button>
            </div>
            <div>
                <h3>Stylometric Profile</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${Object.entries(stylo).map(([k,v]) => {
                        let formattedVal = typeof v === 'number' ? v.toFixed(3) : v;
                        return `<tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 5px;">${k}</td>
                            <td style="padding: 5px; text-align: right; color: var(--color-primary);">${formattedVal}</td>
                        </tr>`;
                    }).join('')}
                </table>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h3>Text Preview</h3>
            <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 5px; max-height: 150px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                ${doc.text}
            </div>
        </div>
    `;
    
    document.getElementById('modalTitle').textContent = `Analysis: ${doc.name}`;
    document.getElementById('modalContent').innerHTML = html;
    
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('docDetailModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('docDetailModal').style.display = 'none';
}
