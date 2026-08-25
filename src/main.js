import "./styles.css";
import { awards, competitions, projects, siteContent, skills, thesis } from "./data.js";

const app = document.querySelector("#app");
const skipLink = document.querySelector(".skip-link");
const metaDescription = document.querySelector('meta[name="description"]');
const ogTitle = document.querySelector('meta[property="og:title"]');
const ogDescription = document.querySelector('meta[property="og:description"]');

const {
  global: globalContent,
  documents,
  homepage,
  projectsPage: projectsContent,
  projectDetail: projectDetailContent,
  competitionsPage: competitionsContent,
  competitionDetail: competitionDetailContent,
  about,
  research,
  cv,
  contactPage: contactContent,
  notFound,
  lightbox: lightboxContent,
} = siteContent;

const html = String.raw;

function setMeta(title, description) {
  document.title = title;
  metaDescription?.setAttribute("content", description);
  ogTitle?.setAttribute("content", title);
  ogDescription?.setAttribute("content", description);
}

function header() {
  const navigation = globalContent.navigation.map((item) => `<a href="${item.href}" data-link>${item.label}</a>`).join("");
  return html`
    <header class="site-header" data-header>
      <a class="wordmark" href="/" data-link aria-label="${globalContent.homeAriaLabel}">${globalContent.siteName}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span>${globalContent.menuLabel}</span></button>
      <nav id="primary-nav" class="primary-nav" aria-label="${globalContent.primaryNavigationLabel}">${navigation}</nav>
    </header>
  `;
}

function footer() {
  const links = globalContent.footerLinks
    .map((link) => `<a href="${link.href}"${link.external ? ' target="_blank" rel="noreferrer"' : ""}>${link.label}</a>`)
    .join("");
  return html`
    <footer class="site-footer">
      <p>${globalContent.siteName} <span>${globalContent.role}</span></p>
      <div class="footer-links">${links}</div>
      <p class="copyright">${globalContent.copyrightPrefix} ${new Date().getFullYear()}</p>
    </footer>
  `;
}

function pageShell(content, pageClass = "") {
  return `${header()}<main id="main-content" class="${pageClass}">${content}</main>${footer()}${lightbox()}`;
}

function externalArrow() {
  return `<span aria-hidden="true">${globalContent.externalArrow}</span>`;
}

function homePage() {
  setMeta(homepage.title, homepage.description);
  const hotspots = homepage.hotspots
    .map(
      (hotspot) => html`
        <a
          class="cover-hotspot cover-hotspot-${hotspot.id}"
          href="${hotspot.route}"
          data-link
          aria-label="${hotspot.label}"
          style="left:${hotspot.left}%;top:${hotspot.top}%;width:${hotspot.width}%;height:${hotspot.height}%"
        ></a>
      `,
    )
    .join("");
  return html`
    <main id="main-content" class="cover-home">
      <section class="cover-stage" aria-label="${homepage.frameLabel}">
        <div class="cover-frame">
          <img class="cover-image" src="${homepage.image}" alt="${homepage.imageAlt}" />
          <div class="cover-hotspots">${hotspots}</div>
        </div>
      </section>
    </main>
  `;
}

function projectsPage() {
  setMeta(projectsContent.title, projectsContent.description);
  const cards = projects
    .map(
      (project, index) => html`
        <article
          class="catalog-card project-card reveal"
          ${import.meta.env.DEV ? `data-preview-group="projects" data-preview-slug="${project.slug}" data-preview-reset-position="${project.previewDefaultPosition}" data-preview-reset-scale="${project.previewDefaultScale}"` : ""}
        >
          <a href="${project.route}" data-link aria-label="${projectsContent.cardLabelPrefix} ${project.title}">
            <figure class="catalog-preview">
              <img
                src="${project.previewImage}"
                alt="${project.previewAlt}"
                loading="${index < 6 ? "eager" : "lazy"}"
                decoding="async"
                style="--preview-scale:${project.previewScale};--preview-hover-scale:${project.previewHoverScale};--preview-position:${project.previewPosition}"
              />
            </figure>
            <div class="catalog-card-copy">
              <span class="catalog-index">${project.index}</span>
              <h2>${project.title}</h2>
              <p>${project.year}${globalContent.itemSeparator}${project.cardLocation}</p>
            </div>
          </a>
        </article>
      `,
    )
    .join("");
  return pageShell(
    html`
      <section class="catalog-intro section-pad">
        <div><p class="eyebrow">${projectsContent.eyebrow}</p><h1>${projectsContent.heading}</h1></div>
        <div class="action-row catalog-actions">
          <a class="button-link" href="${documents.portfolio}" target="_blank" rel="noreferrer">${projectsContent.viewPortfolioLabel} ${externalArrow()}</a>
          <a class="text-link" href="${documents.portfolio}" download>${projectsContent.downloadLabel} ${globalContent.downloadArrow}</a>
        </div>
      </section>
      <section class="catalog-grid projects-grid section-pad" aria-label="${projectsContent.gridLabel}">${cards}</section>
    `,
    "projects-page",
  );
}

