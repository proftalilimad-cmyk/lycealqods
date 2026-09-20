import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import About from "./components/About";
import TestFlow from "./components/test/TestFlow";
import Diagnostic from "./components/Diagnostic";
import Dashboard from "./components/Dashboard";
import Lessons from "./components/Lessons";
import Jadadat from "./components/Jadadat";
import Methodologies from "./components/Methodologies";
import Applications from "./components/Applications";
import Resources from "./components/Resources";
import LessonView from "./components/LessonView";
import Decks from "./components/decks/Decks";
import DeckPlayer from "./components/decks/DeckPlayer";
import { getDeck } from "./data/decks";
import { APPLICATIONS } from "./data/applications";
import { METHODOLOGIES } from "./data/methodologies";
import { getResource } from "./data/resources";
import { resolveLesson } from "./data/lessonContent";
import { getJadada } from "./lib/jadadatLessons";
import SeoHead from "./components/SeoHead";
import { getSeoMetadata } from "./lib/seo";
import { VIEW_LABELS, locationToRoute, routeToHash, type Route } from "./routes";

export default function App() {
  const [route, setRoute] = useState<Route>(() => locationToRoute(window.location));

  /* مزامنة الشاشة مع العنوان: زر الرجوع/التقدّم والروابط النظيفة أو روابط hash المباشرة.
     الهاش الداخلي #main الخاص برابط تجاوز المحتوى لا يغيّر الشاشة. */
  useEffect(() => {
    const onLocationChange = () => {
      const hash = window.location.hash;
      if (hash && !hash.startsWith("#/")) return;
      setRoute(locationToRoute(window.location));
    };
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
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
  const detail = resolvedLesson?.content.title ?? resolvedDeck?.title;
  const jadadaDetail = route.view === "jadadat" && route.id ? getJadada(route.id) : undefined;
  const routeDetail = jadadaDetail?.title ?? detail;
  const seoMetadata = useMemo(
    () =>
      getSeoMetadata(route, {
        lesson: resolvedLesson
          ? {
              title: resolvedLesson.content.title,
              level: resolvedLesson.level.label,
              branch: resolvedLesson.branch.label,
              subject: resolvedLesson.subjectLabel,
              unit: resolvedLesson.unit.title,
            }
          : undefined,
        deck: resolvedDeck
          ? { title: resolvedDeck.title, subject: resolvedDeck.subject, level: "الأولى باكالوريا" }
          : undefined,
        jadada: jadadaDetail
          ? {
              title: jadadaDetail.title,
              level: jadadaDetail.levelLabel,
              branch: jadadaDetail.branchLabel,
              subject: jadadaDetail.subjectLabel,
            }
          : undefined,
        methodology:
          route.view === "methods" && route.id
            ? (() => {
                const item = METHODOLOGIES.find((entry) => entry.id === route.id);
                return item ? { title: item.title, description: item.intro } : undefined;
              })()
            : undefined,
        application:
          route.view === "apps" && route.id
            ? (() => {
                const item = APPLICATIONS.find((entry) => entry.id === route.id);
                return item ? { title: item.title, description: `${item.level} · ${item.subject} · ${item.skillTag}` } : undefined;
              })()
            : undefined,
        resource: route.view === "resources" && route.open
          ? (() => {
              const resource = getResource(route.open);
              return resource
                ? { title: resource.title, description: resource.desc, level: resource.level, subject: resource.subject }
                : undefined;
            })()
          : undefined,
      }),
    [route, resolvedLesson, resolvedDeck, jadadaDetail],
  );
  const detailLabel = routeDetail ? `${routeDetail} — ${VIEW_LABELS[route.view]}` : VIEW_LABELS[route.view];

  return (
    <>
      <SeoHead metadata={seoMetadata} />
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
      <Navbar route={route} go={go} />
      <main id="main">
        {route.view === "home" && <Home go={go} />}
        {route.view === "about" && <About />}
        {route.view === "diagnostic" && <Diagnostic level={route.level} go={go} />}
        {route.view === "test" && <TestFlow initialBank={route.bank} onHome={() => go({ view: "home" })} />}
        {route.view === "dashboard" && <Dashboard key={route.tab ?? "results"} tab={route.tab} go={go} />}
        {route.view === "lessons" && <Lessons key={route.level ?? "default"} go={go} initialLevel={route.level} />}
        {route.view === "jadadat" && (
          <Jadadat key={`${route.level ?? "all"}-${route.id ?? "catalog"}`} go={go} detailId={route.id} initialLevel={route.level} />
        )}
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
        {route.view === "resources" && (
          <Resources key={`${route.type ?? "all"}-${route.open ?? ""}`} go={go} initialType={route.type} openId={route.open} />
        )}
      </main>
      <Footer go={go} />
      {/* إعلان الشاشة الحالية لقارئات الشاشة عند كل تنقّل */}
      <span className="sr-only" aria-live="polite">
        {detailLabel}
      </span>
    </>
  );
}
