import React from 'react';
import ThreadPreview from './ThreadPreview';

const ThreadPreviewDemo = () => {
    // Sample messages with different content lengths to test consistency
    const sampleMessages = [
        {
            id: '1',
            author: { displayName: 'John Doe', email: 'john@example.com' },
            content: 'Original message about project updates',
            replyCount: 3,
            threadParticipants: [
                { id: '1', displayName: 'John Doe', email: 'john@example.com' },
                { id: '2', displayName: 'Jane Smith', email: 'jane@example.com' },
                { id: '3', displayName: 'Mike Johnson', email: 'mike@example.com' }
            ],
            lastReply: {
                author: { displayName: 'Jane Smith', email: 'jane@example.com' },
                content: 'Short reply'
            },
            lastThreadActivity: new Date(Date.now() - 300000) // 5 minutes ago
        },
        {
            id: '2',
            author: { displayName: 'Sarah Wilson', email: 'sarah@example.com' },
            content: 'Another message about design feedback',
            replyCount: 7,
            threadParticipants: [
                { id: '1', displayName: 'Sarah Wilson', email: 'sarah@example.com' },
                { id: '2', displayName: 'Alex Chen', email: 'alex@example.com' },
                { id: '3', displayName: 'Maria Garcia', email: 'maria@example.com' },
                { id: '4', displayName: 'David Kim', email: 'david@example.com' },
                { id: '5', displayName: 'Lisa Brown', email: 'lisa@example.com' }
            ],
            lastReply: {
                author: { displayName: 'Alex Chen', email: 'alex@example.com' },
                content: 'This is a much longer reply that demonstrates how the thread preview handles longer content and ensures consistent width regardless of the message length. It should be properly truncated.'
            },
            lastThreadActivity: new Date(Date.now() - 600000) // 10 minutes ago
        },
        {
            id: '3',
            author: { displayName: 'Tom Anderson', email: 'tom@example.com' },
            content: 'Quick question about the meeting',
            replyCount: 1,
            threadParticipants: [
                { id: '1', displayName: 'Tom Anderson', email: 'tom@example.com' },
                { id: '2', displayName: 'Emma Davis', email: 'emma@example.com' }
            ],
            lastReply: {
                author: { displayName: 'Emma Davis', email: 'emma@example.com' },
                content: 'Yes'
            },
            lastThreadActivity: new Date(Date.now() - 120000) // 2 minutes ago
        },
        {
            id: '4',
            author: { displayName: 'Rachel Green', email: 'rachel@example.com' },
            content: 'Discussion about the new feature implementation and its impact on user experience',
            replyCount: 12,
            threadParticipants: [
                { id: '1', displayName: 'Rachel Green', email: 'rachel@example.com' },
                { id: '2', displayName: 'Ross Geller', email: 'ross@example.com' },
                { id: '3', displayName: 'Monica Bing', email: 'monica@example.com' },
                { id: '4', displayName: 'Chandler Bing', email: 'chandler@example.com' },
                { id: '5', displayName: 'Joey Tribbiani', email: 'joey@example.com' },
                { id: '6', displayName: 'Phoebe Buffay', email: 'phoebe@example.com' }
            ],
            lastReply: {
                author: { displayName: 'Chandler Bing', email: 'chandler@example.com' },
                content: 'Could this BE any more complicated? But seriously, I think we need to consider the performance implications of this approach and maybe look into alternative solutions that might be more scalable in the long run.'
            },
            lastThreadActivity: new Date(Date.now() - 1800000) // 30 minutes ago
        }
    ];

    const handleOpenThread = (messageId) => {
        // TODO: Implement thread opening functionality
        console.log('Would open thread for message:', messageId);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Thread Preview Width Consistency Demo</h2>
                <p className="text-gray-600 mb-8">
                    This demo shows how thread previews now have consistent widths regardless of content length. 
                    Notice how all thread previews maintain the same width and properly truncate long content.
                </p>
                
                <div className="space-y-8">
                    {sampleMessages.map((message, index) => (
                        <div key={message.id} className="border-l-4 border-indigo-200 pl-4">
                            <div className="mb-2">
                                <h3 className="font-medium text-gray-900">
                                    Test Case {index + 1}: {index === 0 ? 'Short Reply' : index === 1 ? 'Long Reply' : index === 2 ? 'Very Short Reply' : 'Very Long Reply'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'} • 
                                    {message.threadParticipants.length} participants
                                </p>
                            </div>
                            
                            {/* Original Message */}
                            <div className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                                    {message.author.displayName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">
                                            {message.author.displayName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            just now
                                        </span>
                                    </div>
                                    <div className="text-gray-800">
                                        {message.content}
                                    </div>
                                </div>
                            </div>

                            {/* Thread Preview */}
                            <div className="ml-11">
                                <ThreadPreview 
                                    message={message}
                                    onOpenThread={handleOpenThread}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Improvements Made:</h3>
                    <ul className="text-green-800 space-y-1 text-sm">
                        <li>• <strong>Consistent Width:</strong> All thread previews have the same max-width (400px)</li>
                        <li>• <strong>Consistent Height:</strong> Minimum height ensures uniform appearance</li>
                        <li>• <strong>Proper Truncation:</strong> Long content is truncated with ellipsis</li>
                        <li>• <strong>Fixed Layout:</strong> Content sections have fixed max-widths to prevent expansion</li>
                        <li>• <strong>Better Spacing:</strong> Improved padding and margins for better visual hierarchy</li>
                        <li>• <strong>Responsive Design:</strong> Adapts to smaller screens while maintaining consistency</li>
                        <li>• <strong>Smooth Animation:</strong> Fade-in effect when thread previews appear</li>
                    </ul>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">User Experience Benefits:</h3>
                    <ul className="text-blue-800 space-y-1 text-sm">
                        <li>• <strong>Predictable Layout:</strong> Users know exactly where to look for thread previews</li>
                        <li>• <strong>Easier Scanning:</strong> Consistent widths make it easier to scan through messages</li>
                        <li>• <strong>Better Visual Hierarchy:</strong> Thread previews don't compete with main message content</li>
                        <li>• <strong>Reduced Cognitive Load:</strong> Consistent design patterns reduce mental effort</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ThreadPreviewDemo; 