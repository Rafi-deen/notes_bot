import { config } from "@/config/config.js";


export const validators = {
  validateNote(title: string | null, content: string, tags: string[]): void {
    if (title && title.length > config.defaultSettings.maxTitleLength) {
      throw new Error(`Title must be ${config.defaultSettings.maxTitleLength} characters or less`);
    }

    if (content.length > config.defaultSettings.maxContentLength) {
      throw new Error(`Content must be ${config.defaultSettings.maxContentLength} characters or less`);
    }

    if (tags.length > config.defaultSettings.maxTags) {
      throw new Error(`Maximum ${config.defaultSettings.maxTags} tags allowed`);
    }

    if (content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }
  },

  validateSearchQuery(query: string): void {
    if (query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (query.length > 100) {
      throw new Error('Search query is too long (max 100 characters)');
    }
  },

  validateId(id: string): number {
    const noteId = parseInt(id);
    if (isNaN(noteId)) {
      throw new Error('Invalid note ID');
    }
    return noteId;
  }
};