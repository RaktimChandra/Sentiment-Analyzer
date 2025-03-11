// DOM Elements
const textInput = document.getElementById('text-input');
const voiceBtn = document.getElementById('voice-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');
const sentimentScore = document.getElementById('sentiment-score');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const sentenceCount = document.getElementById('sentence-count');
const readability = document.getElementById('readability');
const historyList = document.getElementById('history-list');

// Theme Management
const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
};

themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Voice Input
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        textInput.value = text;
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        analyzeSentiment();
    };

    recognition.onerror = () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
    };
}

voiceBtn.addEventListener('click', () => {
    if (recognition) {
        if (voiceBtn.innerHTML.includes('Stop')) {
            recognition.stop();
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        } else {
            recognition.start();
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        }
    }
});

// Text Analysis Functions
const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const getSentenceCount = (text) => {
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
};

const getReadabilityScore = (text) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const syllables = words.reduce((count, word) => {
        return count + word.toLowerCase().replace(/[^aeiouy]/g, '').length;
    }, 0);

    if (words.length === 0 || sentences.length === 0) return 'N/A';

    const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    
    if (score > 90) return 'Very Easy';
    if (score > 80) return 'Easy';
    if (score > 70) return 'Fairly Easy';
    if (score > 60) return 'Standard';
    if (score > 50) return 'Fairly Hard';
    if (score > 30) return 'Hard';
    return 'Very Hard';
};

// Sentiment Analysis
const analyzeSentiment = () => {
    const text = textInput.value.trim();
    if (!text) return;

    // Simple lexicon-based sentiment analysis
    const positiveWords = new Set(['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic']);
    const negativeWords = new Set(['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'poor', 'disappointing']);
    
    const words = text.toLowerCase().match(/\w+/g) || [];
    let positive = 0;
    let negative = 0;

    words.forEach(word => {
        if (positiveWords.has(word)) positive++;
        if (negativeWords.has(word)) negative++;
    });

    const total = positive + negative || 1;
    const score = (positive - negative) / total;
    const confidence = Math.abs(score) * 100;

    let sentiment;
    let emoji;
    if (score > 0.2) {
        sentiment = 'Positive';
        emoji = '😊';
    } else if (score < -0.2) {
        sentiment = 'Negative';
        emoji = '😔';
    } else {
        sentiment = 'Neutral';
        emoji = '😐';
    }

    // Update UI
    sentimentScore.innerHTML = `
        <div class="emoji">${emoji}</div>
        <div class="score">${sentiment}</div>
        <div class="confidence">Confidence: ${confidence.toFixed(0)}%</div>
    `;

    // Update statistics
    wordCount.textContent = getWordCount(text);
    charCount.textContent = text.length;
    sentenceCount.textContent = getSentenceCount(text);
    readability.textContent = getReadabilityScore(text);

    // Add to history
    addToHistory(text, sentiment, emoji);
};

// History Management
const addToHistory = (text, sentiment, emoji) => {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    const timestamp = new Date().toLocaleString();
    
    history.unshift({
        text: text.length > 50 ? text.substring(0, 50) + '...' : text,
        sentiment,
        emoji,
        timestamp
    });

    if (history.length > 10) history.pop();
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    updateHistoryDisplay();
};

const updateHistoryDisplay = () => {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div>${item.emoji} ${item.sentiment}</div>
            <div>${item.text}</div>
            <small>${item.timestamp}</small>
        </div>
    `).join('');
};

// Clear functionality
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    sentimentScore.innerHTML = `
        <div class="emoji">😐</div>
        <div class="score">Neutral</div>
        <div class="confidence">Confidence: 0%</div>
    `;
    wordCount.textContent = '0';
    charCount.textContent = '0';
    sentenceCount.textContent = '0';
    readability.textContent = 'N/A';
});

// Event Listeners
analyzeBtn.addEventListener('click', analyzeSentiment);
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        analyzeSentiment();
    }
});

// Initialize
loadTheme();
updateHistoryDisplay();
