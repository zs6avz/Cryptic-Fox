// Function to encrypt text to selected base
function encryptBinary(base) {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const text = inputElement.value.trim();

    const encoded = text.split('')
        .map(char => char.charCodeAt(0).toString(base))
        .join(' ');

    outputElement.textContent = encoded || "Invalid input!";
}

// Function to decrypt encoded text from selected base
function decryptBinary(base) {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const encodedString = inputElement.value.trim();

    try {
        const decoded = encodedString.split(' ')
            .map(num => String.fromCharCode(parseInt(num, base)))
            .join('');

        outputElement.textContent = decoded || "Invalid input!";
    } catch {
        outputElement.textContent = "Invalid base input!";
    }
}

// Function to get the selected base from dropdown
function getSelectedBase() {
    return document.querySelector('.binary-base').value;
}

// Function to clear binary fields
function clearBinaryFields() {
    const inputElement = document.querySelector('.binary-input');
    const outputElement = document.querySelector('.binary-output');
    const baseSelect = document.querySelector('.binary-base');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (baseSelect) baseSelect.selectedIndex = 0; // Reset dropdown
}



// Hexadecimal Encryption & Decryption
function encryptHex() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');
    const text = inputElement.value.trim();

    const hex = text.split('')
        .map(char => char.charCodeAt(0).toString(16))
        .join(' ');

    outputElement.textContent = hex || "Invalid input!";
}

function decryptHex() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');
    const hexString = inputElement.value.trim();

    const text = hexString.split(' ')
        .map(hex => String.fromCharCode(parseInt(hex, 16)))
        .join('');

    outputElement.textContent = text || "Invalid hex input!";
}

