let cipherToAlphabet = {};
let alphabetToCipher = {};
let cipherToAlternative = {};
let alternativeToAlphabet = {};

// Initialize dropdown button functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropdownBtn = document.querySelector('.dropbtn'); // Dropdown button
    const dropdownContent = document.querySelector('.dropdown-content'); // Dropdown content

    // Toggle dropdown visibility on button click
    dropdownBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click events from propagating
        dropdownContent.classList.toggle('active'); // Add or remove the "active" class for visibility
        dropdownBtn.setAttribute('aria-expanded', dropdownContent.classList.contains('active'));
    });

    // Keyboard support: Enter/Space to toggle, Escape to close
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

    // Optional: Close dropdown menu if clicking outside the dropdown button or menu
    document.addEventListener('click', (event) => {
        if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.classList.remove('active'); // Remove "active" class to hide dropdown
        }
    });

    // Ensure dropdown is hidden on page load
    dropdownContent.classList.remove('active');
});

// Ensure cipher mappings are loaded when the page loads
loadMappings();

// Function to verify the fox input
async function checkFox() {
    try {
        let correctFox = "fox"; // Default fallback
        try {
            const xmlPath = window.location.pathname.includes('blog-post') ? '../xml/fox.xml' : 'xml/fox.xml';
            const response = await fetch(xmlPath); // Fetch fox.xml file
            if (response.ok) {
                const xml = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "application/xml");
                correctFox = xmlDoc.getElementsByTagName("fox")[0].textContent.toLowerCase().trim();
            }
        } catch (e) {
            console.warn("Failed to fetch fox.xml (likely a local file:// CORS issue). Using fallback.");
        }

        const userFox = document.getElementById("foxInput").value.toLowerCase().trim();

        if (userFox === correctFox) {
            hideFoxScreen(); // Hide `foxScreen`
            showMenu(); // Show the dropdown menu
        } else {
            alert("Incorrect! Try again."); // Notify the user
        }
    } catch (error) {
        console.error(error.message); // Log any errors
    }
}

// Function to hide the fox screen
function hideFoxScreen() {
    const foxScreen = document.getElementById("foxScreen");
    foxScreen.style.zIndex = "-1"; // Remove from view
    foxScreen.style.opacity = "0"; // Make it transparent
    foxScreen.style.pointerEvents = "none"; // Disable interactions

    // Ensure menu visibility is restored when the fox screen is hidden
    const menu = document.querySelector('.dropdown');
    if (menu) {
        menu.style.display = 'block';
    }
}

// Function to show the dropdown menu
function showMenu() {
    const menu = document.querySelector('.dropdown');
    if (menu) {
        menu.style.display = 'block'; // Make the menu visible
    }
}

// Add event listener for "Enter" key
document.addEventListener('DOMContentLoaded', () => {
    const foxInput = document.getElementById("foxInput");
    const submitFox = document.getElementById("submitFox");

    if (foxInput && submitFox) {
        foxInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent default form submission behavior
                submitFox.click(); // Trigger the button's click event
            }
        });
    }
});

// Function to hide the dropdown menu (specific to the fox screen)
function hideMenuForFoxScreen() {
    const menu = document.querySelector('.dropdown');
    const foxScreen = document.getElementById("foxScreen");

    // Hide the navigation menu if the fox screen is visible
    if (menu && foxScreen && getComputedStyle(foxScreen).opacity === '1') {
        menu.style.display = 'none'; // Prevent menu from showing on foxScreen
    }
}

// Initial setup to ensure the dropdown menu is hidden on fox screen
document.addEventListener('DOMContentLoaded', () => {
    hideMenuForFoxScreen(); // Hide the navigation menu if foxScreen is active
});

// Function to load cipher mappings
async function loadMappings() {
    try {
        const xmlPath = window.location.pathname.includes('blog-post') ? '../xml/cipher_mapping.xml' : 'xml/cipher_mapping.xml';
        const response = await fetch(xmlPath); // Fetch the mappings XML file
        if (!response.ok) throw new Error(`Failed to load mappings: ${response.statusText}`);
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
        console.error(error.message);
    }
}

// Function to populate cipher buttons dynamically in the keyboard panel
function populateCipherButtons() {
    const keyboardPanel = document.getElementById("keyboardPanel");
    if (!keyboardPanel) return; // not on cipher translator page
    keyboardPanel.innerHTML = ""; // Clear previous buttons

    for (let cipher in cipherToAlphabet) {
        const button = document.createElement("button");
        button.textContent = cipher;
        button.onclick = () => addCipherToInput(cipher);
        keyboardPanel.appendChild(button);
    }
}

// Append cipher to the input field
function addCipherToInput(cipher) {
    document.getElementById("inputText").value += cipher;
}

// Translate text to Alphabet (Standard and Alternative)
function translateToAlphabet() {
    const inputText = document.getElementById("inputText").value;
    let alphabetOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        if (char.match(/[.,?!;:'"-]/)) {
            // Include punctuation directly
            alphabetOutput += char;
            alternativeOutput += char;
        } else {
            alphabetOutput += char === " " ? " " : cipherToAlphabet[char] || "?";
            alternativeOutput += char === " " ? " " : alternativeToAlphabet[char] || "?";
        }
    }

    document.getElementById("outputText").value = alphabetOutput;
    document.getElementById("alternativeOutputText").value = alternativeOutput;
}

// Translate text to Cipher (Standard and Alternative)
function translateToCipher() {
    const inputText = document.getElementById("inputText").value;
    let cipherOutput = "";
    let alternativeOutput = "";

    for (let char of inputText) {
        if (char.match(/[.,?!;:'"-]/)) {
            // Include punctuation directly
            cipherOutput += char;
            alternativeOutput += char;
        } else {
            cipherOutput += char === " " ? " " : alphabetToCipher[char.toUpperCase()] || "?";
            alternativeOutput += char === " " ? " " : cipherToAlternative[alphabetToCipher[char.toUpperCase()]] || "?";
        }
    }

    document.getElementById("outputText").value = cipherOutput;
    document.getElementById("alternativeOutputText").value = alternativeOutput;
}

// Clear input and output fields
function clearFields() {
    document.getElementById("inputText").value = "";
    document.getElementById("outputText").value = "";
    document.getElementById("alternativeOutputText").value = "";
}

/**
 * Site-wide navigation script.
 * Dynamically creates Back and Scroll-to-Top buttons and manages their behavior globally.
 */
document.addEventListener('DOMContentLoaded', () => {

    // Create the button
    const scrollBtn = document.createElement('button');
    scrollBtn.id = "scrollToTopBtn";
    scrollBtn.innerHTML = "<span>↑</span>";
    scrollBtn.title = "Go to top";
    document.body.appendChild(scrollBtn);

    // Show/hide button on scroll
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    });

    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Create the Back button
    const backBtn = document.createElement('button');
    backBtn.id = "backBtn";
    backBtn.innerHTML = "<span>←</span> ϟ⟒⚲Ϟ";
    backBtn.title = "Go to previous page";
    document.body.appendChild(backBtn);

    // Back functionality
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback if no history (e.g. opened in new tab)
            const homePath = window.location.pathname.includes('blog-post') ? '../index.html' : 'index.html';
            window.location.href = homePath;
        }
    });
});
