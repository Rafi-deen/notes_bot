export interface BotConfig {
  botToken: string;
  supabase: {
    url: string;
    key: string;
  };
  webhook: {
    url: string;
    port: number;
  };
  defaultSettings: {
    notesPerPage: number;
    maxTitleLength: number;
    maxContentLength: number;
    maxTags: number;
    timeFormat: string;
    language: string;
  };
}

export const config: BotConfig = {
  // ... other config
  defaultSettings: {
    notesPerPage: 5,
    maxTitleLength: 100,
    maxContentLength: 4000,
    maxTags: 10,
    timeFormat: "DD/MM/YYYY",
    language: "en"
  },
  botToken: "",
  supabase: {
    url: "",
    key: ""
  },
  webhook: {
    url: "",
    port: 0
  }
};