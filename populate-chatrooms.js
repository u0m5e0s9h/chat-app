// Script to populate sample chatrooms data in Firestore
// Run this in your browser console or as a separate script

// Sample chatrooms data
const sampleChatrooms = [
  {
    id: "general",
    title: "General Chat",
    description: "General discussion about anything"
  },
  {
    id: "tech",
    title: "Tech Talk",
    description: "Technology discussions and news"
  },
  {
    id: "random",
    title: "Random Thoughts",
    description: "Share your random thoughts and ideas"
  },
  {
    id: "help",
    title: "Help & Support",
    description: "Get help and support from the community"
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Official announcements and updates"
  }
];

// Function to populate chatrooms
async function populateChatrooms() {
  try {
    console.log("Starting to populate chatrooms...");
    
    for (const room of sampleChatrooms) {
      await db.collection('chatrooms').doc(room.id).set({
        title: room.title,
        description: room.description,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Added chatroom: ${room.title}`);
    }
    
    console.log("Successfully populated all chatrooms!");
    
    // Add some sample messages to make the rooms more realistic
    for (const room of sampleChatrooms) {
      const messagesRef = db.collection('chatrooms').doc(room.id).collection('messages');
      
      // Add 2-3 sample messages per room
      const sampleMessages = [
        {
          text: `Welcome to ${room.title}!`,
          senderId: "system",
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          text: "Hello everyone! 👋",
          senderId: "user1",
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
      ];
      
      for (const message of sampleMessages) {
        await messagesRef.add(message);
      }
    }
    
    console.log("Added sample messages to chatrooms!");
    
  } catch (error) {
    console.error("Error populating chatrooms:", error);
  }
}

// Check if Firebase is initialized
if (typeof firebase !== 'undefined') {
  // Run the population script
  populateChatrooms();
} else {
  console.error("Firebase not initialized. Please ensure firebase-config.js is loaded first.");
}
