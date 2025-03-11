// DOM Elements
const textInput = document.getElementById('text-input');
const voiceBtn = document.getElementById('voice-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');
const sentimentScore = document.getElementById('sentiment-score');
const historyList = document.getElementById('history-list');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const sentenceCount = document.getElementById('sentence-count');
const readability = document.getElementById('readability');

// Theme Management
const setTheme = (isDark) => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme === 'dark');
themeToggle.checked = savedTheme === 'dark';

// Theme toggle event listener
themeToggle.addEventListener('change', (e) => {
    setTheme(e.target.checked);
});

// Voice Recognition Setup
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        textInput.value = transcript;
        voiceBtn.classList.remove('recording');
        analyzeSentiment();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('recording');
        alert('Voice input error. Please try again.');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };
}

// Voice button event listener
voiceBtn.addEventListener('click', () => {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser.');
        return;
    }

    if (voiceBtn.classList.contains('recording')) {
        recognition.stop();
        voiceBtn.classList.remove('recording');
    } else {
        recognition.start();
        voiceBtn.classList.add('recording');
        textInput.value = '';
    }
});

// Clear button event listener
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateTextStats();
    sentimentScore.innerHTML = `
        <div class="emoji">😐</div>
        <div class="score">Neutral</div>
        <div class="confidence">Confidence: 0%</div>
    `;
});

// Text statistics functions
const updateTextStats = () => {
    const text = textInput.value.trim();
    
    // Word count
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = words;

    // Character count
    charCount.textContent = text.length;

    // Sentence count
    const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;
    sentenceCount.textContent = sentences;

    // Readability (Flesch-Kincaid Grade Level approximation)
    if (words > 0 && sentences > 0) {
        const syllables = countSyllables(text);
        const grade = calculateReadability(words, sentences, syllables);
        readability.textContent = grade.toFixed(1);
    } else {
        readability.textContent = 'N/A';
    }
};

// Helper functions for text statistics
const countSyllables = (text) => {
    return text.toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/[^aeiou]+/g, ' ')
        .trim()
        .split(/\s+/).length;
};

const calculateReadability = (words, sentences, syllables) => {
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
};

// Simple sentiment analysis function
const analyzeSentiment = () => {
    const text = textInput.value.trim();
    if (!text) {
        alert('Please enter some text to analyze.');
        return;
    }

    // Positive and negative word lists
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic', 'beautiful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'poor', 'wrong', 'worst', 'stupid'];

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let score = 0;
    let matchedWords = 0;

    words.forEach(word => {
        if (positiveWords.includes(word)) {
            score++;
            matchedWords++;
        } else if (negativeWords.includes(word)) {
            score--;
            matchedWords++;
        }
    });

    const confidence = matchedWords ? (matchedWords / words.length) * 100 : 0;
    let sentiment;
    let emoji;

    if (score > 0) {
        sentiment = 'Positive';
        emoji = '😊';
    } else if (score < 0) {
        sentiment = 'Negative';
        emoji = '😔';
    } else {
        sentiment = 'Neutral';
        emoji = '😐';
    }

    // Update sentiment display
    sentimentScore.innerHTML = `
        <div class="emoji">${emoji}</div>
        <div class="score">${sentiment}</div>
        <div class="confidence">Confidence: ${confidence.toFixed(1)}%</div>
    `;

    // Add to history
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div>${text.substring(0, 50)}${text.length > 50 ? '...' : ''}</div>
        <small>${sentiment} (${confidence.toFixed(1)}% confidence)</small>
    `;
    historyList.insertBefore(historyItem, historyList.firstChild);

    // Update text statistics
    updateTextStats();
};

// Analyze button event listener
analyzeBtn.addEventListener('click', analyzeSentiment);

// Text input event listeners
textInput.addEventListener('input', updateTextStats);
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        analyzeSentiment();
    }
});
