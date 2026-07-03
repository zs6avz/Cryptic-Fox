/**
 * Text Steganography Detection Engine
 * Implements stylometric analysis, TF-IDF weighting, and similarity scoring
 */

// Common English function words for stylometric analysis
const FUNCTION_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what"
];

// Common English words for validation
const COMMON_ENGLISH_WORDS = ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "ANY", "CAN", "HAD", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO"];

let analysisResults = null;
let charts = {};

// ============================================================================
// STYLOMETRIC ANALYSIS
// ============================================================================

/**
 * Calculate comprehensive stylometric metrics for text
 */
function calculateStylometry(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const allTokens = text.match(/\S+/g) || [];
    
    // Basic metrics
    const totalWords = words.length;
    const totalSentences = sentences.length;
    const uniqueWords = new Set(words).size;
    
    // Word length analysis
    const wordLengths = words.map(w => w.length);
    const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / totalWords || 0;
    
    // Sentence length analysis
    const sentenceLengths = sentences.map(s => (s.match(/\b[a-z]+\b/gi) || []).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / totalSentences || 0;
    
    // Lexical diversity (Type-Token Ratio)
    const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;
    
    // Function word frequency
    const functionWordCount = words.filter(w => FUNCTION_WORDS.includes(w)).length;
    const functionWordRatio = totalWords > 0 ? functionWordCount / totalWords : 0;
    
    // Punctuation analysis
    const punctuation = text.match(/[.,;:!?-]/g) || [];
    const punctuationDensity = totalWords > 0 ? punctuation.length / totalWords : 0;
    
    // Spacing analysis
    const spaces = text.match(/ /g) || [];
    const multiSpaces = text.match(/ {2,}/g) || [];
    const avgSpacing = spaces.length / (allTokens.length - 1) || 1;
    const multiSpaceRatio = spaces.length > 0 ? multiSpaces.length / spaces.length : 0;
    
    // Character-level metrics
    const totalChars = text.length;
    const avgCharsPerWord = totalWords > 0 ? totalChars / totalWords : 0;
    
    // Vocabulary richness
    const vocabularyRichness = Math.sqrt(uniqueWords / totalWords) || 0;
    
    return {
        totalWords,
        totalSentences,
        uniqueWords,
        avgWordLength: avgWordLength.toFixed(2),
        avgSentenceLength: avgSentenceLength.toFixed(2),
        lexicalDiversity: lexicalDiversity.toFixed(4),
        functionWordRatio: functionWordRatio.toFixed(4),
        punctuationDensity: punctuationDensity.toFixed(4),
        avgSpacing: avgSpacing.toFixed(2),
        multiSpaceRatio: multiSpaceRatio.toFixed(4),
        vocabularyRichness: vocabularyRichness.toFixed(4),
        wordLengths,
        sentenceLengths
    };
}

// ============================================================================
// TF-IDF ANALYSIS
// ============================================================================

/**
 * Tokenize text into terms
 */
function tokenize(text) {
    return text.toLowerCase()
        .match(/\b[a-z]+\b/g) || [];
}

/**
 * Calculate term frequency for a document
 */
function calculateTF(tokens) {
    const tf = {};
    const total = tokens.length;
    
    tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
    });
    
    // Normalize by total tokens
    Object.keys(tf).forEach(term => {
        tf[term] = tf[term] / total;
    });
    
    return tf;
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(documents) {
    const idf = {};
    const totalDocs = documents.length;
    const termDocCount = {};
    
    // Count documents containing each term
    documents.forEach(doc => {
        const uniqueTerms = new Set(doc);
        uniqueTerms.forEach(term => {
            termDocCount[term] = (termDocCount[term] || 0) + 1;
        });
    });
    
    // Calculate IDF
    Object.keys(termDocCount).forEach(term => {
        idf[term] = Math.log(totalDocs / termDocCount[term]);
    });
    
    return idf;
}

/**
 * Calculate TF-IDF vectors for two texts
 */
