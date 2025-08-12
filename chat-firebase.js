
// ChatMessage class with read status
class ChatMessage {
  constructor(id, senderId, text, timestamp, readBy = []) {
    this.id = id;
    this.senderId = senderId;
    this.text = text;
    this.timestamp = timestamp;
    this.readBy = readBy || [];
  }
}

// DOM elements
const chatArea = document.querySelector('.chat-area');
const messageInput = document.querySelector('.input-bar input');
const sendButton = document.querySelector('.send-button');

// Firestore references
const messagesRef = db.collection('chatrooms').doc(ROOM_ID).collection('messages');
const readsRef = db.collection('reads');

// Global state
let currentUser = null;
let messages = [];
let unsubscribeMessages = null;
let unsubscribeReads = null;
let isChatActive = true;
let lastReadTimestamp = null;

// Authentication
async function signInAnonymously() {
  try {
    const result = await auth.signInAnonymously();
    currentUser = result.user;
    console.log("Signed in anonymously:", currentUser.uid);
    
    // Initialize read tracking after auth
    await initializeReadTracking();
    return currentUser;
  } catch (error) {
    console.error("Authentication error:", error);
    showError("Failed to authenticate. Please refresh the page.");
    throw error;
  }
}

// Initialize read tracking
async function initializeReadTracking() {
  if (!currentUser) return;
  
  try {
    // Set up read status listener
    const userReadRef = readsRef.doc(currentUser.uid).collection('rooms').doc(ROOM_ID);
    
    unsubscribeReads = userReadRef.onSnapshot((doc) => {
      if (doc.exists) {
        lastReadTimestamp = doc.data().lastRead?.toDate() || null;
      }
    });
    
    // Mark current messages as read
    await markMessagesAsRead();
    
  } catch (error) {
    console.error("Error initializing read tracking:", error);
  }
}

// Mark messages as read
async function markMessagesAsRead() {
  if (!currentUser) return;
  
  try {
    console.log("Marking messages as read for user:", currentUser.uid);
    
    // Update user's last read timestamp
    const userReadRef = readsRef.doc(currentUser.uid).collection('rooms').doc(ROOM_ID);
    await userReadRef.set({
      lastRead: firebase.firestore.FieldValue.serverTimestamp(),
      roomId: ROOM_ID
    });

    // Query Firestore directly for unread messages from other users
    const snapshot = await messagesRef
      .where('senderId', '!=', currentUser.uid)
      .get();

    const unreadMessages = [];
    snapshot.forEach(doc => {
      const message = { id: doc.id, ...doc.data() };
      if (!message.readBy || !message.readBy.includes(currentUser.uid)) {
        unreadMessages.push(message);
      }
    });

    console.log("Found unread messages from Firestore:", unreadMessages.length);
    
    if (unreadMessages.length === 0) {
      console.log("No unread messages found in Firestore");
      return;
    }

    // Update each message's readBy array
    const batch = db.batch();
    unreadMessages.forEach(message => {
      console.log("Marking message as read:", message.id);
      const messageRef = messagesRef.doc(message.id);
      batch.update(messageRef, {
        readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
      });
    });
    
    await batch.commit();
    console.log("Successfully marked messages as read");
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

// Send message
async function sendMessage(text) {
  if (!text.trim()) return;

  if (!currentUser) {
    showError("Not authenticated. Please wait...");
    return;
  }

  // Disable send button and show sending state
  sendButton.disabled = true;
  sendButton.textContent = 'Sending...';

  try {
    const messageData = {
      senderId: currentUser.uid,
      text: text.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      readBy: [] // Initialize empty read array
    };

    await messagesRef.add(messageData);
    
    // Clear input
    messageInput.value = '';
    
    // Re-enable send button
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
    
    // Auto-scroll to bottom for sender
    scrollToBottom(true);
    
  } catch (error) {
    console.error("Error sending message:", error);
    showError("Failed to send message. Please try again.");
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
  }
}

// Display message with read status
function displayMessage(message, isNew = false) {
  const existingMessage = document.querySelector(`[data-message-id="${message.id}"]`);
  if (existingMessage) {
    updateMessageReadStatus(message);
    return;
  }

  const messageRow = document.createElement('div');
  messageRow.className = `message-row ${message.senderId === currentUser?.uid ? 'sent' : 'received'}`;
  messageRow.setAttribute('data-message-id', message.id);
  
  const messageBubble = document.createElement('div');
  messageBubble.className = 'message-bubble';
  
  const timestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date();
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const isCurrentUserMessage = message.senderId === currentUser?.uid;
  // Check if the message sender has read this message (for sent messages)
  const isRead = isCurrentUserMessage && message.readBy && message.readBy.length > 0;
  
  messageBubble.innerHTML = `
    ${escapeHtml(message.text)}
    <span class="timestamp">${timeString}</span>
    ${isCurrentUserMessage ? `<span class="read-status ${isRead ? 'read' : 'sent'}">${isRead ? '✓✓' : '✓'}</span>` : ''}
  `;
  
  messageRow.appendChild(messageBubble);
  
  if (isNew && messages.length > 0) {
    chatArea.appendChild(messageRow);
  } else {
    chatArea.appendChild(messageRow);
  }
  
  // Scroll to bottom only for new messages from current user
  if (isNew && message.senderId === currentUser?.uid) {
    scrollToBottom(true);
  }
}

// Update message read status
function updateMessageReadStatus(message) {
  const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
  if (!messageElement) return;
  
  const readStatus = messageElement.querySelector('.read-status');
  if (readStatus && message.readBy?.includes(currentUser?.uid)) {
    readStatus.className = 'read-status read';
    readStatus.textContent = '✓✓';
  }
}

// Load messages with real-time updates
function loadMessages() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }
  
  unsubscribeMessages = messagesRef
    .orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => {
      const changes = snapshot.docChanges();
      
      changes.forEach((change) => {
        const message = { 
          id: change.doc.id, 
          ...change.doc.data(),
          timestamp: change.doc.data().timestamp?.toDate?.() || new Date()
        };
        
        if (change.type === 'added') {
          messages.push(message);
          displayMessage(message, true);
          
          // Mark as read if chat is active
          if (isChatActive && message.senderId !== currentUser?.uid) {
            markMessagesAsRead();
          }
        } else if (change.type === 'modified') {
          // Update existing message (e.g., read status)
          const index = messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            messages[index] = message;
            updateMessageReadStatus(message);
          }
        }
      });
      
      // Update online status
      updateOnlineStatus(true);
    }, (error) => {
      console.error("Error in message listener:", error);
      updateOnlineStatus(false);
    });
}

