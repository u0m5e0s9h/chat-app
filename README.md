# Chat UI Layout - Day 1

## What was implemented today

- Created a static chat UI layout using HTML and CSS.
- Features include:
  - Fixed top bar with room title and back button.
  - Scrollable chat area with message bubbles aligned left/right based on sender.
  - Timestamps below each message.
  - Date separators between messages.
  - Static "Someone is typing..." indicator with animated dots.
  - Input field with "Send" button.
  - Responsive design for desktop and mobile using Flexbox and media queries.

## How to run and test the app

1. Open the `chat.html` file in any modern web browser (Chrome, Firefox, Edge, Safari).
2. Verify the UI layout:
   - Top bar is fixed with room title and back button.
   - Chat messages appear with correct alignment and timestamps.
   - Date separators are visible between messages.
   - The "Someone is typing..." indicator is shown statically.
   - Input field and send button are visible at the bottom.
3. Resize the browser window or open on a mobile device to test responsiveness.
4. Interact with the input field and buttons .

<img width="1917" height="875" alt="Screenshot 2025-08-12 195738" src="https://github.com/user-attachments/assets/5502f704-8cd0-414f-aa28-6220211ec343" />


#  Day 2 Chat Application with Firebase

A modern chat room application with Firebase integration for real-time messaging.

## Features

- **Real-time messaging** with Firebase Firestore
- **Anonymous authentication** - no account required
- **Message persistence** - messages are saved to Firestore
- **Character limit** - 300 characters per message
- **Error handling** - user-friendly error messages
- **Responsive design** - works on desktop and mobile

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** > **Anonymous** sign-in method
4. Enable **Firestore Database** in production mode
5. Create a **Firestore database** in your preferred region

### 2. Update Firebase Configuration

1. Open `firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

### 3. Firestore Security Rules

Set up these security rules in your Firestore console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatrooms/{roomId}/messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```
<img width="1913" height="885" alt="Screenshot 2025-08-12 221403" src="https://github.com/user-attachments/assets/ed6852ae-0814-4f22-b232-debb10d49f65" />

### 4. Run the Application

1. Save all files
2. Open `chat.html` in your browser
3. The app will automatically:
   - Sign in anonymously
   - Load existing messages
   - Enable real-time messaging

## File Structure

- `chat.html` - Main HTML structure
- `chat.css` - Styling and responsive design
- `firebase-config.js` - Firebase configuration
- `chat-firebase.js` - Main application logic
- `README.md` - This documentation

## Customization

### Room Selection
To support multiple chat rooms, modify the `ROOM_ID` in `firebase-config.js`:

```javascript
// Example: Get room from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const ROOM_ID = urlParams.get('room') || 'general';
```

### Message Limits
Adjust message limits in `chat-firebase.js`:

```javascript
// Change max length
const MAX_LENGTH = 500; // Default is 300

// Change in validateInput function
if (text.length > MAX_LENGTH) {
  showError(`Message cannot exceed ${MAX_LENGTH} characters`);
}
```

### Testing

1. Open multiple browser tabs/windows
2. Send messages from different tabs
3. Verify real-time updates across all instances
4. Test offline functionality
5. Verify error handling by disconnecting internet

# Day 3 – Real-Time Listener + Read Status

## What was implemented today

###  Real-Time Listener Enhancements
- **Optimized onSnapshot listener** for better performance
- **Real-time message updates** without page refresh
- **Efficient message rendering** with proper state management

###  Read Status Tracking
- **Firestore reads collection**: `/reads/{userId}/rooms/{roomId}`
- **Last read timestamp** tracking for each user
- **Automatic read marking** when chat is active
- **Real-time read status updates**

###  Read Receipts
- **Visual checkmarks** next to messages (✓ for sent, ✓✓ for read)
- **Real-time read status updates**
- **Different states** for sent vs read messages

###  Auto-Scroll Optimization
- **Smart scrolling** that only scrolls for current user's messages
- **Manual scroll preservation** when reading old messages
- **Smooth scroll behavior** for better UX

###  Offline Handling
- **Connection status indicator** (Online/Offline)
- **Browser network event listeners** for WiFi changes
- **Visual feedback** when connection is lost

###  Enhanced Firestore Structure
- **Messages collection** with readBy array
- **Reads collection** for tracking user read status
- **Batch updates** for marking multiple messages as read

  <img width="1903" height="879" alt="Screenshot 2025-08-12 235911" src="https://github.com/user-attachments/assets/f7749f7b-d40a-4906-a200-86987821aac3" />


## How to run and test the app

