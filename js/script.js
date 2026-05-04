let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {};

console.log("Cryptic Fox Script Loaded");

// Single entry point for all DOM-related initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing components");

    // 1. Dropdown Logic
    const dropdownBtn = document.querySelector('.dropbtn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownContent.classList.toggle('active');
            dropdownBtn.setAttribute('aria-expanded', dropdownContent.classList.contains('active'));
        });

        dropdownBtn.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                dropdownContent.classList.toggle('active');
                dropdownBtn.setAttribute('aria-expanded', dropdownContent.classList.contains('active'));
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dropdownContent.classList.contains('active')) {
                dropdownContent.classList.remove('active');
                dropdownBtn.setAttribute('aria-expanded', 'false');
                dropdownBtn.focus();
            }
        });

        document.addEventListener('click', (event) => {
            if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove('active');
            }
        });
        
        dropdownContent.classList.remove('active');
    } else {
        console.warn("Dropdown components not found.");
    }

    // 2. Fox Screen Logic
    const foxInput = document.getElementById("foxInput");
    const submitFox = document.getElementById("submitFox");

    if (foxInput && submitFox) {
        foxInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                submitFox.click();
            }
        });
    }

    // 3. Navigation Buttons (Back and Scroll-to-Top)
    // Scroll-to-Top Button
    const scrollBtn = document.createElement('button');
    scrollBtn.id = "scrollToTopBtn";
    scrollBtn.innerHTML = "<span>↑</span>";
    scrollBtn.title = "Go to top";
    document.body.appendChild(scrollBtn);

    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Back Button
    if (!document.body.classList.contains('home-page')) {
        const backBtn = document.createElement('button');
        backBtn.id = "backBtn";
        backBtn.innerHTML = "<span>←</span> ϟ⟒⚲Ϟ";
        backBtn.title = "Go to previous page";
        document.body.appendChild(backBtn);

        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                const homePath = window.location.pathname.includes('blog-post') ? '../index.html' : 'index.html';
                window.location.href = homePath;
            }
        });
    }

    // 4. Initial Screen Setup
    const foxScreen = document.getElementById("foxScreen");
    const menu = document.querySelector('.dropdown');
    if (menu && foxScreen && getComputedStyle(foxScreen).opacity === '1') {
        menu.style.display = 'none';
    }

    // 5. Load External Data
    loadMappings();
});

// Function to verify the fox input
async function checkFox() {
    try {
        let correctFox = "fox";
        try {
            const xmlPath = window.location.pathname.includes('blog-post') ? '../xml/fox.xml' : 'xml/fox.xml';
            const response = await fetch(xmlPath);
            if (response.ok) {
                const xml = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "application/xml");
                correctFox = xmlDoc.getElementsByTagName("fox")[0].textContent.toLowerCase().trim();
            }
        } catch (e) {
            console.warn("Failed to fetch fox.xml. Using fallback.");
        }

        const userFox = document.getElementById("foxInput").value.toLowerCase().trim();

        if (userFox === correctFox) {
            hideFoxScreen();
            showMenu();
        } else {
            alert("Incorrect! Try again.");
        }
    } catch (error) {
        console.error(error);
    }
}

function hideFoxScreen() {
    const foxScreen = document.getElementById("foxScreen");
    if (!foxScreen) return;
    foxScreen.style.zIndex = "-1";
    foxScreen.style.opacity = "0";
    foxScreen.style.pointerEvents = "none";

    const menu = document.querySelector('.dropdown');
    if (menu) menu.style.display = 'block';
}

function showMenu() {
    const menu = document.querySelector('.dropdown');
    if (menu) menu.style.display = 'block';
}

// Function to load cipher mappings
async function loadMappings() {
    try {
        const xmlPath = window.location.pathname.includes('blog-post') ? '../xml/cipher_mapping.xml' : 'xml/cipher_mapping.xml';
        const response = await fetch(xmlPath);
        if (!response.ok) return;
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "application/xml");

        const mappings = xmlDoc.getElementsByTagName("mapping");
        for (let mapping of mappings) {
            const cipher = mapping.getAttribute("cipher");
            const alphabet = mapping.getAttribute("alphabet");
            const alternative = mapping.getAttribute("alternative");

            cipherToAlphabet[cipher] = alphabet;
            alphabetToCipher[alphabet] = cipher;
            cipherToAlternative[cipher] = alternative;
            alternativeToAlphabet[alternative] = alphabet;
        }

        populateCipherButtons();
    } catch (error) {
        console.warn("Could not load mappings (likely local file access issue).");
    }
}

function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    if (!keyboardPanel) return;
    keyboardPanel.innerHTML = "";

    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher;
        button.onclick = () => {
            const input = document.getElementById("inputText");
            if (input) input.value += cipher;
        };
        keyboardPanel.appendChild(button);
    }
}

// Global functions for tool pages
function translateToAlphabet() {
    const inputText = document.getElementById("inputText")?.value || "";
    let alphabetOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        if (char.match(/[.,?!;:'"-]/)) {
            alphabetOutput += char;
            alternativeOutput += char;
        } else {
            alphabetOutput += char === " " ? " " : cipherToAlphabet[char] || "?";
            alternativeOutput += char === " " ? " " : alternativeToAlphabet[char] || "?";
        }
    }

    const out1 = document.getElementById("outputText");
    const out2 = document.getElementById("alternativeOutputText");
    if (out1) out1.value = alphabetOutput;
    if (out2) out2.value = alternativeOutput;
}

function translateToCipher() {
    const inputText = document.getElementById("inputText")?.value || "";
    let cipherOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        if (char.match(/[.,?!;:'"-]/)) {
            cipherOutput += char;
            alternativeOutput += char;
        } else {
            const upperChar = char.toUpperCase();
            cipherOutput += char === " " ? " " : alphabetToCipher[upperChar] || "?";
            alternativeOutput += char === " " ? " " : cipherToAlternative[alphabetToCipher[upperChar]] || "?";
        }
    }

    const out1 = document.getElementById("outputText");
    const out2 = document.getElementById("alternativeOutputText");
    if (out1) out1.value = cipherOutput;
    if (out2) out2.value = alternativeOutput;
}

function clearFields() {
    const inp = document.getElementById("inputText");
    const out1 = document.getElementById("outputText");
    const out2 = document.getElementById("alternativeOutputText");
    if (inp) inp.value = "";
    if (out1) out1.value = "";
    if (out2) out2.value = "";
}
