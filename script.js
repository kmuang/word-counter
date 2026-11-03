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
const themeToggleLabel = themeToggle.querySelector('.theme-toggle-label');
const clearTextButton = document.getElementById('clear-text');
const charCountLabel = document.getElementById('char-label');
const showMoreDensityButton = document.getElementById('show-more-density');
const voiceToggleButton = document.getElementById('voice-toggle');
const voiceToggleLabel = document.getElementById('voice-toggle-label');
const voicePlayIcon = voiceToggleButton.querySelector('.voice-play-icon');
const voicePauseIcon = voiceToggleButton.querySelector('.voice-pause-icon');
const voiceStopButton = document.getElementById('voice-stop');
const voiceStatus = document.getElementById('voice-status');
const htmlElement = document.documentElement;
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// State
let isDarkMode = localStorage.getItem('theme') !== 'light'; // Default to dark
let showAllDensity = false;
let speechChunks = [];
let speechChunkIndex = 0;
let speechSession = 0;
let speechState = 'idle';
let availableVoices = [];
let selectedVoice = null;

// Initialize Theme
function applyTheme() {
    const theme = isDarkMode ? 'dark' : 'light';
    const nextTheme = isDarkMode ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('title', `Switch to ${nextTheme} mode`);
    themeToggleLabel.textContent = `${nextTheme} mode`;
    localStorage.setItem('theme', theme);
}
applyTheme();

function updateVoiceControls() {
    voiceToggleButton.disabled = !canSpeak || (speechState === 'idle' && !textInput.value.trim());
    voiceStopButton.disabled = speechState === 'idle';
    voiceToggleLabel.textContent = speechState === 'paused'
        ? 'Resume'
        : speechState === 'speaking'
            ? 'Pause'
            : 'Read aloud';
    voicePlayIcon.classList.toggle('hidden', speechState !== 'idle');
    voicePauseIcon.classList.toggle('hidden', speechState !== 'speaking');
}

function loadSpeechVoices() {
    if (!canSpeak) {
        return;
    }

    availableVoices = window.speechSynthesis.getVoices();
    const englishVoices = availableVoices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
    const masculineVoiceNames = [/^Daniel$/i, /^Alex$/i, /^Albert$/i, /^Fred$/i, /^Ralph$/i, /^Bruce$/i];
    selectedVoice = masculineVoiceNames
        .map((name) => englishVoices.find((voice) => name.test(voice.name)))
        .find(Boolean)
        || englishVoices.find((voice) => voice.default)
        || availableVoices.find((voice) => voice.default)
        || englishVoices[0]
        || null;
    voiceStatus.textContent = selectedVoice
        ? `Using ${selectedVoice.name}.`
        : 'Using your device’s default voice.';
    updateVoiceControls();
}

function splitSpeechText(text, maxChunkLength = 180) {
    const words = text.match(/\S+\s*/g) || [];
    const chunks = [];
    let chunk = '';

    words.forEach((word) => {
        if (chunk && chunk.length + word.length > maxChunkLength) {
            chunks.push(chunk.trim());
            chunk = '';
        }
        chunk += word;
    });

    if (chunk.trim()) {
        chunks.push(chunk.trim());
    }

    return chunks;
}

function speakNextChunk(session) {
    if (session !== speechSession || speechState !== 'speaking') {
        return;
    }

    if (speechChunkIndex >= speechChunks.length) {
        speechState = 'idle';
        voiceStatus.textContent = 'Finished reading.';
        updateVoiceControls();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(speechChunks[speechChunkIndex]);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.onend = () => {
        if (session !== speechSession || speechState !== 'speaking') {
            return;
        }
        speechChunkIndex += 1;
        speakNextChunk(session);
    };
    utterance.onerror = (event) => {
        if (session !== speechSession) {
            return;
        }
        speechState = 'idle';
        voiceStatus.textContent = `Unable to read text aloud: ${event.error}.`;
        updateVoiceControls();
    };

    window.speechSynthesis.speak(utterance);
}

function startReading() {
    const text = textInput.value.trim();
    if (!text || !canSpeak) {
        return;
    }

    window.speechSynthesis.cancel();
    speechSession += 1;
    speechChunks = splitSpeechText(text);
    speechChunkIndex = 0;
    speechState = 'speaking';
    updateVoiceControls();
    speakNextChunk(speechSession);
}

function stopReading(status = 'Reading stopped.') {
    speechSession += 1;
    if (canSpeak) {
        window.speechSynthesis.cancel();
    }
    speechChunks = [];
    speechChunkIndex = 0;
    speechState = 'idle';
    voiceStatus.textContent = status;
    updateVoiceControls();
}

if (!canSpeak) {
    voiceStatus.textContent = 'Text-to-speech is not supported in this browser.';
} else {
    loadSpeechVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadSpeechVoices);
}
updateVoiceControls();

