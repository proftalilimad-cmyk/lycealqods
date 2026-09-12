import { useCallback, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import About from "./components/About";
import TestFlow from "./components/test/TestFlow";
import Dashboard from "./components/Dashboard";
import Lessons from "./components/Lessons";
import Methodologies from "./components/Methodologies";
import Applications from "./components/Applications";
import Resources from "./components/Resources";
import SearchOverlay from "./components/SearchOverlay";
import LessonView from "./components/LessonView";
import Decks from "./components/decks/Decks";
import DeckPlayer from "./components/decks/DeckPlayer";
import { getDeck } from "./data/decks";
import { resolveLesson } from "./data/lessonContent";
import type { Route } from "./routes";

export default function App() {
  const [route, setRoute] = useState<Route>({ view: "home" });
  const [searchOpen, setSearchOpen] = useState(false);

  const go = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        تخطَّ إلى المحتوى الرئيسي
      </a>
      <Navbar route={route} go={go} onSearch={() => setSearchOpen(true)} />
      <main id="main">
        {route.view === "home" && <Home go={go} onSearch={() => setSearchOpen(true)} />}
        {route.view === "about" && <About />}
        {route.view === "test" && <TestFlow initialBank={route.bank} onHome={() => go({ view: "home" })} />}
        {route.view === "dashboard" && <Dashboard />}
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
            const resolved = resolveLesson(route.id);
            if (!resolved) return <Lessons go={go} />;
            return (
              <LessonView
                key={route.id}
                lesson={resolved.content}
                breadcrumb={{
                  level: resolved.level.label,
                  branch: resolved.branch.label,
                  subject: resolved.subjectLabel,
                  unit: resolved.unit.title,
                }}
                onBack={() => go({ view: "lessons", level: resolved.level.id })}
                go={go}
              />
            );
          })()}
        {route.view === "decks" &&
          (() => {
            const deck = route.id ? getDeck(route.id) : undefined;
            if (deck) return <DeckPlayer key={deck.id} deck={deck} onBack={() => go({ view: "decks", subject: deck.subject })} go={go} />;
            return <Decks key={route.subject ?? "all"} go={go} initialSubject={route.subject} />;
          })()}
        {route.view === "resources" && (
          <Resources key={`${route.type ?? "all"}-${route.open ?? ""}`} go={go} initialType={route.type} openId={route.open} />
        )}
      </main>
      <Footer go={go} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} go={go} />
    </>
  );
}
