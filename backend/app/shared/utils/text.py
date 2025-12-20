"""
Text processing utilities for the RAG platform
"""
import re
import hashlib
import unicodedata
from typing import List, Dict, Any, Optional, Set, Tuple
from collections import Counter
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class TextProcessor:
    """Text processing utilities"""

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""

        # Normalize unicode characters
        text = unicodedata.normalize('NFKC', text)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove control characters
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

        return text.strip()

    @staticmethod
    def extract_words(text: str) -> List[str]:
        """Extract words from text"""
        if not text:
            return []

        # Clean text first
        text = TextProcessor.clean_text(text)

        # Split on whitespace and punctuation
        words = re.findall(r'\b\w+\b', text.lower())

        return words

    @staticmethod
    def calculate_word_frequency(text: str) -> Dict[str, int]:
        """Calculate word frequency in text"""
        words = TextProcessor.extract_words(text)
        return dict(Counter(words))

    @staticmethod
    def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
        """Truncate text to maximum length"""
        if not text or len(text) <= max_length:
            return text

        return text[:max_length - len(suffix)] + suffix

    @staticmethod
    def split_into_sentences(text: str) -> List[str]:
        """Split text into sentences"""
        if not text:
            return []

        # Simple sentence splitting (can be enhanced with NLTK/spaCy)
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())

        # Filter out empty sentences
        return [s.strip() for s in sentences if s.strip()]

    @staticmethod
    def split_into_chunks(text: str, chunk_size: int = 1000,
                         overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            # If we're not at the end, try to find a good break point
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                last_period = text.rfind('.', start, end)
                last_newline = text.rfind('\n', start, end)

                # Use the latest sentence break found
                break_point = max(last_period, last_newline)
                if break_point > start + chunk_size - 100:  # Within last 100 chars
                    end = break_point + 1

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move start position with overlap
            start = max(start + 1, end - overlap)

        return chunks

    @staticmethod
    def remove_html_tags(text: str) -> str:
        """Remove HTML tags from text"""
        if not text:
            return ""

        # Simple HTML tag removal
        clean = re.sub(r'<[^>]+>', '', text)

        # Clean up extra whitespace
        clean = re.sub(r'\s+', ' ', clean)

        return clean.strip()

    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Extract URLs from text"""
        if not text:
            return []

        # Simple URL regex (can be enhanced)
        url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?'
        urls = re.findall(url_pattern, text)

        return urls

    @staticmethod
    def generate_text_hash(text: str, algorithm: str = 'sha256') -> str:
        """Generate hash of text content"""
        if not text:
            return ""

        text_bytes = text.encode('utf-8')

        if algorithm == 'md5':
            return hashlib.md5(text_bytes).hexdigest()
        elif algorithm == 'sha1':
            return hashlib.sha1(text_bytes).hexdigest()
        elif algorithm == 'sha256':
            return hashlib.sha256(text_bytes).hexdigest()
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm}")

    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """Calculate simple text similarity using Jaccard similarity"""
        if not text1 or not text2:
            return 0.0

        words1 = set(TextProcessor.extract_words(text1))
        words2 = set(TextProcessor.extract_words(text2))

        if not words1 and not words2:
            return 1.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    @staticmethod
    def highlight_keywords(text: str, keywords: List[str],
                          highlight_tag: str = "**") -> str:
        """Highlight keywords in text"""
        if not text or not keywords:
            return text

        result = text
        for keyword in keywords:
            # Case-insensitive replacement
            pattern = re.compile(re.escape(keyword), re.IGNORECASE)
            result = pattern.sub(f"{highlight_tag}\\g<0>{highlight_tag}", result)

        return result

    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 10,
                        min_length: int = 3) -> List[Tuple[str, int]]:
        """Extract keywords using frequency analysis"""
        if not text:
            return []

        words = TextProcessor.extract_words(text)

        # Filter words by length
        filtered_words = [word for word in words if len(word) >= min_length]

        # Count frequencies
        word_freq = Counter(filtered_words)

        # Get most common words
        keywords = word_freq.most_common(max_keywords)

        return keywords

    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """Normalize whitespace in text"""
        if not text:
            return ""

        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)

        # Replace tabs with spaces
        text = text.replace('\t', ' ')

        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')

        # Remove leading/trailing whitespace
        return text.strip()

    @staticmethod
    @lru_cache(maxsize=1000)
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Replace spaces and special chars with hyphens
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)

        # Remove leading/trailing hyphens
        text = text.strip('-')

        return text

    @staticmethod
    def extract_email_addresses(text: str) -> List[str]:
        """Extract email addresses from text"""
        if not text:
            return []

        # Simple email regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)

        return list(set(emails))  # Remove duplicates

    @staticmethod
    def count_characters(text: str, include_spaces: bool = True) -> int:
        """Count characters in text"""
        if not text:
            return 0

        if include_spaces:
            return len(text)
        else:
            return len(text.replace(' ', '').replace('\t', '').replace('\n', ''))

    @staticmethod
    def count_words(text: str) -> int:
        """Count words in text"""
        words = TextProcessor.extract_words(text)
        return len(words)

    @staticmethod
    def estimate_reading_time(text: str, words_per_minute: int = 200) -> float:
        """Estimate reading time in minutes"""
        word_count = TextProcessor.count_words(text)
        return word_count / words_per_minute


class MarkdownProcessor:
    """Markdown-specific text processing utilities"""

    @staticmethod
    def extract_headers(text: str) -> List[Dict[str, Any]]:
        """Extract headers from markdown text"""
        if not text:
            return []

        headers = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()
            if line.startswith('#'):
                # Count # characters to determine level
                level = len(line) - len(line.lstrip('#'))
                title = line[level:].strip()

                if title:
                    headers.append({
                        'level': level,
                        'title': title,
                        'line_number': i + 1
                    })

        return headers

    @staticmethod
    def extract_links(text: str) -> List[Dict[str, str]]:
        """Extract links from markdown text"""
        if not text:
            return []

        links = []

        # Match markdown links [text](url)
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        matches = re.findall(link_pattern, text)

        for text_content, url in matches:
            links.append({
                'text': text_content,
                'url': url
            })

        return links

    @staticmethod
    def extract_code_blocks(text: str) -> List[Dict[str, Any]]:
        """Extract code blocks from markdown text"""
        if not text:
            return []

        code_blocks = []

        # Match fenced code blocks
        fenced_pattern = r'```(\w+)?\n(.*?)\n```'
        matches = re.findall(fenced_pattern, text, re.DOTALL)

        for language, code in matches:
            code_blocks.append({
                'language': language or 'text',
                'code': code.strip(),
                'type': 'fenced'
            })

        # Match inline code
        inline_pattern = r'`([^`]+)`'
        inline_matches = re.findall(inline_pattern, text)

        for code in inline_matches:
            code_blocks.append({
                'language': 'text',
                'code': code,
                'type': 'inline'
            })

        return code_blocks

    @staticmethod
    def strip_markdown(text: str) -> str:
        """Strip markdown formatting from text"""
        if not text:
            return ""

        # Remove headers
        text = re.sub(r'^#{1,6}\s+.*$', '', text, flags=re.MULTILINE)

        # Remove links, keep text
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

        # Remove bold/italic
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)

        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)
        text = re.sub(r'`([^`]+)`', r'\1', text)

        # Clean up whitespace
        text = TextProcessor.normalize_whitespace(text)

        return text
