// Firebase configuration 

 const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };



// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence().catch((err) => {
  console.error("Persistence error:", err);
});

// Global references for backward compatibility
const firebaseAuth = auth;
const firebaseDB = db;
const firebaseStorage = storage;

// Room ID (can be dynamic based on URL or user selection)
const ROOM_ID = "general"; // Default room
