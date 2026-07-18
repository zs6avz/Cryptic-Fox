/**
 * TF-IDF Calculator for Cryptic Fox
 * Implements Term Frequency-Inverse Document Frequency weighting
 * 
 * TF-IDF = tf * log(N / df)
 * where:
 *   tf = term frequency in document
 *   df = document frequency (number of documents containing the term)
 *   N  = total number of documents in corpus
 * 
 * Usage:
 *   const tfidf = new TFIDFCalculator();
 *   tfidf.addDocument("doc1", "the quick brown fox");
 *   tfidf.addDocument("doc2", "the lazy dog");
 *   const score = tfidf.tfidf("quick", "doc1");  // Returns TF-IDF score
 */

class TFIDFCalculator {
    constructor(useStemming = false) {
        this.documents = {};           // { docId -> { term -> tf } }
        this.documentCount = 0;
        this.documentFrequency = {};   // { term -> df }
        this.idfCache = {};            // { term -> idf }
        this.useStemming = useStemming;
        this.stemmer = useStemming ? new PorterStemmer() : null;
        this.documentNames = [];       // Ordered list of document IDs
    }

    /**
     * Tokenize and optionally stem text
     */
    tokenize(text) {
        // Extract words (alphanumeric sequences)
        const tokens = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
        
        if (this.useStemming && this.stemmer) {
            return tokens.map(token => this.stemmer.stem(token));
        }
        
        return tokens;
    }

    /**
     * Add a document to the corpus
     */
    addDocument(docId, text) {
        if (this.documents[docId]) {
            console.warn(`Document ${docId} already exists. Overwriting.`);
            this.removeDocument(docId);
        }

        const tokens = this.tokenize(text);
        const termFreq = {};
        const uniqueTerms = new Set();

        // Calculate term frequencies
        tokens.forEach(term => {
            if (term.length <= 2) return; // Skip very short terms
            
            termFreq[term] = (termFreq[term] || 0) + 1;
            uniqueTerms.add(term);
        });

        // Update document frequency for each unique term
        uniqueTerms.forEach(term => {
            this.documentFrequency[term] = (this.documentFrequency[term] || 0) + 1;
        });

        this.documents[docId] = termFreq;
        this.documentNames.push(docId);
        this.documentCount++;
        this.idfCache = {}; // Clear IDF cache when corpus changes
    }

    /**
     * Remove a document from the corpus
     */
    removeDocument(docId) {
        if (!this.documents[docId]) {
            console.warn(`Document ${docId} not found.`);
            return;
        }

        const termFreq = this.documents[docId];
        
        // Decrement document frequency for each term
        Object.keys(termFreq).forEach(term => {
            this.documentFrequency[term]--;
            if (this.documentFrequency[term] === 0) {
                delete this.documentFrequency[term];
            }
        });

        delete this.documents[docId];
        this.documentNames = this.documentNames.filter(id => id !== docId);
        this.documentCount--;
        this.idfCache = {}; // Clear IDF cache
    }

    /**
     * Calculate IDF for a term
     * IDF = log(N / df)
     */
    idf(term) {
        if (this.idfCache[term] !== undefined) {
            return this.idfCache[term];
        }

        const df = this.documentFrequency[term] || 0;
        if (df === 0) {
            this.idfCache[term] = 0;
            return 0;
        }

        const idfValue = Math.log(this.documentCount / df);
        this.idfCache[term] = idfValue;
        return idfValue;
    }

    /**
     * Calculate TF-IDF for a term in a specific document
     */
    tfidf(term, docId) {
        const doc = this.documents[docId];
        if (!doc) {
            console.warn(`Document ${docId} not found.`);
            return 0;
        }

        const tf = doc[term] || 0;
        if (tf === 0) return 0;

        return tf * this.idf(term);
    }

    /**
     * Get all terms in a document with their TF-IDF scores
     * Returns: { term: tfidf_score }
     */
    getDocumentVector(docId) {
        const doc = this.documents[docId];
        if (!doc) return {};

        const vector = {};
        Object.keys(doc).forEach(term => {
            vector[term] = this.tfidf(term, docId);
        });

        return vector;
    }