function projectPage(project) {
  const description = `${project.title}${globalContent.titleSeparator}${project.category}${globalContent.itemSeparator}${globalContent.siteName}`;
  setMeta(`${project.title}${globalContent.titleSeparator}${globalContent.siteName}`, description);
  const labels = projectDetailContent.metadataLabels;
  const metadata = [
    [labels.year, project.year],
    [labels.location, project.location],
    [labels.category, project.category],
    [labels.collaboration, project.collaboration],
    project.role ? [labels.role, project.role] : null,
    project.software ? [labels.software, project.software] : null,
    project.model ? [labels.model, project.model] : null,
  ]
    .filter(Boolean)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join("");
  const [firstPage, lastPage] = project.pdfPages;
  const portfolioPages = Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index)
    .map(
      (page, index) => html`
        <figure class="portfolio-pdf-page reveal">
          <img
            src="/assets/portfolio-pages/page-${String(page).padStart(2, "0")}.jpg"
            alt="${project.title}, ${projectDetailContent.portfolioPageLabel} ${page}"
            loading="${index === 0 ? "eager" : "lazy"}"
            decoding="async"
          />
          <figcaption>${projectDetailContent.portfolioPageLabel} ${String(page).padStart(2, "0")}</figcaption>
        </figure>
      `,
    )
    .join("");
  const currentIndex = projects.indexOf(project);
  const next = projects[(currentIndex + 1) % projects.length];

  return pageShell(
    html`
      <article class="project-detail">
        <header class="project-intro section-pad">
          <p class="eyebrow">${projectDetailContent.eyebrowPrefix} ${project.index}</p>
          <h1>${project.title}</h1>
          <p class="project-subtitle">${project.subtitle}</p>
          <div class="project-intro-grid"><dl class="project-facts">${metadata}</dl><p class="project-description">${project.description}</p></div>
        </header>
        <section class="portfolio-page-stream" aria-label="${projectDetailContent.portfolioPagesLabel} ${firstPage}-${lastPage}">${portfolioPages}</section>
        <nav class="next-project section-pad" aria-label="${projectDetailContent.nextNavigationLabel}">
          <p class="eyebrow">${projectDetailContent.nextLabel}</p>
          <a href="${next.route}" data-link><span>${next.title}</span><span aria-hidden="true">${globalContent.nextArrow}</span></a>
        </nav>
      </article>
    `,
    "project-page",
  );
}

