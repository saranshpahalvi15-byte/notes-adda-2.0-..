import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit } from 'lucide-react';

export function AdminMockTests() {
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      const q = query(collection(db, 'mockTests'));
      const snapshot = await getDocs(q);
      setMockTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mockTests', id));
      fetchMockTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addDummyTest = async () => {
    try {
      setLoading(true);
      setError('');
      
      const solutionBase64 = 'JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKMxN0QvJyCXDDFM9Qz1DPQMAwUoEYQplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKMzIKZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAzIDAgUiAvUmVzb3VyY2VzIDYgMCBSIC9Db250ZW50cyA0IDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUuMjggODQxLjg5XQo+PgplbmRvYmoKNiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCBdIC9Gb250IDw8IC9GMSA3IDAgUiA+PiA+PgplbmRvYmoKNyAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL05hbWUgL0YxIC9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZXMgL01lZGlhQm94IFswIDAgNTk1LjI4IDg0MS44OV0gL0NvdW50IDEgL0tpZHMgWyAyIDAgUiBdID4+CmVuZG9iagoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAzIDAgUiA+PgplbmRvYmoKOCAwIG9iago8PCAvUHJvZHVjZXIgKE1hYyBPUyBYIDEwLjEuMSBRdWFydHogUERGQ29udGV4dCkgL0NyZWF0aW9uRGF0ZSAoRDoyMDAyMDQxMTIwMTkyNFopCi9Nb2REYXRlIChEOjIwMDIwNDExMjAxOTI0WikgPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDQ0NCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAzNTEgMDAwMDAgbiAKMDAwMDAwMDAyMiAwMDAwMCBuIAowMDAwMDAwMDk2IDAwMDAwIG4gCjAwMDAwMDAyMjQgMDAwMDAgbiAKMDAwMDAwMDI0NiAwMDAwMCBuIAowMDAwMDAwNDg1IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgOSAvUm9vdCAxIDAgUiAvSW5mbyA4IDAgUiAvSUQgWyA8NzliZGQ0OWRmZGZkNGI5MmIyYzEyODIyMDMzN2ZlNjQ+IDw3OWJkZDQ5ZGZkZmQ0YjkyYjJjMTI4MjIwMzM3ZmU2ND4gXQo+PgpzdGFydHhyZWYKNjM5CiUlRU9GCg=='; // dummy pdf
      const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      const mapData = {
        title: 'Demo Mock Test (With Expert Evaluation)',
        description: 'This is an auto-generated testing mock test created to verify the Expert Evaluation system. The solution is already attached in the backend.',
        classLevel: '10',
        subject: 'Science',
        price: 0,
        maxMarks: 50,
        isFeatured: true,
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        previewImages: [sampleImageBase64, sampleImageBase64, sampleImageBase64],
        solutionBase64,
        solutionMimeType: 'application/pdf',
        rating: 4.8,
        reviewCount: 15,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'mockTests'), mapData);
      await fetchMockTests();
    } catch (err: any) {
      setError(err.message || "Failed to add dummy test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Mock Tests</h2>
        <div className="flex gap-4">
          <button onClick={addDummyTest} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Demo Test
          </button>
          <Link to="new" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Mock Test
          </Link>
        </div>
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
              {mockTests.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">Class {item.classLevel} • {item.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/admin/mock-tests/edit/${item.id}`} className="text-indigo-600 hover:text-indigo-900 inline-block mr-4">
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
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

export function AdminMockTestForm() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classLevel: '9',
    subject: 'Science',
    price: 25,
    discountPercent: '' as number | string,
    maxMarks: 100,
    isFeatured: false,
    pdfUrl: '',
  });
  const [previewImageFiles, setPreviewImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchMockTest = async () => {
        const docRef = doc(db, 'mockTests', id);
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
            maxMarks: data.maxMarks || 100,
            isFeatured: data.isFeatured || false,
            pdfUrl: data.pdfUrl || ''
          });
        }
      };
      fetchMockTest();
    }
  }, [id]);

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = [...previewImageFiles];
      newFiles[index] = e.target.files[0];
      setPreviewImageFiles(newFiles);
    }
  };

  const handleSolutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 800000) {
        setError('Solution file is too large. Must be under 800KB for Firestore storage.');
        return;
      }
      setSolutionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdfUrl) {
      setError("Please provide a PDF link (e.g., Google Drive link).");
      return;
    }
    if (!solutionFile && !id) {
      setError("Please upload a Solution PDF for expert evaluation.");
      return;
    }

    try {
      setError('');
      setUploading(true);

      const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const previewImages = [];
      const validFiles = previewImageFiles.filter(f => f !== null) as File[];
      for (const file of validFiles) {
        const imgUrl = await readFileAsDataURL(file);
        previewImages.push(imgUrl);
      }

      let totalSize = 0;
      previewImages.forEach(img => totalSize += img.length);
      
      let mapData: any = {
        ...formData,
        rating: 0,
        reviewCount: 0
      };
      
      if (formData.discountPercent !== '') {
        mapData.discountPercent = Number(formData.discountPercent);
      } else {
        delete mapData.discountPercent;
      }
      
      if (previewImages.length > 0) {
        mapData.previewImages = previewImages;
      }
      
      if (solutionFile) {
        const solutionBase64Url = await readFileAsDataURL(solutionFile);
        const solutionBase64 = solutionBase64Url.split(',')[1];
        const solutionMimeType = solutionFile.type || 'application/pdf';
        mapData.solutionBase64 = solutionBase64;
        mapData.solutionMimeType = solutionMimeType;
        totalSize += solutionBase64.length;
      }
      
      if (totalSize > 800000) { 
        throw new Error(`Total size of images and solution PDF is too large (${(totalSize / 1024 / 1024).toFixed(2)} MB). Please compress them to stay under ~800KB total for Firestore.`);
      }
      
      if (!id) {
        mapData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'mockTests'), mapData);
      } else {
        delete mapData.rating;
        delete mapData.reviewCount;
        await updateDoc(doc(db, 'mockTests', id), mapData);
      }
      
      navigate('/admin/mock-tests');
    } catch (err: any) {
      console.error("Error adding mock test:", err);
      setError(err.message || "Failed to add mock test.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{id ? 'Edit Mock Test' : 'Add New Mock Test'}</h2>
      
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
            <label className="block text-sm font-medium text-gray-700">Maximum Marks</label>
            <input type="number" required min="1" value={formData.maxMarks} onChange={e => setFormData({...formData, maxMarks: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PDF Access Link (e.g., Google Drive)</label>
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
            <label className="block text-sm font-medium text-gray-700">Solution Document (For Expert Evaluation)<br/><span className="text-xs text-red-500">Max size 800KB total</span></label>
            <input 
              type="file" 
              accept="application/pdf, image/png, image/jpeg" 
              required={!id} 
              onChange={handleSolutionChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
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
            <span className="ml-2 text-sm text-gray-700">Feature this mock test on the homepage</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/mock-tests')} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={uploading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {uploading ? 'Uploading & Saving...' : 'Save Mock Test'}
          </button>
        </div>
      </form>
    </div>
  );
}
