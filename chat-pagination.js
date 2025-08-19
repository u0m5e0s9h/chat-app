// Chat Pagination and Search Manager
class ChatPaginationManager {
  constructor(roomId, currentUser) {
    this.roomId = roomId;
    this.currentUser = currentUser;
    this.messages = [];
    this.messageIndex = new Map(); // For search indexing
    this.lastVisible = null;
    this.isLoading = false;
    this.hasMore = true;
    this.batchSize = 20;
    this.searchResults = [];
    this.unreadCount = 0;
    
    // DOM elements
    this.chatArea = document.querySelector('.chat-area');
    this.searchInput = null;
    this.searchResultsContainer = null;
    
    this.init();
  }

  init() {
    this.setupScrollListener();
    this.setupSearchUI();
    this.loadInitialMessages();
  }

  // Load initial batch of messages
  async loadInitialMessages() {
    try {
      this.isLoading = true;
      
      const query = firebaseDB
        .collection('chatrooms')
        .doc(this.roomId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(this.batchSize);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        this.hasMore = false;
        this.isLoading = false;
        return;
      }

      this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const messages = snapshot.docs.reverse().map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.messages = [...messages, ...this.messages];
      this.buildMessageIndex(messages);
      this.renderMessages(messages, 'prepend');
      
      this.isLoading = false;
      
      // Update unread count
      await this.updateUnreadCount();
      
    } catch (error) {
      console.error('Error loading initial messages:', error);
      this.isLoading = false;
    }
  }

  // Load more messages on scroll up
  async loadMoreMessages() {
    if (!this.hasMore || this.isLoading) return;

    try {
      this.isLoading = true;
      
      const query = firebaseDB
        .collection('chatrooms')
        .doc(this.roomId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .startAfter(this.lastVisible)
        .limit(this.batchSize);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        this.hasMore = false;
        this.isLoading = false;
        return;
      }

      this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const messages = snapshot.docs.reverse().map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.messages = [...messages, ...this.messages];
      this.buildMessageIndex(messages);
      this.renderMessages(messages, 'prepend');
      
      this.isLoading = false;
      
    } catch (error) {
      console.error('Error loading more messages:', error);
      this.isLoading = false;
    }
  }

  // Build search index for new messages
  buildMessageIndex(messages) {
    messages.forEach(message => {
      if (message.text) {
        const keywords = message.text.toLowerCase().split(/\s+/);
        keywords.forEach(keyword => {
          if (!this.messageIndex.has(keyword)) {
            this.messageIndex.set(keyword, []);
          }
          this.messageIndex.get(keyword).push(message.id);
        });
      }
    });
  }

  // Search messages
  searchMessages(query) {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }

    const searchTerm = query.toLowerCase();
    const results = [];

    // Search through message index
    for (const [keyword, messageIds] of this.messageIndex) {
      if (keyword.includes(searchTerm)) {
        messageIds.forEach(id => {
          const message = this.messages.find(m => m.id === id);
          if (message && !results.find(r => r.id === id)) {
            results.push({
              ...message,
              highlightedText: this.highlightSearchTerm(message.text, searchTerm)
            });
          }
        });
      }
    }

    // Also search through all messages for partial matches
    this.messages.forEach(message => {
      if (message.text && message.text.toLowerCase().includes(searchTerm)) {
        if (!results.find(r => r.id === message.id)) {
          results.push({
            ...message,
            highlightedText: this.highlightSearchTerm(message.text, searchTerm)
          });
        }
      }
    });

