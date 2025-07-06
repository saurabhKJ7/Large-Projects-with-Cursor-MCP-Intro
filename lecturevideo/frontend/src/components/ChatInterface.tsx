import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import api, { ChatMessage, Timestamp } from '../services/api';

interface ChatInterfaceProps {
  videoId: string;
  onTimestampClick: (time: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ videoId, onTimestampClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage(videoId, input, messages);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const timestampRegex = /\[(\d{2}:\d{2}:\d{2})\]/g;
    const parts = [];
    let lastIndex = 0;

    message.content.replace(timestampRegex, (match, timestamp, offset) => {
      // Add text before the timestamp
      if (offset > lastIndex) {
        parts.push(message.content.slice(lastIndex, offset));
      }

      // Convert timestamp to seconds
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      // Add clickable timestamp
      parts.push(
        <button
          key={offset}
          onClick={() => onTimestampClick(totalSeconds)}
          className="text-blue-600 hover:underline"
        >
          {match}
        </button>
      );

      lastIndex = offset + match.length;
      return match;
    });

    // Add remaining text
    if (lastIndex < message.content.length) {
      parts.push(message.content.slice(lastIndex));
    }

    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-4 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {parts.length > 0 ? parts : message.content}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the lecture..."
            className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 