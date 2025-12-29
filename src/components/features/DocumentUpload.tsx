"use client";

import React, { useState } from 'react';
import { FileUpload } from '../ui/FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { RefreshCw, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessedDocument {
  document_id: string;
  filename: string;
  chunks_created: number;
  total_tokens: number;
  processing_time: number;
  pages: number;
}

interface DocumentUploadProps {
  onDocumentProcessed?: (document: ProcessedDocument) => void;
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentProcessed,
  className,
}) => {
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileProcessed = (result: ProcessedDocument) => {
    setProcessedDocuments(prev => [result, ...prev]);
    onDocumentProcessed?.(result);

    toast.success(`Successfully processed ${result.filename}`, {
      description: `${result.chunks_created} chunks created, ${result.total_tokens} tokens estimated`,
    });
  };

  const handleUploadError = (error: string) => {
    toast.error('Upload failed', {
      description: error,
    });
  };

  const handleRefreshDocuments = async () => {
    setIsLoading(true);
    try {
      // This would fetch the latest documents from the API
      // For now, we'll just show a loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.info('Document list refreshed');
    } catch (error) {
      toast.error('Failed to refresh documents');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Upload & Processing
          </CardTitle>
          <CardDescription>
            Upload PDF documents for automatic text extraction and chunking.
            Documents are processed immediately and stored for RAG applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileProcessed={handleFileProcessed}
            onError={handleUploadError}
            acceptedTypes={['.pdf']}
            maxFileSize={50 * 1024 * 1024} // 50MB
          />
        </CardContent>
      </Card>

      {/* Recent Uploads Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Recent Uploads
              </CardTitle>
              <CardDescription>
                Documents processed in this session
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {processedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No documents processed yet</p>
              <p className="text-sm">Upload a PDF document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processedDocuments.map((doc, index) => (
                <div
                  key={doc.document_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>{doc.pages} pages</span>
                        <span>{doc.chunks_created} chunks</span>
                        <span>{doc.total_tokens} tokens</span>
                        <span>{doc.processing_time.toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Processed
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // This would navigate to document details or RAG interface
                        toast.info(`Opening ${doc.filename} for RAG queries`);
                      }}
                    >
                      Use for RAG
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Processing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">What happens during processing:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Text extraction from PDF pages</li>
                <li>• Intelligent text chunking with overlap</li>
                <li>• Metadata extraction (title, author, etc.)</li>
                <li>• Token estimation for LLM processing</li>
                <li>• Database storage for RAG retrieval</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Supported formats:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• PDF documents (currently supported)</li>
                <li>• Automatic text cleaning and normalization</li>
                <li>• Page-aware chunking</li>
                <li>• Sentence boundary detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