function calculateTFIDF(baselineText, suspiciousText) {
    const baselineTokens = tokenize(baselineText);
    const suspiciousTokens = tokenize(suspiciousText);
    
    const baselineTF = calculateTF(baselineTokens);
    const suspiciousTF = calculateTF(suspiciousTokens);
    
    const idf = calculateIDF([baselineTokens, suspiciousTokens]);
    
    // Calculate TF-IDF vectors
    const baselineTFIDF = {};
    const suspiciousTFIDF = {};
    
    Object.keys(idf).forEach(term => {
        if (baselineTF[term]) {
            baselineTFIDF[term] = baselineTF[term] * idf[term];
        }
        if (suspiciousTF[term]) {
            suspiciousTFIDF[term] = suspiciousTF[term] * idf[term];
        }
    });
    
    return { baselineTFIDF, suspiciousTFIDF, idf };
}

/**
 * Get top N terms by TF-IDF score with comparison
 */
function getTopTerms(baselineTFIDF, suspiciousTFIDF, n = 20) {
    const allTerms = new Set([
        ...Object.keys(baselineTFIDF),
        ...Object.keys(suspiciousTFIDF)
    ]);
    
    const termComparisons = Array.from(allTerms).map(term => ({
        term,
        baseline: baselineTFIDF[term] || 0,
        suspicious: suspiciousTFIDF[term] || 0,
        difference: Math.abs((suspiciousTFIDF[term] || 0) - (baselineTFIDF[term] || 0))
    }));
    
    // Sort by difference (largest divergences first)
    termComparisons.sort((a, b) => b.difference - a.difference);
    
    return termComparisons.slice(0, n);
}

// ============================================================================
// SIMILARITY SCORING
// ============================================================================

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
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

/**
 * Calculate Jaccard coefficient (vocabulary overlap)
 */
