const express = require('express');
const firebaseAdmin = require('firebase-admin');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('credentialsFile'), async (req, res) => {
  if (!req.file) return res.status(400).send('Firebase credentials file is required.');

  try {
    const credentials = JSON.parse(req.file.buffer.toString('utf8'));

    if (firebaseAdmin.apps.length > 0) {
      firebaseAdmin.app().delete(); 
    }

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(credentials),
    });

    const collections = await getCollectionsData(firebaseAdmin.firestore());
    res.json({ success: true, collections });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing the file.');
  }
});

async function getCollectionsData(db) {
  const collections = await db.listCollections();
  const collectionsData = {};

  for (const collection of collections) {
    const docs = (await collection.get()).docs.map(doc => ({ id: doc.id, ...doc.data() }));
    collectionsData[collection.id] = docs;
  }

  return collectionsData;
}

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
