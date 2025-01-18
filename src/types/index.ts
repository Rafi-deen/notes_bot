import { Context as TelegrafContext } from 'telegraf';
import { Message, Update } from 'telegraf/types';

export interface Note {
  id: number;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
}

export interface SessionData {
  currentPage: number;
  searchType?: 'tags' | 'content';
  noteData?: {
    title?: string;
    content?: string;
    tags?: string[];
  };
}

// Create a custom context type that extends TelegrafContext
export interface Context extends TelegrafContext {
  session: SessionData;
}