function jaccardCoefficient(text1, text2) {
    const tokens1 = new Set(tokenize(text1));
    const tokens2 = new Set(tokenize(text2));
    
    const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Calculate percentage deviation between two values
 */
function percentDeviation(baseline, suspicious) {
    if (baseline === 0) return suspicious === 0 ? 0 : 100;
    return Math.abs((suspicious - baseline) / baseline * 100);
}

/**
 * Detect anomalies by comparing stylometric metrics
 */
function detectAnomalies(baselineMetrics, suspiciousMetrics, tfidfResults, similarityScores) {
    const anomalies = {
        flags: [],
        scores: {},
        overallScore: 0
    };
    
    // Stylometric deviations
    const wordLengthDev = percentDeviation(
        parseFloat(baselineMetrics.avgWordLength),
        parseFloat(suspiciousMetrics.avgWordLength)
    );
    anomalies.scores.wordLength = wordLengthDev;
    if (wordLengthDev > 15) {
        anomalies.flags.push({
            type: 'stylometry',
            severity: wordLengthDev > 25 ? 'high' : 'medium',
            message: `Average word length deviates by ${wordLengthDev.toFixed(1)}%`
        });
    }
    
    const sentenceLengthDev = percentDeviation(
        parseFloat(baselineMetrics.avgSentenceLength),
        parseFloat(suspiciousMetrics.avgSentenceLength)
    );
    anomalies.scores.sentenceLength = sentenceLengthDev;
    if (sentenceLengthDev > 20) {
        anomalies.flags.push({
            type: 'stylometry',
            severity: sentenceLengthDev > 35 ? 'high' : 'medium',
            message: `Average sentence length deviates by ${sentenceLengthDev.toFixed(1)}%`
        });
    }
    
    const lexicalDivDev = percentDeviation(
        parseFloat(baselineMetrics.lexicalDiversity),
        parseFloat(suspiciousMetrics.lexicalDiversity)
    );
    anomalies.scores.lexicalDiversity = lexicalDivDev;
    if (lexicalDivDev > 20) {
        anomalies.flags.push({
            type: 'stylometry',
            severity: lexicalDivDev > 35 ? 'high' : 'medium',
            message: `Lexical diversity deviates by ${lexicalDivDev.toFixed(1)}%`
        });
    }
    
    const functionWordDev = percentDeviation(
        parseFloat(baselineMetrics.functionWordRatio),
        parseFloat(suspiciousMetrics.functionWordRatio)
    );
    anomalies.scores.functionWords = functionWordDev;
    if (functionWordDev > 15) {
        anomalies.flags.push({
            type: 'stylometry',
            severity: functionWordDev > 25 ? 'high' : 'medium',
            message: `Function word usage deviates by ${functionWordDev.toFixed(1)}%`
        });
    }
    
    // Spacing anomalies
    const spacingDev = percentDeviation(
        parseFloat(baselineMetrics.avgSpacing),
        parseFloat(suspiciousMetrics.avgSpacing)
    );
    anomalies.scores.spacing = spacingDev;
    
    const multiSpaceRatio = parseFloat(suspiciousMetrics.multiSpaceRatio);
    if (multiSpaceRatio > 0.02 || spacingDev > 10) {
        anomalies.flags.push({
            type: 'spacing',
            severity: multiSpaceRatio > 0.05 ? 'high' : 'medium',
            message: `Unusual spacing patterns detected (${(multiSpaceRatio * 100).toFixed(2)}% multi-spaces)`
        });
    }
    
    // Punctuation anomalies
    const punctuationDev = percentDeviation(
        parseFloat(baselineMetrics.punctuationDensity),
        parseFloat(suspiciousMetrics.punctuationDensity)
    );
    anomalies.scores.punctuation = punctuationDev;
    if (punctuationDev > 20) {
        anomalies.flags.push({
            type: 'punctuation',
            severity: punctuationDev > 35 ? 'high' : 'medium',
            message: `Punctuation density deviates by ${punctuationDev.toFixed(1)}%`
        });
    }
    
    // Similarity scores
    if (similarityScores.cosine < 0.7) {
        anomalies.flags.push({
            type: 'similarity',
            severity: similarityScores.cosine < 0.5 ? 'high' : 'medium',
            message: `Low cosine similarity (${similarityScores.cosine.toFixed(3)}) suggests vocabulary manipulation`
        });
    }
    
    if (similarityScores.jaccard < 0.6) {
        anomalies.flags.push({
            type: 'similarity',
            severity: similarityScores.jaccard < 0.4 ? 'high' : 'medium',
            message: `Low Jaccard coefficient (${similarityScores.jaccard.toFixed(3)}) indicates vocabulary mismatch`
        });
    }
    
    // Calculate overall anomaly score (0-100)
    const weights = {
        wordLength: 0.10,
        sentenceLength: 0.10,
        lexicalDiversity: 0.15,
        functionWords: 0.15,
        spacing: 0.15,
        punctuation: 0.10,
        cosine: 0.15,
        jaccard: 0.10
    };
    
    let weightedScore = 0;
    weightedScore += Math.min(anomalies.scores.wordLength, 100) * weights.wordLength;
    weightedScore += Math.min(anomalies.scores.sentenceLength, 100) * weights.sentenceLength;
    weightedScore += Math.min(anomalies.scores.lexicalDiversity, 100) * weights.lexicalDiversity;
    weightedScore += Math.min(anomalies.scores.functionWords, 100) * weights.functionWords;
    weightedScore += Math.min(anomalies.scores.spacing, 100) * weights.spacing;
    weightedScore += Math.min(anomalies.scores.punctuation, 100) * weights.punctuation;
    weightedScore += (1 - similarityScores.cosine) * 100 * weights.cosine;
    weightedScore += (1 - similarityScores.jaccard) * 100 * weights.jaccard;
    
    anomalies.overallScore = Math.min(Math.round(weightedScore), 100);
    
    return anomalies;
}

// ============================================================================
// DECODING MECHANISMS
// ============================================================================

/**
 * Attempt to decode whitespace/spacing steganography
 */
function decodeWhitespace(text) {
    const results = [];
    
    // Method 1: Single space = 0, Double space = 1
    const spacingPattern = text.match(/[^ ]+ {1,2}(?=[^ ])/g);
    if (spacingPattern) {
        let binary = '';
        for (let i = 0; i < text.length - 1; i++) {
            if (text[i] !== ' ' && text[i + 1] === ' ') {
                // Count consecutive spaces
                let spaceCount = 0;
                let j = i + 1;
                while (j < text.length && text[j] === ' ') {
                    spaceCount++;
                    j++;
                }
                if (spaceCount === 1) binary += '0';
                else if (spaceCount === 2) binary += '1';
            }
        }
        
        if (binary.length >= 8) {
            const decoded = binaryToText(binary);
            if (decoded && containsValidChars(decoded)) {
                results.push({
                    method: 'Spacing Pattern (1 space=0, 2 spaces=1)',
                    binary: binary.substring(0, 80) + (binary.length > 80 ? '...' : ''),
                    message: decoded
                });
            }
        }
    }
    
    // Method 2: Zero-width character detection
    const zeroWidthChars = text.match(/[\u200B\u200C\u200D\uFEFF]/g);
    if (zeroWidthChars && zeroWidthChars.length > 0) {
        let zwBinary = '';
        for (let char of text) {
            if (char === '\u200B') zwBinary += '0';
            else if (char === '\u200C') zwBinary += '1';
            else if (char === '\u200D') zwBinary += '0';
            else if (char === '\uFEFF') zwBinary += '1';
        }
        
        if (zwBinary.length >= 8) {
            const decoded = binaryToText(zwBinary);
            if (decoded && containsValidChars(decoded)) {
                results.push({
                    method: 'Zero-Width Characters',
                    binary: zwBinary.substring(0, 80) + (zwBinary.length > 80 ? '...' : ''),
                    message: decoded
                });
            }
        }
    }
    
    return results;
}

/**
 * Attempt to decode punctuation-based steganography
 */
function decodePunctuation(text) {
    const results = [];
    
    // Method 1: Sentence-ending punctuation (. = 0, ! = 1, ? = 1)
    const sentences = text.match(/[^.!?]+[.!?]/g);
    if (sentences && sentences.length > 8) {
        let binary = '';
        sentences.forEach(sentence => {
            const ending = sentence.trim().slice(-1);
            if (ending === '.') binary += '0';
            else if (ending === '!' || ending === '?') binary += '1';
        });
        
        if (binary.length >= 8) {
            const decoded = binaryToText(binary);
            if (decoded && containsValidChars(decoded)) {
                results.push({
                    method: 'Sentence-Ending Punctuation (.=0, !/?=1)',
                    binary: binary.substring(0, 80) + (binary.length > 80 ? '...' : ''),
                    message: decoded
                });
            }
        }
    }
    
    // Method 2: Comma patterns
    const words = text.split(/\s+/);
    let commaBinary = '';
    words.forEach(word => {
        if (word.includes(',')) commaBinary += '1';
        else if (word.match(/[a-zA-Z]/)) commaBinary += '0';
    });
    
    if (commaBinary.length >= 8) {
        const decoded = binaryToText(commaBinary);
        if (decoded && containsValidChars(decoded)) {
            results.push({
                method: 'Comma Presence Pattern',
                binary: commaBinary.substring(0, 80) + (commaBinary.length > 80 ? '...' : ''),
                message: decoded
            });
        }
    }
    
    return results;
}

/**
 * Identify suspicious synonym substitutions (TF-IDF outliers)
 */
function identifySynonymSubstitutions(topTerms, threshold = 0.01) {
    const suspicious = topTerms.filter(term => {
        // Terms present in suspicious but not (or rarely) in baseline
        return term.suspicious > threshold && term.baseline < threshold;
    });
    
    return suspicious.slice(0, 15); // Top 15 suspicious terms
}

/**
 * Convert binary string to text
 */
function binaryToText(binary) {
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substring(i, i + 8);
        if (byte.length === 8) {
            const charCode = parseInt(byte, 2);
            if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                text += String.fromCharCode(charCode);
            }
        }
    }
    return text;
}

