import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN!,
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_API_KEY!,
  },
  webhook: {
    url: process.env.WEBHOOK_URL!,
    port: parseInt(process.env.PORT || '80'),
  },
  defaultSettings: {
    notesPerPage: 5,
    timeFormat: 'DD/MM/YYYY',
    language: 'en',
  },
} as const;