// Function to clear hex fields
function clearHexFields() {
    const inputElement = document.querySelector('.hex-input');
    const outputElement = document.querySelector('.hex-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}



// Ensure cipher mappings are loaded when the page loads
loadJacquard();

// Define mapping objects
const jacquardToAlphabet = {};
const alphabetToJacquard = {};

// Function to load cipher mappings
async function loadJacquard() {
    try {
        const response = await fetch('xml/jacquard.xml'); // Fetch the mappings XML file
        if (!response.ok) throw new Error(`Failed to load mappings: ${response.statusText}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        // Extract mappings from the XML file
        const mappings = xmlDoc.getElementsByTagName("mapping");
        for (let mapping of mappings) {
            const cipher = mapping.getAttribute("cipher");
            const alphabet = mapping.getAttribute("alphabet");

            // Populate mapping objects
            jacquardToAlphabet[cipher] = alphabet;
            alphabetToJacquard[alphabet] = cipher;
        }

    } catch (error) {
        console.error("Error loading mappings:", error);
    }
}

// Jacquard Cipher Encryption: Translates alphabet to cipher
function encryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const text = inputElement.value.trim().toUpperCase(); // Convert to uppercase for matching

    // Translate each character to cipher using the mapping
    const cipherText = text.split('')
        .map(char => alphabetToJacquard[char] || "[?]") // Use [?] for unknown characters
        .join(' ');

    outputElement.textContent = cipherText || "Invalid input!";
}

// Jacquard Cipher Decryption: Translates cipher to alphabet
function decryptJacquard() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');
    const cipherText = inputElement.value.trim();

    // Split the cipher text by spaces and translate each to alphabet
    const text = cipherText.split(' ')
        .map(code => jacquardToAlphabet[code] || "[?]") // Use [?] for unknown cipher codes
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

// Function to clear Jacquard fields
function clearJacquardFields() {
    const inputElement = document.querySelector('.jacquard-input');
    const outputElement = document.querySelector('.jacquard-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}



// Caesar Cipher Encryption & Decryption
function encryptCaesar(shift) {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const text = inputElement.value.trim();

    const cipherText = text.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode(((code - offset + shift) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptCaesar(shift) {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const cipherText = inputElement.value.trim();

    const text = cipherText.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let code = char.charCodeAt(0);
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode(((code - offset - shift + 26) % 26) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

function getShiftValue() {
    return parseInt(document.querySelector('.caesar-shift').value, 10);
}

// Clear fields for Caesar Cipher
function clearCaesarFields() {
    const inputElement = document.querySelector('.caesar-input');
    const outputElement = document.querySelector('.caesar-output');
    const shiftElement = document.querySelector('.caesar-shift');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (shiftElement) shiftElement.value = 3; // Reset shift to default value
}



// Vigenère Cipher Encryption & Decryption
document.querySelector('.encrypt-btn').addEventListener('click', function () {
    const key = document.querySelector('.vigenere-key').value.trim();
    const text = document.querySelector('.vigenere-input').value.trim();
    document.querySelector('.vigenere-output').textContent = vigenereEncrypt(text, key);
});

document.querySelector('.decrypt-btn').addEventListener('click', function () {
    const key = document.querySelector('.vigenere-key').value.trim();
    const cipherText = document.querySelector('.vigenere-input').value.trim();
    document.querySelector('.vigenere-output').textContent = vigenereDecrypt(cipherText, key);
});

// Function to generate repeating key while skipping spaces
function generateKey(str, key) {
    key = key.toUpperCase();
    let expandedKey = "";
    let keyIndex = 0;

    for (let i = 0; i < str.length; i++) {
        if (str[i].match(/[A-Z]/)) {
            expandedKey += key[keyIndex % key.length]; // Repeat key correctly
            keyIndex++; // Move to next key letter **only for letters**
        } else {
            expandedKey += str[i]; // Preserve spaces
        }
    }

    return expandedKey;
}

// Function to encrypt using letter addition while preserving spaces
function vigenereEncrypt(str, key) {
    str = str.toUpperCase();
    key = generateKey(str, key.toUpperCase());
    let cipherText = "";

    for (let i = 0; i < str.length; i++) {
        if (str[i].match(/[A-Z]/)) {
            let plainValue = str[i].charCodeAt(0) - 65;
            let keyValue = key[i].charCodeAt(0) - 65;
            let encryptedValue = (plainValue + keyValue) % 26; // Letter addition (modulo 26)
            cipherText += String.fromCharCode(encryptedValue + 65);
        } else {
            cipherText += str[i]; // Preserve spaces and special characters
        }
    }

    return cipherText;
}

// Function to decrypt using letter subtraction while preserving spaces
function vigenereDecrypt(cipherText, key) {
    cipherText = cipherText.toUpperCase();
    key = generateKey(cipherText, key.toUpperCase());
    let plainText = "";

    for (let i = 0; i < cipherText.length; i++) {
        if (cipherText[i].match(/[A-Z]/)) {
            let cipherValue = cipherText[i].charCodeAt(0) - 65;
            let keyValue = key[i].charCodeAt(0) - 65;
            let decryptedValue = (cipherValue - keyValue + 26) % 26; // Letter subtraction (modulo 26)
            plainText += String.fromCharCode(decryptedValue + 65);
        } else {
            plainText += cipherText[i]; // Preserve spaces and special characters
        }
    }

    return plainText;
}

// Clear fields for Vigenère Cipher
function clearVigenereFields() {
    const inputElement = document.querySelector('.vigenere-input');
    const keyElement = document.querySelector('.vigenere-key');
    const outputElement = document.querySelector('.vigenere-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (keyElement) keyElement.value = ''; // Clear key
    if (outputElement) outputElement.textContent = ''; // Clear output
}



// Atbash Cipher Encryption & Decryption
function encryptAtbash() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');
    const text = inputElement.value.trim();

    const cipherText = text.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode((25 - (char.charCodeAt(0) - offset)) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = cipherText || "Invalid input!";
}

function decryptAtbash() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');
    const cipherText = inputElement.value.trim();

    const text = cipherText.split('')
        .map(char => {
            if (char.match(/[a-z]/i)) {
                let offset = char >= 'a' ? 97 : 65;
                return String.fromCharCode((25 - (char.charCodeAt(0) - offset)) + offset);
            }
            return char;
        })
        .join('');

    outputElement.textContent = text || "Invalid cipher text!";
}

function clearAtbashFields() {
    const inputElement = document.querySelector('.atbash-input');
    const outputElement = document.querySelector('.atbash-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}



// Base64 Encoding
function encryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const text = inputElement.value.trim();

    if (!text) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        const encoded = btoa(unescape(encodeURIComponent(text))); // Properly encode text to Base64
        outputElement.textContent = encoded;
    } catch (error) {
        outputElement.textContent = "Error: Invalid input!";
        console.error(error);
    }
}

// Base64 Decoding
function decryptBase64() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');
    const encodedText = inputElement.value.trim();

    if (!encodedText) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        const decoded = decodeURIComponent(escape(atob(encodedText))); // Properly decode Base64 to text
        outputElement.textContent = decoded;
    } catch (error) {
        outputElement.textContent = "Error: Invalid Base64 input!";
        console.error(error);
    }
}

// Clear Base64 Fields
function clearBase64Fields() {
    const inputElement = document.querySelector('.base64-input');
    const outputElement = document.querySelector('.base64-output');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
}

// ── Base-36 & Base-62 Logic ──────────────────────────────────────────

const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Converts a BigInt to a Base-62 string
 */
function toBase62(n) {
    if (typeof n !== 'bigint') n = BigInt(n);
    if (n === 0n) return "0";
    let res = "";
    while (n > 0n) {
        res = BASE62_ALPHABET[Number(n % 62n)] + res;
        n = n / 62n;
    }
    return res;
}

/**
 * Converts a Base-62 string to a BigInt
 */
function fromBase62(s) {
    let res = 0n;
    for (let char of s) {
        let idx = BASE62_ALPHABET.indexOf(char);
        if (idx === -1) return null;
        res = res * 62n + BigInt(idx);
    }
    return res;
}

/**
 * Helper to identify hash sizes based on byte length
 */
function getHashSizeLabel(byteCount) {
    if (byteCount === 16) return " (16 bytes — MD5-sized)";
    if (byteCount === 20) return " (20 bytes — SHA-1-sized)";
    if (byteCount === 32) return " (32 bytes — SHA-256-sized)";
    return ` (${byteCount} bytes)`;
}

function encryptBaseAlt() {
    const inputElement = document.querySelector('.base-alt-input');
    const outputElement = document.querySelector('.base-alt-output');
    const base = document.querySelector('.base-alt-type').value;
    const text = inputElement.value.trim();

    if (!text) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        let result;
        // Default to char-by-char for consistency with other tools
        if (base === "36") {
            result = text.split('').map(char => char.charCodeAt(0).toString(36)).join(' ');
        } else if (base === "62") {
            result = text.split('').map(char => toBase62(BigInt(char.charCodeAt(0)))).join(' ');
        }
        outputElement.textContent = result || "Invalid input!";
    } catch (error) {
        outputElement.textContent = "Error: Encoding failed!";
    }
}

function decryptBaseAlt() {
    const inputElement = document.querySelector('.base-alt-input');
    const outputElement = document.querySelector('.base-alt-output');
    const base = document.querySelector('.base-alt-type').value;
    const encodedText = inputElement.value.trim();

    if (!encodedText) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        let result = "";
        let byteCount = 0;

        if (encodedText.includes(' ')) {
            // Char-by-char mode (space separated)
            const chars = encodedText.split(' ');
            if (base === "36") {
                result = chars.map(s => {
                    const val = parseInt(s, 36);
                    if (isNaN(val)) throw new Error("Invalid Base-36 value: " + s);
                    return String.fromCharCode(val);
                }).join('');
            } else if (base === "62") {
                result = chars.map(s => {
                    const val = fromBase62(s);
                    if (val === null) throw new Error("Invalid Base-62 value: " + s);
                    return String.fromCharCode(Number(val));
                }).join('');
            }
            byteCount = new TextEncoder().encode(result).length;
        } else {
            // Single block mode (treat entire string as one large number)
            let bigNum = 0n;
            const b = BigInt(base);
            if (base === "36") {
                for (const char of encodedText.toLowerCase()) {
                    const val = parseInt(char, 36);
                    if (isNaN(val)) throw new Error("Invalid Base-36 character");
                    bigNum = bigNum * b + BigInt(val);
                }
            } else {
                for (const char of encodedText) {
                    const val = BASE62_ALPHABET.indexOf(char);
                    if (val === -1) throw new Error("Invalid Base-62 character");
                    bigNum = bigNum * b + BigInt(val);
                }
            }

            // Convert BigInt to Hex to determine byte structure
            let hex = bigNum.toString(16);
            if (hex.length % 2 !== 0) hex = '0' + hex;
            byteCount = hex.length / 2;

            // Prepare display: Hex value is most useful for hash-sized data
            result = "Hex: " + hex.toUpperCase();

            // Try to decode as UTF-8 text if it looks printable
            try {
                const bytes = new Uint8Array(byteCount);
                for (let i = 0; i < byteCount; i++) {
                    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
                }
                const decodedText = new TextDecoder().decode(bytes);
                // Check if result is mostly printable characters
                if (/^[\x20-\x7E\s]*$/.test(decodedText)) {
                    result += " | Text: " + decodedText;
                }
            } catch (e) {
                // Not printable, stick to hex
            }
        }

        outputElement.textContent = result + getHashSizeLabel(byteCount);
    } catch (error) {
        outputElement.textContent = "Error: " + error.message;
    }
}

function clearBaseAltFields() {
    const inputElement = document.querySelector('.base-alt-input');
    const outputElement = document.querySelector('.base-alt-output');
    const typeSelect = document.querySelector('.base-alt-type');

    if (inputElement) inputElement.value = '';
    if (outputElement) outputElement.textContent = '';
    if (typeSelect) typeSelect.selectedIndex = 0;
}

// ── Cryptographic Hashes ──────────────────────────────────────────────

const HASH_DICTIONARY = [
    "password", "123456", "admin", "welcome", "12345678", "qwerty", "football", "monkey", "123456789", "letmein", "the", "be", "to", "of",
    "and", "that", "have", "for", "not", "with", "as", "you", "do", "at", "cryptic", "fox", "secret", "hidden", "cipher", "decrypt", "encrypt",
    "puzzle", "logic", "fennfox", "aeon", "end", "society", "ada", "jacquard", "babbage", "lovelace", "enigma", "turing", "Beethoven", "Bach",
    "Mozart", "Schubert", "Der Doppelgänger", "Der Lindenbaum", "Gretchen am Spinnrade", "Erlkönig", "Die Forelle", "An die Musik", "Winterreise",
    "Die schöne Müllerin", "Der Tod und das Mädchen", "Ständchen", "Pathétique", "Moonlight", "Appassionata", "Hammerklavier", "Eroica", "Pastoral",
    "Choral", "Für Elise", "Egmont", "Fidelio", "Missa Solemnis", "Grosse Fuge", "Kreutzer Sonata", "Goldberg Variations", "Well‑Tempered Clavier",
    "Brandenburg Concertos", "St Matthew Passion", "St John Passion", "Art of Fugue", "Toccata and Fugue in D minor", "Jesu Joy of Man’s Desiring",
    "Air on the G String", "Musical Offering", "Cello Suites", "Chaconne", "Requiem", "Eine kleine Nachtmusik", "Die Zauberflöte", "Don Giovanni",
    "Le nozze di Figaro", "Cosi fan tutte", "Jupiter Symphony", "Haffner Symphony", "Great Mass in C minor", "Clarinet Concerto", "Ave verum corpus",
    "Rondo alla Turca", "Lord Byron", "Ada Lovelace", "Joseph-Marie Jacquard", "Charles Babbage", "Ninth Bridgewater Treatise", "T. S. Eliot",
    "Four Quartets", "Childe Harold", "Manfred", "Don Juan", "She Walks in Beauty", "Prometheus", "Ada Augusta", "Countess of Lovelace",
    "Analytical Engine", "Difference Engine", "Jacquard Loom", "Punch Card", "Weaving Loom", "Babbage Engine", "Mathematical Notes",
    "Bridgewater Treatises", "Natural Theology", "Burnt Norton", "East Coker", "The Dry Salvages", "Little Gidding", "Romanticism",
    "Computing Pioneer", "Mechanical Computation", "Symbolic Logic", "Industrial Revolution", "Poetry", "Darkness", "Byron", "Eliot",
    "Coleridge", "Kubla Khan", "Xanadu", "Alph", "Caverns", "Sunless Sea", "Shadow", "Desolation", "Prophecy", "Vision", "Abyss", "Silence",
    "Time", "Stillness", "Ruin", "Night", "Dream", "Fragment", "Oracle", "River", "Temple", "Pleasure Dome", "Chasm", "Thunder", "Eclipse", "Ash",
    "Embers", "Midnight", "Eternity", "Blake", "Innocence", "Experience", "Tyger", "Lamb", "Jerusalem", "Urizen", "Los", "Orc", "Albion", "Beulah",
    "Emanation", "Imagination", "Revelation", "Contraries", "Heaven", "Hell", "Divine", "Fiery", "Furnace", "Forge", "Chains", "Stars", "Angels",
    "Demons", "Paradise", "Mystery", "Reaper", "Chimney", "Rose", "Sick Rose", "Sunflower", "Inspiration", "Rebellion", "Mythos", "dark", "famine",
    "despair", "ember", "vacant", "desolate", "extinct", "chaos", "tempest", "wild", "hunger", "frost", "still", "oblivion", "doom", "wreck", "phantom",
    "terror", "gloom", "starless", "black", "solitude", "cataclysm", "waste", "spectre", "hollow", "perdition", "void", "cinder", "smoke", "pall", "grief",
    "decay", "storm", "dust", "flame", "fire", "ice", "stone", "iron", "bone", "grave", "fall", "rift", "echo", "fear", "dread", "bleak", "cold", "cosmic",
    "astral", "celestial", "axis", "cycle", "origin", "creation", "mythic", "legend", "mist"
];

function generateHash() {
    const inputElement = document.querySelector('.hash-input');
    const saltElement = document.querySelector('.hash-salt');
    const truncateElement = document.querySelector('.hash-truncate');
    const outputElement = document.querySelector('.hash-output');
    const type = document.querySelector('.hash-type').value;

    const text = inputElement.value;
    const salt = saltElement.value || "";
    const truncate = parseInt(truncateElement.value, 10);

    if (!text && !salt) {
        outputElement.textContent = "Error: Input cannot be empty!";
        return;
    }

    try {
        const dataToHash = salt + text;
        let hash;
        if (type === "MD5") {
            hash = CryptoJS.MD5(dataToHash);
        } else if (type === "SHA1") {
            hash = CryptoJS.SHA1(dataToHash);
        } else if (type === "SHA256") {
            hash = CryptoJS.SHA256(dataToHash);
        }

        let result = hash.toString(CryptoJS.enc.Hex);

        if (!isNaN(truncate) && truncate > 0) {
            result = result.substring(0, truncate);
        }

        outputElement.textContent = result;
    } catch (error) {
        outputElement.textContent = "Error: Hashing failed!";
        console.error(error);
    }
}

/**
 * Attempts to "decode" (crack) a hash by checking against common words
 * or providing an external lookup link.
 */
function crackHash() {
    const input = document.querySelector('.hash-input').value.trim().toLowerCase();
    const salt = document.querySelector('.hash-salt').value || "";
    const outputElement = document.querySelector('.hash-output');
    const type = document.querySelector('.hash-type').value;

    if (!input) {
        outputElement.textContent = "Error: Please enter a hash to crack.";
        return;
    }

    // 1. Local Dictionary Attack
    for (let word of HASH_DICTIONARY) {
        const dataToHash = salt + word;
        let hash;
        if (type === "MD5") hash = CryptoJS.MD5(dataToHash).toString();
        else if (type === "SHA1") hash = CryptoJS.SHA1(dataToHash).toString();
        else if (type === "SHA256") hash = CryptoJS.SHA256(dataToHash).toString();

        if (hash === input) {
            outputElement.innerHTML = `Success! Decoded value: <strong style="color: #7bd389;">${word}</strong>`;
            return;
        }
    }

    // 2. If not found, suggest online lookup
    const crackStationUrl = `https://crackstation.net/?q=${input}`;
    outputElement.innerHTML = `Value not found in local dictionary. <a href="${crackStationUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent); font-weight: bold;">Try External Lookup (CrackStation) ⟶</a>`;
}

function clearHashFields() {
    const inputElement = document.querySelector('.hash-input');
    const saltElement = document.querySelector('.hash-salt');
    const truncateElement = document.querySelector('.hash-truncate');
    const outputElement = document.querySelector('.hash-output');
    const typeSelect = document.querySelector('.hash-type');

    if (inputElement) inputElement.value = '';
    if (saltElement) saltElement.value = '';
    if (truncateElement) truncateElement.value = '';
    if (outputElement) outputElement.textContent = '';
    if (typeSelect) typeSelect.selectedIndex = 0;
}



// Morse Code Encryption & Decryption
const morseCodeMap = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
    "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
    "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
    "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
    "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
    "Z": "--..", " ": "/"
};

function encryptMorse(separator) {
    separator = separator || ' ';
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const text = inputElement.value.trim().toUpperCase();

    const morseCode = text.split('')
        .map(char => morseCodeMap[char] || '?')
        .join(separator);

    outputElement.textContent = morseCode || "Invalid input!";
}

function decryptMorse(separator) {
    separator = separator || ' ';
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const morseString = inputElement.value.trim();

    const text = morseString.split(separator)
        .map(symbol => Object.keys(morseCodeMap).find(key => morseCodeMap[key] === symbol) || '?')
        .join('');

    outputElement.textContent = text || "Invalid Morse input!";
}

// Clear fields for Morse Code
function clearMorseFields() {
    const inputElement = document.querySelector('.morse-input');
    const outputElement = document.querySelector('.morse-output');
    const separatorElement = document.querySelector('.morse-separator');

    if (inputElement) inputElement.value = ''; // Clear input
    if (outputElement) outputElement.textContent = ''; // Clear output
    if (separatorElement) separatorElement.selectedIndex = 0; // Reset separator to default
}






// ── Consolidated Event Listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };
    bind('clearBinaryFieldsBtn', clearBinaryFields);
    bind('clearHexFieldsBtn', clearHexFields);
    bind('clearJacquardFieldsBtn', clearJacquardFields);
    bind('clearCaesarFieldsBtn', clearCaesarFields);
    bind('clearVigenereFieldsBtn', clearVigenereFields);
    bind('clearAtbashFieldsBtn', clearAtbashFields);
    bind('clearBase64FieldsBtn', clearBase64Fields);
    bind('clearBaseAltFieldsBtn', clearBaseAltFields);
    bind('clearHashFieldsBtn', clearHashFields);
    bind('clearMorseFieldsBtn', clearMorseFields);
    bind('clearBookFieldsBtn', clearBookFields);
    bind('clearExtractionFieldsBtn', clearExtractionFields);
    bind('clearBaconFieldsBtn', clearBaconFields);
    bind('clearMusicFieldsBtn', clearMusicFields);
});
// ── Vigenère Key Solver ──────────────────────────────────────────────

function guessVigenereKeyLength() {
    const input = document.querySelector('.vigenere-input').value.replace(/[^A-Z]/gi, "").toUpperCase();
    const output = document.getElementById('vigenereGuessOutput');

    if (!input) {
        output.textContent = "Please enter some ciphertext first.";
        return;
    }

    if (input.length < 20) {
        output.textContent = "Text too short for reliable analysis (min 20 chars).";
        return;
    }

    const iocs = [];
    // Check key lengths from 2 to 20
    for (let len = 2; len <= 20; len++) {
        let sumIoC = 0;
        for (let i = 0; i < len; i++) {
            let subtext = "";
            for (let j = i; j < input.length; j += len) {
                subtext += input[j];
            }
            sumIoC += calculateIoC(subtext);
        }
        iocs.push({ length: len, ioc: sumIoC / len });
    }

    // Sort by proximity to English IoC (approx 0.0667)
    iocs.sort((a, b) => Math.abs(a.ioc - 0.0667) - Math.abs(b.ioc - 0.0667));

    const top = iocs.slice(0, 3);
    output.innerHTML = "Likely key lengths: " + top.map(t => `<strong>${t.length}</strong> (IoC: ${t.ioc.toFixed(4)})`).join(", ");
}

function calculateIoC(text) {
    if (text.length <= 1) return 0;
    const counts = {};
    for (let char of text) {
        counts[char] = (counts[char] || 0) + 1;
    }
    let sum = 0;
    for (let char in counts) {
        sum += counts[char] * (counts[char] - 1);
    }
    return sum / (text.length * (text.length - 1));
}
// ── Literary & Thematic Ciphers ──────────────────────────────────────

function processBookCipher(isEncrypt) {
    const input = document.querySelector('.book-input').value.toUpperCase();
    const key = document.querySelector('.book-key').value.replace(/[^A-Z]/gi, "").toUpperCase();
    const output = document.querySelector('.book-output');

    if (!input || !key) {
        output.textContent = "Error: Both message and key text are required.";
        return;
    }

    let result = "";
    let keyIndex = 0;

    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            const shift = key.charCodeAt(keyIndex % key.length) - 65;
            let newCode;
            if (isEncrypt) {
                newCode = ((charCode - 65 + shift) % 26) + 65;
            } else {
                newCode = ((charCode - 65 - shift + 26) % 26) + 65;
            }
            result += String.fromCharCode(newCode);
            keyIndex++;
        } else {
            result += input[i];
        }
    }
    output.textContent = result;
}