/**
 * Check if decoded text contains valid characters
 */
function containsValidChars(text) {
    if (!text || text.length < 2) return false;
    // Check if at least 70% of characters are printable ASCII
    const validChars = text.split('').filter(c => {
        const code = c.charCodeAt(0);
        return (code >= 32 && code <= 126) || code === 10 || code === 13;
    }).length;
    return validChars / text.length > 0.7;
}

// ============================================================================
// TEXT HIGHLIGHTING
// ============================================================================

/**
 * Highlight suspicious sections in text
 */
function highlightAnomalies(text, anomalies, topTerms) {
    let highlighted = text;
    const highlights = [];
    
    // Detect spacing anomalies
    const multiSpaces = [...text.matchAll(/ {2,}/g)];
    multiSpaces.forEach(match => {
        highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'spacing'
        });
    });
    
    // Detect punctuation clusters
    const punctClusters = [...text.matchAll(/[.,;:!?]{2,}/g)];
    punctClusters.forEach(match => {
        highlights.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'punctuation'
        });
    });
    
    // Highlight suspicious terms (synonym candidates)
    const suspiciousTerms = topTerms.slice(0, 10);
    suspiciousTerms.forEach(term => {
        if (term.suspicious > 0.01 && term.baseline < 0.01) {
            const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                highlights.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    type: 'synonym'
                });
            }
        }
    });
    
    // Sort by position and apply highlighting
    highlights.sort((a, b) => a.start - b.start);
    
    let offset = 0;
    highlights.forEach(h => {
        const start = h.start + offset;
        const end = h.end + offset;
        const original = highlighted.substring(start, end);
        const wrapped = `<span class="highlight-${h.type}">${original}</span>`;
        highlighted = highlighted.substring(0, start) + wrapped + highlighted.substring(end);
        offset += wrapped.length - original.length;
    });
    
    return highlighted;
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Main analysis function
 */