function competitionsPage() {
  setMeta(competitionsContent.title, competitionsContent.description);
  const cards = competitions
    .map(
      (entry, index) => html`
        <article
          class="catalog-card competition-card reveal"
          ${import.meta.env.DEV ? `data-preview-group="competitions" data-preview-slug="${entry.slug}" data-preview-reset-position="${entry.previewDefaultPosition}" data-preview-reset-scale="${entry.previewDefaultScale}"` : ""}
        >
          <a href="${entry.route}" data-link aria-label="${competitionsContent.cardLabelPrefix} ${entry.competition}: ${entry.project}">
            <figure class="catalog-preview">
              <img
                src="${entry.previewImage}"
                alt="${entry.previewAlt}"
                loading="${index < 8 ? "eager" : "lazy"}"
                decoding="async"
                style="--preview-scale:${entry.previewScale};--preview-hover-scale:${entry.previewHoverScale};--preview-position:${entry.previewPosition}"
              />
            </figure>
            <div class="catalog-card-copy">
              <span class="catalog-index">${String(index + 1).padStart(2, "0")}</span>
              <h2>${entry.competition}</h2>
              <p class="catalog-project-name">${entry.project}</p>
              <p class="catalog-result">${entry.result}</p>
              <p>${entry.year}${globalContent.itemSeparator}${entry.cardLocation}</p>
            </div>
          </a>
        </article>
      `,
    )
    .join("");
  return pageShell(
    html`
      <section class="catalog-intro section-pad"><div><p class="eyebrow">${competitionsContent.eyebrow}</p><h1>${competitionsContent.heading}</h1></div></section>
      <section class="catalog-grid competitions-grid section-pad" aria-label="${competitionsContent.gridLabel}">${cards}</section>
    `,
    "competitions-page",
  );
}

function competitionPage(entry) {
  setMeta(
    `${entry.competition}${globalContent.titleSeparator}${globalContent.siteName}`,
    `${entry.project}${globalContent.itemSeparator}${entry.result}${globalContent.itemSeparator}${entry.competition}`,
  );
  const boards = entry.boards
    .map(
      (board, boardIndex) => html`
        <figure class="competition-board reveal">
          <img src="${board}" alt="${entry.project}, ${competitionDetailContent.boardAltSuffix} ${boardIndex + 1}" loading="${boardIndex === 0 ? "eager" : "lazy"}" decoding="async" />
        </figure>
      `,
    )
    .join("");
  const currentIndex = competitions.indexOf(entry);
  const next = competitions[(currentIndex + 1) % competitions.length];
  const labels = competitionDetailContent.metadataLabels;
  return pageShell(
    html`
      <article class="competition-entry competition-detail">
        <header class="competition-copy section-pad">
          <p class="eyebrow">${competitionDetailContent.eyebrowPrefix} ${String(currentIndex + 1).padStart(2, "0")}</p>
          <div class="competition-title-row">
            <div><h1>${entry.competition}</h1><p class="competition-project">${entry.project}</p>${entry.subtitle ? `<p class="competition-subtitle">${entry.subtitle}</p>` : ""}</div>
            <dl class="competition-facts">
              <dt>${labels.organizer}</dt><dd>${entry.organizer}</dd>
              <dt>${labels.result}</dt><dd>${entry.result}</dd>
              <dt>${labels.year}</dt><dd>${entry.year}</dd>
              <dt>${labels.location}</dt><dd>${entry.location}</dd>
              <dt>${labels.published}</dt><dd>${entry.resultDate}</dd>
            </dl>
          </div>
          <p class="competition-brief">${entry.brief}</p>
          <div class="competition-links">
            <a class="text-link" href="${entry.officialUrl}" target="_blank" rel="noreferrer">${competitionDetailContent.officialCompetitionLabel} ${externalArrow()}</a>
            <a class="text-link" href="${entry.resultsUrl}" target="_blank" rel="noreferrer">${competitionDetailContent.officialResultsLabel} ${externalArrow()}</a>
          </div>
        </header>
        <section class="competition-boards" aria-label="${competitionDetailContent.boardsLabel}">${boards}</section>
        <nav class="next-project section-pad" aria-label="${competitionDetailContent.nextNavigationLabel}">
          <p class="eyebrow">${competitionDetailContent.nextLabel}</p>
          <a href="${next.route}" data-link><span>${next.competition}</span><span aria-hidden="true">${globalContent.nextArrow}</span></a>
        </nav>
      </article>
    `,
    "competition-page",
  );
}

function thesisNavigator() {
  const chapterLinks = thesis.chapters
    .map((chapter) => {
      const label = chapter.level === "part" ? `${chapter.part}${globalContent.titleSeparator}${chapter.title}` : `${chapter.number}. ${chapter.title}`;
      return `<a class="thesis-chapter-link thesis-chapter-${chapter.level}" href="#${chapter.id}" data-thesis-anchor="${chapter.id}" data-chapter-link="${chapter.id}">${label}</a>`;
    })
    .join("");
  return html`
    <button class="thesis-mobile-toggle" type="button" aria-expanded="false" aria-controls="thesis-chapter-nav">
      <span>${thesis.mobileButtonLabel}</span><span class="thesis-mobile-current" data-thesis-current></span><span aria-hidden="true">▾</span>
    </button>
    <nav id="thesis-chapter-nav" class="thesis-chapter-nav" aria-label="${thesis.navigatorLabel}">${chapterLinks}</nav>
  `;
}

