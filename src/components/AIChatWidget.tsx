import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Camera, Image as ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hi! I am the new, upgraded **Notes Adda AI**. I am powered by an advanced reasoning model to help you with complex academic concepts, exam prep, and platform navigation. How can I help you excel today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Set to Indian English for better accuracy

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const clearChat = () => {
    setMessages([
      { role: 'model', text: 'Hi! I am the new, upgraded **Notes Adda AI**. I am powered by an advanced reasoning model to help you with complex academic concepts, exam prep, and platform navigation. How can I help you excel today?' }
    ]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const imageData = selectedImage;
    clearImage();
    
    const newMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const env = (import.meta as any).env;
      const apiUrl = env.VITE_API_URL 
        ? `${env.VITE_API_URL}/api/chat` 
        : '/api/chat';

      // Prepare image for Gemini if present
      let imagePayload = null;
      if (imageData) {
        const mimeType = imageData.match(/data:([^;]+);base64/)?.[1] || 'image/jpeg';
        const base64Data = imageData.split(',')[1];
        imagePayload = { mimeType, data: base64Data };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          image: imagePayload
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
          if (errorData.details) errorMessage += `: ${errorData.details}`;
        } catch (e) {
          // Ignore json parse error
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      // Add an empty model message that we will update as chunks arrive
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      setIsLoading(false); // Turn off loading dots once stream starts

      if (reader) {
        let buffer = '';
        let hasReceivedData = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.text) {
                  hasReceivedData = true;
                  aiResponse += data.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = aiResponse;
                    return updated;
                  });
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing stream chunk', e);
              }
            }
          }
        }
        
        if (!hasReceivedData) {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = 'Sorry, I could not generate a response. Please try again.';
            return updated;
          });
        }
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      setMessages(prev => {
        const updated = [...prev];
        // If the last message is from the model and is empty, replace it
        if (updated[updated.length - 1].role === 'model' && !updated[updated.length - 1].text) {
          updated[updated.length - 1].text = `Error: ${error.message || 'Please try again later.'}`;
        } else {
          updated.push({ role: 'model', text: `Error: ${error.message || 'Please try again later.'}` });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        drag
        dragConstraints={{ 
          left: -window.innerWidth + 100, 
          right: 0, 
          top: -window.innerHeight + 100, 
          bottom: 0 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all z-50 flex items-center justify-center ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Sparkles className="w-6 h-6 absolute animate-ping opacity-20" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </motion.button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[450px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-all transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center shadow-md z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Notes Adda AI</h3>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={clearChat} className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 dark:hover:bg-black/20 rounded-lg transition-colors" title="Clear Chat">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 dark:hover:bg-black/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 dark:bg-gray-950/50 transition-colors">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Placeholder for images in user messages if we were to display them in history */}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm p-4 shadow-sm flex space-x-2 items-center h-12">
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-indigo-500 shadow-md" />
              <button 
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex space-x-2 items-end">
            <div className="flex space-x-1 mb-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Upload Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={isListening ? "Listening..." : "Ask a complex question..."}
                className="w-full max-h-32 min-h-[44px] bg-transparent px-4 py-3 text-sm focus:outline-none resize-none dark:text-white dark:placeholder-gray-500"
                rows={1}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all shadow-sm flex-shrink-0 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={isListening ? "Stop Listening" : "Voice Command"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">AI can make mistakes. Verify important academic information.</p>
        </form>
      </div>
    </>
  );
}
