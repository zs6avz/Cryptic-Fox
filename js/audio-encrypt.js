/* AES Decryption Function */
function decryptAES(encryptedData, key) {
    let decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// AES Audio Encryption
function encryptAESAudio() {
    const fileInput = document.querySelector('.aes-audio-input').files[0];
    const key = document.querySelector('.aes-audio-key').value;

    if (!fileInput || !key) {
        alert('Please select an audio file and provide an AES key.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = CryptoJS.AES.encrypt(event.target.result, key).toString();
        const outputField = document.querySelector('.aes-encrypted-output');
        outputField.value = encryptedData; // Display encrypted audio data
    };
    reader.readAsDataURL(fileInput); // Read audio file as data URL
}

function decryptAESAudio() {
    const encryptedData = document.querySelector('.aes-audio-input-decrypt').value;
    const key = document.querySelector('.aes-audio-key-decrypt').value;

    if (!encryptedData || !key) {
        alert('Please provide the AES encrypted data and key.');
        return;
    }

    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
    const audioElement = document.getElementById('aes-audio-output');
    audioElement.src = decryptedData; // Set decrypted data as audio source

    const downloadLink = document.getElementById('aes-audio-download-link');
    downloadLink.href = decryptedData; // Allow downloading decrypted audio
    downloadLink.style.display = 'inline-block'; // Make link visible
}

function encryptRSAAudio() {
    alert('RSA audio encryption is not yet implemented. A browser-compatible RSA library (e.g. Web Crypto API) is needed for this feature.');
}

function decryptRSAAudio() {
    alert('RSA audio decryption is not yet implemented. A browser-compatible RSA library (e.g. Web Crypto API) is needed for this feature.');
}