function analyzeText() {
    const suspiciousText = document.getElementById('suspiciousText').value.trim();
    const baselineText = document.getElementById('baselineText').value.trim();
    
    if (!suspiciousText || !baselineText) {
        alert('Please provide both suspicious and baseline text samples.');
        return;
    }
    
    if (suspiciousText.length < 50 || baselineText.length < 50) {
        alert('Text samples should be at least 50 characters long for meaningful analysis.');
        return;
    }
    
    // Calculate stylometric metrics
    const baselineMetrics = calculateStylometry(baselineText);
    const suspiciousMetrics = calculateStylometry(suspiciousText);
    
    // Calculate TF-IDF
    const tfidfResults = calculateTFIDF(baselineText, suspiciousText);
    const topTerms = getTopTerms(tfidfResults.baselineTFIDF, tfidfResults.suspiciousTFIDF);
    
    // Calculate similarity scores
    const cosine = cosineSimilarity(tfidfResults.baselineTFIDF, tfidfResults.suspiciousTFIDF);
    const jaccard = jaccardCoefficient(baselineText, suspiciousText);
    const similarityScores = { cosine, jaccard };
    
    // Detect anomalies
    const anomalies = detectAnomalies(baselineMetrics, suspiciousMetrics, tfidfResults, similarityScores);
    
    // Attempt decoding
    const whitespaceDecoded = decodeWhitespace(suspiciousText);
    const punctuationDecoded = decodePunctuation(suspiciousText);
    const suspiciousTerms = identifySynonymSubstitutions(topTerms);
    
    // Store results
    analysisResults = {
        baselineMetrics,
        suspiciousMetrics,
        tfidfResults,
        topTerms,
        similarityScores,
        anomalies,
        whitespaceDecoded,
        punctuationDecoded,
        suspiciousTerms,
        suspiciousText
    };
    
    // Display results
    displayResults();
}

/**
 * Display analysis results
 */
