import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function configuredValue(env: Record<string, string | undefined>, ...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? env[key];
    if (value?.trim()) return value.trim();
  }
  return "";
}

/**
 * نطاق النشر الدائم (يمكن تغييره عند النشر على نطاق مخصص).
 * مثال: SITE_URL=https://lycealqods.example.org npm run build
 * يحوّل og:image إلى رابط مطلق ويثبت og:url، وهما مطلوبان لمنصات
 * المشاركة (واتساب، فيسبوك، تويتر) التي لا تقبل روابط نسبية.
 */
function ogAbsoluteUrls(siteUrl: string): Plugin {
  return {
    name: "og-absolute-urls",
    transformIndexHtml: {
      // «post»: بعد تحويل Vite للمسارات إلى نسبية (base ./ في بناء الملف الواحد)،
      // فنعيد كتابة وسم og:image إلى رابط مطلق يفهمه واتساب وفيسبوك وتويتر.
      order: "post",
      handler(html) {
        if (!siteUrl) return html;
        const withAbsoluteImage = html
          .replace('content="./og-cover.png"', `content="${siteUrl}/og-cover.png"`)
          .replace('content="/og-cover.png"', `content="${siteUrl}/og-cover.png"`);
        const ogUrl = `<meta property="og:url" content="${siteUrl}/" />`;
        return withAbsoluteImage.includes('property="og:url"')
          ? withAbsoluteImage.replace(/<meta property="og:url"[^>]*\/>/, ogUrl)
          : withAbsoluteImage.replace("</head>", `    ${ogUrl}\n  </head>`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (configuredValue(env, "SITE_URL") || "https://courstalil.netlify.app").replace(/\/+$/, "");

  /*
   * Netlify/Supabase integrations قد تنشئ أسماء SUPABASE_* بدل VITE_*.
   * نسمح بهذه الأسماء العامة فقط، ولا نقرأ أو نعرّف service_role مطلقًا.
   * تبقى runtime-config.js بديلًا للنسخ الثابتة المرفوعة يدويًا.
   */
  const publicBuildConfig = {
    url: configuredValue(env, "VITE_SUPABASE_URL", "SUPABASE_URL"),
    anonKey: configuredValue(env, "VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"),
    siteKey: configuredValue(env, "VITE_PUBLIC_SITE_KEY", "SUPABASE_PUBLIC_SITE_KEY", "SUPABASE_SITE_KEY"),
    teacherEmail: configuredValue(env, "VITE_SUPABASE_TEACHER_EMAIL", "SUPABASE_TEACHER_EMAIL"),
  };

  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), ogAbsoluteUrls(siteUrl)],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBuildConfig.url),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(publicBuildConfig.anonKey),
      "import.meta.env.VITE_PUBLIC_SITE_KEY": JSON.stringify(publicBuildConfig.siteKey),
      "import.meta.env.VITE_SUPABASE_TEACHER_EMAIL": JSON.stringify(publicBuildConfig.teacherEmail),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