    this.searchResults = results.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
    this.displaySearchResults();
  }

  // Highlight search terms
  highlightSearchTerm(text, searchTerm) {
    if (!text) return '';
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Display search results
  displaySearchResults() {
    if (!this.searchResultsContainer) return;

    this.searchResultsContainer.innerHTML = '';
    
    if (this.searchResults.length === 0) {
      this.searchResultsContainer.innerHTML = '<div class="no-results">No messages found</div>';
      return;
    }

    this.searchResults.forEach(result => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'search-result';
      resultDiv.innerHTML = `
        <div class="search-result-content">
          <div class="search-result-text">${result.highlightedText || result.text}</div>
          <div class="search-result-meta">
            <span class="search-result-author">${result.senderName}</span>
            <span class="search-result-time">${this.formatTime(result.timestamp?.toDate())}</span>
          </div>
        </div>
      `;
      
      resultDiv.addEventListener('click', () => this.jumpToMessage(result.id));
      this.searchResultsContainer.appendChild(resultDiv);
    });
  }

  // Jump to specific message
  async jumpToMessage(messageId) {
    // Check if message is already loaded
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    
    if (messageElement) {
      // Scroll to existing message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightMessage(messageId);
    } else {
      // Load more messages until we find it
      await this.loadUntilMessage(messageId);
    }
    
    this.clearSearch();
  }

  // Load messages until specific message is found
  async loadUntilMessage(messageId) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      if (this.messages.find(m => m.id === messageId)) {
        const messageElement = document.querySelector(`[data-id="${messageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.highlightMessage(messageId);
        }
        return;
      }

      if (!this.hasMore) break;
      
      await this.loadMoreMessages();
      attempts++;
    }
  }

  // Highlight a specific message
  highlightMessage(messageId) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
      messageElement.classList.add('highlighted');
      setTimeout(() => {
        messageElement.classList.remove('highlighted');
      }, 3000);
    }
  }

  // Update unread count
  async updateUnreadCount() {
    if (!this.currentUser) return;

    try {
      const readsRef = firebaseDB
        .collection('reads')
        .doc(this.currentUser.uid)
        .collection('rooms')
        .doc(this.roomId);

      const readsDoc = await readsRef.get();
      let lastReadTimestamp = null;

      if (readsDoc.exists) {
        lastReadTimestamp = readsDoc.data().lastRead?.toDate?.() || null;
      }

      // Count unread messages
      let unreadCount = 0;
      this.messages.forEach(message => {
        if (message.senderId !== this.currentUser.uid) {
          if (!lastReadTimestamp || message.timestamp?.toDate() > lastReadTimestamp) {
            unreadCount++;
          }
        }
      });

      this.unreadCount = unreadCount;
      
      // Update UI
      this.updateUnreadBadge();
      
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }

  // Update unread badge in UI
  updateUnreadBadge() {
    // This would typically update a badge in the chat interface
    // Implementation depends on your UI structure
  }

  // Mark messages as read
  async markAsRead() {
    if (!this.currentUser) return;

    try {
      const readsRef = firebaseDB
        .collection('reads')
        .doc(this.currentUser.uid)
        .collection('rooms')
        .doc(this.roomId);

      await readsRef.set({
        lastRead: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      this.unreadCount = 0;
      this.updateUnreadBadge();
      
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  // Render messages to DOM
  renderMessages(messages, mode = 'append') {
    const fragment = document.createDocumentFragment();
    let lastDate = null;

    messages.forEach(message => {
      const messageDate = new Date(message.timestamp?.toDate()).toDateString();
      
      if (messageDate !== lastDate) {
        const separator = this.createDateSeparator(messageDate);
        fragment.appendChild(separator);
        lastDate = messageDate;
      }

      const messageElement = this.createMessageElement(message);
      fragment.appendChild(messageElement);
    });

    if (mode === 'prepend') {
      const currentScrollTop = this.chatArea.scrollTop;
      const currentScrollHeight = this.chatArea.scrollHeight;
      
      this.chatArea.insertBefore(fragment, this.chatArea.firstChild);
      
      // Maintain scroll position
      const newScrollHeight = this.chatArea.scrollHeight;
      this.chatArea.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
    } else {
      this.chatArea.appendChild(fragment);
    }
  }

  // Create message element
  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-row ${message.senderId === this.currentUser.uid ? 'sent' : 'received'}`;
    messageDiv.setAttribute('data-id', message.id);
    
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
        textDiv.innerHTML = message.text;
        bubbleDiv.appendChild(textDiv);
      }
    } else {
      bubbleDiv.innerHTML = message.text;
    }
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = this.formatTime(message.timestamp?.toDate());
    bubbleDiv.appendChild(timestamp);
    
    messageDiv.appendChild(bubbleDiv);
    return messageDiv;
  }

  // Create date separator
  createDateSeparator(dateString) {
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    separator.textContent = dateString;
    return separator;
  }

  // Setup scroll listener for pagination
  setupScrollListener() {
    this.chatArea.addEventListener('scroll', () => {
      if (this.chatArea.scrollTop < 50 && this.hasMore && !this.isLoading) {
        this.loadMoreMessages();
      }
    });
  }

  // Setup search UI
  setupSearchUI() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <div class="search-input-container">
        <input type="text" class="search-input" placeholder="Search messages..." id="messageSearch">
        <button class="search-close" id="searchClose">×</button>
      </div>
      <div class="search-results" id="searchResults"></div>
    `;
    
    document.querySelector('.chat-container').appendChild(searchContainer);
    
    this.searchInput = document.getElementById('messageSearch');
    this.searchResultsContainer = document.getElementById('searchResults');
    
    // Event listeners
    this.searchInput.addEventListener('input', (e) => {
      this.searchMessages(e.target.value);
    });
    
    document.getElementById('searchClose').addEventListener('click', () => {
      this.clearSearch();
    });
  }

  // Clear search
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.searchResults = [];
    if (this.searchResultsContainer) {
      this.searchResultsContainer.innerHTML = '';
    }
  }

  // Format time
  formatTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // Handle room focus
  handleRoomFocus() {
    this.markAsRead();
  }
}
