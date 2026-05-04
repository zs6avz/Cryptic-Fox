// Function to encrypt an image to Base64
function encryptBase64Image() {
    const fileInput = document.querySelector('.base64-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file to encrypt.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const encryptedData = btoa(event.target.result); // Encode file data to Base64
        const outputField = document.querySelector('.base64-encrypted-output');
        outputField.value = encryptedData; // Display encrypted Base64 data
    };

    // Use readAsDataURL to get Base64-compatible data
    reader.readAsBinaryString(file);
}

// Function to decrypt a Base64 string to an image
function decryptBase64Image() {
    const base64Input = document.querySelector('.base64-encrypted-output').value; // Get Base64 input

    if (!base64Input) {
        alert('Please enter Base64 encrypted image data.');
        return;
    }

    const outputImg = document.getElementById('base64-image-output');
    const downloadLink = document.getElementById('base64-download-link');

    // Set image source using Base64
    outputImg.src = `data:image/png;base64,${base64Input}`;
    outputImg.style.display = 'block'; // Ensure the image is visible

    // Set download link
    downloadLink.href = outputImg.src;
    downloadLink.download = 'decrypted-image.png'; // Suggest a filename for the download
    downloadLink.style.display = 'inline-block'; // Make the link visible
}

/* Canvas-Based Image Encryption & Decryption
function encryptCanvasImage() {
    const fileInput = document.querySelector('.canvas-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file to encrypt.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        // Simulating encryption by encoding the image to Base64
        const encryptedData = btoa(event.target.result);
        const outputField = document.querySelector('.canvas-encrypted-output');
        outputField.value = encryptedData; // Display encrypted image data
    };

    reader.readAsBinaryString(file);
}

function decryptCanvasImage() {
    const fileInput = document.querySelector('.canvas-image-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
            const canvas = document.getElementById('canvas-image-output');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const downloadLink = document.getElementById('canvas-download-link');
            downloadLink.href = canvas.toDataURL('image/png'); // Canvas to Base64
            downloadLink.style.display = 'inline-block'; // Make link visible
        };
    };

    reader.readAsDataURL(file);
}*/
