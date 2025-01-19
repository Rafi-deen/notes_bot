
import { Note } from '../types/index.js';
import { config } from '../config/config.js';
import { supabase } from '@/database/superbase.js';

export const noteService = {
  async getNotes(
    userId: number,
    page: number = 1,
    limit: number = config.defaultSettings.notesPerPage
  ): Promise<{ notes: Note[]; total: number }> {
    const offset = (page - 1) * limit;

    const [{ data: notes, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId.toString())
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId.toString())
    ]);

    if (error || countError) throw error || countError;
    return { notes: notes || [], total: count || 0 };
  },

  async getNote(userId: number, noteId: number): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId.toString())
      .eq('id', noteId)
      .single();

    if (error) throw error;
    return data;
  },

  async saveNote(
    userId: number,
    content: string,
    title: string | null = null,
    tags: string[] = []
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          user_id: userId.toString(),
          title,
          content,
          tags,
          is_pinned: false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(
    userId: number,
    noteId: number,
    updates: Partial<Note>
  ): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('user_id', userId.toString())
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(userId: number, noteId: number): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', userId.toString())
      .eq('id', noteId);

    if (error) throw error;
  },

  async togglePin(userId: number, noteId: number): Promise<Note> {
    const note = await this.getNote(userId, noteId);
    if (!note) throw new Error('Note not found');

    return await this.updateNote(userId, noteId, {
      is_pinned: !note.is_pinned
    });
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
      const tags = searchTerm.split(' ').map(tag => tag.toLowerCase().trim());
      query = query.overlaps('tags', tags);
    } else {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      query = query.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`);
    }

    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};