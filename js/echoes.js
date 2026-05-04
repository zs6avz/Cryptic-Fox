const characters = ["Ada", "B25Y", "Charles"];
const questions = [
  "Is the passcode held by Ada?",
  "Is the passcode held by B25Y?",
  "Is the passcode held by Charles?",
  "Who holds the passcode?"
];

const AUTO_RESET_MS = 10000; // delay before automatic reset (ms)

let passcodeHolder = characters[Math.floor(Math.random() * characters.length)];
let autoResetTimer = null;
let gameLocked = false; // prevents multiple questions in one round

function askAda() {
  askCharacter("Ada");
}

function askB25Y() {
  askCharacter("B25Y");
}

function askCharles() {
  askCharacter("Charles");
}

function askCharacter(character) {
  if (gameLocked) return; // enforce single question per round

  const select = document.getElementById("questionSelect");
  const qIndex = parseInt(select.value, 10);

  if (isNaN(qIndex)) return; // no question selected

  const question = questions[qIndex];
  let answer;

  if (qIndex === 3) {
    // "Who holds the passcode?"
    if (character === "Ada") {
      answer = passcodeHolder; // truth
    } else if (character === "B25Y") {
      // lies: choose any name except the holder
      const options = characters.filter(name => name !== passcodeHolder);
      answer = options[Math.floor(Math.random() * options.length)];
    } else {
      // Charles: random
      answer = characters[Math.floor(Math.random() * characters.length)];
    }
  } else {
    // Yes/No questions
    const target = characters[qIndex];
    if (character === "Ada") {
      answer = (passcodeHolder === target); // truth
    } else if (character === "B25Y") {
      answer = !(passcodeHolder === target); // lie
    } else {
      // Charles: random truth/lie
      const randomTruth = Math.random() < 0.5;
      answer = randomTruth ? (passcodeHolder === target) : !(passcodeHolder === target);
    }
  }

  showResponse(character, question, answer);

  // Lock game and schedule automatic reset
  gameLocked = true;
  scheduleAutoReset();
}

function showResponse(character, question, answer) {
  const responseText = `${character} was asked: "${question}"`;
  let resultText;
  let deductionText;

  const isWhoQuestion = question === "Who holds the passcode?";

  if (isWhoQuestion) {
    // Open-ended answer (a name)
    resultText = `${character} answers: "${answer}"`;

    if (character === "Ada") {
      deductionText = `Ada always tells the truth → ${answer} holds the passcode ✅`;
    } else if (character === "B25Y") {
      deductionText = `B25Y always lies → ${answer} does NOT hold the passcode ❌`;
    } else {
      deductionText = `Charles is unpredictable → Cannot deduce reliably 🤷‍♂️`;
    }
  } else {
    // Yes/No answer (boolean)
    resultText = `${character} answers: ${answer ? "True ✅" : "False ❌"}`;

    // Robustly extract the asked-about name from the question
    const match = question.match(/Ada|B25Y|Charles/);
    const target = match ? match[0] : "Unknown";

    if (character === "Ada") {
      deductionText = `Ada always tells the truth → ${answer ? `${target} likely holds the passcode ✅` : `${target} does NOT hold the passcode ❌`}`;
    } else if (character === "B25Y") {
      deductionText = `B25Y always lies → ${answer ? `${target} does NOT hold the passcode ❌` : `${target} likely holds the passcode ✅`}`;
    } else {
      deductionText = `Charles is unpredictable → Cannot deduce reliably 🤷‍♂️`;
    }
  }

  document.getElementById("response").textContent = responseText;
  document.getElementById("result").textContent = resultText;
  document.getElementById("deduction").textContent = deductionText;
}

function scheduleAutoReset() {
  clearTimeout(autoResetTimer);
  autoResetTimer = setTimeout(resetGame, AUTO_RESET_MS);
}

function resetGame() {
  // Cancel any pending auto reset, unlock, roll a new holder
  clearTimeout(autoResetTimer);
  autoResetTimer = null;
  gameLocked = false;
  passcodeHolder = characters[Math.floor(Math.random() * characters.length)];

  // Clear UI and reset selection
  const select = document.getElementById("questionSelect");
  if (select) select.selectedIndex = 0;

  const clear = id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  };
  clear("response");
  clear("result");
  clear("deduction");
  clear("actualHolder"); // safe if present
}
