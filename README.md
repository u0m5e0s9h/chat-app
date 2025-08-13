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

# Day 5 -