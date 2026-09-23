/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_SITE_KEY?: string;
  readonly VITE_SUPABASE_TEACHER_EMAIL?: string;
  readonly VITE_TEACHER_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface LyceumRuntimeConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  publicSiteKey?: string;
  teacherEmail?: string;
}

interface Window {
  __LYCEUM_RUNTIME_CONFIG__?: LyceumRuntimeConfig;
}
