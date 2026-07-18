// --- RSA Audio Encryption (Web Crypto API) ---

// Utility: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Utility: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Utility: PEM formatting for keys
async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const body = arrayBufferToBase64(exported);
    return `-----BEGIN PUBLIC KEY-----\n${body.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
}

async function exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    const body = arrayBufferToBase64(exported);
    return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
}

// Global variable to hold session keys (optional, but good for UX)
let currentKeyPair = null;

async function generateRSAKeyPair() {
    try {
        currentKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const pubPEM = await exportPublicKey(currentKeyPair.publicKey);
        const privPEM = await exportPrivateKey(currentKeyPair.privateKey);

        document.getElementById('rsa-public-key-display').value = pubPEM;
        document.getElementById('rsa-private-key-display').value = privPEM;
        
        alert("RSA Key Pair Generated Successfully!");
    } catch (e) {
        console.error(e);
        alert("Error generating keys: " + e.message);
    }
}

async function encryptRSAAudio() {
    const fileInput = document.getElementById('rsa-audio-input').files[0];
    const pubKeyPEM = document.getElementById('rsa-recipient-public-key').value;

    if (!fileInput || !pubKeyPEM) {
        alert("Please select a file and provide the recipient's public key.");
        return;
    }

    try {
        // 1. Import Public Key
        const pemHeader = "-----BEGIN PUBLIC KEY-----";
        const pemFooter = "-----END PUBLIC KEY-----";
        const pemContents = pubKeyPEM.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
        const binaryDer = base64ToArrayBuffer(pemContents);
        
        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );

        // 2. Generate random AES key (GCM)
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // 3. Encrypt audio data with AES
        const audioBuffer = await fileInput.arrayBuffer();
        const encryptedAudio = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            audioBuffer
        );

        // 4. Encrypt AES key with RSA
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );

        // 5. Package: [Encrypted AES Key Length (2 bytes)] + [Encrypted AES Key] + [IV (12 bytes)] + [Encrypted Audio]
        const packageBuffer = new Uint8Array(2 + encryptedAesKey.byteLength + 12 + encryptedAudio.byteLength);
        const view = new DataView(packageBuffer.buffer);
        view.setUint16(0, encryptedAesKey.byteLength);
        
        packageBuffer.set(new Uint8Array(encryptedAesKey), 2);
        packageBuffer.set(iv, 2 + encryptedAesKey.byteLength);
        packageBuffer.set(new Uint8Array(encryptedAudio), 2 + encryptedAesKey.byteLength + 12);

        document.getElementById('rsa-encrypted-output').value = arrayBufferToBase64(packageBuffer);
        alert("Audio encrypted successfully with RSA!");

    } catch (e) {
        console.error(e);
        alert("Encryption failed: " + e.message);
    }
}

async function decryptRSAAudio() {
    const encryptedBase64 = document.getElementById('rsa-audio-input-decrypt').value;
    const privKeyPEM = document.getElementById('rsa-my-private-key').value;

    if (!encryptedBase64 || !privKeyPEM) {
        alert("Please provide encrypted data and your private key.");
        return;
    }

    const status = document.getElementById('rsa-decrypt-status');
    status.textContent = "Decrypting...";

    try {
        // 1. Import Private Key
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = privKeyPEM.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
        const binaryDer = base64ToArrayBuffer(pemContents);
        
        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );

        // 2. Parse Package
        const packageBuffer = base64ToArrayBuffer(encryptedBase64);
        const view = new DataView(packageBuffer);
        const aesKeyLen = view.getUint16(0);
        
        const encryptedAesKey = packageBuffer.slice(2, 2 + aesKeyLen);
        const iv = packageBuffer.slice(2 + aesKeyLen, 2 + aesKeyLen + 12);
        const encryptedAudio = packageBuffer.slice(2 + aesKeyLen + 12);

        // 3. Decrypt AES Key with RSA
        const decryptedAesKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAesKey
        );
        
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKeyBuffer,
            "AES-GCM",
            false,
            ["decrypt"]
        );

        // 4. Decrypt Audio with AES
        const decryptedAudio = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            aesKey,
            encryptedAudio
        );

        // 5. Output
        const blob = new Blob([decryptedAudio], { type: 'audio/mpeg' }); // Fallback to mpeg, original type not stored
        const url = URL.createObjectURL(blob);
        
        const audioElement = document.getElementById('rsa-audio-output');
        audioElement.src = url;
        
        const downloadLink = document.getElementById('rsa-audio-download-link');
        downloadLink.href = url;
        downloadLink.download = "decrypted_audio.mp3";
        downloadLink.style.display = 'inline-block';
        
        status.textContent = "Decryption successful!";
    } catch (e) {
        console.error(e);
        status.textContent = "Decryption failed: " + e.message;
    }
}

// Global Helper for Copy
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value).then(() => {
        alert("Copied to clipboard!");
    });
}
// --- AES-256-GCM Audio Encryption (Web Crypto API with PBKDF2) ---

async function aesAudioDeriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptAESAudio() {
    const fileInput   = document.querySelector('.aes-audio-input');
    const keyInput    = document.querySelector('.aes-audio-key');
    const outputField = document.querySelector('.aes-encrypted-output');

    if (!fileInput?.files[0] || !keyInput?.value) {
        alert("Please select an audio file and enter an encryption key.");
        return;
    }

    try {
        const salt      = crypto.getRandomValues(new Uint8Array(16));
        const iv        = crypto.getRandomValues(new Uint8Array(12));
        const key       = await aesAudioDeriveKey(keyInput.value, salt);
        const plaintext = await fileInput.files[0].arrayBuffer();
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

        // Package: [salt 16B][iv 12B][ciphertext]
        const pkg = new Uint8Array(16 + 12 + ciphertext.byteLength);
        pkg.set(salt, 0);
        pkg.set(iv, 16);
        pkg.set(new Uint8Array(ciphertext), 28);

        outputField.value = arrayBufferToBase64(pkg.buffer);
        alert("Audio encrypted successfully with AES-256-GCM!");
    } catch (err) {
        console.error(err);
        alert("Encryption failed: " + err.message);
    }
}

async function decryptAESAudio() {
    const encryptedInput = document.querySelector('.aes-audio-input-decrypt');
    const keyInput       = document.querySelector('.aes-audio-key-decrypt');
    const audioPlayer    = document.getElementById('aes-audio-output');
    const downloadLink   = document.getElementById('aes-audio-download-link');

    if (!encryptedInput?.value || !keyInput?.value) {
        alert("Please enter encrypted data and the decryption key.");
        return;
    }

    try {
        const pkg    = new Uint8Array(base64ToArrayBuffer(encryptedInput.value));
        const salt   = pkg.slice(0, 16);
        const iv     = pkg.slice(16, 28);
        const cipher = pkg.slice(28);

        const key   = await aesAudioDeriveKey(keyInput.value, salt);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);

        const blob = new Blob([plain], { type: 'audio/mpeg' });
        const url  = URL.createObjectURL(blob);
        if (audioPlayer)  audioPlayer.src = url;
        if (downloadLink) { downloadLink.href = url; downloadLink.download = "decrypted_audio.mp3"; downloadLink.style.display = "inline-block"; }
        alert("Audio decrypted successfully!");
    } catch (e) {
        console.error(e);
        alert("Decryption failed — wrong key or corrupted data.");
    }
}

// Workflow Helpers for Audio
function copyAudioOutput() {
    const output = document.querySelector('.aes-encrypted-output');
    if (!output?.value) return;
    navigator.clipboard.writeText(output.value).then(() => {
        const btn = document.getElementById('copyAudioBtn');
        if (btn) { const orig = btn.textContent; btn.textContent = '✔ Copied!'; setTimeout(() => { btn.textContent = orig; }, 1500); }
    });
}

function swapAudioFields() {
    const output     = document.querySelector('.aes-encrypted-output');
    const input      = document.querySelector('.aes-audio-input-decrypt');
    const keyEncrypt = document.querySelector('.aes-audio-key');
    const keyDecrypt = document.querySelector('.aes-audio-key-decrypt');
    if (output?.value && input) {
        input.value = output.value;
        if (keyDecrypt && keyEncrypt) keyDecrypt.value = keyEncrypt.value;
    }
}

function clearAudioFields() {
    ['.aes-audio-input', '.aes-audio-key', '.aes-encrypted-output',
     '.aes-audio-input-decrypt', '.aes-audio-key-decrypt'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.value = '';
    });
    const audio    = document.getElementById('aes-audio-output');
    const download = document.getElementById('aes-audio-download-link');
    if (audio)    audio.src = '';
    if (download) download.style.display = 'none';
}

// ── Event listeners (replaces all onclick= in audio-encrypt.html) ────

document.addEventListener('DOMContentLoaded', () => {
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    b('aesEncryptBtn',    encryptAESAudio);
    b('aesDecryptBtn',    decryptAESAudio);
    b('copyAudioBtn',     copyAudioOutput);
    b('swapAudioBtn',     swapAudioFields);
    b('clearAudioBtn',    clearAudioFields);
    b('generateRSABtn',   generateRSAKeyPair);
    b('copyPublicKeyBtn', () => copyToClipboard('rsa-public-key-display'));
    b('copyPrivKeyBtn',   () => copyToClipboard('rsa-private-key-display'));
    b('rsaEncryptBtn',    encryptRSAAudio);
    b('copyRSAOutputBtn', () => copyToClipboard('rsa-encrypted-output'));
    b('rsaDecryptBtn',    decryptRSAAudio);
});
