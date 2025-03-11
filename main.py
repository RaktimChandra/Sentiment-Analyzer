import http.server
import socketserver
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
import os

class SentimentAnalyzer:
    def __init__(self):
        self.word_scores = defaultdict(lambda: defaultdict(float))
        self.initialize_lexicon()
        
    def initialize_lexicon(self):
        # Comprehensive sentiment lexicon with common expressions and emojis
        positive_words = """
        good great excellent amazing wonderful fantastic
        happy joy beautiful perfect love best brilliant
        awesome outstanding superb delightful incredible
        magnificent splendid success positive win winning
        excited thrilled excellent superb outstanding
        proud blessed grateful thankful efficient effective
        innovative creative inspiring motivated dedicated
        accomplished achieved succeeded improved enhanced
        recommended praised appreciated supported helped
        😊 😃 😄 👍 ❤️ 🌟 ✨ 💪 👏 🎉
        """
        
        negative_words = """
        bad terrible horrible awful worst hate sad
        angry upset disappointing poor terrible ugly
        disgusting dreadful unpleasant fail failure
        negative lose losing worse worst problem
        frustrated annoyed unhappy miserable awful
        terrible horrible wrong hate difficult tough
        complicated confusing inefficient ineffective
        problematic concerning worried anxious stressed
        damaged broken failed wasted ruined destroyed
        😠 😢 😭 👎 💔 😤 😫 😩 😰 😱
        """
        
        # Initialize with weighted scores
        for word in positive_words.split():
            self.word_scores[word]['pos'] = 1.0
            
        for word in negative_words.split():
            self.word_scores[word]['neg'] = 1.0
    
    def analyze(self, text):
        if not text:
            return self._create_empty_analysis()
            
        # Text preprocessing and statistics
        words = re.findall(r'\w+|[😊😃😄👍❤️🌟✨💪👏🎉😠😢😭👎💔😤😫😩😰😱]', text.lower())
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        # Sentiment analysis with emoji support
        pos_score = neg_score = 0.1  # Smoothing
        
        for word in words:
            pos_score += self.word_scores[word]['pos']
            neg_score += self.word_scores[word]['neg']
            
        total = pos_score + neg_score
        if total == 0:
            sentiment = 'neutral'
            confidence = 0.5
        else:
            pos_prob = pos_score / total
            sentiment = 'pos' if pos_prob > 0.5 else 'neg'
            confidence = max(pos_prob, 1 - pos_prob)
        
        # Calculate text complexity and statistics
        stats = self._calculate_stats(text, words, sentences)
        
        return {
            'sentiment': sentiment,
            'confidence': confidence,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_stats(self, text, words, sentences):
        if not words:
            return self._create_empty_stats()
            
        # Basic statistics
        word_count = len(words)
        char_count = len(text)
        sentence_count = len(sentences)
        
        # Advanced metrics
        avg_word_length = sum(len(w) for w in words) / word_count
        unique_words = len(set(words))
        vocabulary_diversity = unique_words / word_count
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        
        # Emoji analysis
        emoji_pattern = r'[😊😃😄👍❤️🌟✨💪👏🎉😠😢😭👎💔😤😫😩😰😱]'
        emoji_count = len(re.findall(emoji_pattern, text))
        
        return {
            'word_count': word_count,
            'char_count': char_count,
            'sentence_count': sentence_count,
            'avg_word_length': round(avg_word_length, 2),
            'unique_words': unique_words,
            'vocabulary_diversity': round(vocabulary_diversity, 2),
            'avg_sentence_length': round(avg_sentence_length, 2),
            'emoji_count': emoji_count,
            'readability_score': round(self._calculate_readability(avg_word_length, avg_sentence_length), 2)
        }
    
    def _calculate_readability(self, avg_word_length, avg_sentence_length):
        # Simple readability score (0-10 scale)
        # Lower score means easier to read
        word_factor = min((avg_word_length - 3) * 2, 5)  # Penalize long words
        sentence_factor = min((avg_sentence_length - 10) * 0.3, 5)  # Penalize long sentences
        return max(0, min(word_factor + sentence_factor, 10))
    
    def _create_empty_stats(self):
        return {
            'word_count': 0,
            'char_count': 0,
            'sentence_count': 0,
            'avg_word_length': 0,
            'unique_words': 0,
            'vocabulary_diversity': 0,
            'avg_sentence_length': 0,
            'emoji_count': 0,
            'readability_score': 0
        }
    
    def _create_empty_analysis(self):
        return {
            'sentiment': 'neutral',
            'confidence': 0,
            'stats': self._create_empty_stats(),
            'timestamp': datetime.now().isoformat()
        }

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.analyzer = SentimentAnalyzer()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as f:
                self.wfile.write(f.read())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/analyze':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            text = data.get('text', '')
            analysis = self.analyzer.analyze(text)
            
            response = {
                **analysis,
                'text': text
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    PORT = 9001
    print(f"Starting Sentiment Analyzer server at http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print("Server is running. Press Ctrl+C to stop.")
        httpd.serve_forever()
