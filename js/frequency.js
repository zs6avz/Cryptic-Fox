// frequency.js

const MESSAGES = [
    "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. CRYPTOGRAPHY IS THE ART OF SECRET WRITING. PROTECT YOUR DATA AT ALL COSTS.",
    "INFORMATION IS THE MOST VALUABLE CURRENCY IN THE DIGITAL AGE. ENCRYPTION IS THE ONLY DEFENSE AGAINST SURVEILLANCE.",
    "LOGIC IS THE BEGINNING OF WISDOM, NOT THE END. SOLVE THE PUZZLE TO FIND THE HIDDEN TRUTH WITHIN THE CODE.",
    "A FOX IN THE WILD IS A MASTER OF DISGUISE. SIMILARLY, A WELL ENCRYPTED MESSAGE HIDES IN PLAIN SIGHT.",
    "NOTHING IS AS IT SEEMS. THE TRUTH IS OFTEN HIDDEN BENEATH LAYERS OF OBSCURITY AND COMPLEX SYMBOLS.",
    "THE END PROJECT IS CONTEMPLATING THE NATURE OF REALITY AND COMPUTATION THROUGH THE LENS OF LOGIC."
];

const ENGLISH_FREQ = {
    'A': 8.17, 'B': 1.49, 'C': 2.78, 'D': 4.25, 'E': 12.70, 'F': 2.23, 'G': 2.02, 'H': 6.09, 'I': 6.97,
    'J': 0.15, 'K': 0.77, 'L': 4.03, 'M': 2.41, 'N': 6.75, 'O': 7.51, 'P': 1.93, 'Q': 0.10, 'R': 5.99,
    'S': 6.33, 'T': 9.06, 'U': 2.76, 'V': 0.98, 'W': 2.36, 'X': 0.15, 'Y': 1.97, 'Z': 0.07
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let currentMessage = "";
let ciphertext = "";
let currentMap = {}; // CipherChar -> UserInput
let solutionMap = {}; // CipherChar -> RealChar
let chart = null;

function initGame() {
    // 1. Pick a random message
    currentMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)].toUpperCase();

    // 2. Generate a random substitution cipher
    let shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    let cipherMap = {}; // Real -> Cipher
    alphabet.forEach((char, i) => {
        cipherMap[char] = shuffled[i];
        solutionMap[shuffled[i]] = char;
        currentMap[shuffled[i]] = ""; // Initialize map
    });

    // 3. Encrypt the message
    ciphertext = currentMessage.split("").map(char => {
        return cipherMap[char] || char; // Encrypt if in alphabet, else keep (spaces, dots, etc)
    }).join("");

    document.getElementById("ciphertext").textContent = ciphertext;

    // 4. Populate mapping grid
    const grid = document.getElementById("mappingGrid");
    grid.innerHTML = "";

    // Sort ciphertext chars by frequency to make it more useful? 
    // Or just alphabetically by ciphertext char.
    const presentChars = [...new Set(ciphertext.split(""))].filter(c => alphabet.includes(c)).sort();

    presentChars.forEach(char => {
        const card = document.createElement("div");
        card.className = "map-card";
        card.innerHTML = `
            <label>${char}</label>
            <input type="text" maxlength="1" data-char="${char}" oninput="handleMapInput(this)">
        `;
        grid.appendChild(card);
    });

    updateResolvedText();
    initChart(presentChars);
}

function handleMapInput(input) {
    const cipherChar = input.getAttribute("data-char");
    const val = input.value.toUpperCase();
    input.value = val;
    currentMap[cipherChar] = val;
    updateResolvedText();
    checkWinCondition();
}

function updateResolvedText() {
    const resolved = ciphertext.split("").map(char => {
        if (!alphabet.includes(char)) return char;
        const userChar = currentMap[char];
        return userChar ? userChar : "_";
    }).join("");

    document.getElementById("resolvedText").textContent = resolved;
}

function checkWinCondition() {
    const resolved = document.getElementById("resolvedText").textContent;
    if (resolved === currentMessage) {
        document.getElementById("successMsg").style.display = "block";
        document.querySelectorAll(".map-card input").forEach(input => input.disabled = true);
    }
}

function initChart(presentChars) {
    const ctx = document.getElementById('freqChart').getContext('2d');

    // Calculate ciphertext frequencies
    const counts = {};
    let totalAlpha = 0;
    ciphertext.split("").forEach(char => {
        if (alphabet.includes(char)) {
            counts[char] = (counts[char] || 0) + 1;
            totalAlpha++;
        }
    });

    const cipherFreqs = presentChars.map(char => {
        return ((counts[char] || 0) / totalAlpha * 100).toFixed(2);
    });

    // We don't know which English letter maps to which ciphertext letter yet for the "Target" label, 
    // so we just show the English distribution sorted by frequency next to the Ciphertext distribution sorted?
    // No, standard practice is to show English reference.

    const englishRef = presentChars.map(char => {
        // This is tricky. We'll just show the English values for the solution if we want to help, 
        // OR just show the list of English frequencies in general.
        // Let's show English freq for the letter the user MIGHT THINK it is?
        return ENGLISH_FREQ[char] || 0;
    });

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: presentChars,
            datasets: [
                {
                    label: 'Ciphertext Frequency (%)',
                    data: cipherFreqs,
                    backgroundColor: 'rgba(235, 63, 123, 0.6)',
                    borderColor: 'rgba(235, 63, 123, 1)',
                    borderWidth: 1
                },
                {
                    label: 'English Standard (%)',
                    data: alphabet.map(c => ENGLISH_FREQ[c]).sort((a, b) => b - a), // Sorted for reference? 
                    // No, let's just use the Alphabet order for the second set to let them compare shapes if they want
                    // but it's better to show them side-by-side.
                    // Actually, a separate "Reference" dataset is better.
                    data: presentChars.map(() => 0), // Placeholder
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });

    // Add a second chart or dataset for reference
    addEnglishReference(chart);
}

function addEnglishReference(chart) {
    // Show top English letters for comparison
    const sortedEnglish = Object.entries(ENGLISH_FREQ).sort((a, b) => b[1] - a[1]);
    const labels = sortedEnglish.map(e => e[0]);
    const data = sortedEnglish.map(e => e[1]);

    // Let's just create a static reference chart below or as a separate dataset on a different axis?
    // User wants "similar to English"
    // I'll add a section in the UI for English frequency reference instead of a cluttered chart.
}

document.addEventListener("DOMContentLoaded", initGame);
