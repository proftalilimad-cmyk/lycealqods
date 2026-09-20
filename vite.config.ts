import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * نطاق النشر الدائم (يمكن تغييره عند النشر على نطاق مخصص).
 * مثال: SITE_URL=https://lycealqods.example.org npm run build
 * يحوّل og:image إلى رابط مطلق ويثبت og:url، وهما مطلوبان لمنصات
 * المشاركة (واتساب، فيسبوك، تويتر) التي لا تقبل روابط نسبية.
 */
const SITE_URL = (process.env.SITE_URL ?? "https://courstalil.netlify.app").replace(/\/+$/, "");

function ogAbsoluteUrls(): Plugin {
  return {
    name: "og-absolute-urls",
    transformIndexHtml: {
      // «post»: بعد تحويل Vite للمسارات إلى نسبية (base ./ في بناء الملف الواحد)،
      // فنعيد كتابة وسم og:image إلى رابط مطلق يفهمه واتساب وفيسبوك وتويتر.
      order: "post",
      handler(html) {
        if (!SITE_URL) return html;
        const withAbsoluteImage = html
          .replace('content="./og-cover.png"', `content="${SITE_URL}/og-cover.png"`)
          .replace('content="/og-cover.png"', `content="${SITE_URL}/og-cover.png"`);
        const ogUrl = `<meta property="og:url" content="${SITE_URL}/" />`;
        return withAbsoluteImage.includes('property="og:url"')
          ? withAbsoluteImage.replace(/<meta property="og:url"[^>]*\/>/, ogUrl)
          : withAbsoluteImage.replace("</head>", `    ${ogUrl}\n  </head>`);
      },
    },
  };
}
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), ogAbsoluteUrls()],
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
});