function thesisPage() {
  setMeta(thesis.pageTitle, thesis.description);
  const chapterByPage = new Map(thesis.chapters.map((chapter) => [chapter.startPage, chapter]));
  const pageFigures = Array.from({ length: thesis.pageCount }, (_, index) => index + 1)
    .map((page) => {
      const chapter = chapterByPage.get(page);
      return html`
        <figure class="thesis-page" ${chapter ? `id="${chapter.id}" data-chapter-id="${chapter.id}"` : ""} data-thesis-page="${page}">
          <img
            src="${thesis.pageImageTemplate.replace("{page}", String(page).padStart(3, "0"))}"
            alt="${thesis.pageAltPrefix} ${page}"
            loading="${page <= 3 ? "eager" : "lazy"}"
            decoding="async"
          />
        </figure>
      `;
    })
    .join("");
  return pageShell(
    html`
      <article class="thesis-viewer">
        <header class="thesis-intro section-pad">
          <div><p class="eyebrow">${thesis.eyebrow}</p><h1>${thesis.title}</h1><p>${thesis.subtitle}</p></div>
        </header>
        <div class="thesis-layout section-pad">
          <aside class="thesis-navigation">${thesisNavigator()}</aside>
          <section class="thesis-page-stream" aria-label="${thesis.pagesLabel}">${pageFigures}</section>
        </div>
      </article>
    `,
    "thesis-page",
  );
}

function aboutPage() {
  setMeta(about.title, about.description);
  const skillColumns = skills.map((group) => `<div class="skill-group"><h3>${group.title}</h3><p>${group.items.join(globalContent.itemSeparator)}</p></div>`).join("");
  const awardRows = awards.map((award) => `<li><span>${award.result}</span><strong>${award.title}</strong><span>${award.context}</span><span>${award.year}</span></li>`).join("");
  const experienceRows = about.experience
    .map((item) => `<article><p class="timeline-date">${item.dates}</p><div><h2>${item.organization}</h2><p>${item.position}<br />${item.place}</p></div><p>${item.description}</p></article>`)
    .join("");
  const educationRows = about.education.map((item) => `<article><p>${item.dates}</p><h2>${item.institution}</h2><p>${item.degree}<br />${item.place}</p></article>`).join("");
  return pageShell(
    html`
      <section class="page-intro section-pad"><p class="eyebrow">${about.eyebrow}</p><h1>${about.heading}</h1></section>
      <section class="about-profile section-pad reveal"><h2>${about.profileLabel}</h2><p>${about.bio}</p></section>
      <section class="timeline-section section-pad reveal"><p class="eyebrow">${about.experienceLabel}</p><div class="timeline">${experienceRows}</div></section>
      <section class="education-section section-pad reveal"><p class="eyebrow">${about.educationLabel}</p><div class="education-grid">${educationRows}</div></section>
      <section class="skills-section section-pad reveal"><p class="eyebrow">${about.skillsLabel}</p><div class="skills-grid">${skillColumns}</div></section>
      <section class="awards-section section-pad reveal"><p class="eyebrow">${about.awardsLabel}</p><ul class="award-list">${awardRows}</ul></section>
    `,
    "about-page",
  );
}

