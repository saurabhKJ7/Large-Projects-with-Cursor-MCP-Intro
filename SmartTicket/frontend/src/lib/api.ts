import axios from 'axios';
import { CreateKnowledgeBaseDto, CreateTicketDto, KnowledgeBase, LoginResponse, Ticket, User } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const { data } = await api.post<LoginResponse>('/api/users/token', formData);
    return data;
  },
  register: async (email: string, password: string, fullName: string): Promise<User> => {
    const { data } = await api.post<User>('/api/users/register', {
      email,
      password,
      full_name: fullName,
    });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/api/users/me');
    return data;
  },
};

export const tickets = {
  create: async (ticket: CreateTicketDto): Promise<Ticket> => {
    const { data } = await api.post<Ticket>('/api/tickets', ticket);
    return data;
  },
  list: async (): Promise<Ticket[]> => {
    const { data } = await api.get<Ticket[]>('/api/tickets');
    return data;
  },
  get: async (id: number): Promise<Ticket> => {
    const { data } = await api.get<Ticket>(`/api/tickets/${id}`);
    return data;
  },
  addResponse: async (ticketId: number, content: string): Promise<Ticket> => {
    const { data } = await api.post<Ticket>(`/api/tickets/${ticketId}/response`, { content });
    return data;
  },
};

export const knowledgeBase = {
  create: async (entry: CreateKnowledgeBaseDto): Promise<KnowledgeBase> => {
    const { data } = await api.post<KnowledgeBase>('/api/knowledge', entry);
    return data;
  },
  list: async (): Promise<KnowledgeBase[]> => {
    const { data } = await api.get<KnowledgeBase[]>('/api/knowledge');
    return data;
  },
  get: async (id: number): Promise<KnowledgeBase> => {
    const { data } = await api.get<KnowledgeBase>(`/api/knowledge/${id}`);
    return data;
  },
}; 