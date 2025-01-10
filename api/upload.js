import firebaseAdmin from 'firebase-admin';
import multer from 'multer';
import { IncomingForm } from 'formidable';
import fs from 'fs';

let initialized = false;

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async (req, res) => {
    if (req.method === 'POST') {
        const form = new IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'Error processing the file.' });
            }

            const credentialsFile = files.credentialsFile && files.credentialsFile[0];

            if (!credentialsFile) {
                return res.status(400).json({ success: false, message: 'Firebase credentials file is required.' });
            }

            try {
                const credentials = JSON.parse(fs.readFileSync(credentialsFile.filepath, 'utf8'));

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
                return res.status(500).json({ success: false, message: 'Error processing the file.' });
            }
        });
    } else {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
};

async function getCollectionsData(db) {
    const collections = await db.listCollections();
    const collectionsData = {};

    for (const collection of collections) {
        const docs = (await collection.get()).docs.map(doc => ({ id: doc.id, ...doc.data() }));
        collectionsData[collection.id] = docs;
    }

    return collectionsData;
}
