import React from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage } from '@/lib/chatService';
import {
  getMessageContainerClasses,
  getAvatarClasses,
  getMessageClasses,
  getMessageBorderClasses,
  getTimestampClasses,
  formatMessageTime,
  hasMessageConfidence,
  hasMessageSources,
  getConfidenceColor,
  getConfidenceTextColor
} from '@/lib/messageService';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={getMessageContainerClasses(message.role)}
        >
          {/* Avatar */}
          <div className={getAvatarClasses(message.role)}>
            {message.role === 'user' ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Message Bubble */}
          <div className={getMessageClasses(message.role)}>
            <div className="whitespace-pre-wrap">{message.content}</div>

            {/* Message Metadata */}
            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${getMessageBorderClasses(message.role)}`}>
              <span className={`text-xs ${getTimestampClasses(message.role)}`}>
                {formatMessageTime(message.timestamp)}
              </span>

              {message.role === 'assistant' && hasMessageConfidence(message) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getConfidenceColor(message.confidence!)}`}
                        style={{ width: `${message.confidence}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getConfidenceTextColor(message.confidence!)}`}>
                      {message.confidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sources */}
            {message.role === 'assistant' && hasMessageSources(message) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Sources:</span>
                {message.sources!.map((source, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};