// Theme Toggle Listener
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme();
});

// Analysis Logic
function analyzeText() {
    let text = textInput.value;
    const originalLength = text.length;
    clearTextButton.disabled = text.length === 0;

    // Handle Character Limit
    if (limitToggleCheckbox.checked) {
        charLimitInput.classList.remove('hidden');
        const limit = parseInt(charLimitInput.value, 10);
        
        if (!isNaN(limit) && limit > 0) {
            if (originalLength > limit) {
                limitWarning.classList.remove('hidden');
            } else {
                limitWarning.classList.add('hidden');
            }
        }
    } else {
        charLimitInput.classList.add('hidden');
        limitWarning.classList.add('hidden');
    }

    // Calculations
    let charCount = text.length;
    if (excludeSpacesCheckbox.checked) {
        charCount = text.replace(/\s/g, '').length;
    }
    charCountLabel.textContent = excludeSpacesCheckbox.checked
        ? 'Characters (no spaces)'
        : 'Total characters';

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
    readingTimeDisplay.textContent = wordCount === 0
        ? '0 min'
        : wordCount < 200
            ? '<1 min'
            : `${time} min`;

    // Letter Density
    calculateLetterDensity(text);
}

function calculateLetterDensity(text) {
    const charMap = {};
    
    // Only count letters A-Z (case insensitive)
    const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanTotal = cleanText.length;

    if (cleanTotal === 0) {
        densityList.innerHTML = '<p class="empty-state">No characters found. Start typing to see letter density.</p>';
        showMoreDensityButton.classList.add('hidden');
        showMoreDensityButton.setAttribute('aria-expanded', 'false');
        showAllDensity = false;
        return;
    }

    for (let char of cleanText) {
        charMap[char] = (charMap[char] || 0) + 1;
    }

    // Sort by count descending
    const sortedChars = Object.entries(charMap).sort((a, b) => b[1] - a[1]);
    
    const visibleChars = showAllDensity ? sortedChars : sortedChars.slice(0, 5);

    let html = '';
    visibleChars.forEach(([char, count]) => {
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
    showMoreDensityButton.classList.toggle('hidden', sortedChars.length <= 5);
    showMoreDensityButton.setAttribute('aria-expanded', String(showAllDensity));
    showMoreDensityButton.innerHTML = showAllDensity
        ? 'See less <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
        : 'See more <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
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
textInput.addEventListener('input', () => {
    if (speechState !== 'idle') {
        stopReading('Text changed. Start reading again to hear the updated text.');
    }
    analyzeText();
    updateVoiceControls();
});
excludeSpacesCheckbox.addEventListener('change', analyzeText);
limitToggleCheckbox.addEventListener('change', analyzeText);
charLimitInput.addEventListener('input', analyzeText);
clearTextButton.addEventListener('click', () => {
    textInput.value = '';
    stopReading('Text cleared.');
    analyzeText();
    textInput.focus();
});
voiceToggleButton.addEventListener('click', () => {
    if (speechState === 'speaking') {
        window.speechSynthesis.pause();
        speechState = 'paused';
        voiceStatus.textContent = 'Reading paused.';
        updateVoiceControls();
    } else if (speechState === 'paused') {
        window.speechSynthesis.resume();
        speechState = 'speaking';
        voiceStatus.textContent = `Reading aloud with ${selectedVoice ? selectedVoice.name : 'your device’s default voice'}.`;
        updateVoiceControls();
    } else {
        startReading();
    }
});
voiceStopButton.addEventListener('click', () => stopReading());
showMoreDensityButton.addEventListener('click', () => {
    showAllDensity = !showAllDensity;
    analyzeText();
});

// Initial Run
analyzeText();
