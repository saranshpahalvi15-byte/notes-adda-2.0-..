import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface MockTestEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockTest: any;
}

export default function MockTestEvaluationModal({ isOpen, onClose, mockTest }: MockTestEvaluationModalProps) {
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState('');

  if (!isOpen || !mockTest) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 2000000) { // Limit user upload to 2MB to ensure API doesn't choke, though Gemini can handle more
        setError('File is too large. Please upload a file under 2MB.');
        return;
      }
      setAnswerFile(e.target.files[0]);
      setError('');
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleEvaluate = async () => {
    if (!answerFile) {
      setError("Please upload your answers before evaluating.");
      return;
    }
    setError('');
    setLoading(true);
    setEvaluation('');

    try {
      const userAnswersDataUrl = await readFileAsDataURL(answerFile);
      const userAnswersBase64 = userAnswersDataUrl.split(',')[1];
      const userMimeType = answerFile.type || 'application/pdf';

      if (!mockTest.solutionBase64) {
        throw new Error("This mock test does not have an official evaluation solution attached yet. Please contact support.");
      }

      const response = await fetch('/api/evaluate-mock-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswersBase64,
          userMimeType,
          solutionBase64: mockTest.solutionBase64,
          solutionMimeType: mockTest.solutionMimeType || 'application/pdf',
          maxMarks: mockTest.maxMarks || 100
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to evaluate mock test');

      setEvaluation(data.evaluation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Expert Evaluation: {mockTest.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Upload your answers to receive instant, expert human-like grading.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!evaluation && !loading && (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Answer Sheet</h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                Scan your handwritten answers or upload a typed document (PDF, PNG, JPG). Max size 2MB.
              </p>
              
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
                <span>Select File</span>
                <input 
                  type="file" 
                  accept="application/pdf, image/png, image/jpeg" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>

              {answerFile && (
                <div className="mt-6 flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{answerFile.name}</span>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert evaluation is in progress...</h3>
              <p className="text-gray-500 text-center max-w-md">
                We are carefully comparing your step-by-step methods with the official solution. This may take up to a minute.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {evaluation && !loading && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 prose prose-indigo max-w-none prose-sm sm:prose-base">
              <div className="markdown-body">
                <Markdown>{evaluation}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {evaluation ? (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEvaluate}
                disabled={!answerFile || loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Evaluate Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
