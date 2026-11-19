"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, X, Sparkles, Users, House, MapPin, RotateCcw, MessageCircle, ArrowLeft } from "lucide-react";
import type { Profile } from "@/lib/profiles";

type Tab = "home" | "discover" | "matches";

const storyFrames = [
  "/story/image 1.png",
  "/story/image 2.png",
  "/story/image 3.png",
  "/story/image 4.png",
  "/story/image 5.png",
  "/story/image 6.png",
  "/story/image 7.png",
];
const storyDurations = [1800, 1800, 1800, 2500, 2200, 2000, 5000];
const storyTransitions = [450, 500, 650, 550, 650, 800, 650];

function StoryReel({ onDiscover }: { onDiscover: () => void }) {
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused || documentHidden) return;
    timer.current = setTimeout(() => setFrame(current => (current + 1) % storyFrames.length), storyDurations[frame] + (reducedMotion ? 500 : 0));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [frame, paused, documentHidden, reducedMotion]);

  return (
    <section className="home-story" aria-label="How Coy works">
      <div className="story-intro">
        <span className="eyebrow"><Heart size={14} fill="currentColor" /> A LITTLE STORY ABOUT A LITTLE CRUSH</span>
        <h1>Some feelings are<br /><em>better shared.</em></h1>
        <p>Like someone? Find out if it&apos;s mutual, without ever having to ask.</p>
      </div>
      <div className="story-reel">
        <div className="story-progress" aria-hidden="true">
          {storyFrames.map((_, index) => <span key={index} className={index === frame ? "active" : index < frame ? "complete" : ""} />)}
        </div>
        <div className={`story-frame ${reducedMotion ? "reduced" : ""}`}>
          {storyFrames.map((src, index) => (
            <img key={src} src={src} alt={index === frame ? `Coy story, scene ${index + 1} of 7` : ""} className={index === frame ? "visible" : ""} style={{ transitionDuration: `${storyTransitions[frame]}ms` }} aria-hidden={index !== frame} />
          ))}
          {frame === 6 && <button className="story-cta-overlay" onClick={onDiscover}>Discover <span aria-hidden="true">→</span></button>}
          <button className="story-pause" onClick={() => setPaused(current => !current)} aria-label={paused ? "Play story" : "Pause story"}>{paused ? "▶" : "Ⅱ"}</button>
        </div>
        <p className="story-caption" aria-live="polite">{paused || documentHidden ? "Story paused" : frame === 6 ? "The feeling is mutual." : "A little crush can go a long way."}</p>
      </div>
    </section>
  );
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("discover");
  const [feed, setFeed] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [match, setMatch] = useState<Profile | null>(null);
  const [notice, setNotice] = useState<"like" | "pass" | null>(null);
  const [busy, setBusy] = useState(false);
  const [unliking, setUnliking] = useState<number | null>(null);
  const [matchError, setMatchError] = useState("");
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number } | null>(null);
  const active = feed[0];

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const [f, m] = await Promise.all([
        fetch("/api/feed", { signal: controller.signal, cache: "no-store" }),
        fetch("/api/matches", { signal: controller.signal, cache: "no-store" })
      ]);
      if (!f.ok || !m.ok) throw new Error("The discovery service could not be reached.");
      const fd = await f.json();
      const md = await m.json();
      if (!Array.isArray(fd.profiles) || !Array.isArray(md.matches)) {
        throw new Error("The server returned an unexpected response.");
      }
      setFeed(fd.profiles);
      setMatches(md.matches);
    } catch (error) {
      setLoadError(error instanceof DOMException && error.name === "AbortError"
        ? "The discovery service took too long to respond."
        : error instanceof Error ? error.message : "Something went wrong while loading profiles.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadFeed(); }, [loadFeed]);

  const swipe = async (direction: "like" | "pass") => {
    if (!active || busy) return;
    setBusy(true); setNotice(direction);
    setDrag({ x: direction === "like" ? 520 : -520, y: 30 });
    try {
      const res = await fetch("/api/swipe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: active.id, direction })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save swipe");
      setTimeout(() => {
        setFeed(current => current.filter(p => p.id !== active.id));
        setDrag({ x: 0, y: 0 }); setNotice(null); setBusy(false);
        if (data.matched && data.profile) {
          setMatch(data.profile); setMatches(current => [data.profile, ...current]);
        }
      }, 230);
    } catch {
      setDrag({ x: 0, y: 0 }); setNotice(null); setBusy(false);
    }
  };

  const unlike = async (profile: Profile) => {
    if (unliking !== null) return;
    setUnliking(profile.id);
    setMatchError("");
    try {
      const res = await fetch("/api/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id })
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || "The server could not process this unlike request.");
      setMatches(current => current.filter(matchProfile => matchProfile.id !== profile.id));
      setFeed(current => current.some(feedProfile => feedProfile.id === profile.id) ? current : [profile, ...current]);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : "Could not unlike this person.");
    } finally {
      setUnliking(null);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy) return;
    start.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current || busy) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag.x > 105) swipe("like");
    else if (drag.x < -105) swipe("pass");
    else setDrag({ x: 0, y: 0 });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">c</span><span>coy</span></div>
        <button className="avatar-button" aria-label="Your profile">S</button>
      </header>

      {!match && <div className="mobile-tabs">
        <button className={tab === "home" ? "selected" : ""} onClick={() => setTab("home")}><House size={18}/>Home</button>
        <button className={tab === "discover" ? "selected" : ""} onClick={() => setTab("discover")}><Sparkles size={18}/>Discover</button>
        <button className={tab === "matches" ? "selected" : ""} onClick={() => setTab("matches")}><Heart size={18}/>Matches{matches.length > 0 && <i>{matches.length}</i>}</button>
      </div>}

      {tab === "home" ? <StoryReel onDiscover={() => setTab("discover")} /> : null}

      {tab === "discover" && <section className="discover-layout">
        <aside className="side-copy">
          <span className="eyebrow"><Sparkles size={14}/> YOUR PEOPLE ARE OUT THERE</span>
          <h1>Find your<br/><em>kind</em> of people.</h1>
          <p>Good conversations start with a little curiosity. Trust your vibe.</p>
          <div className="side-stat"><div className="stat-icon"><Heart size={18}/></div><div><b>Real connections</b><small>Only mutual likes become matches.</small></div></div>
          <div className="side-stat"><div className="stat-icon lavender"><Users size={18}/></div><div><b>Your pace, your choice</b><small>Like or pass. No pressure.</small></div></div>
        </aside>
        <div className="discovery-panel">
          <div className="section-heading"><div><span className="eyebrow">THE DISCOVER DECK</span><h2>Someone new <span>♡</span></h2></div><button className="matches-shortcut" onClick={() => setTab("matches")}><Heart size={16}/> {matches.length} matches</button></div>
          {loading ? <div className="empty-state"><div className="loader"/><p>Finding your people…</p></div> :
          loadError ? <div className="empty-state"><div className="empty-illustration"><Sparkles size={34}/></div><h3>We hit a little pause.</h3><p>{loadError}</p><button className="primary-button" onClick={loadFeed}><RotateCcw size={16}/> Try again</button></div> :
          active ? <div className="card-stage">
            <article className="profile-card" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * .045}deg)`, transition: start.current ? "none" : "transform .24s ease", touchAction: "pan-y" }}>
              <img src={active.photo} alt={active.name} draggable={false}/>
              <div className="photo-shade"/>
              {Math.abs(drag.x) > 25 && <div className={`swipe-stamp ${drag.x > 0 ? "stamp-like" : "stamp-pass"}`}>{drag.x > 0 ? "LIKE" : "PASS"}</div>}
              {notice && <div className={`swipe-stamp ${notice === "like" ? "stamp-like" : "stamp-pass"}`}>{notice.toUpperCase()}</div>}
              <div className="profile-info">
                <div className="name-line"><h3>{active.name}, {active.age}</h3><span className="verified">✓</span></div>
                <div className="location"><MapPin size={14}/>{active.location}</div>
                <p>{active.bio}</p>
                <div className="interest-list">{active.interests.map(x => <span key={x}>{x}</span>)}</div>
              </div>
            </article>
            <div className="swipe-actions">
              <button className="action pass" onClick={() => swipe("pass")} disabled={busy} aria-label="Pass"><X size={27}/></button>
              <button className="action rewind" onClick={() => setDrag({x:0,y:0})} aria-label="Reset card position"><RotateCcw size={17}/></button>
              <button className="action like" onClick={() => swipe("like")} disabled={busy} aria-label="Like"><Heart size={25} fill="currentColor"/></button>
            </div>
            <p className="swipe-hint">← pass <span>DRAG THE CARD</span> like →</p>
          </div> :
          <div className="empty-state"><div className="empty-illustration"><Sparkles size={34}/></div><h3>You’re all caught up!</h3><p>You’ve seen everyone in this deck. Check back soon for new faces.</p><button className="primary-button" onClick={loadFeed}><RotateCcw size={16}/> Refresh deck</button></div>}
        </div>
      </section>}

      {tab === "matches" && <section className="matches-page">
        <div className="matches-title"><span className="eyebrow">THE FEELING IS MUTUAL</span><h1>Your <em>matches.</em></h1><p>Only people you’ve both liked show up here.</p></div>
        {matchError && <p className="match-error" role="alert">{matchError}</p>}
        {matches.length ? <div className="match-grid">{matches.map(p => <article className="match-card" key={p.id}><img src={p.photo} alt={p.name}/><div><b>{p.name}, {p.age}</b><small><MapPin size={12}/>{p.location}</small></div><button className="match-heart" onClick={() => unlike(p)} disabled={unliking !== null} aria-label={`Unlike ${p.name}`} title={`Unlike ${p.name}`}><Heart size={16} fill="currentColor"/></button></article>)}</div> :
        <div className="empty-state match-empty"><div className="empty-illustration"><Heart size={34}/></div><h3>Your story starts with a spark.</h3><p>When you and someone else both like each other, you’ll find them here.</p><button className="primary-button" onClick={() => setTab("discover")}>Explore Discover <Sparkles size={16}/></button></div>}
      </section>}

      {!match && <nav className="desktop-nav">
        <button className={tab === "home" ? "nav-active" : ""} onClick={() => setTab("home")}><House size={19}/>Home</button>
        <button className={tab === "discover" ? "nav-active" : ""} onClick={() => setTab("discover")}><Sparkles size={19}/>Discover</button>
        <button className={tab === "matches" ? "nav-active" : ""} onClick={() => setTab("matches")}><Heart size={19}/>Matches{matches.length > 0 && <i>{matches.length}</i>}</button>
      </nav>}

      {match && <div className="match-overlay"><div className="match-confetti">✦　✧　♡　✦</div><button className="close-match" onClick={() => setMatch(null)}>×</button><div className="match-content"><div className="match-bubbles"><img src={match.photo} alt={match.name}/><div className="you-bubble">S</div><span>♡</span></div><span className="eyebrow">THE UNIVERSE HAS GOOD TASTE</span><h2>It’s a <em>match!</em></h2><p>You and {match.name.split(" ")[0]} liked each other.</p><div className="match-note"><MessageCircle size={16}/> A new connection, a new beginning.</div><button className="primary-button" onClick={() => {setMatch(null);setTab("matches");}}>See your matches <Heart size={16}/></button><button className="keep-swiping" onClick={() => setMatch(null)}>Keep discovering</button></div></div>}
      <footer className="footer-note">made for meaningful little moments <span>♡</span></footer>
    </main>
  );
}
