// Typing Manager - Handles typing indicators
class TypingManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.currentUser = null;
    this.typingRef = null;
    this.typingTimeout = null;
    this.debounceTimeout = null;
    this.TYPING_TIMEOUT = 5000; // 5 seconds
    this.DEBOUNCE_DELAY = 300; // 300ms
    this.RATE_LIMIT = 1000; // 1 second
    this.lastTypingUpdate = 0;
  }

  init(user) {
    this.currentUser = user;
    if (user && this.roomId) {
      this.typingRef = firebaseDB
        .collection('typing')
        .doc(this.roomId)
        .collection('users')
        .doc(user.uid);
    }
  }

  // Start typing indicator (debounced)
  startTyping() {
    if (!this.currentUser || !this.typingRef) return;

    // Rate limiting check
    const now = Date.now();
    if (now - this.lastTypingUpdate < this.RATE_LIMIT) {
      return;
    }

    // Clear existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      this.setTyping(true);
    }, this.DEBOUNCE_DELAY);
  }

  // Set typing status
  async setTyping(isTyping) {
    if (!this.currentUser || !this.typingRef) return;

    try {
      if (isTyping) {
        await this.typingRef.set({
          isTyping: true,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          userName: this.currentUser.displayName || 'Anonymous'
        });
        
        this.lastTypingUpdate = Date.now();
        
        // Set timeout to clear typing
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
          this.setTyping(false);
        }, this.TYPING_TIMEOUT);
      } else {
        await this.typingRef.delete();
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
          this.typingTimeout = null;
        }
      }
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }

  // Clear typing (called when message is sent)
  clearTyping() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    this.setTyping(false);
  }

  // Listen for typing users
  listenForTypingUsers(callback) {
    if (!this.roomId) return () => {};

    return firebaseDB
      .collection('typing')
      .doc(this.roomId)
      .collection('users')
      .onSnapshot(snapshot => {
        const typingUsers = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.isTyping && data.updatedAt) {
            // Check if typing indicator is still valid (within 5 seconds)
            const updatedAt = data.updatedAt.toDate();
            if (Date.now() - updatedAt.getTime() < this.TYPING_TIMEOUT) {
              typingUsers.push({
                userId: doc.id,
                userName: data.userName || 'Anonymous'
              });
            } else {
              // Remove expired typing indicator
              doc.ref.delete();
            }
          }
        });
        callback(typingUsers);
      });
  }

  // Get typing users (one-time fetch)
  async getTypingUsers() {
    if (!this.roomId) return [];

    const snapshot = await firebaseDB
      .collection('typing')
      .doc(this.roomId)
      .collection('users')
      .get();

    const typingUsers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isTyping) {
        typingUsers.push({
          userId: doc.id,
          userName: data.userName || 'Anonymous'
        });
      }
    });

    return typingUsers;
  }

  // Format typing indicator text
  formatTypingText(typingUsers) {
    if (typingUsers.length === 0) return '';
    
    const names = typingUsers.map(user => user.userName);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  }

  destroy() {
    this.clearTyping();
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}

// Create global instance
let typingManager = null;
