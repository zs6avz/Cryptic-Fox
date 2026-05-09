/**
 * Cipher Identifier - Heuristic scanner to suggest encryption/encoding types
 */

const COMMON_ENGLISH_WORDS = ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "ANY", "CAN", "HAD", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE"];

function identifyCipher() {
    const input = document.querySelector('.identifier-input').value.trim();
    const output = document.querySelector('.identifier-output');
    
    if (!input) {
        output.innerHTML = "<p>Please enter a message to scan.</p>";
        return;
    }

    const results = [];
    const cleanInput = input.replace(/\s+/g, '');

    // 1. Check for Image (Base64 or Data URI)
    if (input.startsWith('data:image/') || /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cleanInput)) {
        // Check for common image magic numbers in Base64
        const isPNG = cleanInput.startsWith('iVBORw0KGgo');
        const isJPG = cleanInput.startsWith('/9j/');
        const isGIF = cleanInput.startsWith('R0lGODlh');
        
        if (input.startsWith('data:image/') || isPNG || isJPG || isGIF) {
            results.push({ 
                type: "Base64 Image", 
                confidence: "High", 
                reason: `Likely a ${isPNG ? 'PNG' : isJPG ? 'JPEG' : isGIF ? 'GIF' : 'encoded'} image. Use the Image Encryption tool.` 
            });
        }
    }

    // 2. Check Cryptographic Hashes (by length)
    if (/^[0-9a-fA-F]+$/.test(cleanInput)) {
        if (cleanInput.length === 32) {
            results.push({ type: "MD5 Hash", confidence: "High", reason: "32-character hexadecimal string matches MD5 length." });
        } else if (cleanInput.length === 40) {
            results.push({ type: "SHA-1 Hash", confidence: "High", reason: "40-character hexadecimal string matches SHA-1 length." });
        } else if (cleanInput.length === 64) {
            results.push({ type: "SHA-256 Hash", confidence: "High", reason: "64-character hexadecimal string matches SHA-256 length." });
        }
    }

    // 3. Check Binary
    if (/^[01\s]{4,}$/.test(input)) {
        results.push({ type: "Binary (Base 2)", confidence: "High", reason: "Contains only 0s and 1s." });
    }

    // 4. Check Hexadecimal
    if (/^[0-9a-fA-F\s]{4,}$/.test(input) && !/^[01\s]+$/.test(input) && cleanInput.length !== 32 && cleanInput.length !== 40 && cleanInput.length !== 64) {
        results.push({ type: "Hexadecimal (Base 16)", confidence: "High", reason: "Contains only valid Hex characters (0-9, A-F)." });
    }

    // 5. Check Morse Code
    if (/^[.\-/\s]{3,}$/.test(input)) {
        results.push({ type: "Morse Code", confidence: "High", reason: "Contains only dots, dashes, and separators." });
    }

    // 6. Check Base64 (General)
    if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cleanInput) && input.length >= 4 && results.length === 0) {
        results.push({ type: "Base64", confidence: "Moderate", reason: "Matches Base64 character set and padding pattern." });
    }

    // 7. Check Base-36
    if (/^[0-9a-z\s]{4,}$/i.test(input) && !/^[0-9\s]+$/.test(input) && !/^[a-fA-F\s]+$/.test(input)) {
        results.push({ type: "Base-36", confidence: "Moderate", reason: "Contains alphanumeric characters (0-9, A-Z)." });
    }

    // 8. Check Base-62
    if (/^[0-9a-zA-Z\s]{4,}$/.test(input) && !/^[0-9a-z\s]+$/i.test(input)) {
        results.push({ type: "Base-62", confidence: "Moderate", reason: "Contains case-sensitive alphanumeric characters." });
    }

    // 9. Check Caesar / Atbash / Substitution via Word Detection
    const caesarAtbashMatches = checkSubstitution(input);
    caesarAtbashMatches.forEach(match => results.push(match));

    // 10. Fallback for alphabetical strings (Vigenère candidate)
    if (results.length === 0 && /^[a-zA-Z\s]{10,}$/.test(input)) {
        results.push({ type: "Vigenère / Polyalphabetic", confidence: "Low", reason: "Alphabetical string that doesn't match simple shifts. May require a keyword." });
    }

    // 11. General Text check
    if (results.length === 0) {
        results.push({ type: "Unknown / Encrypted", confidence: "Low", reason: "No common patterns detected. Could be Vigenère, AES, or a custom cipher." });
    }

    // Display Results
    displayIdentifierResults(results, output);
}

function checkSubstitution(text) {
    const matches = [];
    const upperText = text.toUpperCase();

    // Check Atbash
    const atbash = upperText.split('').map(char => {
        if (char >= 'A' && char <= 'Z') return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
        return char;
    }).join('');
    
    if (containsCommonWords(atbash)) {
        matches.push({ type: "Atbash Cipher", confidence: "High", reason: "Decodes to English-like text using Atbash." });
    }

    // Check Caesar Shifts (1-25)
    for (let shift = 1; shift < 26; shift++) {
        const decoded = upperText.split('').map(char => {
            if (char >= 'A' && char <= 'Z') return String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
            return char;
        }).join('');

        if (containsCommonWords(decoded)) {
            matches.push({ type: "Caesar Cipher", confidence: "High", reason: `Decodes to English-like text with shift ${shift}.` });
            break; // Found one shift, usually enough
        }
    }

    return matches;
}

