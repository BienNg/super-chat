// Simple hash function for deterministic "randomness"
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

export const addMockThreadData = (messages) => {
    return messages.map((message, index) => {
        // Add thread data to some messages for demo purposes
        if (index % 3 === 0 && message.content && message.content.length > 20) {
            const mockParticipants = [
                { id: 'user1', displayName: 'Sarah Johnson', email: 'sarah@example.com' },
                { id: 'user2', displayName: 'Alex Chen', email: 'alex@example.com' },
                { id: 'user3', displayName: 'Mai Tran', email: 'mai@example.com' },
                { id: 'user4', displayName: 'John Doe', email: 'john@example.com' }
            ];

            // Use message ID or content for deterministic "randomness"
            const seed = simpleHash(message.id || message.content || index.toString());
            
            const replyCount = (seed % 8) + 1;
            const participantCount = (seed % 3) + 2;
            const selectedParticipants = mockParticipants.slice(0, participantCount);

            return {
                ...message,
                replyCount,
                threadParticipants: selectedParticipants,
                lastReply: {
                    content: getReplyContent(seed),
                    author: selectedParticipants[seed % selectedParticipants.length],
                    createdAt: new Date(Date.now() - ((seed % 3600) * 1000)) // Deterministic time within last hour
                },
                lastThreadActivity: new Date(Date.now() - ((seed % 1800) * 1000)) // Deterministic time within last 30 minutes
            };
        }
        return message;
    });
};

const getReplyContent = (seed) => {
    const replies = [
        "Thanks for the clarification!",
        "I agree with this approach.",
        "Could you provide more details?",
        "This is really helpful, thank you!",
        "I have a follow-up question about this.",
        "Great point! I hadn't considered that.",
        "This makes sense now.",
        "Can we schedule a meeting to discuss this further?",
        "I'll work on this and get back to you.",
        "Perfect, that's exactly what I needed."
    ];
    
    return replies[seed % replies.length];
}; 