function displayResults() {
    const results = analysisResults;
    
    // Show results section
    document.getElementById('resultsSection').classList.add('show');
    document.getElementById('exportBtn').style.display = 'inline-block';
    
    // Update anomaly meter
    updateAnomalyMeter(results.anomalies);
    
    // Display stylometric comparison
    displayStylometry(results.baselineMetrics, results.suspiciousMetrics);
    
    // Display TF-IDF analysis
    displayTFIDF(results.topTerms);
    
    // Display similarity scores
    displaySimilarity(results.similarityScores);
    
    // Highlight anomalies in text
    displayHighlightedText(results.suspiciousText, results.anomalies, results.topTerms);
    
    // Display decoded messages
    displayDecodedMessages(results.whitespaceDecoded, results.punctuationDecoded, results.suspiciousTerms);
    
    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Update anomaly meter
 */
function updateAnomalyMeter(anomalies) {
    const score = anomalies.overallScore;
    const indicator = document.getElementById('meterIndicator');
    const label = document.getElementById('meterLabel');
    
    indicator.style.left = `${score}%`;
    label.textContent = `${score} / 100`;
    
    // Color-code label
    if (score < 30) {
        label.style.color = '#4CAF50';
    } else if (score < 70) {
        label.style.color = '#FFC107';
    } else {
        label.style.color = '#F44336';
    }
    
    // Display score breakdown
    const scoreDetails = document.getElementById('scoreDetails');
    scoreDetails.innerHTML = `
        <div class="score-card">
            <h4>Stylometry</h4>
            <div class="value">${Math.round((anomalies.scores.wordLength + anomalies.scores.sentenceLength + anomalies.scores.lexicalDiversity + anomalies.scores.functionWords) / 4)}%</div>
        </div>
        <div class="score-card">
            <h4>Spacing</h4>
            <div class="value">${Math.round(anomalies.scores.spacing)}%</div>
        </div>
        <div class="score-card">
            <h4>Punctuation</h4>
            <div class="value">${Math.round(anomalies.scores.punctuation)}%</div>
        </div>
        <div class="score-card">
            <h4>Vocabulary Match</h4>
            <div class="value">${Math.round(analysisResults.similarityScores.cosine * 100)}%</div>
        </div>
    `;
}

/**
 * Display stylometric comparison
 */
function displayStylometry(baseline, suspicious) {
    const table = document.getElementById('stylometryTable');
    
    const metrics = [
        { name: 'Avg Word Length', baseline: baseline.avgWordLength, suspicious: suspicious.avgWordLength, unit: 'chars' },
        { name: 'Avg Sentence Length', baseline: baseline.avgSentenceLength, suspicious: suspicious.avgSentenceLength, unit: 'words' },
        { name: 'Lexical Diversity', baseline: baseline.lexicalDiversity, suspicious: suspicious.lexicalDiversity, unit: 'ratio' },
        { name: 'Function Word Ratio', baseline: baseline.functionWordRatio, suspicious: suspicious.functionWordRatio, unit: 'ratio' },
        { name: 'Punctuation Density', baseline: baseline.punctuationDensity, suspicious: suspicious.punctuationDensity, unit: 'ratio' },
        { name: 'Vocabulary Richness', baseline: baseline.vocabularyRichness, suspicious: suspicious.vocabularyRichness, unit: 'ratio' }
    ];
    
    let tableHTML = '<tr><th>Metric</th><th>Baseline</th><th>Suspicious</th><th>Deviation</th></tr>';
    
    metrics.forEach(m => {
        const dev = percentDeviation(parseFloat(m.baseline), parseFloat(m.suspicious));
        const devClass = dev > 25 ? 'high' : dev > 15 ? 'medium' : 'low';
        tableHTML += `
            <tr>
                <td><strong>${m.name}</strong></td>
                <td>${m.baseline} ${m.unit}</td>
                <td>${m.suspicious} ${m.unit}</td>
                <td class="deviation ${devClass}">${dev.toFixed(1)}%</td>
            </tr>
        `;
    });
    
    table.innerHTML = tableHTML;
    
    // Create chart
    createStylometryChart(metrics);
}

/**
 * Create stylometry comparison chart
 */
function createStylometryChart(metrics) {
    const canvas = document.getElementById('stylometryChart');
    const ctx = canvas.getContext('2d');
    
    if (charts.stylometry) {
        charts.stylometry.destroy();
    }
    
    // Normalize values for visualization (scale to 0-100)
    const normalizeValue = (val, metric) => {
        if (metric === 'Avg Word Length') return parseFloat(val) * 15;
        if (metric === 'Avg Sentence Length') return parseFloat(val) * 5;
        return parseFloat(val) * 100;
    };
    
    charts.stylometry = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.map(m => m.name),
            datasets: [
                {
                    label: 'Baseline',
                    data: metrics.map(m => normalizeValue(m.baseline, m.name)),
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Suspicious',
                    data: metrics.map(m => normalizeValue(m.suspicious, m.name)),
                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Normalized Value'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Stylometric Comparison'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Display TF-IDF analysis
 */
function displayTFIDF(topTerms) {
    const description = document.getElementById('tfidfDescription');
    description.innerHTML = `<p>Showing top ${topTerms.length} terms with largest TF-IDF divergence between baseline and suspicious texts. Large differences suggest vocabulary manipulation.</p>`;
    
    createTFIDFChart(topTerms);
}

/**
 * Create TF-IDF comparison chart
 */
function createTFIDFChart(topTerms) {
    const canvas = document.getElementById('tfidfChart');
    const ctx = canvas.getContext('2d');
    
    if (charts.tfidf) {
        charts.tfidf.destroy();
    }
    
    const displayTerms = topTerms.slice(0, 15);
    
    charts.tfidf = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: displayTerms.map(t => t.term),
            datasets: [
                {
                    label: 'Baseline TF-IDF',
                    data: displayTerms.map(t => t.baseline),
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Suspicious TF-IDF',
                    data: displayTerms.map(t => t.suspicious),
                    backgroundColor: 'rgba(244, 67, 54, 0.6)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'TF-IDF Weight'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'TF-IDF Term Weight Comparison'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Display similarity scores
 */
function displaySimilarity(scores) {
    const container = document.getElementById('similarityScores');
    
    const cosinePercent = (scores.cosine * 100).toFixed(1);
    const jaccardPercent = (scores.jaccard * 100).toFixed(1);
    
    const cosineClass = scores.cosine >= 0.7 ? 'low' : scores.cosine >= 0.5 ? 'medium' : 'high';
    const jaccardClass = scores.jaccard >= 0.6 ? 'low' : scores.jaccard >= 0.4 ? 'medium' : 'high';
    
    container.innerHTML = `
        <div class="score-card">
            <h4>Cosine Similarity</h4>
            <div class="value deviation ${cosineClass}">${cosinePercent}%</div>
            <p style="font-size: 12px; margin-top: 8px; color: var(--color-text-secondary);">
                Measures vocabulary similarity based on TF-IDF weights. Lower values suggest word substitution.
            </p>
        </div>
        <div class="score-card">
            <h4>Jaccard Coefficient</h4>
            <div class="value deviation ${jaccardClass}">${jaccardPercent}%</div>
            <p style="font-size: 12px; margin-top: 8px; color: var(--color-text-secondary);">
                Measures vocabulary overlap (intersection/union). Lower values indicate different word sets.
            </p>
        </div>
        <div class="score-card">
            <h4>Overall Assessment</h4>
            <div class="value" style="font-size: 16px;">
                ${scores.cosine >= 0.7 && scores.jaccard >= 0.6 ? '✓ Texts appear similar' : 
                  scores.cosine < 0.5 || scores.jaccard < 0.4 ? '⚠ Significant divergence detected' : 
                  '⚡ Moderate differences found'}
            </div>
        </div>
    `;
}

/**
 * Display highlighted text with anomalies
 */
function displayHighlightedText(text, anomalies, topTerms) {
    const container = document.getElementById('highlightedText');
    const highlighted = highlightAnomalies(text, anomalies, topTerms);
    container.innerHTML = highlighted;
}

/**
 * Display decoded messages
 */
function displayDecodedMessages(whitespaceDecoded, punctuationDecoded, suspiciousTerms) {
    const section = document.getElementById('decodedSection');
    
    let html = '';
    
    if (whitespaceDecoded.length > 0 || punctuationDecoded.length > 0) {
        html += '<div class="decoded-message"><h4>🔓 Decoded Messages</h4>';
        
        whitespaceDecoded.forEach(result => {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong>${result.method}</strong><br>
                    <span style="font-size: 12px; color: var(--color-text-secondary);">Binary: ${result.binary}</span>
                    <div class="message-content">${result.message}</div>
                </div>
            `;
        });
        
        punctuationDecoded.forEach(result => {
            html += `
                <div style="margin-bottom: 15px;">
                    <strong>${result.method}</strong><br>
                    <span style="font-size: 12px; color: var(--color-text-secondary);">Binary: ${result.binary}</span>
                    <div class="message-content">${result.message}</div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    if (suspiciousTerms.length > 0) {
        html += '<div class="expandable-section" style="margin-top: 20px;">';
        html += '<div class="section-header" onclick="toggleSection(\'synonyms\')"><h3>🔍 Potential Synonym Substitutions</h3><span>▼</span></div>';
        html += '<div class="section-content" id="synonyms-content">';
        html += '<p>Terms present in suspicious text but rare or absent in baseline (possible substitutions):</p>';
        html += '<table class="comparison-table"><tr><th>Term</th><th>Suspicious TF-IDF</th><th>Baseline TF-IDF</th></tr>';
        
        suspiciousTerms.forEach(term => {
            html += `
                <tr>
                    <td><strong>${term.term}</strong></td>
                    <td>${term.suspicious.toFixed(4)}</td>
                    <td>${term.baseline.toFixed(4)}</td>
                </tr>
            `;
        });
        
        html += '</table>';
        html += '<p style="font-size: 12px; color: var(--color-text-secondary); margin-top: 10px;">Note: Synonym-based steganography cannot be fully decoded without the original text or key. These terms are flagged as potential substitutions.</p>';
        html += '</div></div>';
    }
    
    section.innerHTML = html || '<p style="color: var(--color-text-secondary); text-align: center; padding: 20px;">No hidden messages detected through spacing or punctuation analysis.</p>';
}

/**
 * Toggle expandable sections
 */
function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    content.classList.toggle('show');
}

/**
 * Clear analysis
 */
function clearAnalysis() {
    document.getElementById('suspiciousText').value = '';
    document.getElementById('baselineText').value = '';
    document.getElementById('resultsSection').classList.remove('show');
    document.getElementById('exportBtn').style.display = 'none';
    
    // Destroy charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
    
    analysisResults = null;
}

/**
 * Export results to JSON
 */
function exportResults() {
    if (!analysisResults) return;
    
    const exportData = {
        timestamp: new Date().toISOString(),
        overallScore: analysisResults.anomalies.overallScore,
        anomalies: analysisResults.anomalies.flags,
        stylometry: {
            baseline: analysisResults.baselineMetrics,
            suspicious: analysisResults.suspiciousMetrics
        },
        similarity: analysisResults.similarityScores,
        decodedMessages: {
            whitespace: analysisResults.whitespaceDecoded,
            punctuation: analysisResults.punctuationDecoded
        },
        suspiciousTerms: analysisResults.suspiciousTerms
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-stego-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================================
// FILE UPLOAD HANDLERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Suspicious file upload
    document.getElementById('suspiciousFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('suspiciousText').value = event.target.result;
            };
            reader.readAsText(file);
        } else {
            alert('Please upload a valid .txt file');
        }
    });
    
    // Baseline file upload
    document.getElementById('baselineFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('baselineText').value = event.target.result;
            };
            reader.readAsText(file);
        } else {
            alert('Please upload a valid .txt file');
        }
    });
});
