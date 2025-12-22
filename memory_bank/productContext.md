# Product Context - Web RAG Backup

## Why This Project Exists

This application provides a unified workflow for:

1. Discovering PDF documents from websites through automated crawling
2. Processing and extracting content from PDFs
3. Building a personal knowledge base from collected documents
4. Querying the knowledge base using AI (RAG)

## Problems It Solves

### Manual PDF Collection

- Automates the tedious process of finding and downloading PDFs from websites
- Multi-stage crawling captures links across paginated content

### Document Organization

- Centralizes PDFs from multiple sources
- Categories and tags for easy retrieval
- Storage statistics for capacity planning

### Information Retrieval

- Natural language queries against document collection
- AI-powered responses with source attribution
- Quick prompts for common query patterns

## How It Should Work

### User Flow

1. **Add Crawl Job** → Enter website URL → System discovers pages
2. **Discover PDFs** → System extracts PDF links → Auto/manual download
3. **Process PDFs** → Upload to processing queue → Extract text/metadata
4. **Query Knowledge** → Ask questions → Get AI responses with sources

### Key Interactions

- Sidebar navigation between main features
- Drag-and-drop file uploads
- Real-time progress indicators
- Chat-based RAG interface

## User Experience Goals

- **Intuitive**: Clear navigation and visual hierarchy
- **Responsive**: Works on desktop and mobile
- **Fast**: Lazy loading, virtualization for large lists
- **Informative**: Status badges, progress bars, activity logging