function processExtraction() {
    const text = document.querySelector('.extraction-input').value;
    const type = document.querySelector('.extraction-type').value;
    const output = document.querySelector('.extraction-output');

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    let result = "";

    if (type === 'acrostic') {
        result = lines.map(l => l.trim()[0]).join('');
    } else if (type === 'telestich') {
        result = lines.map(l => { const s = l.trim(); return s[s.length - 1]; }).join('');
    } else if (type === 'mesostic') {
        result = lines.map(l => { const s = l.trim(); return s[Math.floor(s.length / 2)]; }).join('');
    }

    output.textContent = result || "No lines to process.";
}

const BACON_MAP = {
    'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA', 'F': 'AABAB', 'G': 'AABBA', 'H': 'AABBB',
    'I': 'ABAAA', 'J': 'ABAAA', 'K': 'ABAAB', 'L': 'ABABA', 'M': 'ABABB', 'N': 'ABBAA', 'O': 'ABBAB', 'P': 'ABBBA',
    'Q': 'ABBBB', 'R': 'BAAAA', 'S': 'BAAAB', 'T': 'BAABA', 'U': 'BAABB', 'V': 'BAABB', 'W': 'BABAA', 'X': 'BABAB',
    'Y': 'BABBA', 'Z': 'BABBB'
};

