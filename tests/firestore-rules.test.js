const { initializeTestApp, assertFails, assertSucceeds } = require('@firebase/testing');
const fs = require('fs');

describe('Firestore Security Rules', () => {
  let app;
  let adminApp;
  let db;
  let adminDb;

  beforeEach(async () => {
    app = initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'test-user-1', email: 'test1@example.com' }
    });
    
    adminApp = initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'admin-user', email: 'admin@example.com' }
    });
    
    db = app.firestore();
    adminDb = adminApp.firestore();
  });

  describe('Authentication Rules', () => {
    test('should allow authenticated users to read chatrooms', async () => {
      await assertSucceeds(
        db.collection('chatrooms').doc('room1').get()
      );
    });

    test('should deny unauthenticated users to read chatrooms', async () => {
      const unauthApp = initializeTestApp({
        projectId: 'test-project',
        auth: null
      });
      const unauthDb = unauthApp.firestore();
      
      await assertFails(
        unauthDb.collection('chatrooms').doc('room1').get()
      );
    });
  });

  describe('Room Member Permissions', () => {
    beforeEach(async () => {
      // Setup test data
      await adminDb.collection('chatrooms').doc('room1').set({
        title: 'Test Room',
        createdBy: 'admin-user'
      });
      
      await adminDb.collection('chatrooms').doc('room1').collection('members').doc('test-user-1').set({
        role: 'member',
        joinedAt: new Date()
      });
      
      await adminDb.collection('chatrooms').doc('room1').collection('members').doc('admin-user').set({
        role: 'admin',
        joinedAt: new Date()
      });
    });

    test('should allow room members to read messages', async () => {
      await adminDb.collection('chatrooms').doc('room1').collection('messages').add({
        text: 'Hello',
        senderId: 'test-user-1',
        createdAt: new Date()
      });
      
      await assertSucceeds(
        db.collection('chatrooms').doc('room1').collection('messages').get()
      );
    });

    test('should deny non-members from reading messages', async () => {
      const nonMemberApp = initializeTestApp({
        projectId: 'test-project',
        auth: { uid: 'non-member', email: 'non@example.com' }
      });
      const nonMemberDb = nonMemberApp.firestore();
      
      await assertFails(
        nonMemberDb.collection('chatrooms').doc('room1').collection('messages').get()
      );
    });

    test('should allow members to create messages', async () => {
      await assertSucceeds(
        db.collection('chatrooms').doc('room1').collection('messages').add({
          text: 'Hello',
          senderId: 'test-user-1',
          createdAt: new Date()
        })
      );
    });

    test('should deny non-members from creating messages', async () => {
      const nonMemberApp = initializeTestApp({
        projectId: 'test-project',
        auth: { uid: 'non-member', email: 'non@example.com' }
      });
      const nonMemberDb = nonMemberApp.firestore();
      
      await assertFails(
        nonMemberDb.collection('chatrooms').doc('room1').collection('messages').add({
          text: 'Hello',
          senderId: 'non-member',
          createdAt: new Date()
        })
      );
    });

    test('should allow admins to add members', async () => {
      await assertSucceeds(
        adminDb.collection('chatrooms').doc('room1').collection('members').doc('new-user').set({
          role: 'member',
          joinedAt: new Date()
        })
      );
    });

    test('should deny non-admins from adding members', async () => {
      await assertFails(
        db.collection('chatrooms').doc('room1').collection('members').doc('new-user').set({
          role: 'member',
          joinedAt: new Date()
        })
      );
    });

    test('should allow users to leave room', async () => {
      await assertSucceeds(
        db.collection('chatrooms').doc('room1').collection('members').doc('test-user-1').delete()
      );
    });
  });

  describe('Message Creation Rules', () => {
    beforeEach(async () => {
      await adminDb.collection('chatrooms').doc('room1').set({
        title: 'Test Room',
        createdBy: 'admin-user'
      });
      
      await adminDb.collection('chatrooms').doc('room1').collection('members').doc('test-user-1').set({
        role: 'member',
        joinedAt: new Date()
      });
    });

    test('should allow valid message creation', async () => {
      await assertSucceeds(
        db.collection('chatrooms').doc('room1').collection('messages').add({
          text: 'Hello',
          senderId: 'test-user-1',
          createdAt: new Date()
        })
      );
    });

    test('should deny invalid message creation', async () => {
      await assertFails(
        db.collection('chatrooms').doc('room1').collection('messages').add({
          text: 'Hello',
          senderId: 'wrong-user',
          createdAt: new Date()
        })
      );
    });
  });
});
