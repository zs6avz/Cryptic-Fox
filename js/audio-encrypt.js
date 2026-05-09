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
// --- AES Audio Encryption Logic ---
function encryptAESAudio() {
    const fileInput = document.querySelector('.aes-audio-input');
    const keyInput = document.querySelector('.aes-audio-key');
    const outputField = document.querySelector('.aes-encrypted-output');

    if (!fileInput.files[0] || !keyInput.value) {
        alert("Please select an audio file and enter an encryption key.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
            const encrypted = CryptoJS.AES.encrypt(wordArray, keyInput.value).toString();
            outputField.value = encrypted;
            alert("Audio encrypted successfully with AES!");
        } catch (err) {
            console.error(err);
            alert("Encryption failed.");
        }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

function decryptAESAudio() {
    const encryptedInput = document.querySelector('.aes-audio-input-decrypt');
    const keyInput = document.querySelector('.aes-audio-key-decrypt');
    const audioPlayer = document.getElementById('aes-audio-output');
    const downloadLink = document.getElementById('aes-audio-download-link');

    if (!encryptedInput.value || !keyInput.value) {
        alert("Please enter encrypted data and the decryption key.");
        return;
    }

    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedInput.value, keyInput.value);
        
        // Convert CryptoJS WordArray to Uint8Array
        const typedArray = new Uint8Array(decrypted.sigBytes);
        for (let i = 0; i < decrypted.sigBytes; i++) {
            typedArray[i] = (decrypted.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }

        const blob = new Blob([typedArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        audioPlayer.src = url;
        downloadLink.href = url;
        downloadLink.download = "decrypted_audio.mp3";
        downloadLink.style.display = "inline-block";
        alert("Audio decrypted successfully!");
    } catch (e) {
        console.error(e);
        alert("Decryption failed. Please check your key.");
    }
}

// Workflow Helpers for Audio
function copyAudioOutput() {
    const output = document.querySelector('.aes-encrypted-output');
    if (!output.value) return alert("Nothing to copy!");
    output.select();
    navigator.clipboard.writeText(output.value);
    alert("AES output copied!");
}

function swapAudioFields() {
    const output = document.querySelector('.aes-encrypted-output').value;
    const input = document.querySelector('.aes-audio-input-decrypt');
    const keyEncrypt = document.querySelector('.aes-audio-key').value;
    const keyDecrypt = document.querySelector('.aes-audio-key-decrypt');
    if (output) {
        input.value = output;
        keyDecrypt.value = keyEncrypt;
        alert("Moved encrypted data and key to decryption section.");
    }
}

function clearAudioFields() {
    document.querySelector('.aes-audio-input').value = "";
    document.querySelector('.aes-audio-key').value = "";
    document.querySelector('.aes-encrypted-output').value = "";
    document.querySelector('.aes-audio-input-decrypt').value = "";
    document.querySelector('.aes-audio-key-decrypt').value = "";
    const audio = document.getElementById('aes-audio-output');
    if (audio) audio.src = "";
    const download = document.getElementById('aes-audio-download-link');
    if (download) download.style.display = "none";
}
