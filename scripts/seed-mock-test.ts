import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config directly since it's a JSON file
const rawConfig = fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
const config = JSON.parse(rawConfig);

const app = initializeApp(config);
const db = getFirestore(app);

async function seed() {
  try {
    console.log('Seeding mock test...');
    
    const mockTestData = {
      title: 'Demo Mock Test (With Expert Evaluation)',
      description: 'This is a test mock test created to verify the Expert Evaluation system. The solution is already attached in the backend.',
      author: 'Admin',
      classLevel: '10',
      subject: 'Science',
      price: 0,
      maxMarks: 50,
      isFeatured: true,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Dummy PDF for questions
      // Minimal dummy PDF base64 for solution representing standard pdf format
      solutionBase64: 'JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKMxN0QvJyCXDDFM9Qz1DPQMAwUoEYQplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKMzIKZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAzIDAgUiAvUmVzb3VyY2VzIDYgMCBSIC9Db250ZW50cyA0IDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUuMjggODQxLjg5XQo+PgplbmRvYmoKNiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCBdIC9Gb250IDw8IC9GMSA3IDAgUiA+PiA+PgplbmRvYmoKNyAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL05hbWUgL0YxIC9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvTWFjUm9tYW5FbmNvZGluZwo+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZXMgL01lZGlhQm94IFswIDAgNTk1LjI4IDg0MS44OV0gL0NvdW50IDEgL0tpZHMgWyAyIDAgUiBdID4+CmVuZG9iagoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAzIDAgUiA+PgplbmRvYmoKOCAwIG9iago8PCAvUHJvZHVjZXIgKE1hYyBPUyBYIDEwLjEuMSBRdWFydHogUERGQ29udGV4dCkgL0NyZWF0aW9uRGF0ZSAoRDoyMDAyMDQxMTIwMTkyNFopCi9Nb2REYXRlIChEOjIwMDIwNDExMjAxOTI0WikgPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDQ0NCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAzNTEgMDAwMDAgbiAKMDAwMDAwMDAyMiAwMDAwMCBuIAowMDAwMDAwMDk2IDAwMDAwIG4gCjAwMDAwMDAyMjQgMDAwMDAgbiAKMDAwMDAwMDI0NiAwMDAwMCBuIAowMDAwMDAwNDg1IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgOSAvUm9vdCAxIDAgUiAvSW5mbyA4IDAgUiAvSUQgWyA8NzliZGQ0OWRmZGZkNGI5MmIyYzEyODIyMDMzN2ZlNjQ+IDw3OWJkZDQ5ZGZkZmQ0YjkyYjJjMTI4MjIwMzM3ZmU2ND4gXQo+PgpzdGFydHhyZWYKNjM5CiUlRU9GCg==',
      solutionMimeType: 'application/pdf',
      rating: 4.8,
      reviewCount: 15,
      previewImages: [],
      createdAt: new Date().toISOString()
    };
    
    // Add to DB
    const docRef = await addDoc(collection(db, 'mockTests'), mockTestData);
    console.log('Successfully created Mock Test with ID:', docRef.id);

    // Also auto-add to the user's purchased items if they exist
    const userEmail = "saransh1860@gmail.com";
    console.log(`Checking for user profile with email ${userEmail}...`);
    const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        purchasedItems: arrayUnion(docRef.id)
      });
      console.log(`Successfully added Mock Test to user ${userEmail}'s library!`);
    } else {
      console.log('User profile not found yet. The test will appear in the Mock Tests section.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock test:', error);
    process.exit(1);
  }
}

seed();
