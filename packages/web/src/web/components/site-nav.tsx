import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "../hooks/use-theme";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const onHome = location === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className={`nav-inner${onHome ? "" : " article"}`}>
        {onHome ? null : (
          <Link to="/" className="nav-brand">
            Lavish Pal
          </Link>
        )}

        {onHome ? (
          <>
            <a className="nav-link" href="#writing">
              Writing
            </a>
            <a className="nav-link" href="#projects">
              Projects
            </a>
            <a className="nav-link" href="#talks">
              Talks
            </a>
            <a className="nav-link" href="#about">
              About
            </a>
          </>
        ) : null}

        <Link
          to="/blog"
          className="nav-link"
          data-active={location.startsWith("/blog") ? "true" : "false"}
        >
          Blog
        </Link>

        <button
          className="theme-toggle"
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
