import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Scissors, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Set up PDF.js worker using local import for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function AdminPDFSplitter() {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [classLevel, setClassLevel] = useState('9');
  const [subject, setSubject] = useState('Science');
  const [price, setPrice] = useState(25);
  
  const [extracting, setExtracting] = useState(false);
  const [extractedPages, setExtractedPages] = useState<{ pageNum: number, dataUrl: string }[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<number[]>([]);
  
  const [pdfUrl, setPdfUrl] = useState('');
  const [splitPdfBytes, setSplitPdfBytes] = useState<Uint8Array | null>(null);
  
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPdfFile(file);
    setError('');
    setExtractedPages([]);
    setSelectedPreviews([]);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setEndPage(Math.min(10, pdf.numPages)); // Default end page
    } catch (err: any) {
      setError('Failed to load PDF. Please try another file.');
      console.error(err);
    }
  };

  const handleExtract = async () => {
    if (!pdfDoc || !pdfFile) {
      setError('Please upload a PDF first.');
      return;
    }
    if (startPage < 1 || endPage > totalPages || startPage > endPage) {
      setError('Invalid page range.');
      return;
    }

    setExtracting(true);
    setError('');
    setExtractedPages([]);
    setSelectedPreviews([]);

    try {
      const pages: { pageNum: number, dataUrl: string }[] = [];
      
      // Render each page to an image
      for (let i = startPage; i <= endPage; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Good quality for preview
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          // Compress image to save space
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          pages.push({ pageNum: i, dataUrl });
        }
      }
      
      // 1. Create the new split PDF
      const originalPdfBytes = await pdfFile.arrayBuffer();
      const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
      const newPdfDoc = await PDFDocument.create();
      
      // PDF-lib uses 0-based indexing
      const pageIndices = [];
      for (let i = startPage; i <= endPage; i++) {
        pageIndices.push(i - 1);
      }
      
      const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, pageIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      
      const newPdfBytes = await newPdfDoc.save();
      setSplitPdfBytes(newPdfBytes);
      
      // Trigger download of the split PDF
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chapterTitle || 'Chapter'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExtractedPages(pages);
      // Auto-select first 3 pages as previews
      setSelectedPreviews(pages.slice(0, 3).map(p => p.pageNum));
      
      setSuccess('PDF split successfully! The file has been downloaded to your computer. Please upload it to Google Drive and paste the link below to publish.');
    } catch (err: any) {
      setError('Failed to extract pages. ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const togglePreview = (pageNum: number) => {
    setSelectedPreviews(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(p => p !== pageNum);
      } else {
        if (prev.length >= 4) {
          setError('You can select a maximum of 4 preview images.');
          return prev;
        }
        setError('');
        return [...prev, pageNum];
      }
    });
  };

  const compressImage = (dataUrl: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
  };

  const handlePublish = async () => {
    if (!chapterTitle) {
      setError('Please enter a chapter title.');
      return;
    }
    if (selectedPreviews.length === 0) {
      setError('Please select at least one preview image.');
      return;
    }
    if (!pdfUrl) {
      setError('Please paste the Google Drive link for the split PDF.');
      return;
    }
    if (!pdfFile) return;

    setPublishing(true);
    setError('');

    try {
      // 1. Get the selected preview images
      let previewImages = extractedPages
        .filter(p => selectedPreviews.includes(p.pageNum))
        .map(p => p.dataUrl);

      // Compress images to ensure they fit in Firestore (1MB limit)
      const compressedImages = [];
      for (const imgUrl of previewImages) {
        // Compress to max width 800px and 0.6 quality
        const compressed = await compressImage(imgUrl, 800, 0.6);
        compressedImages.push(compressed);
      }
      previewImages = compressedImages;

      // Check size limit again and aggressively compress if needed
      let totalSize = previewImages.reduce((acc, img) => acc + img.length, 0);
      
      if (totalSize > 900000) {
        const aggressiveImages = [];
        for (const imgUrl of previewImages) {
          const compressed = await compressImage(imgUrl, 600, 0.4);
          aggressiveImages.push(compressed);
        }
        previewImages = aggressiveImages;
        totalSize = previewImages.reduce((acc, img) => acc + img.length, 0);
        
        if (totalSize > 900000) {
          throw new Error('Images are still too large after compression. Please select fewer images.');
        }
      }

      // 2. Save to Firestore
      const noteData = {
        title: chapterTitle,
        description: `Complete notes for ${chapterTitle} (Pages ${startPage}-${endPage} from Master Bundle).`,
        classLevel,
        subject,
        price,
        isFeatured: false,
        pdfUrl: pdfUrl,
        previewImages,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'notes'), noteData);
      
      setSuccess(`Successfully published "${chapterTitle}"!`);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
      
    } catch (err: any) {
      setError('Failed to publish: ' + err.message);
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center mb-6">
        <Scissors className="w-6 h-6 text-indigo-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">PDF Splitter & Preview Selector</h2>
      </div>
      
      <p className="text-gray-600 mb-8">
        Upload a large Master Bundle PDF, select the page range for a specific chapter, and visually choose which pages to use as preview images.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md text-sm flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-md text-sm flex items-start">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Step 1: Upload */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange}
          className="hidden" 
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
          <FileUp className="w-10 h-10 text-indigo-500 mb-3" />
          <span className="text-indigo-600 font-medium hover:text-indigo-800">
            {pdfFile ? pdfFile.name : 'Click to upload Master PDF Bundle'}
          </span>
          {totalPages > 0 && (
            <span className="text-sm text-gray-500 mt-2">{totalPages} pages loaded</span>
          )}
        </label>
      </div>

      {/* Step 2: Extract */}
      {pdfDoc && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">1. Define Chapter Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
              <input 
                type="text" 
                value={chapterTitle} 
                onChange={e => setChapterTitle(e.target.value)}
                placeholder="e.g., Chapter 3: Atoms & Molecules"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="jee">JEE</option>
                  <option value="neet">NEET</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Page</label>
              <input 
                type="number" 
                min="1" 
                max={totalPages} 
                value={startPage} 
                onChange={e => setStartPage(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Page</label>
              <input 
                type="number" 
                min={startPage} 
                max={totalPages} 
                value={endPage} 
                onChange={e => setEndPage(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button 
              onClick={handleExtract}
              disabled={extracting}
              className="w-full bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-md hover:bg-indigo-200 disabled:opacity-50"
            >
              {extracting ? 'Extracting...' : 'Extract Pages'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Previews */}
      {extractedPages.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">2. Select Preview Images</h3>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {selectedPreviews.length}/4 Selected
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Click on the pages you want to show as free previews to students.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
            {extractedPages.map((page) => {
              const isSelected = selectedPreviews.includes(page.pageNum);
              return (
                <div 
                  key={page.pageNum}
                  onClick={() => togglePreview(page.pageNum)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="w-full h-auto object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                    Pg {page.pageNum}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Publish */}
      {extractedPages.length > 0 && splitPdfBytes && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">3. Upload & Publish</h3>
          <p className="text-sm text-gray-600 mb-4">
            The split PDF has been downloaded to your computer. Please upload it to your Google Drive, make sure the link sharing is set to "Anyone with the link", and paste the link below.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive PDF Link <span className="text-red-500">*</span></label>
            <input 
              type="url" 
              value={pdfUrl} 
              onChange={e => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button 
              onClick={handlePublish}
              disabled={publishing || selectedPreviews.length === 0 || !chapterTitle || !pdfUrl}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {publishing ? 'Publishing Chapter...' : 'Publish Chapter to Store'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
