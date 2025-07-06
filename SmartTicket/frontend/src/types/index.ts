export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  confidence_score: number;
  tags: string[];
  user_id: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: number;
  ticket_id: number;
  content: string;
  is_automated: boolean;
  confidence_score?: number;
  sources?: any[];
  created_at: string;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding_id: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
}

export interface CreateKnowledgeBaseDto {
  title: string;
  content: string;
  category: string;
  tags: string[];
} 