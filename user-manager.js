// User Manager for handling user profile persistence and operations
class UserManager {
    constructor() {
        this.currentUser = null;
        this.usersCollection = firebase.firestore().collection('users');
    }

    // Initialize user manager with current user
    async init() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.upsertUserProfile(user);
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Upsert user profile on first login
    async upsertUserProfile(user) {
        try {
            const userRef = this.usersCollection.doc(user.uid);
            const userDoc = await userRef.get();
            
            const userData = {
                displayName: user.displayName || '',
                email: user.email || '',
                photoUrl: user.photoURL || '',
                createdAt: userDoc.exists ? userDoc.data().createdAt : firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                searchKeys: this.generateSearchKeys(user.displayName || '', user.email || '')
            };

            await userRef.set(userData, { merge: true });
            console.log('User profile upserted:', user.uid);
            return userData;
        } catch (error) {
            console.error('Error upserting user profile:', error);
            throw error;
        }
    }

    // Generate search keys for typeahead search
    generateSearchKeys(displayName, email) {
        const keys = [];
        
        // Add display name variations
        if (displayName) {
            keys.push(displayName.toLowerCase());
            const nameParts = displayName.toLowerCase().split(' ');
            nameParts.forEach(part => {
                if (part.length > 1) keys.push(part);
            });
        }
        
        // Add email variations
        if (email) {
            keys.push(email.toLowerCase());
            const emailParts = email.toLowerCase().split('@');
            keys.push(emailParts[0]);
        }
        
        return [...new Set(keys)]; // Remove duplicates
    }

    // Search users by search keys
    async searchUsers(query) {
        try {
            if (!query || query.length < 2) return [];
            
            const searchTerm = query.toLowerCase();
            const snapshot = await this.usersCollection
                .where('searchKeys', 'array-contains', searchTerm)
                .limit(10)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    // Get user by ID
    async getUser(userId) {
        try {
            const userDoc = await this.usersCollection.doc(userId).get();
            return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Get all users (for admin purposes)
    async getAllUsers() {
        try {
            const snapshot = await this.usersCollection.limit(50).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
}

// Export for use in other modules
window.UserManager = UserManager;
