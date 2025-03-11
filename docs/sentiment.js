// Sentiment Analysis implementation
class SentimentAnalyzer {
    constructor() {
        this.positiveWords = new Set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'happy', 'joy', 'beautiful', 'perfect', 'love', 'best', 'brilliant',
            'awesome', 'outstanding', 'superb', 'delightful', 'incredible',
            'magnificent', 'splendid', 'success', 'positive', 'win', 'winning',
            'excited', 'thrilled', 'proud', 'blessed', 'grateful', 'thankful',
            '😊', '😃', '😄', '👍', '❤️', '🌟', '✨', '💪', '👏', '🎉'
        ]);

        this.negativeWords = new Set([
            'bad', 'terrible', 'horrible', 'awful', 'worst', 'hate', 'sad',
            'angry', 'upset', 'disappointing', 'poor', 'ugly', 'disgusting',
            'dreadful', 'unpleasant', 'fail', 'failure', 'negative', 'lose',
            'losing', 'worse', 'problem', 'frustrated', 'annoyed', 'unhappy',
            'miserable', 'wrong', 'difficult', 'tough', 'complicated',
            '😠', '😢', '😭', '👎', '💔', '😤', '😫', '😩', '😰', '😱'
        ]);
    }

    analyze(text) {
        if (!text) {
            return this._createEmptyAnalysis();
        }

        const words = this._tokenize(text);
        const sentences = this._getSentences(text);
        const stats = this._calculateStats(text, words, sentences);
        
        let posScore = 0;
        let negScore = 0;

        for (const word of words) {
            if (this.positiveWords.has(word)) posScore++;
            if (this.negativeWords.has(word)) negScore++;
        }

        const total = posScore + negScore || 1;
        const positiveProbability = posScore / total;
        
        let sentiment, confidence;
        if (posScore === 0 && negScore === 0) {
            sentiment = 'neutral';
            confidence = 0.5;
        } else {
            sentiment = positiveProbability > 0.5 ? 'pos' : 'neg';
            confidence = Math.max(positiveProbability, 1 - positiveProbability);
        }

        return {
            sentiment,
            confidence,
            stats,
            text,
            timestamp: new Date().toISOString()
        };
    }

    _tokenize(text) {
        return text.toLowerCase()
            .match(/\b[\w']+\b|[😊😃😄👍❤️🌟✨💪👏🎉😠😢😭👎💔😤😫😩😰😱]/g) || [];
    }

    _getSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim());
    }

    _calculateStats(text, words, sentences) {
        if (!words.length) {
            return this._createEmptyStats();
        }

        const wordCount = words.length;
        const charCount = text.length;
        const sentenceCount = sentences.length;
        const uniqueWords = new Set(words).size;
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
        const vocabularyDiversity = uniqueWords / wordCount;
        const avgSentenceLength = wordCount / (sentenceCount || 1);

        const readabilityScore = this._calculateReadability(avgWordLength, avgSentenceLength);

        return {
            word_count: wordCount,
            char_count: charCount,
            sentence_count: sentenceCount,
            unique_words: uniqueWords,
            avg_word_length: Math.round(avgWordLength * 100) / 100,
            vocabulary_diversity: Math.round(vocabularyDiversity * 100) / 100,
            avg_sentence_length: Math.round(avgSentenceLength * 100) / 100,
            readability_score: readabilityScore
        };
    }

    _calculateReadability(avgWordLength, avgSentenceLength) {
        const wordFactor = Math.min((avgWordLength - 3) * 2, 5);
        const sentenceFactor = Math.min((avgSentenceLength - 10) * 0.3, 5);
        return Math.max(0, Math.min(Math.round((wordFactor + sentenceFactor) * 10) / 10, 10));
    }

    _createEmptyStats() {
        return {
            word_count: 0,
            char_count: 0,
            sentence_count: 0,
            unique_words: 0,
            avg_word_length: 0,
            vocabulary_diversity: 0,
            avg_sentence_length: 0,
            readability_score: 0
        };
    }

    _createEmptyAnalysis() {
        return {
            sentiment: 'neutral',
            confidence: 0,
            stats: this._createEmptyStats(),
            text: '',
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize the analyzer
const analyzer = new SentimentAnalyzer();

// Theme handling
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;

themeSwitch.addEventListener('change', () => {
    body.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
    localStorage.setItem('theme', themeSwitch.checked ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
themeSwitch.checked = savedTheme === 'dark';

// Voice input handling
let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            document.getElementById('text-input').value = text;
            analyzeSentiment();
        };

        recognition.onend = () => {
            toggleVoiceInput();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            toggleVoiceInput();
            alert('Speech recognition error. Please try again.');
        };
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        initSpeechRecognition();
    }

    const voiceBtn = document.getElementById('voice-btn');
    
    if (!isRecording) {
        recognition.start();
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop Recording';
    } else {
        recognition.stop();
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
    }
    
    isRecording = !isRecording;
}

// Analysis history
let history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');

function updateHistory(analysis) {
    history.unshift({
        text: analysis.text,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        timestamp: new Date().toISOString()
    });

    if (history.length > 10) history.pop();
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-text">
                <div>${item.text.substring(0, 50)}${item.text.length > 50 ? '...' : ''}</div>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            </div>
            <div class="history-sentiment">
                ${getEmojiForSentiment(item.sentiment)}
                <span>${Math.round(item.confidence * 100)}%</span>
            </div>
        </div>
    `).join('');
}

function getEmojiForSentiment(sentiment) {
    switch(sentiment) {
        case 'pos': return '😊';
        case 'neg': return '☹️';
        default: return '😐';
    }
}

function updateReadabilityMeter(score) {
    const level = document.getElementById('readability-level');
    const text = document.getElementById('readability-text');
    
    const percentage = (score / 10) * 100;
    level.style.width = `${percentage}%`;
    
    if (score <= 3) {
        level.style.backgroundColor = '#34a853';
        text.textContent = 'Easy to read';
    } else if (score <= 6) {
        level.style.backgroundColor = '#fbbc05';
        text.textContent = 'Moderate';
    } else {
        level.style.backgroundColor = '#ea4335';
        text.textContent = 'Complex';
    }
}

function clearAll() {
    document.getElementById('text-input').value = '';
    document.getElementById('sentiment-card').style.display = 'none';
    document.getElementById('word-count').textContent = '0';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('sentence-count').textContent = '0';
    document.getElementById('unique-words').textContent = '0';
    updateReadabilityMeter(0);
}

async function analyzeSentiment() {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
        alert('Please enter some text to analyze');
        return;
    }

    const loading = document.getElementById('loading');
    const sentimentCard = document.getElementById('sentiment-card');

    try {
        loading.style.display = 'block';
        sentimentCard.style.display = 'none';

        // Perform client-side analysis
        const data = analyzer.analyze(text);
        
        // Update sentiment display
        sentimentCard.style.display = 'block';
        document.getElementById('sentiment-emoji').textContent = getEmojiForSentiment(data.sentiment);
        document.getElementById('sentiment-text').textContent = 
            data.sentiment === 'pos' ? 'Positive' : data.sentiment === 'neg' ? 'Negative' : 'Neutral';
        
        const confidencePercent = Math.round(data.confidence * 100);
        document.querySelector('.confidence-level').style.width = `${confidencePercent}%`;
        document.getElementById('confidence-value').textContent = confidencePercent;

        // Update statistics
        document.getElementById('word-count').textContent = data.stats.word_count;
        document.getElementById('char-count').textContent = data.stats.char_count;
        document.getElementById('sentence-count').textContent = data.stats.sentence_count;
        document.getElementById('unique-words').textContent = data.stats.unique_words;
        
        // Update readability
        updateReadabilityMeter(data.stats.readability_score);

        // Update history
        updateHistory(data);

    } catch (error) {
        alert('Error analyzing text: ' + error.message);
    } finally {
        loading.style.display = 'none';
    }
}

// Initialize
displayHistory();
