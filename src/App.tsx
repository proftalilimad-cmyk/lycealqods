import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import About from "./components/About";
import TestFlow from "./components/test/TestFlow";
import Battle from "./components/battle/Battle";
import Dashboard from "./components/Dashboard";
import Lessons from "./components/Lessons";
import Methodologies from "./components/Methodologies";
import Applications from "./components/Applications";
import Resources from "./components/Resources";
import DocStudio from "./components/DocStudio";
import Jadadat from "./components/Jadadat";
import JadadatLibrary from "./components/JadadatLibrary";
import SearchOverlay from "./components/SearchOverlay";
import LessonView from "./components/LessonView";
import Decks from "./components/decks/Decks";
import DeckPlayer from "./components/decks/DeckPlayer";
import { getDeck } from "./data/decks";
import { getCatalogEntry } from "./data/jadadat";
import { FICHES_GENERAL_DOCS, getFicheById } from "./data/jadadatFiles";
import { resolveLesson } from "./data/lessonContent";
import { BASE_TITLE, VIEW_LABELS, hashToRoute, routeToHash, type Route } from "./routes";

/** عنوان الصفحة حسب الشاشة المعروضة (يظهر في تبويب المتصفح ونتائج البحث) */
function useDocumentTitle(route: Route, detail?: string) {
  useEffect(() => {
    const label = detail ? `${detail} — ${VIEW_LABELS[route.view]}` : VIEW_LABELS[route.view];
    document.title = route.view === "home" ? `${BASE_TITLE} | ثانوية القدس، القنيطرة` : `${label} | ${BASE_TITLE}`;
  }, [route.view, detail]);
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => hashToRoute(window.location.hash));
  const [searchOpen, setSearchOpen] = useState(false);

  /* مزامنة الشاشة مع العنوان: زر الرجوع/التقدّم في المتصفح والروابط المفتوحة مباشرة.
     الروابط الداخلية التي لا تبدأ بـ «#/» (مثل #main) لا تُغيّر الشاشة. */
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash && !hash.startsWith("#/")) return;
      setRoute(hashToRoute(hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const go = useCallback(
    (r: Route) => {
      const hash = routeToHash(r);
      setRoute(r);
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    []
  );

  const resolvedLesson = useMemo(
    () => (route.view === "lesson" ? resolveLesson(route.id) : undefined),
    [route]
  );
  const resolvedDeck = useMemo(
    () => (route.view === "decks" && route.id ? getDeck(route.id) : undefined),
    [route]
  );
  const resolvedJadada = useMemo(
    () => (route.view === "jadadat" && route.open ? getCatalogEntry(route.open) : undefined),
    [route]
  );
  const resolvedFicheFile = useMemo(
    () =>
      route.view === "jadadatLib" && route.open
        ? getFicheById(route.open) ?? FICHES_GENERAL_DOCS.find((g) => g.id === route.open)
        : undefined,
    [route]
  );
  const detail =
    resolvedLesson?.content.title ??
    resolvedDeck?.title ??
    resolvedJadada?.fiche?.title ??
    resolvedJadada?.slot.title ??
    resolvedFicheFile?.title;
  useDocumentTitle(route, detail);
  const detailLabel = detail ? `${detail} — ${VIEW_LABELS[route.view]}` : VIEW_LABELS[route.view];

  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          main?.setAttribute("tabindex", "-1");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>
      <Navbar route={route} go={go} onSearch={() => setSearchOpen(true)} />
      <main id="main">
        {route.view === "home" && <Home go={go} onSearch={() => setSearchOpen(true)} />}
        {route.view === "about" && <About />}
        {route.view === "test" && <TestFlow initialBank={route.bank} onHome={() => go({ view: "home" })} />}
        {route.view === "battle" && <Battle key={route.bank ?? "all"} initialBank={route.bank} go={go} />}
        {route.view === "dashboard" && <Dashboard key={route.tab ?? "results"} tab={route.tab} go={go} />}
        {route.view === "lessons" && <Lessons key={route.level ?? "default"} go={go} initialLevel={route.level} />}
        {route.view === "methods" && (
          <Methodologies key={route.id ?? "list"} detailId={route.id} onSelect={(id) => go({ view: "methods", id })} />
        )}
        {route.view === "apps" && (
          <Applications
            key={`${route.level ?? "all"}-${route.id ?? "list"}`}
            detailId={route.id}
            initialLevel={route.level}
            onSelect={(id) => go({ view: "apps", id })}
          />
        )}
        {route.view === "lesson" &&
          (() => {
            if (!resolvedLesson) return <Lessons go={go} />;
            return (
              <LessonView
                key={route.id}
                lesson={resolvedLesson.content}
                breadcrumb={{
                  level: resolvedLesson.level.label,
                  branch: resolvedLesson.branch.label,
                  subject: resolvedLesson.subjectLabel,
                  unit: resolvedLesson.unit.title,
                }}
                onBack={() => go({ view: "lessons", level: resolvedLesson.level.id })}
                go={go}
              />
            );
          })()}
        {route.view === "decks" &&
          (() => {
            if (resolvedDeck)
              return (
                <DeckPlayer
                  key={resolvedDeck.id}
                  deck={resolvedDeck}
                  onBack={() => go({ view: "decks", subject: resolvedDeck.subject })}
                  go={go}
                />
              );
            return <Decks key={route.subject ?? "all"} go={go} initialSubject={route.subject} />;
          })()}
        {route.view === "jadadatLib" && (
          <JadadatLibrary key={route.open ?? "list"} open={route.open} go={go} />
        )}
        {route.view === "jadadat" && (
          <Jadadat key={`${route.level ?? "tc"}-${route.open ?? ""}`} level={route.level} open={route.open} go={go} />
        )}
        {route.view === "studio" && <DocStudio />}
        {route.view === "resources" && (
          <Resources key={`${route.type ?? "all"}-${route.open ?? ""}`} go={go} initialType={route.type} openId={route.open} />
        )}
      </main>
      <Footer go={go} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} go={go} />
      {/* إعلان الشاشة الحالية لقارئات الشاشة عند كل تنقّل */}
      <span className="sr-only" aria-live="polite">
        {detailLabel}
      </span>
    </>
  );
}
