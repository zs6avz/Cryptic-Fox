// sentinel.js

const STAGES = [
    {
        title: "Stage 1: The Prime Origin",
        text: "The gate is locked by the sequence of the ancients. 3301 was just the beginning. What is the first prime number that follows?",
        answer: "3307",
        error: "Incorrect. The numbers do not lie."
    },
    {
        title: "Stage 2: The Ethereal Source",
        text: "You have crossed the threshold. But to know where you are going, you must know where you are. The key is in the source. Seek the KEY_FRAGMENT.",
        answer: "L1B_PRIMVS",
        error: "The fragment remains hidden. Search deeper."
    },
    {
        title: "Stage 3: The Base Transmission",
        text: "The final barrier. A digital echo of the sequence. Decode the transmission: <br><br> <span style='color:#fff'>U0VOVElORUxfQUNDRVNT</span>",
        answer: "SENTINEL_ACCESS",
        error: "Decoding failed. The base is unstable."
    }
];

let currentStage = 0;

function initTerminal() {
    updateTime();
    setInterval(updateTime, 1000);
    renderStage();

    const input = document.getElementById("terminalInput");
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const val = input.value.trim().toUpperCase();
            input.value = "";
            checkAnswer(val);
        }
    });

    // Keep focus on input
    document.addEventListener("click", () => {
        input.focus();
    });
}

function updateTime() {
    const timeDisplay = document.getElementById("terminalTime");
    const now = new Date();
    timeDisplay.textContent = now.getHours().toString().padStart(2, '0') + ":" +
                             now.getMinutes().toString().padStart(2, '0') + ":" +
                             now.getSeconds().toString().padStart(2, '0');
}

function renderStage() {
    const stage = STAGES[currentStage];
    const content = document.getElementById("stageContent");
    
    content.innerHTML = `
        <div class="stage-title">${stage.title}</div>
        <p>${stage.text}</p>
    `;
    
    const status = document.getElementById("statusMsg");
    status.className = "status-msg";
    status.textContent = "READY_FOR_INPUT";
}

function checkAnswer(val) {
    const stage = STAGES[currentStage];
    const status = document.getElementById("statusMsg");

    if (val === stage.answer.toUpperCase()) {
        status.className = "status-msg success-msg";
        status.textContent = "ACCESS_GRANTED. INITIALIZING_NEXT_PHASE...";
        
        setTimeout(() => {
            currentStage++;
            if (currentStage < STAGES.length) {
                renderStage();
            } else {
                showFinalSuccess();
            }
        }, 1500);
    } else {
        status.className = "status-msg error-msg";
        status.textContent = stage.error;
    }
}

function showFinalSuccess() {
    const content = document.getElementById("stageContent");
    content.innerHTML = `
        <div class="stage-title" style="color: #00ff41;">TRIAL_COMPLETE</div>
        <p>You have reached the end of the corridor. The truth set you free.</p>
        <p style="color: #fff; font-size: 1.5rem; margin-top: 20px;">FLAG{P31M3_S3N71N3L_3301}</p>
        <p style="margin-top: 30px;">
            <button onclick="window.location.href='puzzles.html'" class="primary-btn" style="border-color: #00ff41; color: #00ff41;">Return to Hub</button>
        </p>
    `;
    document.querySelector(".input-line").style.display = "none";
    document.getElementById("statusMsg").style.display = "none";
}

document.addEventListener("DOMContentLoaded", initTerminal);