### 1. Basic Testing
1. **Open `chat.html`** in your browser
2. **Open multiple tabs** with different users
3. **Send messages** and watch real-time updates
4. **Test read receipts**:
   - Send a message → should show ✓
   - Have recipient read it → should change to ✓✓

### 2. Read Receipts Testing
1. **Open in 2 browser tabs** with different users
2. **Send a message** from User A → shows ✓
3. **User B reads the message** → updates to ✓✓ in User A's view
4. **Check Firestore** - verify `readBy` array contains recipient's user ID

### 3. Online/Offline Testing
1. **Turn off WiFi** → should show "Offline" indicator
2. **Turn on WiFi** → should show "Online" indicator
3. **Test in browser console**:
   ```javascript
   window.dispatchEvent(new Event('offline')); // Should show "Offline"
   window.dispatchEvent(new Event('online'));  // Should show "Online"
   ```

### 4. Firestore Testing
1. **Check Firestore console**:
   - Verify `messages/{messageId}/readBy` array updates
   - Check `reads/{userId}/rooms/{roomId}/lastRead` timestamps
2. **Test batch updates** by marking multiple messages as read

### 5. Performance Testing
1. **Open multiple tabs** (3-4 instances)
2. **Send rapid messages** to test real-time performance
3. **Verify smooth scrolling** and UI responsiveness
4. **Test with 100+ messages** to ensure performance

### 6. Debugging
1. **Open browser console** (F12)
2. **Watch console logs** for:
   - "Marking messages as read"
   - "Found unread messages"
   - "Successfully marked messages as read"
3. **Check network tab** for Firestore requests

