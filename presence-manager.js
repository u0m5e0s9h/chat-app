// Presence Manager - Handles online/offline status tracking
class PresenceManager {
  constructor() {
    this.currentUser = null;
    this.presenceRef = null;
    this.heartbeatInterval = null;
    this.HEARTBEAT_INTERVAL = 30000; // 30 seconds
    this.ONLINE_THRESHOLD = 30000; // 30 seconds
  }

  init(user) {
    this.currentUser = user;
    if (user) {
      this.presenceRef = firebaseDB.collection('presence').doc(user.uid);
      this.setupPresence();
      this.startHeartbeat();
      this.handleVisibilityChange();
      this.handleBeforeUnload();
    }
  }

  setupPresence() {
    // Set initial presence
    this.updatePresence();
    
    // Update on focus
    window.addEventListener('focus', () => {
      this.updatePresence();
    });
  }

  updatePresence() {
    if (!this.currentUser || !this.presenceRef) return;
    
    const presenceData = {
      lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName || 'Anonymous',
      isOnline: true
    };
    
    this.presenceRef.set(presenceData, { merge: true })
      .catch(error => console.error('Error updating presence:', error));
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence();
    }, this.HEARTBEAT_INTERVAL);
  }

  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updatePresence();
      }
    });
  }

  handleBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.presenceRef) {
        this.presenceRef.update({
          isOnline: false,
          lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  }

  // Get online users for a room
  async getOnlineUsers() {
    const presenceSnapshot = await firebaseDB.collection('presence')
      .where('lastActiveAt', '>', new Date(Date.now() - this.ONLINE_THRESHOLD))
      .get();
    
    const onlineUsers = [];
    presenceSnapshot.forEach(doc => {
      onlineUsers.push({
        userId: doc.id,
        ...doc.data()
      });
    });
    
    return onlineUsers;
  }

  // Listen for online users changes
  listenForOnlineUsers(callback) {
    return firebaseDB.collection('presence')
      .onSnapshot(snapshot => {
        const onlineUsers = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          const lastActive = data.lastActiveAt?.toDate();
          if (lastActive && (Date.now() - lastActive.getTime()) < this.ONLINE_THRESHOLD) {
            onlineUsers.push({
              userId: doc.id,
              ...data
            });
          }
        });
        callback(onlineUsers);
      });
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.presenceRef && this.currentUser) {
      this.presenceRef.update({
        isOnline: false,
        lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

// Create global instance
const presenceManager = new PresenceManager();
