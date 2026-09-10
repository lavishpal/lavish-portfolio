import { Link } from "wouter";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Built by hand · updated 2026</span>
      <span>
        <Link to="/blog">Blog</Link>
        {" · "}
        <a href="https://www.github.com/lavishpal" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </span>
    </footer>
  );
}