    /**
     * Calculate cosine similarity between two documents
     */
    cosineSimilarity(docId1, docId2) {
        const vec1 = this.getDocumentVector(docId1);
        const vec2 = this.getDocumentVector(docId2);

        // Calculate dot product
        let dotProduct = 0;
        Object.keys(vec1).forEach(term => {
            if (vec2[term]) {
                dotProduct += vec1[term] * vec2[term];
            }
        });

        // Calculate magnitudes
        const mag1 = Math.sqrt(Object.values(vec1).reduce((sum, val) => sum + val * val, 0));
        const mag2 = Math.sqrt(Object.values(vec2).reduce((sum, val) => sum + val * val, 0));

        if (mag1 === 0 || mag2 === 0) return 0;

        return dotProduct / (mag1 * mag2);
    }

    /**
     * Search for documents matching query terms
     * Returns documents ranked by cosine similarity
     */
    search(queryText, topK = 20) {
        const queryTokens = this.tokenize(queryText);
        if (queryTokens.length === 0) return [];

        // Build query vector (using IDF as weight, TF = 1 for each term)
        const queryVector = {};
        const queryTermSet = new Set(queryTokens);
        
        queryTermSet.forEach(term => {
            queryVector[term] = this.idf(term);
        });

        // Calculate query magnitude
        const queryMag = Math.sqrt(
            Object.values(queryVector).reduce((sum, val) => sum + val * val, 0)
        );

        if (queryMag === 0) return [];

        // Score each document
        const results = [];
        
        this.documentNames.forEach(docId => {
            const docVector = this.getDocumentVector(docId);
            
            // Check if document contains all query terms (strict matching)
            const containsAllTerms = Array.from(queryTermSet).every(term => 
                this.documents[docId][term] > 0
            );

            if (!containsAllTerms) return; // Skip documents missing any query term

            // Calculate dot product
            let dotProduct = 0;
            Object.keys(queryVector).forEach(term => {
                if (docVector[term]) {
                    dotProduct += queryVector[term] * docVector[term];
                }
            });

            // Calculate document magnitude
            const docMag = Math.sqrt(
                Object.values(docVector).reduce((sum, val) => sum + val * val, 0)
            );

            if (docMag === 0) return;

            const similarity = dotProduct / (queryMag * docMag);
            
            results.push({
                docId: docId,
                score: similarity,
                terms: Object.keys(docVector).length
            });
        });

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, topK);
    }

    /**
     * Detect statistical anomalies in a document
     * Returns terms with unusual TF-IDF scores (potential steganography indicators)
     */
    detectAnomalies(docId, threshold = 2.0) {
        const vector = this.getDocumentVector(docId);
        const scores = Object.values(vector);
        
        if (scores.length === 0) return [];

        // Calculate mean and standard deviation
        const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        // Find terms with scores > threshold standard deviations from mean
        const anomalies = [];
        Object.entries(vector).forEach(([term, score]) => {
            const zScore = stdDev > 0 ? (score - mean) / stdDev : 0;
            if (Math.abs(zScore) > threshold) {
                anomalies.push({
                    term: term,
                    tfidf: score,
                    zScore: zScore,
                    tf: this.documents[docId][term],
                    idf: this.idf(term)
                });
            }
        });

        // Sort by absolute z-score descending
        anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

        return anomalies;
    }

    /**
     * Get corpus statistics
     */
    getStats() {
        return {
            documentCount: this.documentCount,
            vocabularySize: Object.keys(this.documentFrequency).length,
            useStemming: this.useStemming
        };
    }

    /**
     * Export corpus data for persistence
     */
    export() {
        return {
            documents: this.documents,
            documentFrequency: this.documentFrequency,
            documentNames: this.documentNames,
            documentCount: this.documentCount,
            useStemming: this.useStemming
        };
    }

    /**
     * Import corpus data from saved state
     */
    import(data) {
        this.documents = data.documents || {};
        this.documentFrequency = data.documentFrequency || {};
        this.documentNames = data.documentNames || [];
        this.documentCount = data.documentCount || 0;
        this.useStemming = data.useStemming || false;
        this.idfCache = {};
        
        if (this.useStemming && !this.stemmer) {
            this.stemmer = new PorterStemmer();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TFIDFCalculator;
}
