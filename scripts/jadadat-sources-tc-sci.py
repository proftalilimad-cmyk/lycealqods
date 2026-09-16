#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
خريطة مصادر جذاذات الجذع المشترك العلمي → خانات اللائحة الرسمية.

تقرأ وثائق الأستاذ من المجلد المعطى (افتراضيا: نسخة محلية من مجلد
«منار في التاريخ والجغرافيا» الموجود في فرع main)، وتبني ملف المهام
scripts/jadadat-jobs-tc-sci.json ثم تشغّل scripts/import-jadadat.py
لتوليد src/data/jadadatImported.ts.

الاستعمال:
    python3 scripts/jadadat-sources-tc-sci.py "<مجلد وثائق منار>"
"""
import os, re, json, subprocess, unicodedata, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("MANAR_DIR", "")
if not SRC or not os.path.isdir(SRC):
    raise SystemExit("حدّد مجلد وثائق «منار في التاريخ والجغرافيا»: python3 scripts/jadadat-sources-tc-sci.py <المجلد>")
FILES = os.listdir(SRC)

def nz(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[\u064B-\u0652\u0640\u0670\s_\-.()«»\u200f\u200e]", "", s)
    s = s.replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ة","ه").replace("ؤ","و").replace("ئ","ي").replace("ى","ي")
    return s

NFILES = [(f, nz(f)) for f in FILES]

def pick(kw, ext=None, avoid=None):
    k = nz(kw)
    a = nz(avoid) if avoid else None
    for f, nf in NFILES:
        if k in nf and (ext is None or nf.endswith(ext)) and (a is None or a not in nf):
            return f
    raise SystemExit(f"NOT FOUND: {kw} ext={ext} avoid={avoid}")

JOBS = [
 # ---- التاريخ: المجزوءة الأولى ----
 dict(slot="tc-sci-h01", file=pick("الحركة الإنسية", "doc")),
 dict(slot="tc-sci-h02", file=pick("التحولات السياسية والاجتماعية", "docx", avoid="الدولة الأمة")),
 dict(slot="tc-sci-h03", file=pick("الاكتشافات الجغرافية", "doc")),
 dict(slot="tc-sci-h04", file=pick("العثمانيون", "doc")),
 dict(slot="tc-sci-h05", file=pick("التطورات السياسية", "doc")),
 dict(slot="tc-sci-h06", file=pick("التطورات الاق", "doc")),
 # ---- التاريخ: المجزوءة الثانية ----
 dict(slot="tc-sci-h07", file=pick("عصر الأنوار ( الفكر", "docx")),
 dict(slot="tc-sci-h08", file=pick("الثورات الاجتماعية والسياسية", "docx")),
 dict(slot="tc-sci-h09", file=pick("انطلاقة الثورة الصناعي", "docx")),
 dict(slot="tc-sci-h10", file=pick("الأوضاع العامة في العالم الإسلامي", "docx")),
 dict(slot="tc-sci-h11", file=pick("تصاعد الضغوط الأوربية", "docx")),
 dict(slot="tc-sci-h12", file=pick("بداية محاولات الإصلاح وحدودها", "docx")),
 dict(slot="tc-sci-h13", file=pick("جدادات جدع م علمي التاريخ", "docx"),
      anchor="اختلال التوازن بالعالم المتوسطي"),
 # ---- الجغرافيا ----
 dict(slot="tc-sci-g01", file=pick("جذاذة درس الجغرافيا الموضوع الوظيفية", "pdf")),
 dict(slot="tc-sci-g02", file=pick("الكوارث الطبيعية", "doc")),
 dict(slot="tc-sci-g03", file=pick("المجموعات البنيوية", "docx")),
 dict(slot="tc-sci-g04", file=pick("النطاقات المناخية والغطاء النباتي", "docx")),
 dict(slot="tc-sci-g05", file=pick("المنظومة البيئية", "docx")),
 dict(slot="tc-sci-g06", file=pick("الجغرافيا جدع مشترك جذاذات", "docx"),
      splitAnchor="الإشكــاليـة المركـزية للمجزوءة", pick="استغلال الإنسان للمجال الفلاحي"),
 dict(slot="tc-sci-g07", file=pick("الجغرافيا جدع مشترك جذاذات", "docx"),
      splitAnchor="الإشكــاليـة المركـزية للمجزوءة", pick="أشكال التوسع المجالي للمدن"),
 dict(slot="tc-sci-g08", file=pick("الخرائط", "doc")),
 dict(slot="tc-sci-g09", file=pick("الإجراءات والتدابير التشريعية والتقنية", "docx")),
 dict(slot="tc-sci-g10", file=pick("ملف حول كارثة طبيعية", "docx")),
 dict(slot="tc-sci-g11", file=pick("الاحتباس الحراري", "docx", avoid="المجز")),
 dict(slot="tc-sci-g12", file=pick("جدادات الدورة الثانية جدع مشترك جغرافيا", "docx"),
      anchor="دور الجمعيات والمنظمات غير الحكومية", nextAnchor="استنتاجات وتوصيات"),
]
JOBS_PATH = os.path.join(HERE, "jadadat-jobs-tc-sci.json")
OUT = os.path.join(ROOT, "src", "data", "jadadatImported.ts")
json.dump(JOBS, open(JOBS_PATH, "w", encoding="utf8"), ensure_ascii=False, indent=1)
for j in JOBS:
    print(j["slot"], "←", j["file"])
r = subprocess.run([sys.executable, os.path.join(HERE, "import-jadadat.py"), SRC, OUT, JOBS_PATH], text=True)
raise SystemExit(r.returncode)
