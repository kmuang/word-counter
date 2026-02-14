// Elements
const textInput = document.getElementById('text-input');
const excludeSpacesCheckbox = document.getElementById('exclude-spaces');
const limitToggleCheckbox = document.getElementById('limit-toggle');
const charLimitInput = document.getElementById('char-limit-input');
const limitWarning = document.getElementById('limit-warning');
const readingTimeDisplay = document.getElementById('reading-time');

const charCountDisplay = document.getElementById('char-count');
const wordCountDisplay = document.getElementById('word-count');
const sentenceCountDisplay = document.getElementById('sentence-count');

const densityList = document.getElementById('density-list');
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// State
let isDarkMode = localStorage.getItem('theme') !== 'light'; // Default to dark
let charLimit = 0;

// Initialize Theme
function applyTheme() {
    if (isDarkMode) {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}
applyTheme();

// Theme Toggle Listener
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme();
});

// Analysis Logic
function analyzeText() {
    let text = textInput.value;
    const originalLength = text.length;

    // Handle Character Limit
    if (limitToggleCheckbox.checked) {
        charLimitInput.classList.remove('hidden');
        const limit = parseInt(charLimitInput.value, 10);
        
        if (!isNaN(limit) && limit > 0) {
            if (originalLength > limit) {
                // Determine truncating behavior: 
                // Option A: Truncate text (Aggressive)
                // Option B: Just warn (Passive)
                // Let's warn for now as it's better UX than deleting user input
                limitWarning.classList.remove('hidden');
                textInput.style.borderColor = '#FF5252';
            } else {
                limitWarning.classList.add('hidden');
                textInput.style.borderColor = 'transparent';
                // Reset focus style logic handled by CSS, but we need to clear inline style
                if(document.activeElement === textInput) {
                     textInput.style.borderColor = ''; 
                }
            }
        }
    } else {
        charLimitInput.classList.add('hidden');
        limitWarning.classList.add('hidden');
        textInput.style.borderColor = '';
    }

    // Calculations
    let charCount = text.length;
    if (excludeSpacesCheckbox.checked) {
        charCount = text.replace(/\s/g, '').length;
    }

    const trimmedText = text.trim();
    // Word Count: Split by whitespace, filter empty strings
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    
    // Sentence Count: Split by sentence terminators (. ! ?)
    // Filter out empty entries caused by trailing punctuation
    const sentenceCount = trimmedText ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;

    // Update Basic Stats
    animateValue(charCountDisplay, parseInt(charCountDisplay.innerText), charCount, 500);
    animateValue(wordCountDisplay, parseInt(wordCountDisplay.innerText), wordCount, 500);
    animateValue(sentenceCountDisplay, parseInt(sentenceCountDisplay.innerText), sentenceCount, 500);

    // Reading Time (Words / 200 wpm)
    const time = Math.ceil(wordCount / 200);
    readingTimeDisplay.innerText = wordCount > 0 ? `<${time}` : 0;

    // Letter Density
    calculateLetterDensity(text);
}

function calculateLetterDensity(text) {
    const charMap = {};
    const totalChars = text.length;
    
    // Only count letters A-Z (case insensitive)
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanTotal = cleanText.length;

    if (cleanTotal === 0) {
        densityList.innerHTML = '<p class="empty-state">No characters found. Start typing to see letter density.</p>';
        return;
    }

    for (let char of cleanText) {
        charMap[char] = (charMap[char] || 0) + 1;
    }

    // Sort by count descending
    const sortedChars = Object.entries(charMap).sort((a, b) => b[1] - a[1]);
    
    // Take top 5 for simplicity in this UI implementation as per reference
    // (Reference image shows E, I, T, O, N)
    const topChars = sortedChars.slice(0, 5);

    let html = '';
    topChars.forEach(([char, count]) => {
        const percentage = ((count / cleanTotal) * 100).toFixed(2);
        html += `
            <div class="density-item">
                <span class="density-char">${char}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <span class="density-val">${count} (${percentage}%)</span>
            </div>
        `;
    });
    
    densityList.innerHTML = html;
}

// Utility: Number Animation
function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

// Event Listeners
textInput.addEventListener('input', analyzeText);
excludeSpacesCheckbox.addEventListener('change', analyzeText);
limitToggleCheckbox.addEventListener('change', analyzeText);
charLimitInput.addEventListener('input', analyzeText);

// Initial Run
analyzeText();