function researchPage() {
  setMeta(research.title, research.description);
  const methods = research.methods.map((method) => `<article><p class="method-number">${method.number}</p><h2>${method.title}</h2><p>${method.description}</p></article>`).join("");
  return pageShell(
    html`
      <section class="page-intro research-intro section-pad"><p class="eyebrow">${research.eyebrow}</p><h1>${research.heading}</h1></section>
      <section class="research-overview section-pad reveal"><div><p class="eyebrow">${research.period}</p><h2>${research.theme}</h2><p>${research.context}</p></div><p>${research.intro}</p></section>
      <section class="research-video section-pad reveal">
        <div class="research-video-copy"><p class="eyebrow">${research.video.eyebrow}</p><h2>${research.video.title}</h2></div>
        <figure class="research-video-figure">
          <video controls playsinline preload="metadata" poster="${research.video.poster}" aria-label="${research.video.ariaLabel}">
            <source src="${research.video.src}" type="${research.video.type}" />
          </video>
          <figcaption>${research.video.caption}</figcaption>
        </figure>
      </section>
      <section class="research-methods section-pad reveal"><p class="eyebrow">${research.methodsLabel}</p><div class="methods-grid">${methods}</div></section>
      <section class="research-note section-pad reveal"><p class="eyebrow">${research.contextLabel}</p><p>${research.note}</p></section>
    `,
    "research-page",
  );
}

function cvPage() {
  setMeta(cv.title, cv.description);
  return pageShell(
    html`
      <section class="page-intro section-pad">
        <p class="eyebrow">${cv.eyebrow}</p><h1>${cv.heading}</h1>
        <div class="action-row"><a class="button-link" href="${documents.cv}" target="_blank" rel="noreferrer">${cv.viewLabel} ${externalArrow()}</a><a class="text-link" href="${documents.cv}" download>${cv.downloadLabel} ${globalContent.downloadArrow}</a></div>
      </section>
      <section class="cv-summary section-pad reveal">
        <div class="cv-column"><p class="eyebrow">${cv.educationLabel}</p>${cv.education.map((item) => `<article><p>${item.dates}</p><h2>${item.title}</h2><p>${item.place}</p></article>`).join("")}</div>
        <div class="cv-column"><p class="eyebrow">${cv.practiceLabel}</p>${cv.practice.map((item) => `<article><p>${item.dates}</p><h2>${item.title}</h2><p>${item.place}</p></article>`).join("")}</div>
      </section>
      <section class="document-panel section-pad reveal"><div><p>${cv.pdfNote}</p><a class="text-link" href="${documents.cv}" target="_blank" rel="noreferrer">${cv.openPdfLabel} ${externalArrow()}</a></div><iframe class="cv-embed" src="${documents.cv}#view=FitH" title="${cv.embedTitle}"></iframe></section>
    `,
    "cv-page",
  );
}

function contactPage() {
  setMeta(contactContent.title, contactContent.description);
  const contactLinks = [...contactContent.links, contactContent.linkedin]
    .filter((link) => link?.href)
    .map((link) => `<a href="${link.href}" target="_blank" rel="noreferrer">${link.label} ${externalArrow()}</a>`)
    .join("");
  return pageShell(
    html`
      <section class="contact-hero section-pad"><p class="eyebrow">${contactContent.eyebrow}</p><h1>${contactContent.name}</h1><p class="contact-role">${contactContent.role}</p><a class="contact-email" href="mailto:${contactContent.email}">${contactContent.email}</a></section>
      <section class="contact-links section-pad">${contactLinks}</section>
    `,
    "contact-page",
  );
}

function notFoundPage() {
  setMeta(notFound.title, notFound.description);
  return pageShell(html`<section class="not-found section-pad"><p class="eyebrow">${notFound.eyebrow}</p><h1>${notFound.heading}</h1><a class="text-link" href="/" data-link>${notFound.returnLabel} ${globalContent.nextArrow}</a></section>`);
}

function lightbox() {
  return html`
    <div class="lightbox" role="dialog" aria-modal="true" aria-label="${lightboxContent.dialogLabel}" hidden>
      <button class="lightbox-close" type="button" aria-label="${lightboxContent.closeLabel}">${lightboxContent.closeText}</button><img src="" alt="" /><p></p>
    </div>
  `;
}

function route() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return homePage();
  if (path === "/projects") return projectsPage();
  if (path === "/competitions") return competitionsPage();
  if (path === "/thesis") return thesisPage();
  if (path === "/about") return aboutPage();
  if (path === "/research") return researchPage();
  if (path === "/cv") return cvPage();
  if (path === "/contact") return contactPage();
  if (path.startsWith("/projects/")) {
    const project = projects.find((entry) => entry.type === "project" && entry.route === path);
    return project ? projectPage(project) : notFoundPage();
  }
  if (path.startsWith("/competitions/")) {
    const entry = competitions.find((competition) => competition.route === path);
    return entry ? competitionPage(entry) : notFoundPage();
  }
  return notFoundPage();
}

