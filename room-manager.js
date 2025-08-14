// Room Manager for handling room creation and member management
class RoomManager {
    constructor() {
        this.roomsCollection = firebase.firestore().collection('chatrooms');
    }

    // Create a new room with initial members
    async createRoom(title, initialMembers, createdBy) {
        try {
            // Validate title
            if (!title || title.trim().length === 0) {
                throw new Error('Room title is required');
            }

            // Check for duplicate titles locally
            const existingRooms = await this.roomsCollection
                .where('title', '==', title.trim())
                .limit(1)
                .get();

            if (!existingRooms.empty) {
                throw new Error('A room with this title already exists');
            }

            // Create room document
            const roomRef = this.roomsCollection.doc();
            const roomId = roomRef.id;
            const now = firebase.firestore.FieldValue.serverTimestamp();

            const roomData = {
                type: 'group',
                title: title.trim(),
                createdBy: createdBy,
                createdAt: now,
                memberCount: initialMembers.length
            };

            // Create room document
            await roomRef.set(roomData);

            // Add initial members
            const batch = firebase.firestore().batch();
            
            initialMembers.forEach(memberId => {
                const memberRef = roomRef.collection('members').doc(memberId);
                batch.set(memberRef, {
                    role: memberId === createdBy ? 'admin' : 'member',
                    joinedAt: now
                });
            });

            await batch.commit();
            console.log('Room created successfully:', roomId);
            
            return { roomId, ...roomData };
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    // Get members of a room
    async getRoomMembers(roomId) {
        try {
            const membersSnapshot = await this.roomsCollection
                .doc(roomId)
                .collection('members')
                .get();

            const memberIds = membersSnapshot.docs.map(doc => doc.id);
            
            // Get user details for each member
            const userPromises = memberIds.map(async (userId) => {
                const userDoc = await firebase.firestore().collection('users').doc(userId).get();
                return userDoc.exists ? { id: userId, ...userDoc.data() } : null;
            });

            const members = await Promise.all(userPromises);
            return members.filter(member => member !== null);
        } catch (error) {
            console.error('Error getting room members:', error);
            return [];
        }
    }

    // Check if user is a member of a room
    async isRoomMember(roomId, userId) {
        try {
            const memberDoc = await this.roomsCollection
                .doc(roomId)
                .collection('members')
                .doc(userId)
                .get();
            
            return memberDoc.exists;
        } catch (error) {
            console.error('Error checking room membership:', error);
            return false;
        }
    }

    // Add member to existing room
    async addMemberToRoom(roomId, userId, role = 'member') {
        try {
            const memberRef = this.roomsCollection
                .doc(roomId)
                .collection('members')
                .doc(userId);
            
            await memberRef.set({
                role: role,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update member count
            await this.roomsCollection.doc(roomId).update({
                memberCount: firebase.firestore.FieldValue.increment(1)
            });

            console.log('Member added to room:', userId);
            return true;
        } catch (error) {
            console.error('Error adding member to room:', error);
            throw error;
        }
    }

    // Get all rooms for a user
    async getUserRooms(userId) {
        try {
            // This is a simplified version - in production you might want to use a more efficient query
            const roomsSnapshot = await this.roomsCollection.get();
            const userRooms = [];

            for (const roomDoc of roomsSnapshot.docs) {
                const isMember = await this.isRoomMember(roomDoc.id, userId);
                if (isMember) {
                    userRooms.push({
                        id: roomDoc.id,
                        ...roomDoc.data()
                    });
                }
            }

            return userRooms;
        } catch (error) {
            console.error('Error getting user rooms:', error);
            return [];
        }
    }
}

// Export for use in other modules
window.RoomManager = RoomManager;