// Scroll to bottom
function scrollToBottom(force = false) {
  const shouldScroll = force || 
    (chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 100);
  
  if (shouldScroll) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

// Track chat visibility
function setupChatVisibilityTracking() {
  // Track when user switches tabs or minimizes window
  document.addEventListener('visibilitychange', () => {
    isChatActive = !document.hidden;
    if (isChatActive) {
      markMessagesAsRead();
    }
  });
  
  // Track when window gains/loses focus
  window.addEventListener('focus', () => {
    isChatActive = true;
    markMessagesAsRead();
  });
  
  window.addEventListener('blur', () => {
    isChatActive = false;
  });
}

// Update online status UI
function updateOnlineStatus(isOnline) {
  const statusIndicator = document.querySelector('.connection-status') || createConnectionStatus();
  statusIndicator.textContent = isOnline ? 'Online' : 'Offline';
  statusIndicator.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
}

// Create connection status indicator
function createConnectionStatus() {
  const statusDiv = document.createElement('div');
  statusDiv.className = 'connection-status online';
  statusDiv.textContent = 'Online';
  document.querySelector('.top-bar').appendChild(statusDiv);
  return statusDiv;
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

// Cleanup function
function cleanup() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }
  if (unsubscribeReads) {
    unsubscribeReads();
  }
}

  
// Initialize app
async function initApp() {
  try {
    await signInAnonymously();
    setupChatVisibilityTracking();
    loadMessages();
    console.log("Chat app initialized successfully with Day 3 features");

    // Add event listeners for browser online/offline events
    window.addEventListener('online', () => {
      console.log('Browser is online');
      updateOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      console.log('Browser is offline');
      updateOnlineStatus(false);
    });

    // Set initial online status
    updateOnlineStatus(navigator.onLine);

  } catch (error) {
    console.error("Failed to initialize app:", error);
    showError("Failed to connect to chat. Please refresh the page.");
  }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

