// gauntlet.js

const ROUNDS = [
    {
        name: "Atbash",
        clue: "The mirror of the alphabet. A=Z, B=Y...",
        words: ["CYBER", "SQUIRE", "KODIAK", "PHANTOM", "VESSEL"],
        encrypt: (word) => {
            return word.split("").map(c => {
                const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
                return "ZYXWVUTSRQPONMLKJIHGFEDCBA"[i];
            }).join("");
        }
    },
    {
        name: "Caesar (Shift 3)",
        clue: "Traditional bridge. Move 3 steps forward.",
        words: ["SHADOW", "BRIDGE", "TUNNEL", "CAVERN", "GHOST"],
        encrypt: (word) => {
            return word.split("").map(c => {
                const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
                return "DEFGHIJKLMNOPQRSTUVWXYZABC"[i];
            }).join("");
        }
    },
    {
        name: "Vigenere (Key: FOX)",
        clue: "The Polyalphabetic trial. Use the keyword 'FOX'.",
        words: ["MUSEUM", "PLANET", "SILVER", "STRIKE", "BEACON"],
        encrypt: (word) => {
            const key = "FOX";
            return word.split("").map((c, idx) => {
                const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
                const ki = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(key[idx % key.length]);
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[(i + ki) % 26];
            }).join("");
        }
    },
    {
        name: "TEP Cipher",
        clue: "The custom frequency. Translate the symbols.",
        words: ["FOX", "AEON", "LOGIC", "DATA", "VOID"],
        encrypt: (word) => {
            const mapping = {
                'A': "⟒", 'B': "ϟ", 'C': "⚲", 'D': "⍠", 'E': "Ξ", 'F': "⌬", 'G': "⌁", 'H': "⍥", 'I': "∷",
                'J': "⊙", 'K': "Ϟ", 'L': "⌇", 'M': "⨀", 'N': "〄", 'O': "◎", 'P': "⎔", 'Q': "⏁", 'R': "⎐",
                'S': "Ϩ", 'T': "⌖", 'U': "⋑", 'V': "⚶", 'W': "Ѡ", 'X': "⊗", 'Y': "⚷", 'Z': "⏃"
            };
            return word.split("").map(c => mapping[c] || c).join("");
        }
    }
];

let currentRoundIndex = 0;
let currentTargetWord = "";
let startTime = 0;
let timerInterval = null;
let solves = 0;

function startGame() {
    document.getElementById("startOverlay").style.display = "none";
    document.getElementById("gameContent").style.display = "block";
    currentRoundIndex = 0;
    solves = 0;
    startTime = Date.now();
    startTimer();
    nextRound();

    document.getElementById("answerInput").focus();
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById("timerValue").textContent = elapsed.toFixed(2);
    }, 50);
}

function nextRound() {
    if (currentRoundIndex >= ROUNDS.length) {
        endGame();
        return;
    }

    const round = ROUNDS[currentRoundIndex];
    document.getElementById("currentRound").textContent = currentRoundIndex + 1;

    // Pick random word from round
    const originalWord = round.words[Math.floor(Math.random() * round.words.length)];
    currentTargetWord = originalWord;
    const cipher = round.encrypt(originalWord);

    document.getElementById("cipherDisplay").textContent = cipher;
    document.getElementById("roundClue").textContent = `${round.name}: ${round.clue}`;
    document.getElementById("answerInput").value = "";
    document.getElementById("feedback").textContent = "";
}

document.getElementById("answerInput").addEventListener("input", (e) => {
    const val = e.target.value.toUpperCase();
    if (val === currentTargetWord) {
        solves++;
        document.getElementById("solveCount").textContent = solves;
        document.getElementById("feedback").textContent = "CORRECT!";
        document.getElementById("feedback").className = "feedback correct";

        currentRoundIndex++;
        setTimeout(nextRound, 500);
    }
});

function endGame() {
    clearInterval(timerInterval);
    const finalTime = (Date.now() - startTime) / 1000;
    document.getElementById("gameContent").style.display = "none";
    document.getElementById("endScreen").style.display = "block";
    document.getElementById("finalTime").textContent = finalTime.toFixed(2);

    let rank = "";
    if (finalTime < 15) rank = "S - QUANTUM DECRYPTOR";
    else if (finalTime < 25) rank = "A - ELITE CRYPTOGRAPHER";
    else if (finalTime < 45) rank = "B - SYSTEM ANALYST";
    else rank = "C - NOVICE DECODER";

    document.getElementById("rankText").textContent = rank;
}

document.addEventListener('DOMContentLoaded', () => {
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    b('startGameBtn',  () => typeof startGame === 'function' && startGame());
    b('reloadGameBtn', () => location.reload());
});
