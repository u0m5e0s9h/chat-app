// ChatMessage class
class ChatMessage {
  constructor(id, senderId, text, timestamp) {
    this.id = id;
    this.senderId = senderId;
    this.text = text;
    this.timestamp = timestamp;
  }
}

// DOM elements
const chatArea = document.querySelector('.chat-area');
const messageInput = document.querySelector('.input-bar input');
const sendButton = document.querySelector('.send-button');

// Authentication
async function signInAnonymously() {
  try {
    const result = await auth.signInAnonymously();
    console.log("Signed in anonymously:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Authentication error:", error);
    showError("Failed to authenticate. Please refresh the page.");
    throw error;
  }
}

// Firestore operations
const messagesRef = db.collection('chatrooms').doc(ROOM_ID).collection('messages');

// Send message
async function sendMessage(text) {
  if (!text.trim()) return;

  const user = auth.currentUser;
  if (!user) {
    showError("Not authenticated. Please wait...");
    return;
  }

  // Disable send button and show sending state
  sendButton.disabled = true;
  sendButton.textContent = 'Sending...';

  try {
    const messageData = {
      senderId: user.uid,
      text: text.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await messagesRef.add(messageData);
    
    // Clear input
    messageInput.value = '';
    
    // Re-enable send button
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
    
  } catch (error) {
    console.error("Error sending message:", error);
    showError("Failed to send message. Please try again.");
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
  }
}

// Display message
function displayMessage(message) {
  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${message.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`;
  
  const messageBubble = document.createElement('div');
  messageBubble.className = 'message-bubble';
  
  const timestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date();
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageBubble.innerHTML = `
    ${escapeHtml(message.text)}
    <span class="timestamp">${timeString}</span>
  `;
  
  messageRow.appendChild(messageBubble);
  chatArea.appendChild(messageRow);
  
  // Scroll to bottom
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Load existing messages
function loadMessages() {
  messagesRef.orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const message = { id: change.doc.id, ...change.doc.data() };
        displayMessage(message);
      }
    });
  });
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    background: #ffebee;
    color: #c62828;
    padding: 10px;
    margin: 10px;
    border-radius: 5px;
    text-align: center;
  `;
  chatArea.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Input validation
function validateInput(text) {
  if (!text.trim()) {
    showError("Message cannot be empty");
    return false;
  }
  if (text.length > 300) {
    showError("Message cannot exceed 300 characters");
    return false;
  }
  return true;
}

// Event listeners
sendButton.addEventListener('click', async () => {
  const text = messageInput.value;
  if (validateInput(text)) {
    await sendMessage(text);
  }
});

messageInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const text = messageInput.value;
    if (validateInput(text)) {
      await sendMessage(text);
    }
  }
});

// Character counter
messageInput.addEventListener('input', () => {
  const length = messageInput.value.length;
  const counter = document.querySelector('.char-counter') || createCharCounter();
  counter.textContent = `${length}/300`;
  
  if (length > 300) {
    counter.style.color = '#c62828';
    sendButton.disabled = true;
  } else {
    counter.style.color = '#666';
    sendButton.disabled = false;
  }
});

function createCharCounter() {
  const counter = document.createElement('div');
  counter.className = 'char-counter';
  counter.style.cssText = 'font-size: 12px; color: #666; margin-top: 5px;';
  document.querySelector('.input-bar').appendChild(counter);
  return counter;
}

// Initialize app
async function initApp() {
  try {
    await signInAnonymously();
    loadMessages();
    console.log("Chat app initialized successfully");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showError("Failed to connect to chat. Please refresh the page.");
  }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
