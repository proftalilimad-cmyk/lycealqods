#!/usr/bin/env bash
# ============================================================
# تصدير الموقع كأرشيف ZIP — أمر قابل للتكرار:  npm run export
#
# ينتج أرشيفين داخل dist/exports/ (مجلد مُتجاهَل في جيت وفي لقطات العمل):
#   1) lycealqods-site-YYYY-MM-DD.zip    الموقع الجاهز للنشر:
#      يُفكّ محتواه في جذر أي استضافة statique (index.html + decks/ + files/
#      + og-cover.png + images/). لا يحتاج خادمًا: كل شيء ملفات ثابتة.
#   2) lycealqods-source-YYYY-MM-DD.zip  مصدر المشروع كاملًا بدون
#      node_modules ولا dist، لفتحه ومتابعة التطوير في مكان آخر.
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
SRC_ZIP="$OUT/lycealqods-source-$DATE.zip"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "→ البناء (npm run build)…"
  npm run build
fi

mkdir -p "$OUT"
rm -f "$OUT"/*.zip

echo "→ أرشفة الموقع المنشور (dist)…"
(
  cd "$ROOT/dist"
  zip -qrX "$SITE_ZIP" index.html decks files images og-cover.png
)

echo "→ أرشفة مصدر المشروع…"
(
  cd "$ROOT"
  zip -qrX "$SRC_ZIP" \
    src public index.html package.json package-lock.json tsconfig.json \
    vite.config.ts scripts .gitignore *.md
)

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
echo "  /dist/exports/$(basename "$SRC_ZIP")"
