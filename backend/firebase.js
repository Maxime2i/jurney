const admin = require("firebase-admin");
const serviceAccount = require("./firebase.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://messaging-app-4b1cc.appspot.com" 
  });
}

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };