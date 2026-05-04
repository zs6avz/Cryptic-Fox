// cryptograms.js

const PUZZLES = [
    {
        name: "Level 1: The Forest of Codes",
        plaintext: "THE FOX RUNS THROUGH THE FOREST OF CODES. ONLY THE WISE CAN SEE THE PATH.",
        mapping: {
            'A': 'Q', 'B': 'W', 'C': 'E', 'D': 'R', 'E': 'T', 'F': 'Y', 'G': 'U', 'H': 'I', 'I': 'O',
            'J': 'P', 'K': 'A', 'L': 'S', 'M': 'D', 'N': 'F', 'O': 'G', 'P': 'H', 'Q': 'J', 'R': 'K',
            'S': 'L', 'T': 'Z', 'U': 'X', 'V': 'C', 'W': 'V', 'X': 'B', 'Y': 'N', 'Z': 'M'
        },
        hint: "Start with common three-letter words like 'THE'."
    },
    {
        name: "Level 2: The Midnight Glow",
        plaintext: "BENEATH THE SILVER MOON THE FOX HUNTS IN THE SHADOWS. COLD IS THE NIGHT BUT WARM IS THE GLOW OF DISCOVERY.",
        mapping: {
            'A': 'M', 'B': 'N', 'C': 'B', 'D': 'V', 'E': 'C', 'F': 'X', 'G': 'Z', 'H': 'L', 'I': 'K',
            'J': 'P', 'K': 'H', 'L': 'G', 'M': 'F', 'N': 'D', 'O': 'S', 'P': 'A', 'Q': 'X', 'R': 'O',
            'S': 'I', 'T': 'U', 'U': 'Y', 'V': 'T', 'W': 'R', 'X': 'E', 'Y': 'W', 'Z': 'Q'
        },
        hint: "Frequent characters like 'E' often map to the most common letters in the ciphertext."
    }
];

let currentLevel = 0;
let userMapping = {}; // CipherChar -> UserInput
let ciphertext = "";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function initPuzzle(levelIndex) {
    currentLevel = levelIndex;
    const puzzle = PUZZLES[levelIndex];
    userMapping = {};

    // Generate ciphertext based on fixed mapping
    ciphertext = puzzle.plaintext.toUpperCase().split("").map(char => {
        if (alphabet.includes(char)) {
            return puzzle.mapping[char] || char;
        }
        return char;
    }).join("");

    // Initialize user mapping for all present cipher characters
    const cipherChars = [...new Set(ciphertext.split(""))].filter(c => alphabet.includes(c));
    cipherChars.forEach(c => userMapping[c] = "");

    // Update UI
    document.getElementById("levelName").textContent = puzzle.name;
    document.getElementById("ciphertext").textContent = ciphertext;
    
    renderMappingGrid(cipherChars.sort());
    updateResolvedArea();
    renderLevelSelectors();
    
    document.getElementById("successOverlay").style.display = "none";
}

function renderMappingGrid(chars) {
    const grid = document.getElementById("mappingGrid");
    grid.innerHTML = "";

    chars.forEach(char => {
        const card = document.createElement("div");
        card.className = "map-card";
        card.innerHTML = `
            <label>${char}</label>
            <input type="text" maxlength="1" data-char="${char}" value="${userMapping[char]}" oninput="handleInput(this)">
        `;
        grid.appendChild(card);
    });
}

function handleInput(input) {
    const cipherChar = input.getAttribute("data-char");
    const val = input.value.toUpperCase();
    input.value = val;
    userMapping[cipherChar] = val;
    updateResolvedArea();
    checkWin();
}

function updateResolvedArea() {
    const area = document.getElementById("resolvedArea");
    area.innerHTML = "";

    // We want to render the resolved text character by character
    // and highlight which ones are filled.
    ciphertext.split("").forEach(char => {
        const span = document.createElement("span");
        if (alphabet.includes(char)) {
            const userChar = userMapping[char];
            span.className = "mapped-char" + (userChar ? " filled" : "");
            span.textContent = userChar || "_";
        } else {
            span.className = "literal-char";
            span.textContent = char;
            if (char === " ") span.style.minWidth = "20px";
        }
        area.appendChild(span);
    });
}

function checkWin() {
    const puzzle = PUZZLES[currentLevel];
    const resolved = ciphertext.split("").map(char => {
        if (alphabet.includes(char)) {
            return userMapping[char] || "_";
        }
        return char;
    }).join("");

    if (resolved === puzzle.plaintext.toUpperCase()) {
        showSuccess();
    }
}

function showSuccess() {
    const overlay = document.getElementById("successOverlay");
    const nextBtn = document.getElementById("nextBtn");
    
    overlay.style.display = "flex";
    
    if (currentLevel < PUZZLES.length - 1) {
        nextBtn.textContent = "Next Level";
        nextBtn.onclick = () => initPuzzle(currentLevel + 1);
    } else {
        nextBtn.textContent = "Back to Hub";
        nextBtn.onclick = () => window.location.href = "puzzles.html";
    }
}

function renderLevelSelectors() {
    const container = document.getElementById("puzzleStatus");
    container.innerHTML = "";

    PUZZLES.forEach((p, i) => {
        const btn = document.createElement("button");
        btn.textContent = `P ${i + 1}`;
        btn.className = (i === currentLevel) ? "primary-btn" : "";
        btn.style.padding = "5px 15px";
        btn.style.fontSize = "0.8rem";
        btn.onclick = () => initPuzzle(i);
        container.appendChild(btn);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initPuzzle(0);

    document.getElementById("hintBtn").addEventListener("click", () => {
        alert(PUZZLES[currentLevel].hint);
    });
});
