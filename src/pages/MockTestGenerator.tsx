import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { FileText, Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function MockTestGenerator() {
  const { profile } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  
  const questions = result ? result.split('# CHAPTER_SOLUTIONS')[0].replace('# CHAPTER_MOCK_TEST', '').trim() : '';
  const solutions = result ? (result.split('# CHAPTER_SOLUTIONS')[1] || '').trim() : '';


  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const generateTest = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize Gemini SDK
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });

      const prompt = `You are an expert NCERT Indian curriculum exam creator. 
Based on the provided PDF chapter, generate a comprehensive Mock Test followed by detailed Solutions.
The output MUST be structured as follows:
# CHAPTER_MOCK_TEST
[Content of the mock test with sections: MCQs, Short Answer, Long Answer, Case Study]

# CHAPTER_SOLUTIONS
[Content of the solutions]

Format the output clearly in Markdown. Ensure the questions are accurate and directly related to the provided text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf',
            }
          }
        ],
      });

      if (response && response.text) {
        setResult(response.text.replace('# Solutions', '# CHAPTER_SOLUTIONS').replace('# Chapter Mock Test', '# CHAPTER_MOCK_TEST'));
      } else {
        setError('Failed to generate mock test. Invalid response format.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error generating test: ' + (err.message || 'Unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    
    try {
      setIsDownloading(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const { marked } = await import('marked');
      
      const generateFromIframe = async (markdownContent: string, title: string, filename: string) => {
        return new Promise<void>(async (resolve, reject) => {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'absolute';
          iframe.style.width = '800px';
          iframe.style.height = '1000px'; 
          iframe.style.left = '-9999px';
          document.body.appendChild(iframe);
          
          let resolved = false;

          const finish = () => {
            if (!resolved) {
              resolved = true;
              document.body.removeChild(iframe);
            }
          };

          iframe.onload = async () => {
             try {
                const element = iframe.contentDocument?.getElementById('content');
                if (element) {
                   await html2pdf().set({
                      margin: 15,
                      filename,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true, logging: false },
                      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
                   }).from(element).save();
                }
                resolve();
             } catch (e) {
                reject(e);
             } finally {
                finish();
             }
          };

          const htmlContent = await marked.parse(markdownContent);

          const docContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; color: #111827; background-color: #ffffff; }
                  h1 { color: #1e3a8a; text-align: center; text-transform: uppercase; border-bottom: 4px solid #4f46e5; padding-bottom: 20px; font-size: 32px; font-weight: 800; margin-bottom: 8px; }
                  .solutions h1 { color: #064e3b; border-bottom: 4px solid #16a34a; }
                  .subtitle { text-align: center; color: #6b7280; font-weight: 600; margin-bottom: 32px; }
                  h2 { color: #3730a3; margin-top: 30px; font-size: 24px; font-weight: 700; }
                  h3 { color: #4338ca; margin-top: 24px; font-size: 20px; font-weight: 600; }
                  .solutions h2 { color: #065f46; }
                  .solutions h3 { color: #047857; }
                  p { line-height: 1.7; font-size: 16px; margin-bottom: 16px; }
                  ul, ol { margin-bottom: 20px; line-height: 1.7; padding-left: 24px; }
                  li { margin-bottom: 8px; }
                  strong { color: #111827; }
                  pre { background-color: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px; }
                  code { background-color: #f3f4f6; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; }
                  blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; color: #4b5563; font-style: italic; margin-bottom: 16px; }
                  .footer { text-align: center; margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 14px; font-weight: 700; }
                </style>
              </head>
              <body>
                <div id="content" class="${title === 'Mock_Test_Solutions' ? 'solutions' : ''}">
                  <h1>${title.replace(/_/g, ' ')}</h1>
                  <div class="subtitle">
                    ${title === 'Mock_Test_Questions' ? 'Auto-generated Student Assessment' : 'Evaluate Student Responses'}
                  </div>
                  ${htmlContent}
                  <div class="footer">End of Document</div>
                </div>
              </body>
            </html>
          `;
          
          if (iframe.contentDocument) {
             iframe.contentDocument.open();
             iframe.contentDocument.write(docContent);
             iframe.contentDocument.close();
          } else {
             reject(new Error("Iframe content document not available"));
             finish();
          }
        });
      };

      await generateFromIframe(questions, 'Chapter_Mock_Test', 'Mock_Test_Questions.pdf');
      await generateFromIframe(solutions, 'Detailed_Solutions', 'Mock_Test_Solutions.pdf');

    } catch (err: any) {
      console.error(err);
      setError('Error generating PDFs: ' + (err.message || 'Unknown error occurred.'));
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Mock Test Generator</h1>
        <p className="text-gray-600 mb-8">
          Upload an NCERT chapter PDF, and our AI will generate a complete exam-style mock test 
          with MCQs, Short/Long Answers, and Case Studies, plus the full solutions.
        </p>

        {!result ? (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900">
                  {file ? file.name : "Click to upload or drag and drop"}
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  PDF files only (max 10MB recommended)
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-3" />
                {error}
              </div>
            )}

            <button
              onClick={generateTest}
              disabled={!file || loading}
              className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-6 w-6 mr-3" />
                  Generating Test... This may take a minute
                </>
              ) : (
                <>
                  <FileText className="h-6 w-6 mr-3" />
                  Generate Chapter Mock Test
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                Done!
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {isDownloading ? (
                    <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Generating...</>
                  ) : 'Download PDFs'}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Generate Another Test
                </button>
              </div>
            </div>
            
            <div className="prose prose-indigo max-w-none text-left p-6 bg-gray-50 rounded-xl border border-gray-100 markdown-body">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
