import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Play, RotateCcw, Mic, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { compileCppCode } from '@/lib/cppCompiler';

const DEFAULT_CPP_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;

export function Interview() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('code');
  const [code, setCode] = useState(DEFAULT_CPP_CODE);
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ url: string; timestamp: string }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString();
        setRecordings(prev => [...prev, { url, timestamp }]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRunCode = async () => {
    setIsCompiling(true);
    setOutput('Compiling and running code...\n');

    try {
      const result = await compileCppCode(code);
      let outputText = '';
      
      if (result.output) {
        outputText += result.output;
      }
      if (result.error) {
        outputText += `\nError:\n${result.error}`;
      }

      setOutput(outputText || 'No output');
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'Failed to execute code'}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleReset = () => {
    setCode(DEFAULT_CPP_CODE);
    setOutput('');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Interview #{id}</h2>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Question 1</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Write a C++ program that finds the maximum element in an array.
                </p>
              </div>
              
              {/* Recording Controls */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Voice Recording</h3>
                <div className="space-y-2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="w-full flex items-center justify-center"
                      variant="outline"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="w-full flex items-center justify-center"
                      variant="destructive"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                {/* Recordings List */}
                {recordings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recordings</h4>
                    <div className="space-y-2">
                      {recordings.map((recording, index) => (
                        <div key={recording.timestamp} className="bg-gray-50 p-2 rounded">
                          <audio src={recording.url} controls className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">
                            Recording {index + 1} - {new Date(recording.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'code'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('code')}
              >
                C++ Editor
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'output'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
            </div>
          </div>

          {/* Editor/Output area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' ? (
              <div className="h-full flex flex-col">
                <div className="bg-white p-2 border-b border-gray-200 flex items-center space-x-4">
                  <Button
                    size="sm"
                    onClick={handleRunCode}
                    disabled={isCompiling}
                    className="mr-2"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {isCompiling ? 'Compiling...' : 'Run Code'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isCompiling}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    language="cpp"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: isCompiling,
                      automaticLayout: true,
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        useShadows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 h-full overflow-auto">
                <pre className="bg-white p-4 rounded-lg shadow-sm font-mono text-sm whitespace-pre-wrap">
                  {output || 'welcome!! hello world'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Chat */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium">Chat</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Welcome to the interview session!</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button size="sm">Send</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}