function containsCommonWords(text) {
    const words = text.split(/[^A-Z]+/);
    return words.some(word => word.length >= 3 && COMMON_ENGLISH_WORDS.includes(word));
}

function displayIdentifierResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = "<p>No clear patterns identified.</p>";
        return;
    }

    let html = "<ul style='list-style: none; padding: 0; text-align: left; width: 100%;'>";
    results.forEach(res => {
        const color = res.confidence === "High" ? "#7bd389" : (res.confidence === "Moderate" ? "#447D9B" : "#FE7743");
        
        // Determine tool type for "Apply" button
        let toolType = "";
        let toolValue = "";
        
        if (res.type.includes("Caesar")) { toolType = "caesar"; toolValue = res.reason.match(/\d+/)?.[0] || ""; }
        else if (res.type.includes("Atbash")) { toolType = "atbash"; }
        else if (res.type.includes("Binary")) { toolType = "binary"; }
        else if (res.type.includes("Hexadecimal")) { toolType = "hex"; }
        else if (res.type.includes("Base64")) { toolType = "base64"; }
        else if (res.type.includes("Base-36")) { toolType = "base-alt"; toolValue = "36"; }
        else if (res.type.includes("Base-62")) { toolType = "base-alt"; toolValue = "62"; }
        else if (res.type.includes("Morse")) { toolType = "morse"; }
        else if (res.type.includes("Hash")) { toolType = "hash"; toolValue = res.type.split(' ')[0]; }

        html += `
            <li style="margin-bottom: 15px; padding: 15px; border-left: 4px solid ${color}; background: rgba(255,255,255,0.05); position: relative;">
                <strong style="color: ${color}; font-size: 1.1rem;">${res.type}</strong> 
                <span style="font-size: 0.8rem; opacity: 0.7;">(${res.confidence} Confidence)</span>
                <p style="margin: 5px 0 0; font-size: 0.9rem; color: var(--color-text-muted);">${res.reason}</p>
                ${toolType ? `<button onclick="applyCipherTool('${toolType}', '${toolValue}')" style="margin-top: 10px; font-size: 0.8rem; padding: 4px 10px; background: ${color}; color: #000; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">Apply This Tool</button>` : ''}
            </li>
        `;
    });
    html += "</ul>";
    container.innerHTML = html;
}

/**
 * Jumps to a specific tool, populates it with the scanned input, and sets parameters
 */
function applyCipherTool(type, value) {
    const input = document.querySelector('.identifier-input').value;
    let targetSection;
    let targetInput;

    switch(type) {
        case 'caesar':
            targetSection = document.querySelector('.caesar-input').closest('.method');
            targetInput = document.querySelector('.caesar-input');
            if (value) document.querySelector('.caesar-shift').value = value;
            break;
        case 'atbash':
            targetSection = document.querySelector('.atbash-input').closest('.method');
            targetInput = document.querySelector('.atbash-input');
            break;
        case 'binary':
            targetSection = document.querySelector('.binary-input').closest('.method');
            targetInput = document.querySelector('.binary-input');
            break;
        case 'hex':
            targetSection = document.querySelector('.hex-input').closest('.method');
            targetInput = document.querySelector('.hex-input');
            break;
        case 'base64':
            targetSection = document.querySelector('.base64-input').closest('.method');
            targetInput = document.querySelector('.base64-input');
            break;
        case 'base-alt':
            targetSection = document.querySelector('.base-alt-input').closest('.method');
            targetInput = document.querySelector('.base-alt-input');
            document.querySelector('.base-alt-type').value = value;
            break;
        case 'morse':
            targetSection = document.querySelector('.morse-input').closest('.method');
            targetInput = document.querySelector('.morse-input');
            break;
        case 'hash':
            targetSection = document.querySelector('.hash-input').closest('.method');
            targetInput = document.querySelector('.hash-input');
            document.querySelector('.hash-type').value = value;
            break;
    }

    if (targetInput && targetSection) {
        targetInput.value = input;
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary glow effect to the target section
        targetSection.style.transition = 'box-shadow 0.5s';
        targetSection.style.boxShadow = '0 0 30px rgba(123, 211, 137, 0.5)';
        setTimeout(() => {
            targetSection.style.boxShadow = '';
        }, 2000);
    }
}

// Clear Identifier Fields
function clearIdentifierFields() {
    document.querySelector('.identifier-input').value = '';
    document.querySelector('.identifier-output').innerHTML = '';
}

// Bind event listener if on decrypt page
document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clearIdentifierFieldsBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearIdentifierFields);
});
