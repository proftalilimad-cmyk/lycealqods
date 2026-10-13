#!/usr/bin/env bash
# ============================================================
# تصدير الموقع كأرشيف ZIP — أمر قابل للتكرار:  npm run export
#
# ينتج أرشيفين داخل dist/exports/ (مجلد مُتجاهَل في جيت وفي لقطات العمل):
#   1) lycealqods-site-YYYY-MM-DD.zip    الموقع الجاهز للنشر:
#      يُفكّ محتواه في جذر أي استضافة statique (index.html + runtime-config.js
#      + decks/ + files/ + exports/ + og-cover.png + images/). لا يحتاج خادمًا:
#      كل شيء ملفات ثابتة.
#   2) lycealqods-source-YYYY-MM-DD.zip  مصدر المشروع كاملًا بدون
#      node_modules ولا dist، لفتحه ومتابعة التطوير في مكان آخر.
#      يضمّ أيضًا مجلد وثائق الأستاذ «جذع مسترك شعبة علوم تجريبية» حفظًا
#      لملفات الجذاذات الأصلية ضمن النسخة الاحتياطية.
#
# للتحميل مباشرة من المعاينة الحية:
#   <رابط المعاينة>/dist/exports/lycealqods-site-YYYY-MM-DD.zip
# لتخطي إعادة البناء:  SKIP_BUILD=1 npm run export
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DATE="${EXPORT_DATE:-$(date +%Y-%m-%d)}"
OUT="$ROOT/dist/exports"
SITE_ZIP="$OUT/lycealqods-site-$DATE.zip"
DOCS_DIR="جذع مسترك شعبة علوم تجريبية"
SRC_ZIP="$OUT/lycealqods-source-$DATE.zip"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "→ البناء (npm run build)…"
  npm run build
fi

mkdir -p "$OUT"
rm -f "$OUT"/*.zip
# ملفات public/exports المطلوبة في النسخة الجاهزة (خصوصًا أرشيف PDF للجذاذات)
# تُنسخ إلى مسار مؤقت حتى لا تختلط بأرشيفات المصدر الناتجة داخل dist/exports.
HOSTINGER_TMP="$(mktemp -d)"
trap 'rm -rf "$HOSTINGER_TMP"' EXIT
if [ -d "$ROOT/public/exports" ]; then
  cp -a "$ROOT/public/exports" "$HOSTINGER_TMP/exports"
fi

echo "→ أرشفة الموقع المنشور (dist)…"
(
  cd "$ROOT/dist"
  # runtime-config.js is required beside index.html for manual Supabase setup.
  # Keep it in the deployable archive; Netlify builds may override these values,
  # while static uploads edit this file after extraction.
  zip -qrX "$SITE_ZIP" index.html runtime-config.js decks files images og-cover.png ads.txt robots.txt sitemap.xml _redirects _headers
)
if [ -d "$HOSTINGER_TMP/exports" ]; then
  (
    cd "$HOSTINGER_TMP"
    zip -qrX "$SITE_ZIP" exports
  )
fi

echo "→ أرشفة مصدر المشروع…"
# إضافات اختيارية: تُضمَّن فقط إن وُجدت حتى لا يفشل الأمر
EXTRA=()
[ -d "$ROOT/docs" ] && EXTRA+=("docs")
[ -d "$ROOT/supabase" ] && EXTRA+=("supabase")
[ -d "$ROOT/$DOCS_DIR" ] && EXTRA+=("$DOCS_DIR")
[ -f "$ROOT/.env.example" ] && EXTRA+=(".env.example")
(
  cd "$ROOT"
  zip -qrX "$SRC_ZIP" \
    src public index.html package.json package-lock.json tsconfig.json \
    vite.config.ts scripts .gitignore *.md "${EXTRA[@]}" \
    -x "scripts/__pycache__/*" "public/exports/*"
)

# نسخ بالأسماء المختصرة المعتمدة للنسخ الاحتياطي
cp -f "$SITE_ZIP" "$OUT/site-talil-imad.zip"
cp -f "$SRC_ZIP" "$OUT/site-talil-imad-source.zip"
cp -f "$SRC_ZIP" "$OUT/imad-source.zip"

# نسخ الأسماء المعتمدة إلى مجلد sauvegarde (الأرشيف الجاهز قد يتجاوز 100MB
# ولذلك يبقى site-talil-imad.zip خارج GitHub، بينما تحفظ نسخة المصدر المتتبعة).
BACKUP_DIR="$ROOT/sauvegarde"
mkdir -p "$BACKUP_DIR"
cp -f "$OUT/site-talil-imad.zip" "$BACKUP_DIR/site-talil-imad.zip"
cp -f "$OUT/site-talil-imad-source.zip" "$BACKUP_DIR/site-talil-imad-source.zip"
cp -f "$OUT/imad-source.zip" "$BACKUP_DIR/imad-source.zip"

echo
echo "================ النتيجة ================"
for z in "$SITE_ZIP" "$SRC_ZIP"; do
  printf '%-46s %8.1f MB\n' "$(basename "$z")" "$(du -m "$z" | cut -f1)"
done
echo
echo "فحص سلامة الأرشيفين:"
unzip -tq "$SITE_ZIP" | tail -1
unzip -tq "$SRC_ZIP" | tail -1
echo
echo "عدد الملفات داخل أرشيف الموقع: $(unzip -l "$SITE_ZIP" | tail -1 | awk '{print $2}')"
echo "عدد الملفات داخل أرشيف المصدر: $(unzip -l "$SRC_ZIP" | tail -1 | awk '{print $2}')"
echo
echo "للتحميل من المعاينة الحية:"
echo "  /dist/exports/$(basename "$SITE_ZIP")"
echo "  /dist/exports/$(basename "$SRC_ZIP")
  /dist/exports/site-talil-imad.zip  (= الموقع)
  /dist/exports/site-talil-imad-source.zip  و  /dist/exports/imad-source.zip  (= المصدر)"
