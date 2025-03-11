// DOM Elements
console.log('Script loading...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

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
        console.log('Theme toggle clicked');
        setTheme(e.target.checked);
    });

    // Voice Recognition Setup
    let recognition = null;
    let isRecording = false;

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
            isRecording = false;
        };
    }

    // Voice button event listener
    voiceBtn.addEventListener('click', () => {
        console.log('Voice button clicked');
        if (!recognition) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        if (isRecording) {
            recognition.stop();
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        } else {
            recognition.start();
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop Recording';
        }
        
        isRecording = !isRecording;
    });

    // Clear button event listener
    clearBtn.addEventListener('click', () => {
        console.log('Clear button clicked');
        textInput.value = '';
        updateTextStats();
        sentimentScore.innerHTML = `
            <div class="emoji">😐</div>
            <div class="score">Neutral</div>
            <div class="confidence">Confidence: 0%</div>
        `;
        // Clear history
        historyList.innerHTML = '';
    });

    // Text statistics functions
    const updateTextStats = () => {
        console.log('Updating text stats');
        const text = textInput.value.trim();
        
        // Word count
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = words;

        // Character count
        charCount.textContent = text.length;

        // Sentence count
        const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;
        sentenceCount.textContent = sentences;

        // Simple readability score
        if (words > 0 && sentences > 0) {
            const syllables = countSyllables(text);
            const score = calculateReadability(words, sentences, syllables);
            let readabilityText;
            
            if (score <= 6) {
                readabilityText = 'Easy';
            } else if (score <= 10) {
                readabilityText = 'Moderate';
            } else {
                readabilityText = 'Complex';
            }
            
            readability.textContent = readabilityText;
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

    // Expanded word lists for better sentiment analysis
    const positiveWords = [
        'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic', 
        'beautiful', 'perfect', 'amazing', 'brilliant', 'joy', 'delightful', 'pleasant',
        'blessed', 'success', 'win', 'winning', 'victory', 'peaceful', 'proud', 'pride',
        'best', 'better', 'incredible', 'enjoy', 'enjoyed', 'enjoying', 'fun', 'exciting',
        'excited', 'glad', 'thankful', 'grateful', 'appreciate', 'appreciated', 'impressive',
        'positive', 'optimistic', 'outstanding', 'super', 'superb', 'excellent', 'exceptional'
    ];

    const negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'poor', 'wrong', 'worst',
        'stupid', 'angry', 'mad', 'furious', 'annoyed', 'disappointed', 'frustrating',
        'frustrated', 'useless', 'waste', 'fail', 'failed', 'failing', 'failure', 'problem',
        'difficult', 'hard', 'impossible', 'never', 'negative', 'pessimistic', 'unfortunately',
        'unhappy', 'unpleasant', 'unsatisfactory', 'upset', 'worried', 'worry', 'worse',
        'disaster', 'tragic', 'pathetic', 'inferior', 'inadequate', 'mediocre'
    ];

    // Sentiment analysis function
    const analyzeSentiment = () => {
        console.log('Analyzing sentiment');
        try {
            const text = textInput.value.trim();
            if (!text) {
                alert('Please enter some text to analyze.');
                return;
            }

            // Split text into words and remove punctuation
            const words = text.toLowerCase().match(/\b\w+\b/g) || [];
            if (words.length === 0) {
                alert('Please enter valid text with words.');
                return;
            }

            console.log('Words to analyze:', words);

            let score = 0;
            let matchedWords = 0;
            let positiveMatches = 0;
            let negativeMatches = 0;

            // Analyze each word
            words.forEach(word => {
                if (positiveWords.includes(word)) {
                    score++;
                    matchedWords++;
                    positiveMatches++;
                    console.log('Positive word found:', word);
                } else if (negativeWords.includes(word)) {
                    score--;
                    matchedWords++;
                    negativeMatches++;
                    console.log('Negative word found:', word);
                }
            });

            console.log('Analysis results:', { score, matchedWords, positiveMatches, negativeMatches });

            // Calculate confidence based on matched words and their distribution
            const confidence = matchedWords ? (matchedWords / words.length) * 100 : 0;
            let sentiment;
            let emoji;

            // Determine sentiment with more nuanced thresholds
            if (score > 0) {
                sentiment = 'Positive';
                emoji = '😊';
            } else if (score < 0) {
                sentiment = 'Negative';
                emoji = '😔';
            } else {
                // For neutral, check if there's a balance of positive and negative words
                if (positiveMatches === negativeMatches && positiveMatches > 0) {
                    sentiment = 'Mixed';
                    emoji = '😐';
                } else {
                    sentiment = 'Neutral';
                    emoji = '😐';
                }
            }

            console.log('Final sentiment:', { sentiment, confidence });

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
                <div class="history-text">
                    <div>${text.substring(0, 50)}${text.length > 50 ? '...' : ''}</div>
                    <small>${new Date().toLocaleString()}</small>
                </div>
                <div class="history-sentiment">
                    ${emoji}
                    <span>${confidence.toFixed(1)}%</span>
                </div>
            `;
            
            // Keep only the last 10 items
            while (historyList.children.length >= 10) {
                historyList.removeChild(historyList.lastChild);
            }
            
            historyList.insertBefore(historyItem, historyList.firstChild);

            // Update text statistics
            updateTextStats();
        } catch (error) {
            console.error('Error in sentiment analysis:', error);
            alert('An error occurred while analyzing the text. Please try again.');
        }
    };

    // Analyze button event listener
    analyzeBtn.addEventListener('click', () => {
        console.log('Analyze button clicked');
        analyzeSentiment();
    });

    // Text input event listeners
    textInput.addEventListener('input', updateTextStats);
    textInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeSentiment();
        }
    });

    console.log('All event listeners attached');
});

console.log('Script loaded');
