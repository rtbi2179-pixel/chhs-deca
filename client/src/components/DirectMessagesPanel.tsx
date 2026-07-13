'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Search, X, MessageCircle } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface User {
  id: number;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  body: string;
  readAt?: Date | null;
  createdAt: Date;
}

// Inner component that handles messaging logic
function MessagesContent() {
  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Search users
  const { data: searchResults, isLoading: isSearching } = trpc.members.searchUsers.useQuery(
    { emailQuery: searchQuery },
    { enabled: searchQuery.length > 0 && isOpen }
  );

  // Get messages with selected user
  const { data: conversationMessages } = trpc.members.getMessages.useQuery(
    { otherUserId: selectedUser?.id || 0 },
    { enabled: !!selectedUser }
  );

  // Send message mutation
  const sendMessageMutation = trpc.members.sendMessage.useMutation();

  // Get conversations
  const { data: conversations } = trpc.members.getConversations.useQuery(
    {},
    { enabled: isOpen }
  );

  // Update messages when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages);
      scrollToBottom();
    }
  }, [conversationMessages]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    try {
      await sendMessageMutation.mutateAsync({
        recipientId: selectedUser.id,
        body: messageText,
      });

      // Add message to local state immediately
      setMessages([
        ...messages,
        {
          id: Date.now(),
          senderId: currentUser.id,
          recipientId: selectedUser.id,
          body: messageText,
          createdAt: new Date(),
        },
      ]);
      setMessageText('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedUser(null);
    setSearchQuery('');
    setMessages([]);
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-40"
          title="Direct Messages"
          aria-label="Open Direct Messages"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Messages Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-96 max-w-full h-screen bg-background border-l border-border shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
            <h2 className="text-lg font-bold text-foreground truncate">
              {selectedUser ? selectedUser.name : 'Direct Messages'}
            </h2>
            <button
              onClick={handleClose}
              className="text-foreground/60 hover:text-foreground transition-colors p-1"
              aria-label="Close messages"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!selectedUser ? (
            <>
              {/* Search Bar */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/50" />
                  <Input
                    type="text"
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results or Conversations */}
              <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                  <>
                    {isSearching ? (
                      <div className="flex items-center justify-center h-20">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <div className="space-y-2 p-4">
                        {searchResults.map((user: any) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user as User)}
                            className="w-full text-left p-3 rounded-lg hover:bg-background/80 border border-border transition-colors"
                          >
                            <div className="font-medium text-foreground">{user.name || 'Unknown'}</div>
                            <div className="text-sm text-foreground/60">{user.email || 'No email'}</div>
                            {user.role === 'super_admin' && (
                              <div className="text-xs text-yellow-400 mt-1">👑 Founder</div>
                            )}
                            {user.role === 'admin' && user.role !== 'super_admin' && (
                              <div className="text-xs text-blue-400 mt-1">👤 Admin</div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-foreground/60">
                        No users found
                      </div>
                    )}
                  </>
                ) : conversations && conversations.length > 0 ? (
                  <div className="space-y-2 p-4">
                    {conversations.map((conv: any) => {
                      const otherUserId = conv.senderId === currentUser?.id ? conv.recipientId : conv.senderId;
                      const otherUserName = conv.senderId === currentUser?.id ? conv.recipientName : conv.senderName;
                      return (
                        <button
                          key={otherUserId}
                          onClick={() => {
                            const user: User = {
                              id: otherUserId,
                              name: (otherUserName || 'Unknown') as string,
                              email: '',
                              role: 'user',
                            };
                            handleSelectUser(user);
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-background/80 border border-border transition-colors"
                        >
                          <div className="font-medium text-foreground truncate">
                            {otherUserName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-foreground/60 truncate">
                            {conv.body}
                          </div>
                          <div className="text-xs text-foreground/40 mt-1">
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-foreground/60">
                    No conversations yet. Search for a member to start messaging.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                {messages.length === 0 ? (
                  <div className="text-center text-foreground/60 mt-8">
                    Start a conversation with {selectedUser.firstName || selectedUser.name}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.senderId === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-background/80 border border-border text-foreground'
                        }`}
                      >
                        <p className="break-words text-sm">{msg.body}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-background/95 backdrop-blur">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Back Button */}
              <div className="p-4 border-t border-border">
                <Button
                  onClick={() => setSelectedUser(null)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Back to Conversations
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// Outer component that handles auth check
export function DirectMessagesPanel() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return <MessagesContent />;
}
