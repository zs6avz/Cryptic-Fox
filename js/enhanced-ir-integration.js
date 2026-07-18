/**
 * Enhanced Forensic Index Integration
 * This file enhances text-stego-index.js with Porter Stemming and advanced TF-IDF
 * 
 */

// Enhanced Document Corpus with TF-IDF Calculator
class EnhancedDocumentCorpus extends DocumentCorpus {
    constructor() {
        super();
        this.tfidfCalculator = new TFIDFCalculator(true); // Enable stemming
        this.rebuildTFIDF();
    }

    addDocument(name, text) {
        const doc = super.addDocument(name, text);
        if (doc) {
            this.tfidfCalculator.addDocument(`doc_${doc.id}`, text);
        }
        return doc;
    }

    removeDocument(id) {
        this.tfidfCalculator.removeDocument(`doc_${id}`);
        super.removeDocument(id);
    }

    clear() {
        this.tfidfCalculator = new TFIDFCalculator(true);
        super.clear();
    }

    rebuildTFIDF() {
        // Rebuild TF-IDF calculator from existing documents
        this.tfidfCalculator = new TFIDFCalculator(true);
        this.documents.forEach(doc => {
            this.tfidfCalculator.addDocument(`doc_${doc.id}`, doc.text);
        });
    }

    /**
     * Search documents using enhanced TF-IDF with stemming
     */
    searchDocuments(query, topK = 20) {
        const results = this.tfidfCalculator.search(query, topK);
        return results.map(result => {
            const docId = parseInt(result.docId.replace('doc_', ''));
            const doc = this.getDocument(docId);
            return {
                doc: doc,
                score: result.score,
                rank: results.indexOf(result) + 1
            };
        });
    }

    /**
     * Detect anomalies in a specific document
     */
    detectDocumentAnomalies(docId, threshold = 2.0) {
        const anomalies = this.tfidfCalculator.detectAnomalies(`doc_${docId}`, threshold);
        return anomalies.map(a => ({
            term: a.term,
            tfidf: a.tfidf.toFixed(4),
            zScore: a.zScore.toFixed(2),
            frequency: a.tf,
            idf: a.idf.toFixed(4),
            suspiciousLevel: Math.abs(a.zScore) > 3 ? 'High' : Math.abs(a.zScore) > 2 ? 'Medium' : 'Low'
        }));
    }

    /**
     * Get TF-IDF statistics for the corpus
     */
    getTFIDFStats() {
        return this.tfidfCalculator.getStats();
    }

    /**
     * Export enhanced corpus data
     */
    exportEnhanced() {
        return {
            corpus: {
                documents: this.documents,
                nextId: this.nextId
            },
            tfidf: this.tfidfCalculator.export()
        };
    }

    /**
     * Import enhanced corpus data
     */
    importEnhanced(data) {
        if (data.corpus) {
            this.documents = data.corpus.documents || [];
            this.nextId = data.corpus.nextId || 1;
            this.saveToStorage();
        }
        if (data.tfidf) {
            this.tfidfCalculator.import(data.tfidf);
        } else {
            this.rebuildTFIDF();
        }
    }
}

// Enhanced Index with anomaly detection
class EnhancedCorpusIndex extends CorpusIndex {
    constructor(corpus) {
        super(corpus);
        this.porter = new PorterStemmer();
    }

    /**
     * Tokenize with optional stemming
     */
    tokenizeWithStem(text) {
        const tokens = tokenize(text);
        return tokens.map(token => this.porter.stem(token));
    }

    /**
     * Build index with stemming
     */
    buildIndexWithStemming() {
        const docs = this.corpus.getAllDocuments();
        this.stats.totalDocs = docs.length;
        if (docs.length === 0) return;
        
        const allTokensList = [];
        let totalWords = 0;
        
        // Tokenize with stemming
        docs.forEach(doc => {
            const docTokens = this.tokenizeWithStem(doc.text);
            this.tokens[doc.id] = docTokens;
            allTokensList.push(docTokens);
            totalWords += docTokens.length;
            this.stylometrics[doc.id] = calculateStylometry(doc.text);
        });
        
        this.stats.avgDocLength = Math.round(totalWords / docs.length);
        this.idf = calculateIDF(allTokensList);
        this.stats.vocabularySize = Object.keys(this.idf).length;
        
        // TF-IDF with stemmed tokens
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

    /**
     * Query with stemming support
     */
    queryRankWithStemming(queryText) {
        if (!this.isBuilt) return [];
        const qTokens = this.tokenizeWithStem(queryText);
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

    /**
     * Detect TF-IDF-based anomalies (not just stylometric)
     */
    detectTFIDFAnomalies() {
        if (!this.isBuilt) return [];
        
        const docs = this.corpus.getAllDocuments();
        const results = [];
        
        docs.forEach(doc => {
            const vector = this.tfidfVectors[doc.id];
            const scores = Object.values(vector);
            
            if (scores.length === 0) return;
            
            // Calculate z-scores for this document's TF-IDF values
            const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
            const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
            const stdDev = Math.sqrt(variance);
            
            const anomalousTerms = [];
            Object.entries(vector).forEach(([term, score]) => {
                const zScore = stdDev > 0 ? (score - mean) / stdDev : 0;
                if (Math.abs(zScore) > 2.5) {
                    anomalousTerms.push({
                        term: term,
                        tfidf: score,
                        zScore: zScore
                    });
                }
            });
            
            if (anomalousTerms.length > 0) {
                anomalousTerms.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
                results.push({
                    docId: doc.id,
                    name: doc.name,
                    anomalousTermCount: anomalousTerms.length,
                    topAnomalies: anomalousTerms.slice(0, 5)
                });
            }
        });
        
        return results.sort((a, b) => b.anomalousTermCount - a.anomalousTermCount);
    }
}

// Export enhanced classes
if (typeof window !== 'undefined') {
    window.EnhancedDocumentCorpus = EnhancedDocumentCorpus;
    window.EnhancedCorpusIndex = EnhancedCorpusIndex;
}

console.log('[Enhanced IR] Porter Stemmer and TF-IDF Calculator loaded successfully');
