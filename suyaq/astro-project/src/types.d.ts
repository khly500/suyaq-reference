export interface PromptItem { id: string; type: 'prompt'|'code'; cat: string; title: string; body: string; description?: string; variables?: string[]; lang?: string; file?: string; }
