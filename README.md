
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