function processBacon(isEncrypt) {
    const input = document.querySelector('.bacon-input').value.toUpperCase();
    const output = document.querySelector('.bacon-output');

    if (isEncrypt) {
        output.textContent = input.split('').map(c => BACON_MAP[c] || c).join(' ');
    } else {
        const words = input.replace(/\s+/g, '').match(/.{5}/g) || [];
        const reverseMap = Object.fromEntries(Object.entries(BACON_MAP).map(([k, v]) => [v, k]));
        output.textContent = words.map(w => reverseMap[w] || '?').join('');
    }
}

const MUSIC_MAP = {
    'A': 'C4', 'B': 'D4', 'C': 'E4', 'D': 'F4', 'E': 'G4', 'F': 'A4', 'G': 'B4',
    'H': 'C5', 'I': 'D5', 'J': 'E5', 'K': 'F5', 'L': 'G5', 'M': 'A5', 'N': 'B5',
    'O': 'C6', 'P': 'D6', 'Q': 'E6', 'R': 'F6', 'S': 'G6', 'T': 'A6', 'U': 'B6',
    'V': 'C7', 'W': 'D7', 'X': 'E7', 'Y': 'F7', 'Z': 'G7'
};

function processMusic(isEncrypt) {
    const input = document.querySelector('.music-input').value.toUpperCase();
    const output = document.querySelector('.music-output');

    if (isEncrypt) {
        output.textContent = input.split('').map(c => MUSIC_MAP[c] || c).join(' ');
    } else {
        const reverseMap = Object.fromEntries(Object.entries(MUSIC_MAP).map(([k, v]) => [v, k]));
        output.textContent = input.split(' ').map(n => reverseMap[n] || n).join('');
    }
}

