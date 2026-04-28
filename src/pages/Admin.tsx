import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Edit, Trash2, Image as ImageIcon, FileText, Package, Tag, ShoppingBag, Scissors, Mic, BrainCircuit, FileSignature } from 'lucide-react';
import AdminPDFSplitter from './AdminPDFSplitter';
import { AdminMindMaps, AdminMindMapForm } from './AdminMindMaps';
import { AdminMockTests, AdminMockTestForm } from './AdminMockTests';
import MockTestGenerator from './MockTestGenerator';

function AdminNotes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, 'notes'));
      const snapshot = await getDocs(q);
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      fetchNotes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Notes</h2>
        <Link to="new-note" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Note
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notes.map(note => (
                <tr key={note.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{note.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Class {note.classLevel} • {note.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{note.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`edit-note/${note.id}`} className="text-indigo-600 hover:text-indigo-900 inline-block mr-4">
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminAudioNotes() {
  const [audioNotes, setAudioNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAudioNotes();
  }, []);

  const fetchAudioNotes = async () => {
    try {
      const q = query(collection(db, 'audioNotes'));
      const snapshot = await getDocs(q);
      setAudioNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'audioNotes', id));
      fetchAudioNotes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Audio Notes</h2>
        <Link to="new-audio-note" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Audio Note
        </Link>
      </div>
      
      {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
      
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audioNotes.map(note => (
                <tr key={note.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{note.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Class {note.classLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{note.price || 5}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/audio-notes/edit-audio-note/${note.id}`} className="text-indigo-600 hover:text-indigo-900 inline-block mr-4">
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminAudioNoteForm() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', classLevel: '9', audioUrl: '', noteId: '', price: 5, discountPercent: '' as number | string });
  const [notes, setNotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchAudio = async () => {
        const docRef = doc(db, 'audioNotes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            classLevel: data.classLevel || '9',
            audioUrl: data.audioUrl || '',
            noteId: data.noteId || '',
            price: data.price !== undefined ? data.price : 5,
            discountPercent: data.discountPercent !== undefined ? data.discountPercent : ''
          });
        }
      };
      fetchAudio();
    }
  }, [id]);

  useEffect(() => {
    fetchNotes();
  }, [formData.classLevel]);

  const fetchNotes = async () => {
    try {
      const q = query(
        collection(db, 'notes'),
        where('classLevel', '==', formData.classLevel)
      );
      const snapshot = await getDocs(q);
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Sort by subject then title
      fetchedNotes.sort((a, b) => {
        if (a.subject < b.subject) return -1;
        if (a.subject > b.subject) return 1;
        return a.title.localeCompare(b.title);
      });
      setNotes(fetchedNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    note.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.audioUrl && !audioFile) {
      alert("Please provide an Audio URL or upload an audio file.");
      return;
    }
    
    if (audioFile && audioFile.size > 700 * 1024) {
      alert(`Audio file is too large (${(audioFile.size / 1024 / 1024).toFixed(2)} MB). Please use a file smaller than ~700KB, or upload your audio to Google Drive and paste the link in the Audio URL field instead to avoid Firestore limits.`);
      return;
    }

    try {
      setUploading(true);
      let finalAudioUrl = formData.audioUrl;
      
      if (audioFile) {
        const reader = new FileReader();
        finalAudioUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(audioFile);
        });
      }

      const audioNoteData: any = { 
        title: formData.title,
        classLevel: formData.classLevel,
        audioUrl: finalAudioUrl,
        noteId: formData.noteId === '' ? null : formData.noteId,
        price: Number(formData.price)
      };
      
      if (formData.discountPercent !== '') {
        audioNoteData.discountPercent = Number(formData.discountPercent);
      }
      
      if (!id) {
        audioNoteData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'audioNotes'), audioNoteData);
      } else {
        await updateDoc(doc(db, 'audioNotes', id), audioNoteData);
      }
      
      navigate('/admin/audio-notes');
    } catch (err: any) {
      console.error("Error adding audio note:", err);
      alert("Failed to add audio note: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Audio Note' : 'Add Audio Note'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
          <input type="number" min="0" max="100" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="e.g. 20 (Optional)" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Class</label>
          <select value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value, noteId: ''})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
            <option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="jee">JEE</option><option value="neet">NEET</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Audio URL</label>
          <input type="url" value={formData.audioUrl} onChange={e => setFormData({...formData, audioUrl: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Associate with Specific Note/Chapter (Optional)</label>
          <div className="mt-1 space-y-2">
            <input 
              type="text" 
              placeholder="Search by title or subject..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <select 
              value={formData.noteId} 
              onChange={e => {
                console.log("Selected noteId:", e.target.value);
                setFormData({...formData, noteId: e.target.value});
              }}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">General (All notes in this class)</option>
              {filteredNotes.map(note => (
                <option key={note.id} value={note.id}>[{note.subject}] {note.title}</option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-500">If you select a specific note, the audio will only appear on that note's page.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Or Upload Audio File</label>
          <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full" />
        </div>
        <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">{uploading ? 'Adding...' : 'Add Audio Note'}</button>
      </form>
    </div>
  );
}

function AdminNoteForm() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    price: 25,
    discountPercent: '' as number | string,
    isFeatured: false,
    pdfUrl: '',
    audioNoteUrl: ''
  });
  const [previewImageFiles, setPreviewImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchNote = async () => {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            description: data.description || '',
            classLevel: data.classLevel || '9',
            subject: data.subject || '',
            price: data.price || 0,
            discountPercent: data.discountPercent !== undefined ? data.discountPercent : '',
            isFeatured: data.isFeatured || false,
            pdfUrl: data.pdfUrl || '',
            audioNoteUrl: data.audioNoteUrl || ''
          });
        }
      };
      fetchNote();
    }
  }, [id]);

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = [...previewImageFiles];
      newFiles[index] = e.target.files[0];
      setPreviewImageFiles(newFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdfUrl) {
      setError("Please provide a PDF link (e.g., Google Drive link).");
      return;
    }

    try {
      setError('');
      setUploading(true);

      // Helper to read file as Data URI
      const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // Convert Preview Images
      const previewImages = [];
      const validFiles = previewImageFiles.filter(f => f !== null) as File[];
      for (const file of validFiles) {
        const imgUrl = await readFileAsDataURL(file);
        previewImages.push(imgUrl);
      }

      // Check total size to prevent Firestore limits (approx 1MB limit for document size)
      let totalSize = 0;
      previewImages.forEach(img => totalSize += img.length);
      
      // Keeping it well below 1MB to be safe with base64 overhead
      if (totalSize > 800000) { 
        throw new Error(`Images are too large (${(totalSize / 1024 / 1024).toFixed(2)} MB). Please compress your images to stay under ~800KB total for Firestore.`);
      }

      let noteData: any = {
        ...formData,
        rating: 0,
        reviewCount: 0
      };
      
      if (formData.discountPercent !== '') {
        noteData.discountPercent = Number(formData.discountPercent);
      } else {
        delete noteData.discountPercent;
      }
      
      if (previewImages.length > 0) {
        noteData.previewImages = previewImages;
      }
      
      if (!id) {
        noteData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'notes'), noteData);
      } else {
        delete noteData.rating;
        delete noteData.reviewCount;
        await updateDoc(doc(db, 'notes', id), noteData);
      }
      
      navigate('/admin');
    } catch (err: any) {
      console.error("Error adding note:", err);
      setError(err.message || "Failed to add note.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Note' : 'Add New Note'}</h2>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="jee">JEE</option>
              <option value="neet">NEET</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
            <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
            <input type="number" min="0" max="100" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="e.g. 20 (Optional)" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">PDF Download Link (e.g., Google Drive)</label>
            <input 
              type="url" 
              required 
              value={formData.pdfUrl}
              onChange={e => setFormData({...formData, pdfUrl: e.target.value})}
              placeholder="https://drive.google.com/file/d/..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Audio Note URL (Optional)</label>
            <input 
              type="url" 
              value={formData.audioNoteUrl}
              onChange={e => setFormData({...formData, audioNoteUrl: e.target.value})}
              placeholder="https://..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview Images (PNG/JPG)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((num, index) => (
              <div key={num} className="border border-gray-200 p-3 rounded-md bg-gray-50">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Image {num} {num <= 3 ? <span className="text-red-500">*</span> : <span className="text-gray-400">(Optional)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  required={num <= 3 && !id}
                  onChange={(e) => handleImageChange(index, e)} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={formData.isFeatured}
              onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Feature this note on the homepage</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin')} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={uploading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {uploading ? 'Uploading & Saving...' : 'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminBundles() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const q = query(collection(db, 'bundles'));
      const snapshot = await getDocs(q);
      setBundles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bundles', id));
      fetchBundles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Bundles</h2>
        <Link to="new-bundle" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Bundle
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bundles.map(bundle => (
                <tr key={bundle.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bundle.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Class {bundle.classLevel} • {bundle.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{bundle.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/bundles/edit-bundle/${bundle.id}`} className="text-indigo-600 hover:text-indigo-900 inline-block mr-4">
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(bundle.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminBundleForm() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [mindMaps, setMindMaps] = useState<any[]>([]);
  const [audioNotes, setAudioNotes] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    price: 39,
    discountPercent: '' as number | string,
    noteIds: [] as string[],
    mindMapIds: [] as string[],
    audioNoteIds: [] as string[],
    mockTestIds: [] as string[],
    pdfUrl: '',
    isFeatured: false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchBundle = async () => {
        const docRef = doc(db, 'bundles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            description: data.description || '',
            classLevel: data.classLevel || '9',
            subject: data.subject || '',
            price: data.price || 39,
            discountPercent: data.discountPercent !== undefined ? data.discountPercent : '',
            noteIds: data.noteIds || [],
            mindMapIds: data.mindMapIds || [],
            audioNoteIds: data.audioNoteIds || [],
            mockTestIds: data.mockTestIds || [],
            pdfUrl: data.pdfUrl || '',
            isFeatured: data.isFeatured || false
          });
        }
      };
      fetchBundle();
    }
  }, [id]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [notesSnap, mindMapsSnap, audioNotesSnap, mockTestsSnap] = await Promise.all([
          getDocs(query(collection(db, 'notes'))),
          getDocs(query(collection(db, 'mindMaps'))),
          getDocs(query(collection(db, 'audioNotes'))),
          getDocs(query(collection(db, 'mockTests')))
        ]);
        
        setNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setMindMaps(mindMapsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAudioNotes(audioNotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setMockTests(mockTestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      formData.noteIds.length === 0 && 
      formData.mindMapIds.length === 0 && 
      formData.audioNoteIds.length === 0 && 
      formData.mockTestIds.length === 0 && 
      !formData.pdfUrl.trim()
    ) {
      setError('Please either provide a Combined Bundle PDF URL or select at least one item (Note, Mind Map, Audio Note, Mock Test).');
      return;
    }

    try {
      setError('');
      setSaving(true);
      
      // Auto-collect preview images from notes of the same class and subject
      const matchingNotes = notes.filter(n => n.classLevel === formData.classLevel && n.subject.toLowerCase() === formData.subject.toLowerCase());
      const previewImages = matchingNotes.flatMap(n => n.previewImages || []).slice(0, 5); // Kept lower to stay well within 1MB total

      const bundleData: any = {
        ...formData,
        previewImages
      };
      
      if (formData.discountPercent !== '') {
        bundleData.discountPercent = Number(formData.discountPercent);
      } else {
        delete bundleData.discountPercent;
      }
      
      if (!id) {
        bundleData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'bundles'), bundleData);
      } else {
        await updateDoc(doc(db, 'bundles', id), bundleData);
      }
      
      navigate('/admin/bundles');
    } catch (err: any) {
      console.error("Error adding bundle:", err);
      setError(err.message || "Failed to add bundle");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (type: 'noteIds' | 'mindMapIds' | 'audioNoteIds' | 'mockTestIds', id: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(id) 
        ? prev[type].filter(iId => iId !== id)
        : [...prev[type], id]
    }));
  };

  const renderSection = (title: string, items: any[], type: 'noteIds' | 'mindMapIds' | 'audioNoteIds' | 'mockTestIds') => {
    let filtered = items.filter(i => i.classLevel === formData.classLevel);
    if (type !== 'audioNoteIds') {
      filtered = filtered.filter(i => (i.subject || '').toLowerCase() === (formData.subject || '').toLowerCase());
    }
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select {title}</label>
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
          {filtered.map(item => (
            <label key={item.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData[type].includes(item.id)}
                onChange={() => toggleItem(type, item.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-900">{item.title} (₹{item.price})</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 p-2">No items found for this class{type !== 'audioNoteIds' ? ' and subject' : ''}.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Bundle' : 'Add New Bundle'}</h2>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="jee">JEE</option>
              <option value="neet">NEET</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
            <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
            <input type="number" min="0" max="100" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="e.g. 20 (Optional)" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bundle Contents</h3>
          <p className="text-sm text-gray-500 mb-4">You can provide a single combined PDF link for the entire bundle, and/or select included items below.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Combined Bundle PDF URL (Optional)</label>
            <p className="text-xs text-gray-500 mb-1">Google Drive or Dropbox link for the combined PDF.</p>
            <input 
              type="url" 
              value={formData.pdfUrl} 
              onChange={e => setFormData({...formData, pdfUrl: e.target.value})} 
              placeholder="https://drive.google.com/file/d/..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            {renderSection('Notes', notes, 'noteIds')}
            {renderSection('Mind Maps', mindMaps, 'mindMapIds')}
            {renderSection('Audio Notes', audioNotes, 'audioNoteIds')}
            {renderSection('Mock Tests', mockTests, 'mockTestIds')}
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={formData.isFeatured}
              onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Feature this bundle on the homepage</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/bundles')} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 10, isActive: true });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const q = query(collection(db, 'coupons'));
      const snapshot = await getDocs(q);
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        discountPercent: Number(newCoupon.discountPercent),
        isActive: newCoupon.isActive,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'coupons'), couponData);
      
      setNewCoupon({ code: '', discountPercent: 10, isActive: true });
      fetchCoupons();
    } catch (err: any) {
      console.error("Error adding coupon:", err);
      setError(err.message || "Failed to add coupon");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { isActive: !currentStatus });
      fetchCoupons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      fetchCoupons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Coupon</h2>
        <form onSubmit={handleAddCoupon} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
            <input type="text" required value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="e.g. SUMMER20" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
            <input type="number" required min="1" max="100" value={newCoupon.discountPercent} onChange={e => setNewCoupon({...newCoupon, discountPercent: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="w-32 pb-2">
            <label className="flex items-center">
              <input type="checkbox" checked={newCoupon.isActive} onChange={e => setNewCoupon({...newCoupon, isActive: e.target.checked})} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Add Coupon</button>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Coupons</h2>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map(coupon => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{coupon.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{coupon.discountPercent}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => toggleStatus(coupon.id, coupon.isActive)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No coupons found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [items, setItems] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersSnapshot = await getDocs(query(collection(db, 'orders')));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort orders by date descending
      ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);

      // Fetch users
      const usersSnapshot = await getDocs(query(collection(db, 'users')));
      const usersMap: Record<string, any> = {};
      usersSnapshot.docs.forEach(doc => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsers(usersMap);

      // Fetch notes and bundles to map itemIds to titles
      const notesSnapshot = await getDocs(query(collection(db, 'notes')));
      const bundlesSnapshot = await getDocs(query(collection(db, 'bundles')));
      const mindMapsSnapshot = await getDocs(query(collection(db, 'mindMaps')));
      const mockTestsSnapshot = await getDocs(query(collection(db, 'mockTests')));
      
      const itemsMap: Record<string, any> = {};
      notesSnapshot.docs.forEach(doc => {
        itemsMap[doc.id] = { id: doc.id, ...doc.data(), type: 'note' };
      });
      bundlesSnapshot.docs.forEach(doc => {
        itemsMap[doc.id] = { id: doc.id, ...doc.data(), type: 'bundle' };
      });
      mindMapsSnapshot.docs.forEach(doc => {
        itemsMap[doc.id] = { id: doc.id, ...doc.data(), type: 'mindMap' };
      });
      mockTestsSnapshot.docs.forEach(doc => {
        itemsMap[doc.id] = { id: doc.id, ...doc.data(), type: 'mockTest' };
      });
      setItems(itemsMap);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => {
                const user = users[order.userId];
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{user?.email || order.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="text-sm text-gray-500 space-y-1">
                        {order.items?.map((item: any, idx: number) => {
                          const itemDetails = items[item.itemId];
                          // Some older orders might have the title in the item directly
                          const title = item.title || itemDetails?.title || 'Unknown Item';
                          return (
                            <li key={idx}>
                              • {title} <span className="text-xs text-gray-400">({item.type})</span>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No purchase history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Admin Panel</h2>
          </div>
          <nav className="p-2 space-y-1">
            <Link to="/admin" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/admin' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <FileText className="w-4 h-4 mr-2" /> Notes
            </Link>
            <Link to="/admin/bundles" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/bundles') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Package className="w-4 h-4 mr-2" /> Bundles
            </Link>
            <Link to="/admin/mind-maps" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/mind-maps') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BrainCircuit className="w-4 h-4 mr-2" /> Mind Maps
            </Link>
            <Link to="/admin/mock-tests" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/mock-tests') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <FileSignature className="w-4 h-4 mr-2" /> Mock Tests
            </Link>
            <Link to="/admin/coupons" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/coupons') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Tag className="w-4 h-4 mr-2" /> Coupons
            </Link>
            <Link to="/admin/audio-notes" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/audio-notes') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Mic className="w-4 h-4 mr-2" /> Audio Notes
            </Link>
            <Link to="/admin/pdf-splitter" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/pdf-splitter') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Scissors className="w-4 h-4 mr-2" /> PDF Splitter
            </Link>
            <Link to="/admin/orders" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/orders') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ShoppingBag className="w-4 h-4 mr-2" /> Purchase History
            </Link>
            <Link to="/admin/test-maker" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/test-maker') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BrainCircuit className="w-4 h-4 mr-2" /> AI Test Maker
            </Link>
          </nav>
        </div>
      </div>
      
      <div className="flex-1">
        <Routes>
          <Route index element={<AdminNotes />} />
          <Route path="new-note" element={<AdminNoteForm />} />
          <Route path="edit-note/:id" element={<AdminNoteForm />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="bundles/new-bundle" element={<AdminBundleForm />} />
          <Route path="bundles/edit-bundle/:id" element={<AdminBundleForm />} />
          <Route path="mind-maps" element={<AdminMindMaps />} />
          <Route path="mind-maps/new" element={<AdminMindMapForm />} />
          <Route path="mind-maps/edit/:id" element={<AdminMindMapForm />} />
          <Route path="mock-tests" element={<AdminMockTests />} />
          <Route path="mock-tests/new" element={<AdminMockTestForm />} />
          <Route path="mock-tests/edit/:id" element={<AdminMockTestForm />} />
          <Route path="pdf-splitter" element={<AdminPDFSplitter />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="audio-notes" element={<AdminAudioNotes />} />
          <Route path="audio-notes/new-audio-note" element={<AdminAudioNoteForm />} />
          <Route path="audio-notes/edit-audio-note/:id" element={<AdminAudioNoteForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="test-maker" element={<MockTestGenerator />} />
        </Routes>
      </div>
    </div>
  );
}
