import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User
} from 'lucide-react';
import type { ConversationSession } from '@/types/chat';

interface ConversationHistoryPanelProps {
  conversations: ConversationSession[];
  currentConversationId: string | null;
  isVisible: boolean;
  onToggle: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onCreateNewConversation: () => void;
}

export const ConversationHistoryPanel: React.FC<ConversationHistoryPanelProps> = ({
  conversations,
  currentConversationId,
  isVisible,
  onToggle,
  onSelectConversation,
  onDeleteConversation,
  onCreateNewConversation
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getLastMessage = (conversation: ConversationSession): string => {
    if (conversation.messages.length === 0) return 'No messages yet';
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const content = lastMessage.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const handleDelete = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId === conversationId) {
      onDeleteConversation(conversationId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(conversationId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => 
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 shadow-2xl z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={onCreateNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create New Dialog Box
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {sortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start your first chat!</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {sortedConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentConversationId === conversation.id
                          ? 'bg-indigo-100 border-2 border-indigo-300'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      {/* Current conversation indicator */}
                      {currentConversationId === conversation.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                      )}

                      {/* Conversation content */}
                      <div className="pl-2">
                        {/* Title */}
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-gray-800 text-sm truncate pr-2">
                            {conversation.title}
                          </h3>
                          <button
                            onClick={(e) => handleDelete(conversation.id, e)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 ${
                              deleteConfirmId === conversation.id
                                ? 'bg-red-100 opacity-100'
                                : ''
                            }`}
                          >
                            <Trash2 className={`w-3 h-3 ${
                              deleteConfirmId === conversation.id
                                ? 'text-red-600'
                                : 'text-gray-400 hover:text-red-600'
                            }`} />
                          </button>
                        </div>

                        {/* Last message preview */}
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {getLastMessage(conversation)}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(conversation.updatedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{conversation.messages.length}</span>
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {deleteConfirmId === conversation.id && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                            Click again to delete
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggle Button (when panel is hidden) */}
      {!isVisible && (
        <motion.button
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          onClick={onToggle}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-l-lg shadow-lg hover:bg-white transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