function render({ preserveScroll = false } = {}) {
  app.innerHTML = route();
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isHome = path === "/";
  skipLink.textContent = globalContent.skipLabel;
  skipLink.toggleAttribute("hidden", isHome);
  document.body.classList.toggle("is-home", isHome);
  bindInteractions();
  bindThesisNavigator();
  observeReveals();
  if (!preserveScroll) {
    const hashTarget = window.location.hash ? document.querySelector(window.location.hash) : null;
    requestAnimationFrame(() => {
      if (hashTarget) hashTarget.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    });
  }
}

function bindInteractions() {
  const headerElement = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  menuButton?.addEventListener("click", () => {
    const open = headerElement.classList.toggle("menu-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector("span").textContent = open ? globalContent.closeMenuLabel : globalContent.menuLabel;
  });
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      history.pushState({}, "", `${url.pathname}${url.hash}`);
      render();
    });
  });
  const lightboxElement = document.querySelector(".lightbox");
  const lightboxImage = lightboxElement?.querySelector("img");
  const lightboxCaption = lightboxElement?.querySelector("p");
  const closeButton = lightboxElement?.querySelector(".lightbox-close");
  let opener = null;
  const closeLightbox = () => {
    if (!lightboxElement || lightboxElement.hidden) return;
    lightboxElement.hidden = true;
    document.body.classList.remove("modal-open");
    opener?.focus();
  };
  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      opener = button;
      lightboxImage.src = button.dataset.lightboxSrc;
      lightboxImage.alt = button.dataset.lightboxAlt;
      lightboxCaption.textContent = button.dataset.lightboxAlt;
      lightboxElement.hidden = false;
      document.body.classList.add("modal-open");
      closeButton.focus();
    });
  });
  closeButton?.addEventListener("click", closeLightbox);
  lightboxElement?.addEventListener("click", (event) => {
    if (event.target === lightboxElement) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  }, { once: true });
}

function bindThesisNavigator() {
  if (!document.querySelector(".thesis-page-stream")) return;
  const mobileToggle = document.querySelector(".thesis-mobile-toggle");
  const navigation = document.querySelector(".thesis-navigation");
  const currentLabel = document.querySelector("[data-thesis-current]");
  const chapterLinks = [...document.querySelectorAll("[data-chapter-link]")];
  const setActive = (chapter) => {
    if (!chapter) return;
    chapterLinks.forEach((link) => {
      const active = link.dataset.chapterLink === chapter.id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    currentLabel.textContent = chapter.level === "part" ? `${chapter.part}${globalContent.titleSeparator}${chapter.title}` : chapter.title;
  };
  mobileToggle?.addEventListener("click", () => {
    const open = navigation.classList.toggle("is-open");
    mobileToggle.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll("[data-thesis-anchor]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.thesisAnchor);
      if (!target) return;
      history.pushState({}, "", `#${link.dataset.thesisAnchor}`);
      navigation.classList.remove("is-open");
      mobileToggle?.setAttribute("aria-expanded", "false");
      requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  });
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => Number(a.target.dataset.thesisPage) - Number(b.target.dataset.thesisPage));
      if (!visible.length) return;
      const page = Number(visible[0].target.dataset.thesisPage);
      const chapter = [...thesis.chapters].reverse().find((item) => item.startPage <= page);
      setActive(chapter || thesis.chapters[0]);
    },
    { rootMargin: "-10% 0px -78% 0px", threshold: 0 },
  );
  document.querySelectorAll("[data-thesis-page]").forEach((page) => observer.observe(page));
  const hashChapter = thesis.chapters.find((chapter) => `#${chapter.id}` === window.location.hash);
  setActive(hashChapter || thesis.chapters[0]);
}

function observeReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

window.addEventListener("popstate", () => render());
render();

if (import.meta.env.DEV && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
  import("./dev/previewEditor.js").then(({ initPreviewEditor }) => initPreviewEditor());
}
