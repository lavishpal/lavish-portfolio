import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { usePosts } from "../queries/posts";
import { formatDate } from "../lib/format";

interface Role {
  title: string;
  date?: string;
  org?: string;
  bullets: string[];
  tags: string[];
}

const experience: Role[] = [
  {
    title: "OSS Reviewer & Contributor",
    date: "Dec 2024 – Present",
    org: "Kubernetes, etcd, Kyverno",
    bullets: [
      "Reviewed incoming pull requests for kubernetes-sigs/reference-docs, evaluating code organization and design tradeoffs",
      "Authored test cases and implemented CEL-based policy enforcement for Kyverno, extending admission control coverage",
      "Migrated etcdctl command implementations to the Cobra CLI framework and added plugin support for etcd, including a major dependency version bump across the module",
    ],
    tags: ["Kubernetes", "etcd", "Kyverno", "CEL", "Go"],
  },
  {
    title: "Linux Foundation Mentee",
    date: "Sept 2025 – Nov 2025",
    org: "Kubernetes (LFX Mentorship), Remote",
    bullets: [
      "Refactored schema traversal logic in the Kubernetes API reference-generator, improving correctness and maintainability of generated API documentation used by the Kubernetes release team",
      "Modernized API documentation workflows by replacing deprecated GOPATH-based processes with module-aware tooling, reducing friction for future contributors",
      "Improved error handling and logging across configuration and writer components, increasing robustness of the documentation build pipeline",
    ],
    tags: ["Go", "Kubernetes API", "Documentation tooling"],
  },
  {
    title: "DevOps Evangelist",
    date: "April 2025 – Aug 2025",
    org: "Devtron, Gurugram, India",
    bullets: [
      "Designed and maintained CI/CD pipelines using GitLab CI, Azure DevOps, and Argo CD on Linux infrastructure, enabling automated deployments to Kubernetes clusters across multiple environments",
      "Deployed containerized applications on Kubernetes using Helm and RWX persistent storage, building custom container images and configuring NGINX for advanced request handling",
      "Set up Prometheus and Grafana monitoring for deployed workloads, tracking pod CPU, request throughput, and HTTP 5xx error rates with alerting",
    ],
    tags: ["GitLab CI", "Azure DevOps", "Argo CD", "Helm", "Prometheus", "Grafana"],
  },
];

const projects: Role[] = [
  {
    title: "k8s-ec2-operator",
    bullets: [
      "Developed a Kubernetes operator in Go that provisions and manages AWS EC2 instances declaratively via a custom CRD and controller-runtime reconciliation loop",
      "Packaged the operator with Helm, Kustomize, RBAC manifests, and Prometheus monitoring, backed by automated CI/CD pipelines (lint, unit, e2e tests) via GitHub Actions",
      "Deployed and validated the operator on a local k3d cluster using Kubebuilder",
    ],
    tags: ["Go", "Kubernetes", "AWS EC2", "Kubebuilder", "k3d", "GitHub Actions"],
  },
  {
    title: "NASA (Not Another SRE Agent)",
    bullets: [
      "Built a self-hosted Go agent that listens to GitHub Actions webhooks and routes CI/CD failure alerts with AI-generated fix suggestions to Slack, Discord, and Telegram",
      "Designed a config-driven, modular architecture with unit test coverage for webhook parsing and configuration loading",
      "Containerized the agent with Docker Compose for single-command, environment-configured deployment",
    ],
    tags: ["Go", "Docker", "GitHub Actions"],
  },
];

const talks = [
  {
    title: "etcd in 2026: Enhancements, V3.7 Roadmap, and Community Growth",
    meta: "KubeCon India",
    href: "https://youtu.be/BcLKvLD2D2Y?si=6EMCuXwWbkUADVQ0",
  },
  {
    title: "Lightning Talk: From Learner To Contributor: A LFX Mentee's Kubernetes Story",
    meta: "KubeCon EU",
    href: "https://youtu.be/YxZR4mISycg?si=N5b_JMMn9iSofFOV",
  },
  {
    title: "SIG Docs and You: The New Chapter of the Kubernetes API Reference Generator",
    meta: "KubeCon EU",
    href: "https://youtu.be/xnHsQE7bg7o?si=jYVvxenIqM7pqNI7",
  },
  {
    title: "Kube-Green: Scaling Kubernetes for a Greener Tomorrow",
    meta: "Cloud Native Sustainability Week",
    href: "https://www.youtube.com/live/0J3jSLn4GZM?si=qY2yJvkSOkjlXwcj",
  },
];