// ── Bind Clear Buttons for new sections ──
function clearBookFields() {
    document.querySelector('.book-input').value = '';
    document.querySelector('.book-key').value = '';
    document.querySelector('.book-output').textContent = '';
}
function clearExtractionFields() {
    document.querySelector('.extraction-input').value = '';
    document.querySelector('.extraction-output').textContent = '';
}
function clearBaconFields() {
    document.querySelector('.bacon-input').value = '';
    document.querySelector('.bacon-output').textContent = '';
}
function clearMusicFields() {
    document.querySelector('.music-input').value = '';
    document.querySelector('.music-output').textContent = '';
}

// ── Shared Copy & Swap Utilities ─────────────────────────────────────

function copyToClipboard(outputSelector) {
    const el = document.querySelector(outputSelector);
    if (!el) return;
    const text = el.textContent || el.value || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const btns = document.querySelectorAll(`button[onclick*="${outputSelector}"]`);
        btns.forEach(btn => {
            if (btn.textContent.includes('Copy')) {
                const original = btn.textContent;
                btn.textContent = '✔ Copied!';
                setTimeout(() => { btn.textContent = original; }, 1500);
            }
        });
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

function swapFields(inputSelector, outputSelector) {
    const inputEl = document.querySelector(inputSelector);
    const outputEl = document.querySelector(outputSelector);
    if (!inputEl || !outputEl) return;
    const outputText = outputEl.textContent || outputEl.value || '';
    if (!outputText) return;
    inputEl.value = outputText;
    outputEl.textContent = '';
}
