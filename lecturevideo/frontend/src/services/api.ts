import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Timestamp {
  time: number;
  text: string;
}

export interface ChatResponse {
  response: string;
  timestamps: Timestamp[];
  relevant_chunks: string[];
}

const api = {
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/video/upload`, formData);
    return response.data;
  },

  processVideo: async (videoId: string) => {
    const response = await axios.post(`${API_URL}/video/process/${videoId}`);
    return response.data;
  },

  sendMessage: async (videoId: string, message: string, conversationHistory: ChatMessage[] = []) => {
    const response = await axios.post<ChatResponse>(`${API_URL}/chat/message`, {
      video_id: videoId,
      message,
      conversation_history: conversationHistory,
    });
    return response.data;
  },
};

export default api; 