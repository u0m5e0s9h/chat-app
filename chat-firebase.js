// Get room ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

// Handle missing room ID
if (!roomId) {
  const savedRoomId = localStorage.getItem('lastRoomId');
  if (savedRoomId) {
    window.location.href = `chat.html?roomId=${savedRoomId}`;
  } else {
    alert('No room ID provided. Redirecting to chat rooms...');
    window.location.href = 'chatrooms.html';
  }
}

// DOM elements - using correct selectors
const chatArea = document.querySelector('.chat-area');
const messageInput = document.querySelector('#messageInput');
const sendButton = document.querySelector('.send-button');
const imageButton = document.querySelector('.image-button');
const imageInput = document.querySelector('#imageInput');
const imagePreview = document.querySelector('#imagePreview');
const previewImage = document.querySelector('#previewImage');
const cancelImage = document.querySelector('#cancelImage');
const uploadProgress = document.querySelector('.upload-progress');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');

// Current user info
let currentUser = null;
let selectedImageFile = null;

// Initialize auth state
firebaseAuth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadMessages();
    setupMessageListener();
    localStorage.setItem('lastRoomId', roomId);
  } else {
    window.location.href = 'index.html';
  }
});

// Load existing messages
function loadMessages() {
  firebaseDB.collection('chatrooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .get()
    .then((snapshot) => {
      chatArea.innerHTML = '';
      let lastDate = null;
      
      snapshot.forEach((doc) => {
        const message = doc.data();
        const messageDate = new Date(message.timestamp?.toDate()).toDateString();
        
        if (messageDate !== lastDate) {
          addDateSeparator(messageDate);
          lastDate = messageDate;
        }
        
        displayMessage(doc.id, message);
      });
      
      scrollToBottom();
    })
    .catch((error) => {
      console.error('Error loading messages:', error);
    });
}

// Setup real-time listener
function setupMessageListener() {
  firebaseDB.collection('chatrooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const message = change.doc.data();
          const messageId = change.doc.id;
          
          const existingMessage = document.querySelector(`[data-id="${messageId}"]`);
          if (!existingMessage) {
            displayMessage(messageId, message);
            scrollToBottom();
          }
        }
      });
    });
}

// Display message
function displayMessage(messageId, message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-row ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
  messageDiv.setAttribute('data-id', messageId);
  
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  
  if (message.imageUrl) {
    const img = document.createElement('img');
    img.src = message.imageUrl;
    img.alt = 'Shared image';
    img.className = 'message-image';
    img.onclick = () => window.open(message.imageUrl, '_blank');
    bubbleDiv.appendChild(img);
    
    if (message.text) {
      const textDiv = document.createElement('div');
      textDiv.textContent = message.text;
      bubbleDiv.appendChild(textDiv);
    }
  } else {
    bubbleDiv.textContent = message.text;
  }
  
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = formatTime(message.timestamp?.toDate());
  bubbleDiv.appendChild(timestamp);
  
  messageDiv.appendChild(bubbleDiv);
  chatArea.appendChild(messageDiv);
}

// Add date separator
function addDateSeparator(dateString) {
  const separator = document.createElement('div');
  separator.className = 'date-separator';
  separator.textContent = dateString;
  chatArea.appendChild(separator);
}

// Format time
function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Scroll to bottom
function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Send message
function sendMessage(text, imageUrl = null) {
  if (!text.trim() && !imageUrl) return;
  
  const messageData = {
    text: text.trim(),
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Anonymous',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    imageUrl: imageUrl || null
  };
  
  return firebaseDB.collection('chatrooms')
    .doc(roomId)
    .collection('messages')
    .add(messageData);
}

// Compress image
function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Upload image to Firebase Storage
async function uploadImage(file) {
  if (!file) return null;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return null;
  }
  
  try {
    const compressedFile = await compressImage(file);
    const messageId = Date.now().toString();
    const storageRef = firebaseStorage.ref();
    const imageRef = storageRef.child(`chatrooms/${roomId}/images/${messageId}.jpg`);
    
    const uploadTask = imageRef.put(compressedFile);
    uploadProgress.style.display = 'block';
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressFill.style.width = progress + '%';
          progressText.textContent = Math.round(progress) + '%';
        },
        (error) => {
          console.error('Upload error:', error);
          uploadProgress.style.display = 'none';
          reject(error);
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          uploadProgress.style.display = 'none';
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image. Please try again.');
    return null;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('Chat initialized with room ID:', roomId);
  
  // Send button click
  if (sendButton) {
    sendButton.addEventListener('click', async () => {
      const text = messageInput.value.trim();
      
      if (selectedImageFile) {
        const imageUrl = await uploadImage(selectedImageFile);
        if (imageUrl) {
          await sendMessage(text, imageUrl);
          messageInput.value = '';
          hideImagePreview();
        }
      } else if (text) {
        await sendMessage(text);
        messageInput.value = '';
      }
    });
  }
  
  // Enter key press
  if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendButton.click();
      }
    });
  }
  
  // Image button click
  if (imageButton) {
    imageButton.addEventListener('click', () => {
      if (imageInput) {
        imageInput.click();
      }
    });
  }
  
  // Image selection
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        selectedImageFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Cancel image
  if (cancelImage) {
    cancelImage.addEventListener('click', hideImagePreview);
  }
  
  // Back button
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'chatrooms.html';
    });
  }
});

function hideImagePreview() {
  selectedImageFile = null;
  imagePreview.style.display = 'none';
  previewImage.src = '';
  if (imageInput) {
    imageInput.value = '';
  }
}