### 7. Firestore Rules for Day 3
Add these rules for read status functionality:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatrooms/{roomId}/messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['readBy']);
    }
    
    match /reads/{userId}/rooms/{roomId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```


## File Structure for Day 3

- `chat.html` - Enhanced HTML with Day 3 features
- `chat.css` - Additional styles for read receipts
- `chat-firebase.js` - Enhanced JavaScript with real-time + read status
- `firebase-config.js` - Firebase configuration

## Quick Start

1. **Replace existing files** with Day 3 versions
2. **Update Firebase config** with your project details
3. **Set up Firestore rules** as shown above
4. **Open `chat.html`** in your browser
5. **Test all features** using the testing guide above

## Troubleshooting

### Read receipts not updating?
- Check Firestore console for `readBy` array updates
- Verify user authentication is working
- Check browser console for errors

### Online status not changing?
- Ensure browser network events are working
- Check if `navigator.onLine` is supported
- Verify `updateOnlineStatus` function is called

### Messages not appearing?
- Check Firestore connection
- Verify security rules allow reads
- Check console for JavaScript errors


# Day 4 –Chatroom List + Mute / Search

<img width="1821" height="901" alt="Screenshot 2025-08-13 022415" src="https://github.com/user-attachments/assets/a182e092-ea26-4449-983b-b8f06b96f5aa" />

<img width="1795" height="866" alt="Screenshot 2025-08-13 022432" src="https://github.com/user-attachments/assets/954bd6a5-3e59-45d7-8457-e11d949705e9" />

## Objective
Build a chatroom list page and allow per-room mute control.

---

## What Was Implemented Today
- Created `chatrooms.html` page to display available chatrooms.
- Displayed:
  - **Room Title**
  - **Last Message Preview**
  - **Timestamp** of last message
  - **Unread Count** based on `lastReadTimestamp`
- Added **Mute Toggle** per room.
- Mute status stored in **`/mutes/{userId}/{roomId}`** collection in Firebase.
- Implemented **Search Bar** at the top to filter rooms by title in real time.
- Data fetched dynamically from Firestore for real-time updates.

---

## Firebase Collections & Data Format Used

### `/chatrooms`
```json
{
  "id": "roomId123",
  "title": "General Chat",
  "lastMessage": "Hello there!",
  "lastMessageTimestamp": "2025-08-13T15:45:00Z"
}

```

# Day 5 – Image upload
<img width="1671" height="843" alt="Screenshot 2025-08-13 101230" src="https://github.com/user-attachments/assets/7cee1354-1fb9-4a9b-9df2-a86f081cdd12" />
<img width="1904" height="874" alt="Screenshot 2025-08-13 101215" src="https://github.com/user-attachments/assets/43843d77-15c3-4990-9b39-a3f4d6d4ccae" />

## Objective
Allow users to upload and send image messages.

---

## What Was Implemented Today
- Added **file input** to select an image from the gallery.
- Implemented **image upload** to Firebase Storage at:
 - After upload, sent a chat message containing the `imageUrl`.
- Displayed **image previews** inside chat bubbles.
- Handled both text and image messages in the same chat UI.
- Added **upload progress bar** to show real-time upload percentage.
- Restricted file size to **5MB**.
- (Optional) Added **basic image compression** before upload to optimize performance.

---
## Firebase Storage & Firestore Flow

1. **User selects an image** → Triggers file input change event.
2. **Image uploaded to Storage** → Path based on room ID & message ID.
3. **Upload progress** tracked and displayed in UI.
4. **Firestore message created** with `imageUrl`.
5. **Chat UI** updates in real-time to show new image message.


# Day 6 –  User Profile & Room Creation Features

##  Features Implemented

### 1. User Profile Persistence
- **User Profile Management**: Automatic user profile creation/updating on login
- **Searchable Users**: Typeahead search functionality for users by name/email
- **Profile Storage**: Complete user profiles with displayName, email, photoUrl, and search keys

### 2. Room Creation System
- **Room Creation**: Complete room creation with title, initial members, and proper Firestore structure
- **Member Management**: Add/remove members from existing rooms
- **Role Management**: Creator as admin, members with appropriate roles
- **Validation**: Local duplicate title validation

### 3. Firebase Integration
- **Firestore Collections**: Properly structured collections for users, chatrooms, and members
- **Authentication**: Anonymous authentication with user profile persistence
- **Storage**: Firebase Storage integration for file uploads


## Setup Instructions

### 1. Firebase Configuration
Update `firebase-config.js` with your Firebase project details:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Environment Setup
1. Clone or download the project
2. Ensure Firebase SDK is loaded:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   ```

##  Testing Instructions

### 1. User Profile Testing
```javascript

const userManager = new UserManager();
await userManager.init();
```

### 2. Room Creation Testing
```javascript

const roomManager = new RoomManager();
const room = await roomManager.createRoom(
    "Test Room",
    ["user1", "user2", "user3"],
    "currentUserId"
);
```

### 3. Member Management Testing
```javascript

await roomManager.addMemberToRoom("roomId", "newUserId", "member");
```

### 4. User Search Testing
```javascript

const users = await userManager.searchUsers("test");
```


##  Testing Commands

### 1. Test User Creation
```bash

const userManager = new UserManager();
await userManager.init();
```

### 2. Test Room Creation
```bash

const roomManager = new RoomManager();
await roomManager.createRoom("Test Room", ["user1", "user2"], "currentUser");
```

### 3. Test Member Search
```bash

const users = await userManager.searchUsers("test");
```

##  Firestore Structure

### Users Collection
```javascript
users/{uid}: {
  displayName: string,
  email: string,
  photoUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  searchKeys: [string]
}
```

### Chatrooms Collection
```javascript
chatrooms/{roomId}: {
  type: "group",
  title: string,
  createdBy: string,
  createdAt: timestamp,
  memberCount: number
}
```

### Members Collection
```javascript
chatrooms/{roomId}/members/{uid}: {
  role: "admin" | "member",
  joinedAt: timestamp
}
```

##  Quick Start

1. **Clone the repository**
2. **Update Firebase configuration** in `firebase-config.js`
3. **Open `chatrooms.html`** in your browser
4. **Test user registration** by logging in (anonymous auth)
5. **Create a new room** using the room creation dialog
6. **Test member addition** and search functionality




# Day 7 – Room Members Management

## Objective
Manage membership in a room and enforce admin-only actions.

## What Was Implemented Today

###  Core Features Completed
- **room_members.html** - Complete room members management page with:
  - Member listing with avatars, display names, and role badges
  - Admin-only actions (add/remove members)
  - Real-time Firestore updates
  - Protection against removing the last admin
  - User search and selection modal for adding members
  - Responsive design with loading/empty states

###  Technical Implementation
- **Real-time Firestore listeners** for live member updates
- **Batch operations** for efficient member management
- **Role-based permissions** (admin vs member)
- **Comprehensive error handling** and user feedback

###  Files Created
- `room_members.html` - Main room members management page


## How to Run and Test the Room Members Feature

### 1. Basic Testing
1. **Open `room_members.html?roomId=YOUR_ROOM_ID`** in your browser
2. **Sign in with Firebase** (anonymous auth is supported)
3. **View member list** with avatars, names, and role badges
4. **Test admin permissions**:
   - If you're an admin: see "Add Member" button
   - If you're a member: see read-only view

### 2. Admin Features Testing
1. **Add new members**:
   - Click "Add Member" button
   - Search for users by name or email
   - Select multiple users to add
   - Confirm addition with batch operation

2. **Remove members**:
   - Click "Remove" button next to non-admin members
   - Confirm removal in dialog
   - Verify member is removed from list

3. **Last admin protection**:
   - Try to remove the last admin → should show error
   - Verify at least one admin remains in room

### 3. Real-time Testing
1. **Open multiple browser tabs** with the same room
2. **Add/remove members** in one tab
3. **Verify updates** appear instantly in all tabs
4. **Test Firestore listeners** are working correctly

### 4. Firestore Structure Testing
1. **Check Firestore console**:
   - Verify `/chatrooms/{roomId}/members/{userId}` documents
   - Check role field (admin/member)
   - Verify joinedAt timestamps

2. **Test member count updates**:
   - Add/remove members
   - Verify memberCount field updates in room document



### 5. Security Testing
1. **Test non-admin access**:
   - Sign in as regular member
   - Verify no admin actions are available
   - Verify read-only access

2. **Test unauthorized access**:
   - Try to access room you're not a member of
   - Verify appropriate error handling


## Quick Start Guide

1. **Set up Firebase** with the configuration from previous days
2. **Update Firestore rules** with the room members rules above
3. **Open `test-room-members.html`** for easy testing
4. **Click test links** to open different rooms
5. **Test all features** using the guide above



# Day 8 – Online Presence & Typing Indicators


## What Was Implemented Today

### Online Presence System
- **Real-time online user tracking** using Firestore
- **Presence collection**: `/presence/{userId}` with `lastActiveAt` timestamp
- **Automatic updates** on user activity (focus, typing, heartbeat)
- **Online count display** in chat room header
- **30-second heartbeat** to maintain presence
- **Graceful cleanup** on page unload

###  Typing Indicators
- **Real-time typing detection** with debouncing
- **Typing collection**: `/typing/{roomId}/users/{userId}`
- **Smart aggregation** for multiple users typing
- **5-second timeout** for inactive typing
- **Rate limiting** (1 write per second)
- **Debounced input** (300ms delay)

###  UI Enhancements
- **Online count badge** in chat room header
- **"X is typing..." indicator** below chat messages
- **Multi-user typing** support ("X and Y are typing...")
- **Responsive design** for mobile devices
- **Clean visual indicators** with smooth transitions

###  Performance Optimizations
- **Client-side throttling** to reduce writes
- **Automatic cleanup** of expired typing indicators
- **Efficient Firestore listeners** with proper cleanup
- **Memory management** on page navigation

## Files Created Today

### New Files:
- **`presence-manager.js`** - Handles online presence tracking
- **`typing-manager.js`** - Manages typing indicators with debouncing

### Modified Files:
- **`chat.html`** - Added online count and typing indicator UI
- **`chat.css`** - Styled new presence and typing indicators
- **`chat-firebase.js`** - Integrated presence and typing functionality

## How to Run and Test

### 1. Basic Setup
1. **Update Firebase configuration** in `firebase-config.js` with your project details
2. **Add Firestore security rules** (see rules below)
3. **Open `chat.html`** in your browser with a valid room ID

### 2. Testing Online Presence
1. **Open multiple browser tabs** with the same room
2. **Check online count** in the top-right corner
3. **Close a tab** - count should decrease after 30 seconds
4. **Switch between tabs** - presence updates on focus

### 3. Testing Typing Indicators
1. **Open 2+ browser tabs** with different users
2. **Start typing** in the message input
3. **See "X is typing..."** appear in other tabs
4. **Stop typing** - indicator disappears after 5 seconds
5. **Send a message** - typing indicator clears immediately

### 4. Multi-User Testing
1. **Open 3+ browser tabs** with different users
2. **Have multiple users type simultaneously**
3. **See aggregated messages** like:
   - "Alice is typing..."
   - "Alice and Bob are typing..."
   - "Alice and 2 others are typing..."

### 5. Performance Testing
1. **Open browser console** (F12)
2. **Watch console logs** for:
   - "Updating presence..."
   - "Starting typing..."
   - "Clearing typing..."
3. **Check Firestore** for presence and typing collections



## Firestore Security Rules

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Presence rules
    match /presence/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Typing rules
    match /typing/{roomId}/users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Existing rules for messages
    match /chatrooms/{roomId}/messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['readBy']);
    }
  }
}
```

## Quick Start Guide

### 1. Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable **Authentication** > **Anonymous** sign-in
4. Enable **Firestore Database**
5. Add the security rules above

### 2. Update Configuration
1. Open `firebase-config.js`
2. Replace with your Firebase project config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

### 3. Test the Features
1. **Open `chat.html`** in your browser
2. **Add `?roomId=test` to URL** if needed
3. **Open multiple tabs** to test real-time features
4. **Start typing** to see typing indicators
5. **Check online count** in the header

## Testing Commands

### Browser Console Testing
```javascript
// Test presence updates
presenceManager.updatePresence();

