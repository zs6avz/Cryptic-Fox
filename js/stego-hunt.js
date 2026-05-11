// stego-hunt.js

const CHALLENGES = [
    {
        image: "../images/new-fox-logo.PNG",
        flag: "FLAG{LSB_VOICE}",
        hint: "Try looking at the Least Significant Bit (LSB) of the Blue channel.",
        channel: 2, // Blue
        bit: 0      // LSB
    },
    {
        image: "../images/Ada_Lovelace_portrait.jpg",
        flag: "FLAG{COUNTESS}",
        hint: "Check the Green channel, Bit 1.",
        channel: 1, // Green
        bit: 1
    }
];

let currentChallengeIndex = 0;
let baseImage = new Image();
let originalData = null;
let stegoCanvas = document.getElementById("stegoCanvas");
let ctx = stegoCanvas.getContext("2d");

function initChallenge() {
    const challenge = CHALLENGES[currentChallengeIndex];
    baseImage.src = challenge.image;
    baseImage.onload = () => {
        stegoCanvas.width = baseImage.width;
        stegoCanvas.height = baseImage.height;
        ctx.drawImage(baseImage, 0, 0);

        // 1. Get image data and inject flag
        const imageData = ctx.getImageData(0, 0, stegoCanvas.width, stegoCanvas.height);
        injectFlag(imageData, challenge.flag, challenge.channel, challenge.bit);

        // 2. Store the stego data as the new "original"
        originalData = imageData;
        processImage();
    };

    // Fallback if image fails (CORS or missing)
    baseImage.onerror = () => {
        console.warn("Could not load image, generating pattern.");
        generateNoisePattern();
    };
}

function generateNoisePattern() {
    stegoCanvas.width = 600;
    stegoCanvas.height = 400;
    const imageData = ctx.createImageData(600, 400);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.random() * 50 + 20;     // R
        data[i + 1] = Math.random() * 50 + 20;   // G
        data[i + 2] = Math.random() * 50 + 20;   // B
        data[i + 3] = 255;                       // A
    }
    const challenge = CHALLENGES[currentChallengeIndex];
    injectFlag(imageData, challenge.flag, challenge.channel, challenge.bit);
    originalData = imageData;
    processImage();
}

function injectFlag(imageData, flag, targetChannel, targetBit) {
    const data = imageData.data;
    const binaryFlag = stringToBinary(flag + "###"); // Terminator

    for (let i = 0; i < binaryFlag.length; i++) {
        const pixelIndex = i * 4;
        const channelIndex = pixelIndex + targetChannel;

        if (channelIndex < data.length) {
            // Set the specific bit
            const bit = parseInt(binaryFlag[i]);
            if (bit === 1) {
                data[channelIndex] |= (1 << targetBit);
            } else {
                data[channelIndex] &= ~(1 << targetBit);
            }
        }
    }
}

function stringToBinary(str) {
    return str.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
}

function processImage() {
    if (!originalData) return;

    const mode = document.getElementById("analysisMode").value;
    const channel = parseInt(document.getElementById("colorChannel").value);
    const layer = parseInt(document.getElementById("bitLayer").value);
    const boost = parseInt(document.getElementById("brightness").value);

    document.getElementById("bitplaneControls").style.display = (mode === "bitplane") ? "block" : "none";

    const displayData = new ImageData(new Uint8ClampedArray(originalData.data), originalData.width, originalData.height);
    const d = displayData.data;

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const channels = [r, g, b];
        const val = channels[channel];

        if (mode === "normal") {
            // Do nothing, just keep original
        } else if (mode === "bitplane") {
            const bit = (val >> layer) & 1;
            const pixelVal = bit ? 255 : 0;
            d[i] = d[i + 1] = d[i + 2] = pixelVal;
        } else if (mode === "xor") {
            // Simple high-pass/noise filter simulation
            const noise = (Math.random() - 0.5) * 50;
            d[i] = d[i + 1] = d[i + 2] = (val + noise) * boost;
        } else if (mode === "entropy") {
            // Visualizing differences in LSB
            const lsb = val & 1;
            d[i] = lsb ? 255 : 0;
            d[i + 1] = (val & 2) ? 255 : 0;
            d[i + 2] = (val & 4) ? 255 : 0;
        }
    }

    ctx.putImageData(displayData, 0, 0);
}

function checkFlag() {
    const input = document.getElementById("flagInput").value.trim().toUpperCase();
    const challenge = CHALLENGES[currentChallengeIndex];

    if (input === challenge.flag) {
        document.getElementById("successOverlay").style.display = "flex";
    } else {
        alert("Incorrect flag. Keep analyzing!");
    }
}

function showHint() {
    const challenge = CHALLENGES[currentChallengeIndex];
    const hintBox = document.getElementById("hintBox");
    hintBox.textContent = challenge.hint;
    hintBox.style.display = "block";
}

document.addEventListener("DOMContentLoaded", initChallenge);
