import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Edit, Trash2, Image as ImageIcon, FileText, Package, Tag } from 'lucide-react';

function AdminNotes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'notes'));
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Using a simple state-based confirmation would be better, but for simplicity we'll just delete
    // since window.confirm is blocked in iframes.
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
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-900 ml-4">
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

function AdminNoteForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    price: 25,
    isFeatured: false,
    pdfUrl: ''
  });
  const [previewImageFiles, setPreviewImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

      // Check total size to prevent Firestore 1MB limit error
      let totalSize = 0;
      previewImages.forEach(img => totalSize += img.length);
      
      // 1 character in base64 is roughly 1 byte. Firestore limit is 1,048,576 bytes.
      // We leave ~100KB for other document fields and overhead.
      if (totalSize > 900000) {
        throw new Error(`Images are too large (${(totalSize / 1024 / 1024).toFixed(2)} MB). Because you are using the free tier without Firebase Storage, all preview images for a single note must be under 900 KB combined. Please compress your images.`);
      }

      const noteData = {
        ...formData,
        previewImages,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'notes'), noteData);
      await updateDoc(docRef, { id: docRef.id });
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Note</h2>
      
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
                  required={num <= 3}
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
      const snapshot = await getDocs(collection(db, 'bundles'));
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
                    <button onClick={() => handleDelete(bundle.id)} className="text-red-600 hover:text-red-900 ml-4">
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
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    price: 249,
    noteIds: [] as string[],
    pdfUrl: '',
    isFeatured: false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'notes'));
        setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.noteIds.length === 0 && !formData.pdfUrl.trim()) {
      setError('Please either provide a Combined Bundle PDF URL or select at least one note.');
      return;
    }

    try {
      setError('');
      setSaving(true);
      
      // Auto-collect preview images from notes of the same class and subject
      const matchingNotes = notes.filter(n => n.classLevel === formData.classLevel && n.subject.toLowerCase() === formData.subject.toLowerCase());
      const previewImages = matchingNotes.flatMap(n => n.previewImages || []).slice(0, 10);

      const bundleData = {
        ...formData,
        previewImages,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'bundles'), bundleData);
      await updateDoc(docRef, { id: docRef.id });
      navigate('/admin/bundles');
    } catch (err: any) {
      console.error("Error adding bundle:", err);
      setError(err.message || "Failed to add bundle");
    } finally {
      setSaving(false);
    }
  };

  const toggleNote = (id: string) => {
    setFormData(prev => ({
      ...prev,
      noteIds: prev.noteIds.includes(id) 
        ? prev.noteIds.filter(nId => nId !== id)
        : [...prev.noteIds, id]
    }));
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Bundle</h2>
      
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
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bundle Contents</h3>
          <p className="text-sm text-gray-500 mb-4">You can either provide a single combined PDF link for the entire bundle, select individual notes to include, or do both.</p>
          
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Individual Notes (Optional if PDF URL is provided)</label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
            {notes.filter(n => n.classLevel === formData.classLevel && n.subject.toLowerCase() === formData.subject.toLowerCase()).map(note => (
              <label key={note.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.noteIds.includes(note.id)}
                  onChange={() => toggleNote(note.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-900">{note.title} (₹{note.price})</span>
              </label>
            ))}
            {notes.filter(n => n.classLevel === formData.classLevel && n.subject.toLowerCase() === formData.subject.toLowerCase()).length === 0 && (
              <p className="text-sm text-gray-500 p-2">No notes found for this class and subject.</p>
            )}
            </div>
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
      const snapshot = await getDocs(collection(db, 'coupons'));
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
            <Link to="/admin/coupons" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location.pathname.includes('/admin/coupons') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Tag className="w-4 h-4 mr-2" /> Coupons
            </Link>
          </nav>
        </div>
      </div>
      
      <div className="flex-1">
        <Routes>
          <Route index element={<AdminNotes />} />
          <Route path="new-note" element={<AdminNoteForm />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="bundles/new-bundle" element={<AdminBundleForm />} />
          <Route path="coupons" element={<AdminCoupons />} />
        </Routes>
      </div>
    </div>
  );
}