// Test typing indicators
typingManager.startTyping();

// Check online users
presenceManager.getOnlineUsers().then(users => console.log(users));

// Check typing users
typingManager.getTypingUsers().then(users => console.log(users));
```

### URL Testing
```
chat.html?roomId=general
chat.html?roomId=random
chat.html?roomId=testing
```

## Troubleshooting

### Presence not updating?
- Check Firestore console for `/presence` collection
- Verify user authentication is working
- Check browser console for errors

### Typing indicators not showing?
- Ensure `/typing` collection has documents
- Check if debounce delay is working (300ms)
- Verify rate limiting isn't blocking writes

### Online count incorrect?
- Check if heartbeat is running (30-second intervals)
- Verify cleanup on page unload is working
- Check Firestore timestamps are correct



# Day 9 - Efficient History Loading & Message Search

##  Features Implemented

### Pagination System
- Efficient message loading using Firestore queries with `limit(N)` and `startAfter()`
- Scroll-based loading (loads more messages when scrolling up)
- Maintains scroll position during DOM updates
- Batch loading of 20 messages at a time

###  Search Functionality
- Client-side search with in-memory message index
- Real-time search with highlighting of matched terms
- Jump-to-message functionality with smooth scrolling
- Search results display with metadata

###  Unread Management
- Enhanced `/reads/{userId}/{roomId}` structure
- Efficient unread count calculation with pagination
- Automatic marking of messages as read on room focus



---

##  New Files Created
- `chat-pagination.js` - Complete pagination and search manager
- `chat-pagination.css` - Styles for search and pagination features

##  Updated Files
- `chat.html` - Added new pagination script
- `chatrooms.html` - Added pagination CSS integration

---

##  How to Run and Test

### 1. Basic Setup
- Update Firebase configuration in `firebase-config.js` with your project details
- Add Firestore security rules (see below)
- Open `chat.html` in your browser with a valid room ID

### 2. Testing Pagination
- Open `chat.html` with a room that has many messages
- Scroll up to trigger loading more messages
- Verify scroll position is maintained during loading
- Check loading indicators appear during pagination

### 3. Testing Search
- Open any chat room with messages
- Use the search input to find specific messages
- Click search results to jump to specific messages
- Verify highlighting of search terms in results

### 4. Testing Unread Counts
- Open `chatrooms.html` to see room list
- Check unread badges on room cards
- Enter a room to mark messages as read
- Verify unread count updates automatically


---

##  Firestore Security Rules
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages with pagination support
    match /chatrooms/{roomId}/messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null 
        && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['readBy']);
    }
    
    // Reads collection for unread tracking
    match /reads/{userId}/rooms/{roomId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

##  Quick Start Commands
```bash
# Open chat rooms
open chatrooms.html

