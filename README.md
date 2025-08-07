# Chat App

## Daily Update :Day 1

### What was implemented today
- Created a responsive chat screen layout using HTML and CSS.
- Designed a fixed top bar with room title and back button.
- Implemented a scrollable chat area with message bubbles aligned left/right based on sender.
- Added timestamps below each message.
- Created an input field with a "Send" button.
- Ensured responsiveness on desktop and mobile using media queries.
- Added date separators between messages.
- Added a static "typing..." indicator.
- Enhanced the design with modern, visual styling including gradients, glass morphism, animations, and 
  hover effects.
- Added a light background color to the chat section for better visual appeal.

### How to run and test the app
1. Open the `chat.html` file in any modern web browser .
2. The chat interface will load with sample messages and UI elements.
3. Resize the browser window or open on different devices to test responsiveness.


## Daily Update :Day 2

### What was implemented today
- **Complete Firebase Integration**: Added full Firebase functionality for real-time messaging
- **Anonymous Authentication**: Implemented anonymous login for users
- **Message Sending**: Added functionality to send messages and save to Firestore
- **Real-time Updates**: Messages sync across all connected clients in real-time
- **Error Handling**: Added user-friendly error messages for network issues
- **Input Validation**: Added 300-character limit and empty message prevention
- **UI Enhancements**: Added loading indicators and character counter

### Firebase Collections and Data Format

**Collection Structure:**
- **Path**: `/chatrooms/{roomId}/messages/{messageId}`
- **Room ID**: `general-chat` (placeholder)

**Message Document Format:**
```javascript
{
  id: "unique-message-id",
  senderId: "user-uid-from-anonymous-auth",
  text: "message content",
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
}
```

**Example Document:**
```javascript
{
  id: "abc123",
  senderId: "anonymous-user-uid",
  text: "Hello, how are you?",
  timestamp: 2024-01-15T10:30:00.000Z
}
```

### How to run and test the app
1. **Setup Firebase**: Replace Firebase config placeholders in chat.html with actual project credentials
2. **Open App**: Open chat.html in any modern web browser
3. **Test Features**:
   - Send messages and see real-time updates
   - Verify 300-character limit works
   - Check empty message prevention
   - Test error handling by disconnecting network
4. **Multi-user Testing**: Open in multiple browser tabs to test real-time sync
5. **Mobile Testing**: Test responsiveness on mobile devices


