import React from 'react';
import { DocumentUpload } from '../../components/features/DocumentUpload';
import { RealtimeTestPanel } from '../../components/features/RealtimeTestPanel';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Real-Time Features & File Processing Test
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Comprehensive testing of real-time URL updates, cross-tab synchronization, and file processing
          </p>
        </div>

        {/* Document Upload Section */}
        <DocumentUpload className="mb-8" />

        {/* Real-Time Test Panel */}
        <RealtimeTestPanel />
      </div>
    </div>
  );
}
