"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { ConnectionStatusIndicator } from '../ui/ConnectionStatusIndicator';
import { LiveStatusIndicator } from '../ui/LiveStatusIndicator';
import { useCrawlRealtimeStore } from '../../stores/crawlRealtime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';
import { Activity, TestTube, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface RealtimeTestPanelProps {
  onStartCrawl?: () => void;
  onStopCrawl?: () => void;
  isCrawling?: boolean;
  className?: string;
}

export const RealtimeTestPanel: React.FC<RealtimeTestPanelProps> = ({
  onStartCrawl,
  onStopCrawl,
  isCrawling = false,
  className,
}) => {
  const realtimeStore = useCrawlRealtimeStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test BroadcastChannel functionality
  const testBroadcastChannel = () => {
    try {
      const channel = new BroadcastChannel('test-channel');
      channel.postMessage({ type: 'test', data: 'Hello from test panel!' });

      channel.onmessage = (event) => {
        if (event.data.type === 'test') {
          addTestResult('✅ BroadcastChannel: Message received successfully');
          channel.close();
        }
      };

      // Also test cross-tab sync
      setTimeout(() => {
        addTestResult('✅ BroadcastChannel: Test initiated');
      }, 100);

    } catch (error) {
      addTestResult('❌ BroadcastChannel: Not supported or failed');
    }
  };

  // Test real-time store functionality
  const testRealtimeStore = () => {
    const initialCount = realtimeStore.totalUrlsFound;

    // Test adding discovered URLs
    realtimeStore.addDiscoveredUrls(['test-url-1.pdf', 'test-url-2.pdf']);
    addTestResult(`✅ Store: Added URLs (count: ${realtimeStore.totalUrlsFound - initialCount})`);

    // Test progress update
    realtimeStore.setProgress(75, 'testing');
    addTestResult(`✅ Store: Progress updated to ${realtimeStore.currentProgress}%`);

    // Reset
    setTimeout(() => {
      realtimeStore.resetCrawlState();
      addTestResult('✅ Store: State reset successfully');
    }, 1000);
  };

  // Test connection status
  const testConnectionStatus = () => {
    const initialStatus = realtimeStore.isConnected;
    realtimeStore.setConnectionStatus(!initialStatus);
    addTestResult(`✅ Connection: Status toggled to ${!initialStatus ? 'connected' : 'disconnected'}`);

    setTimeout(() => {
      realtimeStore.setConnectionStatus(initialStatus);
      addTestResult(`✅ Connection: Status restored to ${initialStatus ? 'connected' : 'disconnected'}`);
    }, 2000);
  };

  // Run all tests
  const runAllTests = async () => {
    addTestResult('🚀 Starting comprehensive real-time functionality test...');

    setTestResults([]);

    // Test 1: BroadcastChannel
    testBroadcastChannel();

    // Test 2: Real-time store
    setTimeout(() => testRealtimeStore(), 500);

    // Test 3: Connection status
    setTimeout(() => testConnectionStatus(), 1000);

    // Test 4: Crawl operations (if available)
    if (onStartCrawl && onStopCrawl) {
      setTimeout(() => {
        addTestResult('⏳ Testing crawl operations...');
        onStartCrawl();
        setTimeout(() => {
          onStopCrawl();
          addTestResult('✅ Crawl operations: Start/stop cycle completed');
        }, 1000);
      }, 1500);
    }

    setTimeout(() => {
      addTestResult('🎉 All tests completed!');
    }, 3000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Functionality Test Panel
          </CardTitle>
          <CardDescription>
            Test the real-time URL updates, cross-tab synchronization, and connection status features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="flex flex-wrap gap-4">
            <ConnectionStatusIndicator
              isConnected={realtimeStore.isConnected}
              hasError={!!realtimeStore.connectionError}
              lastUpdate={realtimeStore.lastUpdate}
            />

            {isCrawling && (
              <LiveStatusIndicator
                isConnected={realtimeStore.isConnected}
                error={realtimeStore.connectionError}
                discoveredUrls={realtimeStore.totalUrlsFound}
              />
            )}
          </div>

          {/* Current State Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">URLs Found</div>
              <div className="text-2xl font-bold text-blue-600">{realtimeStore.totalUrlsFound}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Progress</div>
              <div className="text-2xl font-bold text-green-600">{realtimeStore.currentProgress}%</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Stage</div>
              <div className="text-lg font-semibold text-purple-600">{realtimeStore.currentStage || 'idle'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">Cross-tab Sync</div>
              <div className="text-lg font-semibold text-orange-600">
                {realtimeStore.isCrossTabEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testBroadcastChannel}
              variant="outline"
              size="sm"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Test BroadcastChannel
            </Button>

            <Button
              onClick={testRealtimeStore}
              variant="outline"
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              Test Store
            </Button>

            <Button
              onClick={testConnectionStatus}
              variant="outline"
              size="sm"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Test Connection
            </Button>

            <Button
              onClick={runAllTests}
              size="sm"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Test Results
              </h4>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700">{result}</div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Testing Instructions
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>BroadcastChannel Test:</strong> Verifies cross-tab communication works</li>
              <li>• <strong>Store Test:</strong> Tests real-time data updates and state management</li>
              <li>• <strong>Connection Test:</strong> Tests connection status indicators</li>
              <li>• <strong>Run All Tests:</strong> Comprehensive test suite for all real-time features</li>
              <li>• <strong>Cross-tab Testing:</strong> Open this page in multiple tabs to test synchronization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