# Open specific room
open chat.html?roomId=general

# Open room with pagination
open chat.html?roomId=test&pagination=true
```

---

## 🌐 Testing URLs
- `chat.html?roomId=general`
- `chat.html?roomId=random`
- `chat.html?roomId=testing`

---

##  Browser Console Testing
```js
// Test pagination
const pagination = new ChatPaginationManager('roomId', user);
await pagination.loadInitialMessages();

// Test search
pagination.searchMessages('hello');

// Test unread count
await pagination.updateUnreadCount();
```

---

##  Key Features to Test
 Pagination - Scroll up to load more messages  
 Search - Find messages by text content  
 Unread counts - Real-time unread tracking  
 Scroll position - Maintained during pagination  
 Performance - Efficient loading with large datasets  
 Responsive design - Works on mobile and desktop  



# Day 9 - Efficient History Loading & Message Search

## Phase 1: Firestore Security Rules
-  Create comprehensive firestore.rules file
-  Implement authentication requirements
-  Add room member permission checks
-  Add admin-only member management
-  Add message ownership validation
-  Add user leave room functionality

## Phase 2: Emulator Tests
-  Set up Firebase emulator configuration
-  Create test file structure
-  Write tests for member permissions
-  Write tests for non-member restrictions
-  Write tests for admin actions
-  Write tests for message creation rules
-  Write tests for user leave functionality

## Phase 3: UI/UX Polish
-  Add disabled composer for non-members
-  Add error banners for failed writes
-  Add retry buttons for failed operations
-  Fix keyboard/scroll behavior on mobile
-  Add loading states for permission checks

## Phase 4: Accessibility Improvements
-  Add alt text for images
-  Add ARIA labels for interactive elements
-  Improve focus order
-  Add keyboard navigation support


