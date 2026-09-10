import { Route, Switch } from "wouter";
import Index from "./pages/index";
import BlogPage from "./pages/blog";
import ArticlePage from "./pages/article";
import AdminPage from "./pages/admin";
import AdminEditorPage from "./pages/admin-editor";
import { Provider } from "./components/provider";
import { ThemeProvider } from "./hooks/use-theme";
import { GalaxyBackground } from "./components/galaxy-background";
import { SiteNav } from "./components/site-nav";
import { SiteFooter } from "./components/site-footer";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function NotFound() {
  return (
    <div className="wrap">
      <header className="hero">
        <h1>Not found</h1>
        <p className="bio">That page does not exist.</p>
      </header>
      <a className="btn" href="/">
        Back home
      </a>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <ThemeProvider>
        <GalaxyBackground />
        <div className="page">
          <SiteNav />
          <main>
            <Switch>
              <Route path="/" component={Index} />
              <Route path="/blog" component={BlogPage} />
              <Route path="/blog/:slug" component={ArticlePage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/admin/posts/new" component={AdminEditorPage} />
              <Route path="/admin/posts/:id" component={AdminEditorPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <SiteFooter />
        </div>
      </ThemeProvider>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
