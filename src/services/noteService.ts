
import { supabase } from '@/database/superbase.js';
import { Note } from '../types/index.js';

export const noteService = {
  async saveNote(
    userId: number,
    content: string,
    title: string | null = null,
    tags: string[] = []
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        user_id: userId.toString(),
        content,
        title,
        tags,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getNotes(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ notes: Note[]; total: number }> {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId.toString())
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { notes: data || [], total: count || 0 };
  },

  async deleteNote(userId: number, noteId: number): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId.toString());
    
    if (error) throw error;
  },

  async togglePinNote(userId: number, noteId: number): Promise<Note> {
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('is_pinned')
      .eq('id', noteId)
      .eq('user_id', userId.toString())
      .single();

    if (fetchError) throw fetchError;
    if (!note) throw new Error('Note not found');

    const { data, error } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', noteId)
      .eq('user_id', userId.toString())
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async searchNotes(
    userId: number,
    searchType: 'tags' | 'content',
    searchTerm: string
  ): Promise<Note[]> {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId.toString());

    if (searchType === 'tags') {
      const tags = searchTerm.split(' ').map(tag => tag.replace('#', ''));
      query = query.contains('tags', tags);
    } else {
      query = query.ilike('content', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};