const community = [
  {
    title: "Kubernetes Release Team — v1.32",
    meta: "Docs & deprecations",
    description:
      "Worked with the Kubernetes release team on document changes, deprecations, and new features for the v1.32 release cycle.",
  },
  {
    title: "KubeCon Europe 2025",
    meta: "Communications Team Member",
    description:
      "Served on the Maintainer Summit Communications team, coordinating content and ensuring messaging reached the CNCF community.",
  },
  {
    title: "CNCG Gurugram",
    meta: "Core Team Member",
    description:
      "Organized meetups and events for the cloud-native community, engaging over 400 participants and empowering contributors to get involved in open source.",
  },
];

function WorkItem({ role }: { role: Role }) {
  return (
    <div className="work-item">
      <div className="work-head">
        <h3 className="work-title">{role.title}</h3>
        {role.date ? <span className="work-date">{role.date}</span> : null}
      </div>
      {role.org ? <p className="work-org">{role.org}</p> : null}
      <ul className="work-bullets">
        {role.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <div className="work-tags">
        {role.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const posts = usePosts({ limit: 3 });

  return (
    <div className="wrap">
      <header className="hero reveal" id="about">
        <div className="role">
          <span className="dot" />
          Platform Engineer · DevOps · SRE
        </div>
        <h1>Lavish Pal</h1>
        <p className="subline">Greater Noida, India · open to remote</p>
        <p className="bio">
          Open source contributor working across the Kubernetes ecosystem - reviewer at{" "}
          <strong>Kubernetes</strong>, contributor at <strong>etcd</strong>, <strong>Kyverno</strong>{" "}
          — and shipped release notes as part of the <strong>Kubernetes v1.32 Release Team</strong>.
          Currently Contributing to Chainguard's <strong>apko</strong> project.
        </p>
        <div className="tags">
          {["Go", "Kubernetes", "etcd", "CI/CD", "GitOps", "CNCF"].map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="reveal" style={{ animationDelay: "0.1s" }} id="experience">
        <div className="eyebrow">Experience</div>
        {experience.map((role) => (
          <WorkItem key={role.title} role={role} />
        ))}
      </section>

      <section className="reveal" style={{ animationDelay: "0.15s" }} id="projects">
        <div className="eyebrow">Projects</div>
        {projects.map((role) => (
          <WorkItem key={role.title} role={role} />
        ))}
      </section>

      <section className="reveal" style={{ animationDelay: "0.2s" }} id="writing">
        <div className="eyebrow">
          Writing
          <Link to="/blog">All articles</Link>
        </div>

        {posts.isLoading ? (
          <p className="blog-excerpt">Loading articles…</p>
        ) : posts.data && posts.data.length > 0 ? (
          <ul className="flat-list">
            {posts.data.map((post) => (
              <li key={post.id}>
                <Link to={`/blog/${post.slug}`} className="title">
                  {post.title}
                </Link>
                <span className="meta">
                  {formatDate(post.publishedAt)} · {post.readingTime} min read
                </span>
                <p className="community-description">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="blog-excerpt">No published articles yet.</p>
        )}

        <Link to="/blog" className="read-link">
          Read the blog <ArrowRight size={12} />
        </Link>
      </section>

      <section className="reveal" style={{ animationDelay: "0.25s" }} id="talks">
        <div className="eyebrow">Talks</div>
        <ul className="flat-list">
          {talks.map((talk) => (
            <li key={talk.href}>
              <a className="title" href={talk.href} target="_blank" rel="noopener noreferrer">
                {talk.title}
              </a>
              <span className="meta">{talk.meta}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="reveal" style={{ animationDelay: "0.3s" }}>
        <div className="eyebrow">Community</div>
        <ul className="flat-list">
          {community.map((item) => (
            <li key={item.title}>
              <span className="title">{item.title}</span>
              <span className="meta">{item.meta}</span>
              <p className="community-description">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="contact reveal" style={{ animationDelay: "0.35s" }} id="contact">
        <h2>Get in touch</h2>
        <p>
          Looking for junior DevOps, SRE, and platform engineering roles. Open source contributor
          first — happy to talk through any of the work above.
        </p>
        <div className="links">
          <a href="mailto:lavishpal408@gmail.com">Email</a>
          <a href="https://www.github.com/lavishpal" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/in/lavish-pal" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="https://x.com/lavishpal408" target="_blank" rel="noopener noreferrer">
            X
          </a>
        </div>
      </section>
    </div>
  );
}

export default Index;
