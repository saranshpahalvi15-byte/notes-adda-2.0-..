import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, BookOpen, PenTool, CheckCircle, Share2, MoreVertical, MessageCircle, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function NcertCorner() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Read');
  const [selectedChapter, setSelectedChapter] = useState('1.1 Introduction');
  const [highlightedText, setHighlightedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs = ['Read', 'Practice', 'NCERT Solutions', 'Highlights & Notes'];
  
  const textContent = `Measurement of any physical quantity involves comparison with a certain basic, arbitrarily chosen, internationally accepted reference standard called unit. The result of a measurement of a physical quantity is expressed by a number (or numerical measure) accompanied by a unit. Although the number of physical quantities appears to be very large, we need only a limited number of units for expressing all the physical quantities, since they are inter-related with one another. The units for the fundamental or base quantities are called fundamental or base units. The units of all other physical quantities can be expressed as combinations of the base units. Such units obtained for the derived quantities are called derived units. A complete set of these units, both the base units and derived units, is known as the system of units.`;

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setHighlightedText(selection.toString());
      setSelectionRect(rect);
      setShowAiPopup(true);
      setAiExplanation(null);
    } else {
      setShowAiPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, []);

  const handleExplain = async (type: 'Sentence' | 'Paragraph') => {
    if (!highlightedText) return;
    setIsExplaining(true);
    setAiExplanation(null);
    try {
       // Replace process.env depending on your Vite setup. Using standard process for now.
       const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : (import.meta as any).env?.VITE_GEMINI_API_KEY;
       if (!apiKey) {
           setAiExplanation("AI API key is missing. Cannot provide explanation.");
           setIsExplaining(false);
           return;
       }
       const ai = new GoogleGenAI({ apiKey });
       const prompt = `Explain the following ${type} from a physics perspective in a simple, easy-to-understand way for a student: "${highlightedText}"`;
       
       const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt
       });
       if (response && response.text) {
         setAiExplanation(response.text);
       }
    } catch (err: any) {
       console.error("AI Explanation error:", err);
       setAiExplanation("Failed to get explanation. Please try again.");
    } finally {
       setIsExplaining(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10 w-full shadow-sm">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Units And Measurement</h1>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar border-b px-4 gap-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 mt-4 relative">
        {activeTab === 'Read' && (
          <div className="bg-white/80 p-8 rounded-2xl shadow-sm min-h-[600px] border border-blue-100">
            <div className="mb-8 flex justify-center">
              <select className="bg-gray-100 border-none rounded-lg px-4 py-2 text-gray-700 font-medium focus:ring-0">
                <option>1.1 Introduction</option>
                <option>1.2 The international system of units</option>
              </select>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-2">Chapter One</h2>
              <h3 className="text-2xl sm:text-3xl font-serif text-gray-900 tracking-wide">
                <span className="text-3xl">U</span>NITS AND <span className="text-3xl">M</span>EASUREMENT
              </h3>
            </div>

            <div className="prose prose-lg mx-auto text-gray-800 leading-relaxed font-serif" ref={contentRef}>
              <p className="mb-6 relative">
                {textContent}
              </p>
              
              <h4 className="text-xl font-bold text-blue-500 mt-12 mb-4 uppercase tracking-wide">1.2 The International System of Units</h4>
              <p>
                 In earlier time scientists of different countries were using different systems of units for measurement.
                 Three such systems, the CGS, the FPS (or British) system and the MKS system were in use extensively till recently.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Practice' && (
          <div className="space-y-6 max-w-3xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center">
                        NCERT Exempler <CheckCircle className="w-4 h-4 ml-2 text-blue-500" />
                      </h3>
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">47 Questions</span>
                   </div>
                   <div className="flex gap-4">
                      <button className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">Start Over</button>
                      <button className="flex-1 py-3 bg-white border border-gray-300 hover:border-indigo-500 hover:text-indigo-600 text-gray-800 font-medium rounded-lg transition-colors shadow-sm">Resume</button>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center">
                        NCERT Line by Line MCQ <CheckCircle className="w-4 h-4 ml-2 text-blue-500" />
                      </h3>
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">55 Questions</span>
                   </div>
                   <div className="flex gap-4">
                      <button className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">Start Over</button>
                      <button className="flex-1 py-3 bg-white border border-gray-300 hover:border-indigo-500 hover:text-indigo-600 text-gray-800 font-medium rounded-lg transition-colors shadow-sm">Resume</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {(activeTab === 'NCERT Solutions' || activeTab === 'Highlights & Notes') && (
           <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
              <p>Coming soon. Content for {activeTab} will appear here.</p>
           </div>
        )}

      </div>
      
      {/* Floating Toolbar & AI Popup */}
      {showAiPopup && selectionRect && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 mt-2 px-2"
          style={{ 
            top: `${Math.min(selectionRect.bottom + window.scrollY, window.innerHeight - 300)}px`, 
            left: `${selectionRect.left + (selectionRect.width / 2)}px`
          }}
        >
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl flex flex-col min-w-[280px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
               <div className="flex gap-4 text-sm font-medium">
                 <button className="hover:text-indigo-300 transition-colors">Highlight</button>
                 <button className="hover:text-indigo-300 transition-colors">Note</button>
                 <button className="hover:text-indigo-300 transition-colors">Copy</button>
                 <button className="hover:text-indigo-300 transition-colors">Share</button>
               </div>
               <button onClick={() => setShowAiPopup(false)} className="text-gray-400 hover:text-white p-1">
                 <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="p-4 bg-white text-gray-900 flex flex-col relative rounded-b-xl">
               <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-800"></div>
               
               <p className="font-semibold text-gray-800 mb-3 text-sm flex items-center">
                 <MessageCircle className="w-4 h-4 mr-2 text-indigo-500" /> What should I explain?
               </p>
               
               {!aiExplanation && !isExplaining && (
                 <div className="flex gap-3">
                   <button 
                     onClick={() => handleExplain('Sentence')}
                     className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                   >
                     Sentence
                   </button>
                   <button 
                     onClick={() => handleExplain('Paragraph')}
                     className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                   >
                     Paragraph
                   </button>
                 </div>
               )}

               {isExplaining && (
                  <div className="flex items-center text-sm text-indigo-600 font-medium py-2">
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing text...
                  </div>
               )}

               {aiExplanation && (
                  <div className="text-sm text-gray-700 mt-2 p-3 bg-indigo-50 rounded-lg max-h-[250px] overflow-y-auto prose prose-sm">
                     <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Floating AI companion icon */}
      <div className="fixed bottom-6 right-6 z-40">
         <div className="w-14 h-14 bg-white border-2 border-blue-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden">
            <img src="https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=e2e8f0" alt="AI Agent" className="w-12 h-12" />
         </div>
      </div>
    </div>
  );
}
