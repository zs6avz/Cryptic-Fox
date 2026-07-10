// lsb-worker.js

// Known magic numbers to look out for
const MAGIC_NUMBERS = [
    { name: 'PNG Image', hex: '89504E470d0a1a0a' },
    { name: 'JPEG Image', hex: 'ffd8ffe0' },
    { name: 'JPEG Image', hex: 'ffd8ffee' },
    { name: 'ZIP Archive (or Docx)', hex: '504b0304' },
    { name: 'PDF Document', hex: '25504446' },
    { name: 'RAR Archive', hex: '526172211a0700' },
    { name: 'MP3 Audio', hex: '494433' },
    { name: 'ELF Executable', hex: '7f454c46' },
    { name: 'GZIP Archive', hex: '1f8b' }
];

self.onmessage = function (e) {
    const { framesData, channel, selectedBits } = e.data;
    // framesData is an array of { timestamp, width, height, data }

    let totalPixels = 0;
    for (let f of framesData) {
        totalPixels += (f.data.length / 4);
    }

    let bitsPerPixel = selectedBits.length;
    if (channel === "all") bitsPerPixel *= 3;

    const totalBits = totalPixels * bitsPerPixel;
    const byteLength = Math.ceil(totalBits / 8);
    const binaryData = new Uint8Array(byteLength);

    let byteIndex = 0;
    let bitIndexInByte = 0;
    let currentByte = 0;
    let textOutput = "";
    let totalTextChars = 0;
    let maxTextChars = 50000; // Limit text to avoid DOM freeze

    const pushBit = (bit) => {
        if (bit) {
            currentByte |= (1 << (7 - bitIndexInByte));
        }
        bitIndexInByte++;
        if (bitIndexInByte === 8) {
            binaryData[byteIndex++] = currentByte;
            currentByte = 0;
            bitIndexInByte = 0;
        }
    };

    const getBitsFromValue = (val) => {
        let bits = [];
        for (let b of selectedBits) {
            bits.push((val >> b) & 1);
        }
        return bits;
    };

    for (let fi = 0; fi < framesData.length; fi++) {
        const f = framesData[fi];

        // Report progress every ~10% of frames so the UI can update
        if (fi % Math.max(1, Math.ceil(framesData.length / 10)) === 0) {
            self.postMessage({ type: 'progress', percent: Math.round((fi / framesData.length) * 100) });
        }

        let frameStr = `Frame @ ${f.timestamp}:\n`;
        textOutput += frameStr;
        totalTextChars += frameStr.length;

        let data = f.data;
        for (let i = 0; i < data.length; i += 4) {
            // process bits
            let bits = [];
            if (channel === "all" || channel === "red") bits.push(...getBitsFromValue(data[i]));
            if (channel === "all" || channel === "green") bits.push(...getBitsFromValue(data[i + 1]));
            if (channel === "all" || channel === "blue") bits.push(...getBitsFromValue(data[i + 2]));

            for (let b of bits) {
                pushBit(b);
                if (totalTextChars < maxTextChars) {
                    textOutput += b;
                    totalTextChars++;
                }
            }
            if (totalTextChars < maxTextChars && ((i / 4 + 1) % f.width) === 0) {
                textOutput += "\n";
                totalTextChars++;
            }
        }
        textOutput += "\n";
    }

    // Push remaining partial byte if any
    if (bitIndexInByte > 0) {
        binaryData[byteIndex] = currentByte;
    }

    if (totalTextChars >= maxTextChars) {
        textOutput += "\n... [TRUNCATED FOR BROWSER PERFORMANCE]\nDownload Binary to view complete data.";
    }

    // Magic number detection
    let detectedSignatures = [];
    // Convert first few dozen bytes to hex for checking
    let hexHeader = "";
    for (let i = 0; i < Math.min(binaryData.length, 64); i++) {
        hexHeader += binaryData[i].toString(16).padStart(2, '0');
    }

    for (let sig of MAGIC_NUMBERS) {
        if (hexHeader.includes(sig.hex)) {
            detectedSignatures.push(sig.name);
        }
    }

    self.postMessage({
        type: 'done',
        textOutput: textOutput,
        binaryData: binaryData,
        signatures: detectedSignatures
    }, [binaryData.buffer]);
};
