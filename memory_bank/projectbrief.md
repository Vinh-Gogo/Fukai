# Project Brief - Web RAG Backup

## Project Overview
A Next.js web application for managing web crawling, PDF processing, and RAG (Retrieval-Augmented Generation) queries. The system allows users to crawl websites for PDF links, process PDFs, and query them using AI.

## Core Requirements

### 1. Web Crawling Dashboard
- Add and manage crawl jobs by URL
- Multi-stage crawling: pages → articles → PDF links
- Auto-download capability for discovered PDFs
- Progress tracking and status reporting

### 2. PDF Processing Pipeline
- Upload and manage PDF files
- Process PDFs for text extraction
- Virtual list rendering for large file lists
- PDF viewer with zoom, search, and navigation

### 3. Archive Management
- Organize downloaded/uploaded files
- Category-based filtering
- Storage statistics
- Bulk file operations

### 4. RAG Query Interface
- Chat-based AI query system
- Quick prompts for common actions
- Message history with confidence scores
- Source attribution

### 5. Activity Dashboard
- Track user activities
- Visualize trends and statistics
- Filter by time range and activity type

## Technical Goals
- Clean, modular architecture
- Type-safe with TypeScript
- Consistent UI/UX patterns
- Optimized for performance
- SSR-compatible (Next.js App Router)

## Success Metrics
- Fast page loads with dynamic imports
- Responsive design across devices
- Maintainable, well-organized codebase
- Consistent styling and component patterns
