const UI_BUILD = "2026-05-02.11";

const CURATED_AUDIENCE_GROUPS = [
  { value: "Board of Directors", label: "IWFSA Board of Director" },
  { value: "Advocacy and Voice", label: "Advocacy and Voice" },
  { value: "Catalytic Strategy", label: "Catalytic Strategy" },
  { value: "Leadership Development Committee", label: "Leadership Development" },
  { value: "Member Affairs", label: "Member Affairs" },
  { value: "Brand and Reputation", label: "Brand and Reputation" }
];

function htmlLayout({ title, body, appBaseUrl, currentPath, pageClass = "" }) {
  const normalizedPath = currentPath || "/";
  const navItems = [{ href: `${appBaseUrl}/sign-in`, label: "Sign In", path: "/sign-in" }];
  const navLinks = navItems
    .map((item) => {
      const isActive = normalizedPath === item.path;
      return `<a class="nav-link nav-link-sign-in${isActive ? " nav-link-active" : ""}" href="${item.href}"${
        isActive ? ' aria-current="page"' : ""
      }>${item.label}</a>`;
    })
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="${appBaseUrl}/assets/styles.css?v=${UI_BUILD}-public-refresh" />
  </head>
  <body class="${escapeHtml(pageClass)}">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="shell site-header-shell">
        <div class="brand-lockup">
          <a class="brand-link" href="${appBaseUrl}/">
            <img class="brand-logo" src="${appBaseUrl}/assets/iwfsa-logo.svg?v=${UI_BUILD}" alt="International Women's Forum South Africa" />
            <span class="brand-copy">
              <span class="eyebrow">IWFSA Web Platform</span>
              <span class="brand-title">International Women's Forum South Africa</span>
              <span class="brand-subtitle">Public website, member workspace, and governance console</span>
            </span>
          </a>
        </div>
        <nav class="site-nav" aria-label="Primary">
          ${navLinks}
          <button type="button" hidden class="nav-link nav-link-signout session-nav-signout member-session-logout admin-session-logout">Sign Out</button>
        </nav>
      </div>
    </header>
    <main id="main-content" class="shell page-shell">
      ${body}
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderPublicPage(config) {
  return htmlLayout({
    title: "IWFSA | Public",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/",
    pageClass: "page-public",
    body: `
      <section class="panel panel-hero public-hero">
        <div class="hero-copy">
          <p class="eyebrow eyebrow-contrast">Public Service | International Women's Forum South Africa</p>
          <h1 class="page-title">Leading with Purpose.</h1>
          <p class="lead public-hero-lead">
            IWFSA brings women leaders together through purposeful programmes, mentoring, and events, creating a forum for connection, leadership growth, and meaningful impact across South Africa.
          </p>
        </div>
        <figure class="featured-signal-figure">
          <div class="featured-photo-frame">
            <img
              id="public-hero-image"
              class="featured-hero-image"
              src="${config.appBaseUrl}/assets/iwfsa-home.jpg?v=${UI_BUILD}-public-refresh"
              alt="IWFSA leaders meeting around a conference table in Sandton while a presentation screen reads Ignite. Inspire. Impact."
              data-default-src="${config.appBaseUrl}/assets/iwfsa-home.jpg?v=${UI_BUILD}-public-refresh"
              data-default-alt="IWFSA leaders meeting around a conference table in Sandton while a presentation screen reads Ignite. Inspire. Impact."
              data-default-focal-point="center top"
              loading="eager"
              decoding="async"
            />
          </div>
        </figure>
      </section>

      <section class="public-highlights" aria-label="IWFSA public highlights">
        <div class="hero-stat-grid public-highlights-grid">
          <div class="hero-stat public-highlight-card">
            <strong>Purposeful programmes</strong>
            <span>Leadership conversations, knowledge exchange, and shared learning for women shaping South Africa.</span>
          </div>
          <div class="hero-stat public-highlight-card">
            <strong>Mentoring and connection</strong>
            <span>A trusted network where accomplished women build relationships, support growth, and extend opportunity.</span>
          </div>
        </div>
      </section>

      <section class="panel panel-carousel" aria-label="IWFSA photo gallery" style="margin-top: 2rem; padding: 0; overflow: hidden;">
        <div class="carousel" id="iwfsa-carousel" aria-roledescription="carousel">
          <div class="carousel-track" role="list">
            <div class="carousel-slide" role="listitem" aria-label="Slide 1 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/54923917203_a297501112_c.jpg"
                  alt="IWFSA event – group of women leaders" loading="lazy" decoding="async" />
              </a>
            </div>
            <div class="carousel-slide" role="listitem" aria-label="Slide 2 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/DSC04621-scaled.jpg"
                  alt="IWFSA gathering – members at an official event" loading="lazy" decoding="async" />
              </a>
            </div>
            <div class="carousel-slide" role="listitem" aria-label="Slide 3 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/SB-IWFSA-fellows-breakfast-050-qz8dlgcmi31qq9tk81eixoqndfa8vjz5f0wxulcrkw.webp"
                  alt="IWFSA Fellows Breakfast" loading="lazy" decoding="async" />
              </a>
            </div>
            <div class="carousel-slide" role="listitem" aria-label="Slide 4 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/IWFSA-Revised-Board-Strategy-Launch-February-2024-qz8dl44q18l0jcbb7e4dj9tnneyh3hmn1cfmlzuvts.webp"
                  alt="IWFSA Revised Board Strategy Launch – February 2024" loading="lazy" decoding="async" />
              </a>
            </div>
            <div class="carousel-slide" role="listitem" aria-label="Slide 5 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/iwfsa-2024-halle-of-femme-awards-800-qz8dlx9usiumz9rx4w6hmvue7ptdd4p70j0d36kklc.webp"
                  alt="IWFSA 2024 Hall of Femme Awards" loading="lazy" decoding="async" />
              </a>
            </div>
            <div class="carousel-slide" role="listitem" aria-label="Slide 6 of 6">
              <a href="https://www.iwfsa.co.za/" target="_blank" rel="noopener noreferrer" tabindex="-1">
                <img src="https://www.iwfsa.co.za/wp-content/uploads/2025/11/Catalytic-Strategy-Gender-Inclusive-Tax-Roundtable-October-2024-qz8dl1bcc5kkxynqinbsg20vnlompwy47s48xyl5yc.webp"
                  alt="Catalytic Strategy Gender-Inclusive Tax Roundtable – October 2024" loading="lazy" decoding="async" />
              </a>
            </div>
          </div>

          <button class="carousel-btn carousel-btn-prev" aria-label="Previous slide" onclick="iwfsaCarouselMove(-1)">&#8249;</button>
          <button class="carousel-btn carousel-btn-next" aria-label="Next slide" onclick="iwfsaCarouselMove(1)">&#8250;</button>

          <div class="carousel-dots" role="tablist" aria-label="Slide indicators">
            <button class="carousel-dot carousel-dot-active" role="tab" aria-label="Go to slide 1" aria-selected="true" onclick="iwfsaCarouselGo(0)"></button>
            <button class="carousel-dot" role="tab" aria-label="Go to slide 2" aria-selected="false" onclick="iwfsaCarouselGo(1)"></button>
            <button class="carousel-dot" role="tab" aria-label="Go to slide 3" aria-selected="false" onclick="iwfsaCarouselGo(2)"></button>
            <button class="carousel-dot" role="tab" aria-label="Go to slide 4" aria-selected="false" onclick="iwfsaCarouselGo(3)"></button>
            <button class="carousel-dot" role="tab" aria-label="Go to slide 5" aria-selected="false" onclick="iwfsaCarouselGo(4)"></button>
            <button class="carousel-dot" role="tab" aria-label="Go to slide 6" aria-selected="false" onclick="iwfsaCarouselGo(5)"></button>
          </div>
        </div>
        <script>
          (function () {
            var current = 0;
            var total = 6;
            var timer;
            var paused = false;

            function update(idx) {
              current = (idx + total) % total;
              var track = document.querySelector('#iwfsa-carousel .carousel-track');
              track.style.transform = 'translateX(-' + (current * 100) + '%)';
              var dots = document.querySelectorAll('#iwfsa-carousel .carousel-dot');
              dots.forEach(function (d, i) {
                d.classList.toggle('carousel-dot-active', i === current);
                d.setAttribute('aria-selected', i === current ? 'true' : 'false');
              });
              var slides = document.querySelectorAll('#iwfsa-carousel .carousel-slide a');
              slides.forEach(function (a, i) {
                a.setAttribute('tabindex', i === current ? '0' : '-1');
              });
            }

            function next() { update(current + 1); }

            function startTimer() {
              clearInterval(timer);
              timer = setInterval(function () { if (!paused) next(); }, 5000);
            }

            window.iwfsaCarouselMove = function (dir) { update(current + dir); startTimer(); };
            window.iwfsaCarouselGo   = function (idx) { update(idx); startTimer(); };

            var el = document.getElementById('iwfsa-carousel');
            if (el) {
              el.addEventListener('mouseenter', function () { paused = true; });
              el.addEventListener('mouseleave', function () { paused = false; });
              el.addEventListener('focusin',    function () { paused = true; });
              el.addEventListener('focusout',   function () { paused = false; });
              el.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft')  { iwfsaCarouselMove(-1); }
                if (e.key === 'ArrowRight') { iwfsaCarouselMove(1); }
              });
            }

            update(0);
            startTimer();
          })();
        </script>
        <script>
          (function () {
            var heroImage = document.getElementById("public-hero-image");
            if (!heroImage) {
              return;
            }

            var defaultSrc = heroImage.getAttribute("data-default-src") || heroImage.getAttribute("src") || "";
            var defaultAlt = heroImage.getAttribute("data-default-alt") || heroImage.getAttribute("alt") || "";
            var defaultFocalPoint = heroImage.getAttribute("data-default-focal-point") || "center top";

            fetch("${config.apiBaseUrl}/api/public/site-settings/public-hero")
              .then(function (response) {
                if (!response.ok) {
                  throw new Error("hero_settings_unavailable");
                }
                return response.json();
              })
              .then(function (payload) {
                var item = payload && payload.item ? payload.item : null;
                if (!item) {
                  return;
                }
                heroImage.setAttribute("alt", item.altText || defaultAlt);
                heroImage.style.objectPosition = item.focalPointCss || defaultFocalPoint;
                if (item.imageUrl) {
                  heroImage.setAttribute("src", item.imageUrl);
                } else {
                  heroImage.setAttribute("src", defaultSrc);
                }
              })
              .catch(function () {
                heroImage.setAttribute("src", defaultSrc);
                heroImage.setAttribute("alt", defaultAlt);
                heroImage.style.objectPosition = defaultFocalPoint;
              });
          })();
        </script>
      </section>

      <section class="panel" aria-labelledby="portal-nav-heading" style="margin-top: 2rem;">
        <p class="eyebrow">Public Surface</p>
        <h2 id="portal-nav-heading" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">Quick Links — Portal Access</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Member Portal</h3>
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
              <li><a href="${config.appBaseUrl}/member#events">Events</a></li>
              <li><a href="${config.appBaseUrl}/member#birthdays">Birthdays</a></li>
              <li><a href="${config.appBaseUrl}/member#sms">SMS Settings</a></li>
              <li><a href="${config.appBaseUrl}/member#celebrations">Celebration Thread</a></li>
            </ul>
          </div>
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Admin Console</h3>
            <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
              <li><a href="${config.appBaseUrl}/admin#members">Members</a></li>
              <li><a href="${config.appBaseUrl}/admin#imports">Imports</a></li>
              <li><a href="${config.appBaseUrl}/admin#notifications">Notifications</a></li>
              <li><a href="${config.appBaseUrl}/admin#reports">Reports</a></li>
            </ul>
          </div>
        </div>
      </section>

      <section class="panel" aria-labelledby="contact-heading" style="margin-top: 2rem;">
        <h2 id="contact-heading" style="border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">Get in touch</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Office Address</h3>
            <address style="font-style: normal; line-height: 1.6;">
              2 Bruton, Block A<br>
              Nicol Main Office Park<br>
              Bryanston 2191<br>
              South Africa
            </address>
          </div>

          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Postal Address</h3>
            <address style="font-style: normal; line-height: 1.6;">
              PO Box 3189,<br>
              Houghton, 2041<br>
              South Africa
            </address>
          </div>

          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Contact</h3>
            <p style="margin: 0; line-height: 1.6;">Tel: <a href="tel:+27113255295">+27 (0) 11 325 5295</a></p>
            <p style="margin: 0; line-height: 1.6;">Fax: +27 (0) 11 325 5284</p>
          </div>

          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Company Details</h3>
            <p style="margin: 0; line-height: 1.6;">Reg No: 201/000062/08</p>
            <p style="margin: 0; line-height: 1.6;">VAT No: 4130 201 934</p>
          </div>
        </div>
      </section>
    `
  });
}

export function renderSignInPage(config) {
  return htmlLayout({
    title: "IWFSA | Sign In",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/sign-in",
    pageClass: "page-sign-in",
    body: `
      <section class="sign-in-stage" aria-labelledby="sign-in-title">
        <div class="sign-in-stage-backdrop"></div>
        <div class="sign-in-stage-copy">
          <p class="eyebrow eyebrow-contrast">Secure Access</p>
          <h1 id="sign-in-title" class="page-title">Member Access</h1>
          <p class="lead">Use your IWFSA credentials to continue to the member or admin workspace.</p>
        </div>
        <div id="sign-in-card" class="sign-in-card">
          <div class="sign-in-card-handle">
            <span class="eyebrow">Portal Access</span>
          </div>
          <div class="sign-in-card-brand" aria-hidden="true"><span>Member and admin credentials</span></div>
          <form id="prompt-sign-in-form" class="sign-in-card-form login-form">
            <label for="sign-in-username">Username</label>
            <input id="sign-in-username" name="username" autocomplete="username" required />
            <label for="sign-in-password">Password</label>
            <input id="sign-in-password" name="password" type="password" autocomplete="current-password" required />
            <button id="sign-in-submit" class="button-link sign-in-submit" type="submit">Sign In</button>
            <p id="sign-in-status" class="muted" aria-live="polite">Ready to sign in.</p>
          </form>
        </div>
      </section>
      <script>
        (function () {
          const status = document.getElementById("sign-in-status");
          const form = document.getElementById("prompt-sign-in-form");
          const usernameInput = document.getElementById("sign-in-username");
          const passwordInput = document.getElementById("sign-in-password");
          const submitButton = document.getElementById("sign-in-submit");

          function roleDefaultPath(role) {
            const normalized = String(role || "").trim().toLowerCase();
            if (normalized === "chief_admin" || normalized === "admin") {
              return "/admin#overview";
            }
            if (normalized === "event_editor") {
              return "/admin#events";
            }
            return "/member#dashboard";
          }

          function safeRedirectPath(payload) {
            const serverPath = String(payload?.redirectPath || "").trim();
            const fallback = roleDefaultPath(payload?.user?.role);
            const candidate = serverPath || fallback;
            try {
              const url = new URL(candidate, window.location.origin);
              if (url.origin !== window.location.origin) {
                return fallback;
              }
              if (url.pathname === "/admin" || url.pathname === "/member") {
                return url.pathname + (url.hash || "");
              }
            } catch {
              return fallback;
            }
            return fallback;
          }

          function clearStoredSessions() {
            sessionStorage.removeItem("iwfsa_token");
            sessionStorage.removeItem("iwfsa_member_username");
            sessionStorage.removeItem("iwfsa_member_role");
            sessionStorage.removeItem("iwfsa_admin_token");
            sessionStorage.removeItem("iwfsa_admin_role");
            sessionStorage.removeItem("iwfsa_admin_username");
            sessionStorage.removeItem("iwfsa_admin_expires_at");
          }

          function persistSession(payload, redirectPath) {
            const token = String(payload?.token || "");
            const role = String(payload?.user?.role || "");
            const username = String(payload?.user?.username || "");
            const expiresAt = String(payload?.expiresAt || "");
            clearStoredSessions();
            if (!token) {
              return;
            }
            if (String(redirectPath || "").startsWith("/admin")) {
              sessionStorage.setItem("iwfsa_admin_token", token);
              sessionStorage.setItem("iwfsa_admin_role", role);
              sessionStorage.setItem("iwfsa_admin_username", username);
              if (expiresAt) {
                sessionStorage.setItem("iwfsa_admin_expires_at", expiresAt);
              }
              return;
            }
            sessionStorage.setItem("iwfsa_token", token);
            sessionStorage.setItem("iwfsa_member_username", username);
            sessionStorage.setItem("iwfsa_member_role", role || "member");
          }

          async function startPromptSignIn() {
            const payload = {
              username: String(usernameInput.value || "").trim(),
              password: String(passwordInput.value || "")
            };
            if (!payload.username || !payload.password) {
              status.textContent = "Username and password are required.";
              return;
            }
            status.textContent = "Signing in...";
            submitButton.disabled = true;
            try {
              const response = await fetch("${config.apiBaseUrl}/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              const json = await response.json();
              if (!response.ok) {
                status.textContent = "Sign in failed: " + (json.message || "Invalid credentials.");
                submitButton.disabled = false;
                return;
              }
              const redirectPath = safeRedirectPath(json);
              persistSession(json, redirectPath);
              status.textContent = "Opening your workspace...";
              window.location.assign("${config.appBaseUrl}" + redirectPath);
            } catch {
              status.textContent = "Sign in failed: unable to reach API.";
              submitButton.disabled = false;
            }
          }

          window.setTimeout(() => usernameInput?.focus(), 0);

          form.addEventListener("submit", (event) => {
            event.preventDefault();
            void startPromptSignIn();
          });
        })();
      </script>
    `
  });
}

export function renderMemberPage(config) {
  return htmlLayout({
    title: "IWFSA | Member Portal",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/member",
    pageClass: "page-member",
    body: `
      <div id="member-portal-root" class="portal-shell">
        <section class="panel panel-hero portal-hero">
          <div class="header-cluster">
             <div>
                <p class="eyebrow">Member Experience</p>
                <h1 class="page-title">Member Event Directory</h1>
               <p class="lead">
                 A focused member workspace for events, birthdays, notifications, celebrations, and personal communication preferences.
               </p>
             </div>
             <aside class="portal-hero-card" aria-label="Member workspace areas">
                <div class="portal-hero-card-content">
                  <p class="eyebrow">Workspace</p>
                  <strong>Members can move quickly between events, profiles, news, and celebrations.</strong>
                  <div class="portal-hero-tags" aria-hidden="true">
                    <span>Events</span>
                    <span>Profile</span>
                    <span>Notifications</span>
                  </div>
                </div>
             </aside>
             <p id="member-login-status" class="sr-only" aria-live="polite"></p>
          </div>
          <div id="member-session-bar" class="session-bar member-top-session-bar" hidden>
            <div>
              <p class="eyebrow">Signed in area</p>
              <p id="member-session-summary" class="session-summary">Member portal session active.</p>
            </div>
          </div>
          <nav class="module-nav" id="member-nav" aria-label="Member modules" hidden>
            <a href="#dashboard" class="module-nav-link" data-module="dashboard" data-member-module-link="dashboard">Dashboard</a>
            <a href="#events" class="module-nav-link" data-module="events" data-member-module-link="events">Events</a>
            <a href="#profile" class="module-nav-link" data-module="profile" data-member-module-link="profile">Member Profile</a>
            <a href="#birthdays" class="module-nav-link" data-module="birthdays" data-member-module-link="birthdays">Birthdays</a>
            <a href="#notifications" class="module-nav-link" data-module="notifications" data-member-module-link="notifications">Notifications</a>
            <a href="#sms" class="module-nav-link" data-module="sms" data-member-module-link="sms">SMS Settings</a>
            <a href="#celebrations" class="module-nav-link" data-module="celebrations" data-member-module-link="celebrations">Celebration Thread</a>
          </nav>
          <section id="member-birthday-panel" class="panel panel-accent member-birthday-panel" hidden>
            <div class="member-birthday-copy">
              <p class="eyebrow">Birthday Circle</p>
              <h2>Celebrate members and build team spirit</h2>
              <p class="muted">
                When a member signs in, this panel becomes the welcome moment for the organisation to send warm
                birthday wishes and recognise the people who keep the forum strong.
              </p>
            </div>
            <a class="button-link member-birthday-link" href="#birthdays">Open Birthday Circle</a>
          </section>
        </section>

                <section id="module-dashboard" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Member Home</p>
              <h2>Invites, news, and birthdays at a glance</h2>
            </div>
            <p class="muted">A focused member view of invitations and organisation updates.</p>
          </div>
          <div class="dashboard-cards">
            <button type="button" class="dashboard-card" onclick="window.location.hash='#events'">
              <h4>Upcoming Events</h4>
              <p>Browse events, confirm attendance, and download calendar files.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#profile'">
              <h4>My Personal Details</h4>
              <p>Update your profile details and upload your member photo.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.assign('${config.appBaseUrl}/profiles?member=self')">
              <h4>Profile Gallery</h4>
              <p>Open a read-only profile gallery and move through member profiles in one place.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#birthdays'">
              <h4>Birthday Circle</h4>
              <p>Celebrate members and strengthen the organisation community.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#notifications'">
              <h4>Notifications</h4>
              <p>Stay current on reminders, updates, and important changes.</p>
            </button>
          </div>
          <div class="member-actions">
            <button id="member-refresh-home" type="button" disabled>Refresh member home</button>
            <span id="member-home-status" class="muted">Sign in to load invitations and news.</span>
          </div>
          <div class="member-layout">
            <div class="main-column">
              <h3 class="subsection-title">Invites Received</h3>
              <div id="member-invite-list" class="event-grid">
                <p class="muted">Sign in to view your event invitations.</p>
              </div>

              <h3 class="subsection-title">IWFSA News</h3>
              <div id="member-news-list" class="thread-list">
                <p class="muted">Sign in to view relevant IWFSA news.</p>
              </div>
            </div>
            <aside class="sidebar-card sidebar-card-accent">
              <h3>Birthday Highlights</h3>
              <div id="member-dashboard-birthdays" class="birthday-list">
                <p class="muted">Sign in to load birthday highlights.</p>
              </div>
            </aside>
          </div>
        </section>

        <section id="module-profile" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Profile Settings</p>
              <h2>Manage Your Member Profile</h2>
            </div>
            <p class="muted">Maintain the read-only leadership profile other members browse, while keeping sensitive contact details under your control.</p>
          </div>
          <div class="member-layout">
            <div class="main-column">
              <form id="member-profile-form" class="login-form">
                <div class="sms-grid">
                  <div>
                    <label for="member-profile-username">Username</label>
                    <input id="member-profile-username" type="text" readonly disabled />
                  </div>
                  <div>
                    <label for="member-profile-email">Email</label>
                    <input id="member-profile-email" type="email" readonly disabled />
                  </div>
                  <div>
                    <label for="member-profile-full-name">Full name</label>
                    <input id="member-profile-full-name" type="text" maxlength="160" required disabled />
                  </div>
                  <div>
                    <label for="member-profile-company">Organisation</label>
                    <input id="member-profile-company" type="text" maxlength="180" disabled />
                  </div>
                  <div>
                    <label for="member-profile-phone">Phone</label>
                    <input id="member-profile-phone" type="text" maxlength="48" disabled />
                  </div>
                  <div>
                    <label for="member-profile-business-title">Professional title</label>
                    <input id="member-profile-business-title" type="text" maxlength="120" disabled />
                  </div>
                  <div>
                    <label for="member-profile-iwfsa-position">IWFSA position</label>
                    <input id="member-profile-iwfsa-position" type="text" maxlength="160" disabled />
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-bio">Short biography</label>
                    <textarea id="member-profile-bio" maxlength="300" rows="4" disabled></textarea>
                  </div>
                  <div>
                    <label for="member-profile-expertise">Expertise and sector</label>
                    <input id="member-profile-expertise" type="text" maxlength="300" disabled />
                  </div>
                  <div>
                    <label for="member-profile-linkedin-url">LinkedIn URL</label>
                    <input
                      id="member-profile-linkedin-url"
                      type="url"
                      maxlength="2048"
                      placeholder="https://www.linkedin.com/in/your-profile"
                      disabled
                    />
                  </div>
                  <div>
                    <label for="member-profile-preferred-name">Preferred name</label>
                    <input id="member-profile-preferred-name" type="text" maxlength="80" disabled />
                  </div>
                  <div>
                    <label for="member-profile-title">Title / honorific</label>
                    <input id="member-profile-title" type="text" maxlength="80" placeholder="Dr, Adv, Prof, Ms" disabled />
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-headline">Profile headline</label>
                    <input id="member-profile-headline" type="text" maxlength="180" placeholder="Leadership, sector, and contribution summary" disabled />
                  </div>
                  <div>
                    <label for="member-profile-sector">Industry / sector</label>
                    <input id="member-profile-sector" type="text" maxlength="160" disabled />
                  </div>
                  <div>
                    <label for="member-profile-current-role-title">Current role title</label>
                    <input id="member-profile-current-role-title" type="text" maxlength="160" disabled />
                  </div>
                  <div>
                    <label for="member-profile-city">City</label>
                    <input id="member-profile-city" type="text" maxlength="120" disabled />
                  </div>
                  <div>
                    <label for="member-profile-province">Province / state</label>
                    <input id="member-profile-province" type="text" maxlength="120" disabled />
                  </div>
                  <div>
                    <label for="member-profile-country">Country</label>
                    <input id="member-profile-country" type="text" maxlength="120" disabled />
                  </div>
                  <div>
                    <label for="member-profile-website">Website</label>
                    <input id="member-profile-website" type="url" maxlength="2048" placeholder="https://..." disabled />
                  </div>
                  <div>
                    <label for="member-profile-mentorship-role">Mentorship role</label>
                    <input id="member-profile-mentorship-role" type="text" maxlength="160" placeholder="Mentor, speaker, advisor" disabled />
                  </div>
                  <div>
                    <label for="member-profile-board-status">Board / governance status</label>
                    <input id="member-profile-board-status" type="text" maxlength="120" disabled />
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-featured-quote">Featured quote</label>
                    <textarea id="member-profile-featured-quote" rows="2" maxlength="280" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-contributions">Contributions to women’s leadership</label>
                    <textarea id="member-profile-contributions" rows="4" maxlength="1200" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-committee-involvement">Committee involvement</label>
                    <textarea id="member-profile-committee-involvement" rows="3" placeholder="One item per line" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-programme-involvement">Leadership programme involvement</label>
                    <textarea id="member-profile-programme-involvement" rows="3" placeholder="One item per line" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-achievements">Professional highlights and achievements</label>
                    <textarea id="member-profile-achievements" rows="4" placeholder="One item per line" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-expertise-tags">Expertise tags</label>
                    <textarea id="member-profile-expertise-tags" rows="3" placeholder="Comma-separated or one per line" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-speaking-topics">Speaking topics</label>
                    <textarea id="member-profile-speaking-topics" rows="3" placeholder="Comma-separated or one per line" disabled></textarea>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-gallery-items">Media links</label>
                    <textarea
                      id="member-profile-gallery-items"
                      rows="4"
                      placeholder="One item per line: Source Label | https://image-url | Caption"
                      disabled
                    ></textarea>
                    <p class="muted">Prefer Google Photos, LinkedIn, or another approved hosted image URL. The app stores the link and metadata rather than large original files.</p>
                  </div>
                  <div>
                    <label for="member-profile-visibility">Profile visibility</label>
                    <select id="member-profile-visibility" disabled>
                      <option value="private">Private</option>
                      <option value="admins_only">Admins only</option>
                      <option value="members_only">Members only</option>
                      <option value="submitted_for_public_review">Submitted for public review</option>
                      <option value="public_approved">Public approved</option>
                    </select>
                  </div>
                  <div>
                    <label for="member-profile-links-visibility">Links visibility</label>
                    <select id="member-profile-links-visibility" disabled>
                      <option value="private">Private</option>
                      <option value="admins_only">Admins only</option>
                      <option value="members_only">Members only</option>
                      <option value="submitted_for_public_review">Submitted for public review</option>
                      <option value="public_approved">Public approved</option>
                    </select>
                  </div>
                  <div class="field-span-full">
                    <label>Field visibility overrides</label>
                    <div class="sms-grid" id="member-profile-field-visibility-grid">
                      <div>
                        <label for="member-profile-visibility-full-name">Full name visibility</label>
                        <select id="member-profile-visibility-full-name" data-profile-field-visibility="fullName" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-company">Organisation visibility</label>
                        <select id="member-profile-visibility-company" data-profile-field-visibility="company" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-phone">Phone visibility</label>
                        <select id="member-profile-visibility-phone" data-profile-field-visibility="phone" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-business-title">Professional title visibility</label>
                        <select id="member-profile-visibility-business-title" data-profile-field-visibility="businessTitle" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-iwfsa-position">IWFSA position visibility</label>
                        <select id="member-profile-visibility-iwfsa-position" data-profile-field-visibility="iwfsaPosition" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-bio">Biography visibility</label>
                        <select id="member-profile-visibility-bio" data-profile-field-visibility="bio" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-linkedin-url">LinkedIn visibility</label>
                        <select id="member-profile-visibility-linkedin-url" data-profile-field-visibility="linkedinUrl" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-professional-links">Professional links visibility</label>
                        <select id="member-profile-visibility-professional-links" data-profile-field-visibility="professionalLinks" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-expertise">Expertise visibility</label>
                        <select id="member-profile-visibility-expertise" data-profile-field-visibility="expertiseFreeText" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-photo">Photo visibility</label>
                        <select id="member-profile-visibility-photo" data-profile-field-visibility="photo" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                      <div>
                        <label for="member-profile-visibility-birthday">Birthday visibility override</label>
                        <select id="member-profile-visibility-birthday" data-profile-field-visibility="birthday" disabled>
                          <option value="private">Private</option>
                          <option value="admins_only">Admins only</option>
                          <option value="members_only">Members only</option>
                          <option value="submitted_for_public_review">Submitted for public review</option>
                          <option value="public_approved">Public approved</option>
                        </select>
                      </div>
                    </div>
                    <p class="muted">Use the two selectors above as defaults, then override individual fields that need a different review or audience rule.</p>
                  </div>
                  <div class="field-span-full member-profile-privacy-grid">
                    <label>Directory privacy controls</label>
                    <label class="inline-checkbox" for="member-profile-show-email">
                      <input id="member-profile-show-email" type="checkbox" disabled />
                      Show email in the read-only member profile
                    </label>
                    <label class="inline-checkbox" for="member-profile-show-phone">
                      <input id="member-profile-show-phone" type="checkbox" disabled />
                      Show phone in the read-only member profile
                    </label>
                    <label class="inline-checkbox" for="member-profile-show-location">
                      <input id="member-profile-show-location" type="checkbox" checked disabled />
                      Show city / province / country
                    </label>
                    <label class="inline-checkbox" for="member-profile-show-linkedin">
                      <input id="member-profile-show-linkedin" type="checkbox" checked disabled />
                      Show LinkedIn and professional links
                    </label>
                    <label class="inline-checkbox" for="member-profile-show-gallery">
                      <input id="member-profile-show-gallery" type="checkbox" checked disabled />
                      Show linked media gallery to members
                    </label>
                    <label class="inline-checkbox" for="member-profile-show-highlights">
                      <input id="member-profile-show-highlights" type="checkbox" checked disabled />
                      Show professional highlights and leadership sections
                    </label>
                    <label class="inline-checkbox" for="member-profile-public-enabled">
                      <input id="member-profile-public-enabled" type="checkbox" checked disabled />
                      Enable my read-only profile in the directory
                    </label>
                  </div>
                  <div class="field-span-full">
                    <label for="member-profile-professional-links">Professional links</label>
                    <textarea
                      id="member-profile-professional-links"
                      rows="4"
                      placeholder="One link per line: Label | https://example.com"
                      disabled
                    ></textarea>
                    <p class="muted">Use one link per line. You can write Label | URL or just paste a URL.</p>
                  </div>
                  <div>
                    <label for="member-profile-birthday-visibility">Birthday visibility</label>
                    <select id="member-profile-birthday-visibility" disabled>
                      <option value="hidden">Hidden</option>
                      <option value="members_only">Members only</option>
                      <option value="members_and_social">Members and social</option>
                    </select>
                  </div>
                  <div>
                    <label for="member-profile-birthday-month">Birthday month</label>
                    <input id="member-profile-birthday-month" type="number" min="1" max="12" placeholder="MM" disabled />
                  </div>
                  <div>
                    <label for="member-profile-birthday-day">Birthday day</label>
                    <input id="member-profile-birthday-day" type="number" min="1" max="31" placeholder="DD" disabled />
                  </div>
                </div>
                <div class="member-actions">
                  <button id="member-profile-save" type="submit" disabled>Save Profile</button>
                  <button id="member-profile-clear-birthday" type="button" class="ghost" disabled>Clear birthday</button>
                  <a id="member-open-profile-gallery" class="button-link button-link-ghost" href="${config.appBaseUrl}/profiles?member=self">View My Public Profile</a>
                  <a id="member-open-directory-gallery" class="button-link button-link-ghost" href="${config.appBaseUrl}/profiles">Browse member profiles</a>
                </div>
                <p id="member-profile-status" class="muted">Sign in to edit your profile details and visibility.</p>
              </form>
            </div>
            <aside class="sidebar-card">
              <h3>Profile Photo</h3>
              <img id="member-photo-preview" class="member-photo-preview" alt="Member profile photo" hidden />
              <p id="member-photo-empty" class="muted">No profile photo uploaded yet.</p>
              <label for="member-photo-file">Choose image</label>
              <input id="member-photo-file" type="file" accept="image/*" disabled />
              <label for="member-photo-camera">Use camera</label>
              <input id="member-photo-camera" type="file" accept="image/*" capture="user" disabled />
              <label for="member-photo-url">Primary photo link</label>
              <input
                id="member-photo-url"
                type="url"
                maxlength="2048"
                placeholder="https://photos.google.com/... or LinkedIn image URL"
                disabled
              />
              <p class="muted">Use an https image link from Google Photos, LinkedIn, or another hosted source to keep the platform light.</p>
              <div class="member-actions">
                <button id="member-photo-upload" type="button" disabled>Upload photo</button>
                <button id="member-photo-link-save" type="button" disabled>Use linked photo</button>
                <button id="member-photo-remove" type="button" class="ghost" disabled>Remove photo</button>
              </div>
              <p id="member-photo-status" class="muted">Sign in to upload your photo.</p>
            </aside>
          </div>
        </section>
<section id="module-events" class="panel module-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Events</p>
                <h2>Create events and invite members</h2>
              </div>
              <p class="muted">Set up a meeting, choose the audience, and publish it so invited members receive the event notification.</p>
            </div>
            <div class="event-create-panel">
              <div class="event-create-intro">
                <p class="eyebrow">Member event setup</p>
                <h3>New member event</h3>
                <p class="muted">Member-created events are sent to active IWFSA members in good standing. Add individual invitees only when a smaller working group is needed.</p>
              </div>
              <form id="member-event-create-form" class="login-form member-event-create-form">
                <div class="sms-grid event-create-grid">
                  <div class="wide-field">
                    <label for="member-event-title">Event title</label>
                    <input id="member-event-title" name="title" required placeholder="e.g. Leadership roundtable" />
                  </div>
                  <div class="wide-field">
                    <label for="member-event-description">Description</label>
                    <textarea id="member-event-description" name="description" rows="3" placeholder="What should invited members know?"></textarea>
                  </div>
                  <div>
                    <label for="member-event-start">Start date and time</label>
                    <input id="member-event-start" name="startAt" type="datetime-local" required />
                  </div>
                  <div>
                    <label for="member-event-end">End date and time</label>
                    <input id="member-event-end" name="endAt" type="datetime-local" required />
                  </div>
                  <div>
                    <label for="member-event-venue-type">Venue type</label>
                    <select id="member-event-venue-type" name="venueType" required>
                      <option value="physical">Physical</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label for="member-event-venue-name">Venue or platform</label>
                    <input id="member-event-venue-name" name="venueName" placeholder="Boardroom, Teams, Zoom..." />
                  </div>
                  <div>
                    <label for="member-event-online-url">Online join link</label>
                    <input id="member-event-online-url" name="onlineJoinUrl" type="url" placeholder="https://..." />
                  </div>
                  <div>
                    <label for="member-event-host">Host or chairperson</label>
                    <input id="member-event-host" name="hostName" placeholder="Name of host" required />
                  </div>
                  <div>
                    <label for="member-event-capacity">Capacity</label>
                    <input id="member-event-capacity" name="capacity" type="number" min="0" value="0" required />
                  </div>
                  <div>
                    <label for="member-event-registration-close">Registration closes</label>
                    <input id="member-event-registration-close" name="registrationClosesAt" type="datetime-local" />
                  </div>
                  <div class="wide-field">
                    <label for="member-event-audience">Invite audience</label>
                    <select id="member-event-audience" name="audienceCode" required>
                      <option value="all_members">All Active IWFSA Members</option>
                    </select>
                  </div>
                  <div class="wide-field invitee-search-panel">
                    <div class="field-label-row">
                      <label for="member-event-invitee-search">Invite individual members</label>
                      <span
                        class="tooltip-help"
                        tabindex="0"
                        aria-label="Search by member name, email, organisation, or group. Choose a result to add that member to this event, or leave this blank to invite all active members."
                      >?</span>
                    </div>
                    <div class="invitee-search-row">
                      <input id="member-event-invitee-search" type="search" placeholder="Type a member name or email" autocomplete="off" />
                      <button id="member-event-invitee-clear" type="button" class="ghost">Clear selected</button>
                    </div>
                    <div id="member-event-invitee-results" class="invitee-results" aria-live="polite">
                      <p class="muted">Sign in to search the member directory.</p>
                    </div>
                    <div id="member-event-selected-invitees" class="invitee-selected-list" aria-live="polite"></div>
                  </div>
                  <div class="wide-field event-attachment-field">
                    <label for="member-event-attachment">Optional event file</label>
                    <input id="member-event-attachment" name="eventAttachment" type="file" accept=".pdf,.txt,application/pdf,text/plain" />
                    <p class="muted form-hint">Attach a PDF or text file to this event. Invitees can open it from the event details.</p>
                  </div>
                </div>
                <label class="inline-checkbox" for="member-event-publish-now">
                  <input id="member-event-publish-now" name="publishNow" type="checkbox" checked />
                  Publish immediately and send invitations to the selected audience
                </label>
                <div class="member-actions">
                  <button id="member-event-create-submit" type="submit" disabled>Create event and invite members</button>
                  <button id="member-event-create-reset" type="reset" class="ghost" disabled>Clear form</button>
                </div>
                <p id="member-event-create-status" class="muted">Sign in to create events.</p>
              </form>
            </div>
            <div class="member-actions event-list-toolbar">
              <label for="member-event-view" class="muted">Event window</label>
              <select id="member-event-view" disabled>
                <option value="">All</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <button id="member-refresh-events" type="button" disabled>Refresh events</button>
            </div>
            <div id="event-list" class="event-grid">
               <p class="muted">Sign in to load events.</p>
            </div>
        </section>
        <section id="module-birthdays" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Birthdays</p>
              <h2>Birthday Circle</h2>
            </div>
            <p class="muted">Celebrate members respectfully, with visibility controlled by consent choices.</p>
          </div>
          <div class="member-actions">
            <label for="birthday-window" class="muted">Window</label>
            <select id="birthday-window" disabled>
              <option value="7">7 days</option>
              <option value="14" selected>14 days</option>
              <option value="30">30 days</option>
            </select>
            <button id="refresh-birthdays" type="button" class="ghost" disabled>Refresh birthdays</button>
          </div>
          <div id="birthday-list" class="birthday-list">
            <p class="muted">Sign in to load birthdays.</p>
          </div>
        </section>

        <section id="module-notifications" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Alerts</p>
              <h2>Notification Center</h2>
            </div>
            <p class="muted">Stay current on schedule changes, reminders, and operational updates.</p>
          </div>
          <div class="member-actions">
            <button id="member-refresh-notifications" type="button" disabled>Refresh</button>
            <button id="member-mark-read" type="button" class="ghost" disabled>Mark all read</button>
          </div>
          <div id="notification-list" class="event-grid">
            <p class="muted">Sign in to load notifications.</p>
          </div>
        </section>

        <section id="module-sms" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SMS Settings</p>
              <h2>Control how urgent texts reach you</h2>
            </div>
            <p class="muted">Choose opt-in status, delivery limits, and quiet hours that fit your schedule.</p>
          </div>
          <form id="member-sms-form" class="login-form sms-form">
            <label class="inline-checkbox" for="member-sms-enabled">
              <input id="member-sms-enabled" type="checkbox" />
              Enable SMS reminders
            </label>
            <label for="member-sms-phone">Phone number</label>
            <input id="member-sms-phone" type="tel" placeholder="+27..." />
            <div class="sms-grid">
              <div>
                <label for="member-sms-daily-limit">Daily limit</label>
                <input id="member-sms-daily-limit" type="number" min="1" max="10" />
              </div>
              <div>
                <label for="member-sms-per-event-limit">Per-event limit</label>
                <input id="member-sms-per-event-limit" type="number" min="1" max="5" />
              </div>
              <div>
                <label for="member-sms-quiet-start">Quiet hours start</label>
                <input id="member-sms-quiet-start" type="time" />
              </div>
              <div>
                <label for="member-sms-quiet-end">Quiet hours end</label>
                <input id="member-sms-quiet-end" type="time" />
              </div>
            </div>
            <label class="inline-checkbox" for="member-sms-allow-urgent">
              <input id="member-sms-allow-urgent" type="checkbox" />
              Allow urgent SMS outside quiet hours
            </label>
            <p id="member-sms-limits" class="muted">Sign in to load SMS policy guidance.</p>
            <button id="member-sms-save" type="submit" disabled>Save SMS Settings</button>
            <p id="member-sms-status" class="muted">Sign in to manage SMS preferences.</p>
          </form>
        </section>

        <section id="module-celebrations" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Celebration Thread</p>
              <h2>Share approved messages for birthdays and milestones</h2>
            </div>
            <p class="muted">Use the shared thread for respectful, relevant posts that support the IWFSA community.</p>
          </div>
          <div class="member-layout celebration-layout">
            <div class="main-column">
              <form id="celebration-form" class="login-form celebration-form">
                <label for="celebration-body">New celebration post</label>
                <textarea id="celebration-body" rows="5" class="registration-draft-input" placeholder="Write a short, relevant celebration message..."></textarea>
                <div class="celebration-confirmations" aria-label="Celebration posting confirmations">
                  <label class="inline-checkbox" for="celebration-acknowledge">
                    <input id="celebration-acknowledge" type="checkbox" />
                    <span>I acknowledge the community posting rules</span>
                  </label>
                  <label class="inline-checkbox" for="celebration-relevant">
                    <input id="celebration-relevant" type="checkbox" />
                    <span>This post is directly relevant to IWFSA activity</span>
                  </label>
                </div>
                <button id="celebration-submit" type="submit" disabled>Post to Celebration Thread</button>
                <p id="celebration-status" class="muted">Sign in to load the shared thread.</p>
              </form>
              <div id="celebration-list" class="thread-list">
                <p class="muted">Sign in to load celebration posts.</p>
              </div>
            </div>
            <aside class="sidebar-card">
              <h3>Posting rules</h3>
              <ul id="celebration-rules" class="status-list">
                <li>Sign in to load moderation rules.</li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
      <script>
        const container = document.getElementById("event-list");
        const birthdayList = document.getElementById("birthday-list");
        const notificationList = document.getElementById("notification-list");
        const memberInviteList = document.getElementById("member-invite-list");
        const memberNewsList = document.getElementById("member-news-list");
        const memberDashboardBirthdays = document.getElementById("member-dashboard-birthdays");
        const memberHomeStatus = document.getElementById("member-home-status");
        const refreshHomeButton = document.getElementById("member-refresh-home");
        const memberNav = document.getElementById("member-nav");
        const loginStatus = document.getElementById("member-login-status");
        const birthdayPanel = document.getElementById("member-birthday-panel");
        const viewSelect = document.getElementById("member-event-view");
        const refreshEventsButton = document.getElementById("member-refresh-events");
        const memberEventCreateForm = document.getElementById("member-event-create-form");
        const memberEventCreateSubmitButton = document.getElementById("member-event-create-submit");
        const memberEventCreateResetButton = document.getElementById("member-event-create-reset");
        const memberEventCreateStatus = document.getElementById("member-event-create-status");
        const memberEventTitleInput = document.getElementById("member-event-title");
        const memberEventStartInput = document.getElementById("member-event-start");
        const memberEventEndInput = document.getElementById("member-event-end");
        const memberEventVenueTypeInput = document.getElementById("member-event-venue-type");
        const memberEventHostInput = document.getElementById("member-event-host");
        const memberEventCapacityInput = document.getElementById("member-event-capacity");
        const memberEventOnlineUrlInput = document.getElementById("member-event-online-url");
        const memberEventAudienceInput = document.getElementById("member-event-audience");
        const memberEventPublishNowInput = document.getElementById("member-event-publish-now");
        const memberEventInviteeSearchInput = document.getElementById("member-event-invitee-search");
        const memberEventInviteeResults = document.getElementById("member-event-invitee-results");
        const memberEventSelectedInvitees = document.getElementById("member-event-selected-invitees");
        const memberEventInviteeClearButton = document.getElementById("member-event-invitee-clear");
        const memberEventAttachmentInput = document.getElementById("member-event-attachment");
        const birthdayWindowSelect = document.getElementById("birthday-window");
        const refreshBirthdaysButton = document.getElementById("refresh-birthdays");
        const refreshNotificationsButton = document.getElementById("member-refresh-notifications");
        const markNotificationsReadButton = document.getElementById("member-mark-read");
        const smsForm = document.getElementById("member-sms-form");
        const smsEnabledInput = document.getElementById("member-sms-enabled");
        const smsPhoneInput = document.getElementById("member-sms-phone");
        const smsDailyLimitInput = document.getElementById("member-sms-daily-limit");
        const smsPerEventLimitInput = document.getElementById("member-sms-per-event-limit");
        const smsQuietStartInput = document.getElementById("member-sms-quiet-start");
        const smsQuietEndInput = document.getElementById("member-sms-quiet-end");
        const smsAllowUrgentInput = document.getElementById("member-sms-allow-urgent");
        const smsLimits = document.getElementById("member-sms-limits");
        const smsStatus = document.getElementById("member-sms-status");
        const smsSaveButton = document.getElementById("member-sms-save");
        const profileForm = document.getElementById("member-profile-form");
        const profileUsernameInput = document.getElementById("member-profile-username");
        const profileEmailInput = document.getElementById("member-profile-email");
        const profileFullNameInput = document.getElementById("member-profile-full-name");
        const profileCompanyInput = document.getElementById("member-profile-company");
        const profilePhoneInput = document.getElementById("member-profile-phone");
        const profileBusinessTitleInput = document.getElementById("member-profile-business-title");
        const profileIwfsaPositionInput = document.getElementById("member-profile-iwfsa-position");
        const profileBioInput = document.getElementById("member-profile-bio");
        const profileExpertiseInput = document.getElementById("member-profile-expertise");
        const profileLinkedinUrlInput = document.getElementById("member-profile-linkedin-url");
        const profilePreferredNameInput = document.getElementById("member-profile-preferred-name");
        const profileTitleInput = document.getElementById("member-profile-title");
        const profileHeadlineInput = document.getElementById("member-profile-headline");
        const profileSectorInput = document.getElementById("member-profile-sector");
        const profileCurrentRoleTitleInput = document.getElementById("member-profile-current-role-title");
        const profileCityInput = document.getElementById("member-profile-city");
        const profileProvinceInput = document.getElementById("member-profile-province");
        const profileCountryInput = document.getElementById("member-profile-country");
        const profileWebsiteInput = document.getElementById("member-profile-website");
        const profileMentorshipRoleInput = document.getElementById("member-profile-mentorship-role");
        const profileBoardStatusInput = document.getElementById("member-profile-board-status");
        const profileFeaturedQuoteInput = document.getElementById("member-profile-featured-quote");
        const profileContributionsInput = document.getElementById("member-profile-contributions");
        const profileCommitteeInput = document.getElementById("member-profile-committee-involvement");
        const profileProgrammeInput = document.getElementById("member-profile-programme-involvement");
        const profileAchievementsInput = document.getElementById("member-profile-achievements");
        const profileExpertiseTagsInput = document.getElementById("member-profile-expertise-tags");
        const profileSpeakingTopicsInput = document.getElementById("member-profile-speaking-topics");
        const profileGalleryItemsInput = document.getElementById("member-profile-gallery-items");
        const profileVisibilityInput = document.getElementById("member-profile-visibility");
        const profileLinksVisibilityInput = document.getElementById("member-profile-links-visibility");
        const profileFieldVisibilityInputs = Array.from(document.querySelectorAll("[data-profile-field-visibility]"));
        const profileProfessionalLinksInput = document.getElementById("member-profile-professional-links");
        const profileShowEmailInput = document.getElementById("member-profile-show-email");
        const profileShowPhoneInput = document.getElementById("member-profile-show-phone");
        const profileShowLocationInput = document.getElementById("member-profile-show-location");
        const profileShowLinkedinInput = document.getElementById("member-profile-show-linkedin");
        const profileShowGalleryInput = document.getElementById("member-profile-show-gallery");
        const profileShowHighlightsInput = document.getElementById("member-profile-show-highlights");
        const profilePublicEnabledInput = document.getElementById("member-profile-public-enabled");
        const profileBirthdayVisibilityInput = document.getElementById("member-profile-birthday-visibility");
        const profileBirthdayMonthInput = document.getElementById("member-profile-birthday-month");
        const profileBirthdayDayInput = document.getElementById("member-profile-birthday-day");
        const profileSaveButton = document.getElementById("member-profile-save");
        const profileClearBirthdayButton = document.getElementById("member-profile-clear-birthday");
        const profileStatus = document.getElementById("member-profile-status");
        const memberPhotoPreview = document.getElementById("member-photo-preview");
        const memberPhotoEmpty = document.getElementById("member-photo-empty");
        const memberPhotoFileInput = document.getElementById("member-photo-file");
        const memberPhotoCameraInput = document.getElementById("member-photo-camera");
        const memberPhotoUrlInput = document.getElementById("member-photo-url");
        const memberPhotoUploadButton = document.getElementById("member-photo-upload");
        const memberPhotoLinkSaveButton = document.getElementById("member-photo-link-save");
        const memberPhotoRemoveButton = document.getElementById("member-photo-remove");
        const memberPhotoStatus = document.getElementById("member-photo-status");
        const celebrationForm = document.getElementById("celebration-form");
        const celebrationBodyInput = document.getElementById("celebration-body");
        const celebrationAcknowledgeInput = document.getElementById("celebration-acknowledge");
        const celebrationRelevantInput = document.getElementById("celebration-relevant");
        const celebrationList = document.getElementById("celebration-list");
        const celebrationRules = document.getElementById("celebration-rules");
        const celebrationStatus = document.getElementById("celebration-status");
        const memberSessionBar = document.getElementById("member-session-bar");
        const memberSessionSummary = document.getElementById("member-session-summary");
        const draftAutosaveTimers = new Map();
        const localDraftOverrides = new Map();
        let serverSkewMs = 0;
        let currentEvents = [];
        let memberInviteDirectory = [];
        const selectedMemberEventInvitees = new Map();
        const MEMBER_SIGN_IN_URL = "${config.appBaseUrl}/sign-in";

        function showMemberModule(moduleName, { scroll = false } = {}) {
          const nextModule = ["dashboard", "events", "profile", "birthdays", "notifications", "sms", "celebrations"].includes(moduleName)
            ? moduleName
            : "dashboard";
          if (window.location.hash.substring(1) !== nextModule) {
            window.location.hash = "#" + nextModule;
          }
          handleHashChange();
          if (scroll) {
            const target = document.getElementById("module-" + nextModule) || memberSessionBar;
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }

        function handleHashChange() {
           if (!getToken()) {
              document.querySelectorAll('.module-nav-link').forEach(link => {
                 link.classList.remove('active');
              });
              document.querySelectorAll('.module-section').forEach(section => {
                 section.classList.remove('active');
              });
              return;
           }
           const hash = window.location.hash.substring(1) || "dashboard";
           let activeModule = hash;
           if (!["dashboard", "events", "profile", "birthdays", "notifications", "sms", "celebrations"].includes(activeModule)) {
              activeModule = 'dashboard';
           }

           document.querySelectorAll('.module-nav-link').forEach(link => {
              link.classList.toggle('active', link.getAttribute('data-module') === activeModule);
           });

           document.querySelectorAll('.module-section').forEach(section => {
              section.classList.toggle('active', section.id === 'module-' + activeModule);
           });
        }
        
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Init

        function getToken() {
          return sessionStorage.getItem("iwfsa_token");
        }

        function formatRoleLabel(role) {
          const normalized = String(role || "").trim().toLowerCase();
          const labels = {
            member: "Member",
            event_editor: "Event Editor",
            admin: "Admin",
            chief_admin: "Chief Admin"
          };
          return labels[normalized] || "Member";
        }

        let memberUsername = sessionStorage.getItem("iwfsa_member_username") || "";
        let memberRole = sessionStorage.getItem("iwfsa_member_role") || "member";

        function formatMemberSessionSummary() {
          return "Signed in as " + (memberUsername || "member") + " (" + formatRoleLabel(memberRole) + ").";
        }

        function setToken(token, username = "", role = "member") {
          if (token) {
            sessionStorage.setItem("iwfsa_token", token);
            memberUsername = String(username || memberUsername || "").trim();
            memberRole = String(role || memberRole || "member").trim() || "member";
            if (memberUsername) {
              sessionStorage.setItem("iwfsa_member_username", memberUsername);
            } else {
              sessionStorage.removeItem("iwfsa_member_username");
            }
            sessionStorage.setItem("iwfsa_member_role", memberRole);
          } else {
            sessionStorage.removeItem("iwfsa_token");
            sessionStorage.removeItem("iwfsa_member_username");
            sessionStorage.removeItem("iwfsa_member_role");
            memberUsername = "";
            memberRole = "member";
          }
        }

        function setSignedInState(isSignedIn) {
          document.body.classList.toggle("member-signed-in", isSignedIn);
          document.querySelectorAll(".session-nav-signout").forEach((button) => {
            button.hidden = !isSignedIn;
          });
          if (birthdayPanel) {
            birthdayPanel.hidden = !isSignedIn;
          }
          if (memberNav) {
            memberNav.hidden = !isSignedIn;
          }
          if (memberSessionBar) {
            memberSessionBar.hidden = !isSignedIn;
          }
          if (memberSessionSummary) {
            memberSessionSummary.textContent = isSignedIn ? formatMemberSessionSummary() : "Not signed in.";
          }

          viewSelect.disabled = !isSignedIn;
          refreshEventsButton.disabled = !isSignedIn;
          refreshHomeButton.disabled = !isSignedIn;
          if (memberEventCreateForm) {
            Array.from(memberEventCreateForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !isSignedIn);
              }
            });
          }
          if (memberEventCreateStatus && !isSignedIn) {
            memberEventCreateStatus.textContent = "Sign in to create events.";
          }
          birthdayWindowSelect.disabled = !isSignedIn;
          refreshBirthdaysButton.disabled = !isSignedIn;
          refreshNotificationsButton.disabled = !isSignedIn;
          markNotificationsReadButton.disabled = !isSignedIn;
          smsSaveButton.disabled = !isSignedIn;
          profileSaveButton.disabled = !isSignedIn;
          profileClearBirthdayButton.disabled = !isSignedIn;
          memberPhotoUploadButton.disabled = !isSignedIn;
          memberPhotoLinkSaveButton.disabled = !isSignedIn;
          memberPhotoRemoveButton.disabled = !isSignedIn;

          Array.from(smsForm?.elements || []).forEach((element) => {
            if (element !== smsSaveButton && element instanceof HTMLElement) {
              element.toggleAttribute("disabled", !isSignedIn);
            }
          });
          Array.from(profileForm?.elements || []).forEach((element) => {
            if (
              element !== profileUsernameInput &&
              element !== profileEmailInput &&
              element !== profileSaveButton &&
              element !== profileClearBirthdayButton &&
              element instanceof HTMLElement
            ) {
              element.toggleAttribute("disabled", !isSignedIn);
            }
          });
          Array.from(celebrationForm?.elements || []).forEach((element) => {
            if (element instanceof HTMLElement) {
              element.toggleAttribute("disabled", !isSignedIn);
            }
          });

          if (memberPhotoFileInput) {
            memberPhotoFileInput.toggleAttribute("disabled", !isSignedIn);
          }
          if (memberPhotoCameraInput) {
            memberPhotoCameraInput.toggleAttribute("disabled", !isSignedIn);
          }
          if (memberPhotoUrlInput) {
            memberPhotoUrlInput.toggleAttribute("disabled", !isSignedIn);
          }

          if (!isSignedIn) {
            document.querySelectorAll('.module-section').forEach(section => {
              section.classList.remove('active');
            });
            document.querySelectorAll('.module-nav-link').forEach(link => {
              link.classList.remove('active');
            });
            memberHomeStatus.textContent = "Sign in to load invitations and news.";
            profileStatus.textContent = "Sign in to edit your profile details and visibility.";
            memberPhotoStatus.textContent = "Sign in to upload your photo.";
          }
        }

        function redirectToUnifiedSignIn(message = "Please sign in to continue.") {
          if (loginStatus) {
            loginStatus.textContent = message;
          }
          window.location.replace(MEMBER_SIGN_IN_URL);
        }

        function nowWithServerSkew() {
          return Date.now() + serverSkewMs;
        }

        function escapeClientHtml(value) {
          return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function normalizeDisplayText(value) {
          const text = String(value || "").trim();
          if (!text) {
            return "";
          }
          const longDashPrefix = String.fromCharCode(195, 162, 226, 8218, 172, 226, 8364);
          const shortPrefix = String.fromCharCode(226, 8364);
          return text
            .replaceAll(longDashPrefix + String.fromCharCode(156), "-")
            .replaceAll(longDashPrefix + String.fromCharCode(157), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8220), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8221), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8482), "'")
            .replaceAll(shortPrefix + String.fromCharCode(732), "'")
            .replaceAll(shortPrefix + String.fromCharCode(339), '"')
            .replaceAll(shortPrefix + String.fromCharCode(157), '"')
            .replaceAll(shortPrefix + String.fromCharCode(166), "...")
            .replace(/\\s+/g, " ")
            .trim();
        }

        function isMissingDisplayText(value) {
          const normalized = normalizeDisplayText(value);
          return !normalized || ["-", "--", "n/a", "na", "null", "undefined"].includes(normalized.toLowerCase());
        }

        function displayTextHtml(value, missingHtml = "<span class='muted'>&mdash;</span>") {
          const normalized = normalizeDisplayText(value);
          return isMissingDisplayText(normalized) ? missingHtml : escapeClientHtml(normalized);
        }

        function memberInviteeId(member) {
          const id = Number(member?.userId || member?.id || 0);
          return Number.isInteger(id) && id > 0 ? id : 0;
        }

        function memberInviteeLabel(member) {
          return String(member?.fullName || member?.username || member?.email || "Member").trim();
        }

        function selectedMemberInviteeIds() {
          return Array.from(selectedMemberEventInvitees.keys()).filter((id) => Number.isInteger(id) && id > 0);
        }

        function renderMemberEventInviteeSelections() {
          if (!memberEventSelectedInvitees) return;
          const selected = Array.from(selectedMemberEventInvitees.values());
          if (selected.length === 0) {
            memberEventSelectedInvitees.innerHTML = "<p class='muted'>No individual members selected yet.</p>";
            return;
          }
          memberEventSelectedInvitees.innerHTML = selected
            .map((member) => {
              const id = memberInviteeId(member);
              const label = memberInviteeLabel(member);
              const detail = member.email ? "<span>" + escapeClientHtml(member.email) + "</span>" : "";
              return (
                "<span class='invitee-chip'>" +
                "<span><strong>" + escapeClientHtml(label) + "</strong>" + detail + "</span>" +
                "<button type='button' data-remove-member-invitee='" + id + "' aria-label='Remove " + escapeClientHtml(label) + "'>Remove</button>" +
                "</span>"
              );
            })
            .join("");
        }

        function renderMemberEventInviteeResults(term = "") {
          if (!memberEventInviteeResults) return;
          const query = String(term || memberEventInviteeSearchInput?.value || "").trim().toLowerCase();
          const source = Array.isArray(memberInviteDirectory) ? memberInviteDirectory : [];
          if (source.length === 0) {
            memberEventInviteeResults.innerHTML = getToken()
              ? "<p class='muted'>No active members are available to invite yet.</p>"
              : "<p class='muted'>Sign in to search the member directory.</p>";
            return;
          }
          if (!query) {
            memberEventInviteeResults.innerHTML = "<p class='muted'>Use the help icon above for search tips, then choose a matching member from the results.</p>";
            return;
          }
          const matches = source
            .filter((member) => {
              const id = memberInviteeId(member);
              if (!id || selectedMemberEventInvitees.has(id)) return false;
              const haystack = [member.fullName, member.username, member.email, member.organisation, ...(Array.isArray(member.groups) ? member.groups : [])]
                .map((value) => normalizeDisplayText(value).toLowerCase())
                .join(" ");
              return haystack.includes(query);
            })
            .slice(0, 8);
          if (matches.length === 0) {
            memberEventInviteeResults.innerHTML = "<p class='muted'>No matching active members found.</p>";
            return;
          }
          memberEventInviteeResults.innerHTML = matches
            .map((member) => {
              const id = memberInviteeId(member);
              const label = memberInviteeLabel(member);
              const detailParts = [member.email, member.organisation]
                .map((value) => normalizeDisplayText(value))
                .filter((value) => !isMissingDisplayText(value))
                .join(" | ");
              return (
                "<button type='button' class='invitee-result' data-add-member-invitee='" + id + "'>" +
                "<strong>" + escapeClientHtml(label) + "</strong>" +
                (detailParts ? "<span>" + escapeClientHtml(detailParts) + "</span>" : "") +
                "</button>"
              );
            })
            .join("");
        }

        async function loadMemberInviteDirectory() {
          const token = getToken();
          if (!token) {
            memberInviteDirectory = [];
            renderMemberEventInviteeResults();
            return;
          }
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/directory?limit=150", {
              headers: { Authorization: "Bearer " + token }
            });
            const json = await response.json();
            if (!response.ok) {
              memberInviteDirectory = [];
              renderMemberEventInviteeResults();
              return;
            }
            memberInviteDirectory = Array.isArray(json.items) ? json.items : [];
            renderMemberEventInviteeResults();
            renderMemberEventInviteeSelections();
          } catch {
            memberInviteDirectory = [];
            renderMemberEventInviteeResults();
          }
        }

        function resetMemberEventInviteePicker() {
          selectedMemberEventInvitees.clear();
          if (memberEventInviteeSearchInput) {
            memberEventInviteeSearchInput.value = "";
          }
          renderMemberEventInviteeResults();
          renderMemberEventInviteeSelections();
        }

        async function uploadMemberEventAttachment(eventId, file, token) {
          if (!file) return null;
          const formData = new FormData();
          formData.set("documentType", "attachment");
          formData.set("availabilityMode", "immediate");
          formData.set("memberAccessScope", "all_visible");
          formData.set("publishNow", "true");
          formData.set("file", file, file.name || "event-attachment.txt");
          const response = await fetch("${config.apiBaseUrl}/api/events/" + String(eventId) + "/documents", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
          });
          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.message || "The event was created, but the attachment could not be uploaded.");
          }
          return json.item || null;
        }


        function ordinalSuffix(day) {
          const j = day % 10;
          const k = day % 100;
          if (j === 1 && k !== 11) return "st";
          if (j === 2 && k !== 12) return "nd";
          if (j === 3 && k !== 13) return "rd";
          return "th";
        }

        function formatEventDateTime(value) {
          if (!value) return "";
          const date = new Date(value);
          if (!Number.isFinite(date.getTime())) return "";

          const day = date.getDate();
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          const month = monthNames[date.getMonth()] || "";
          const year = date.getFullYear();

          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours24 >= 12 ? "pm" : "am";
          let hours12 = hours24 % 12;
          if (hours12 === 0) hours12 = 12;
          const minuteLabel = String(minutes).padStart(2, "0");

          return (
            String(day) +
            ordinalSuffix(day) +
            " " +
            month +
            " " +
            year +
            ", " +
            String(hours12) +
            ":" +
            minuteLabel +
            ampm
          );
        }

        function toIsoStringFromMemberLocalInput(value) {
          const raw = String(value || "").trim();
          if (!raw) return "";
          const date = new Date(raw);
          if (!Number.isFinite(date.getTime())) return "";
          return date.toISOString();
        }

        function formatMemberDateTimeLocal(date = new Date()) {
          const pad = (value) => String(value).padStart(2, "0");
          return (
            String(date.getFullYear()) +
            "-" +
            pad(date.getMonth() + 1) +
            "-" +
            pad(date.getDate()) +
            "T" +
            pad(date.getHours()) +
            ":" +
            pad(date.getMinutes())
          );
        }

        function setMemberEventStartDefault() {
          if (!memberEventStartInput) return;
          memberEventStartInput.value = formatMemberDateTimeLocal(new Date());
        }

        function clearMemberEventCreateErrors() {
          [
            memberEventTitleInput,
            memberEventStartInput,
            memberEventEndInput,
            memberEventVenueTypeInput,
            memberEventHostInput,
            memberEventCapacityInput,
            memberEventOnlineUrlInput,
            memberEventAudienceInput
          ].forEach((input) => {
            if (!input) return;
            input.classList.remove("field-error");
            input.removeAttribute("aria-invalid");
          });
        }

        function markMemberEventCreateError(input) {
          if (!input) return;
          input.classList.add("field-error");
          input.setAttribute("aria-invalid", "true");
        }

        function buildMemberEventCreatePayload(formData) {
          clearMemberEventCreateErrors();
          const title = String(formData.get("title") || "").trim();
          const description = String(formData.get("description") || "").trim();
          const startAt = toIsoStringFromMemberLocalInput(formData.get("startAt"));
          const endAt = toIsoStringFromMemberLocalInput(formData.get("endAt"));
          const venueType = String(formData.get("venueType") || "physical").trim() || "physical";
          const venueName = String(formData.get("venueName") || "").trim();
          const onlineJoinUrl = String(formData.get("onlineJoinUrl") || "").trim();
          const hostName = String(formData.get("hostName") || "").trim();
          const capacity = Number(formData.get("capacity") || 0);
          const registrationClosesAt = toIsoStringFromMemberLocalInput(formData.get("registrationClosesAt"));
          const audienceCode = "all_members";
          const inviteeUserIds = selectedMemberInviteeIds();
          const targetAudienceType = inviteeUserIds.length > 0 && audienceCode === "all_members" ? "groups" : "";
          const errors = [];

          if (!title) {
            markMemberEventCreateError(memberEventTitleInput);
            errors.push("Event title is required.");
          }
          if (!startAt) {
            markMemberEventCreateError(memberEventStartInput);
            errors.push("Start date and time is required.");
          }
          if (!endAt) {
            markMemberEventCreateError(memberEventEndInput);
            errors.push("End date and time is required.");
          }
          if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
            markMemberEventCreateError(memberEventStartInput);
            markMemberEventCreateError(memberEventEndInput);
            errors.push("End date and time must be later than the start date and time.");
          }
          if (!venueType) {
            markMemberEventCreateError(memberEventVenueTypeInput);
            errors.push("Venue type is required.");
          }
          if (!hostName) {
            markMemberEventCreateError(memberEventHostInput);
            errors.push("Host or chairperson is required.");
          }
          if (!Number.isFinite(capacity) || capacity < 0) {
            markMemberEventCreateError(memberEventCapacityInput);
            errors.push("Capacity must be 0 or greater.");
          }
          if (onlineJoinUrl && !onlineJoinUrl.toLowerCase().startsWith("http://") && !onlineJoinUrl.toLowerCase().startsWith("https://")) {
            markMemberEventCreateError(memberEventOnlineUrlInput);
            errors.push("Online join link must start with http:// or https://.");
          }
          if (errors.length > 0) {
            return { error: errors[0] };
          }

          return {
            payload: {
              title,
              description,
              startAt,
              endAt,
              venueType,
              venueName,
              onlineProvider: venueType === "online" && venueName ? venueName : "",
              onlineJoinUrl,
              hostName,
              capacity,
              registrationClosesAt,
              audienceCode,
              inviteeUserIds,
              ...(targetAudienceType ? { audienceType: targetAudienceType } : {})
            }
          };
        }
        function initialsFromName(fullName) {
          const parts = String(fullName || "")
            .trim()
            .split(/\\s+/)
            .filter(Boolean);
          if (parts.length === 0) return "?";
          const first = parts[0][0] ? parts[0][0].toUpperCase() : "?";
          const second = parts.length > 1 && parts[1][0] ? parts[1][0].toUpperCase() : "";
          return (first + second).slice(0, 2);
        }

        function formatBirthdayLabel(occursOn) {
          if (!occursOn) return "";
          const date = new Date(String(occursOn) + "T00:00:00Z");
          if (!Number.isFinite(date.getTime())) return "";
          return date.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
        }

        function formatRelativeTime(value) {
          const timestampMs = Date.parse(String(value || ""));
          if (!Number.isFinite(timestampMs)) {
            return "just now";
          }
          const deltaMs = Date.now() - timestampMs;
          const deltaMinutes = Math.round(Math.abs(deltaMs) / (60 * 1000));
          if (deltaMinutes < 60) {
            return deltaMs >= 0 ? deltaMinutes + "m ago" : "in " + deltaMinutes + "m";
          }
          const deltaHours = Math.round(deltaMinutes / 60);
          if (deltaHours < 48) {
            return deltaMs >= 0 ? deltaHours + "h ago" : "in " + deltaHours + "h";
          }
          const deltaDays = Math.round(deltaHours / 24);
          return deltaMs >= 0 ? deltaDays + "d ago" : "in " + deltaDays + "d";
        }

        function formatInvitationStatusLabel(status) {
          const normalized = String(status || "").trim().toLowerCase();
          if (normalized === "confirmed") return "Confirmed";
          if (normalized === "waitlisted") return "Waitlisted";
          if (normalized === "declined") return "Declined";
          return "Awaiting response";
        }

        function renderMemberHomeBirthdays(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            memberDashboardBirthdays.innerHTML = "<p class='muted'>No birthdays in the next 30 days.</p>";
            return;
          }
          memberDashboardBirthdays.innerHTML = rows
            .map((item) => {
              const label = escapeClientHtml(formatBirthdayLabel(item.occursOn));
              const name = escapeClientHtml(item.fullName || "Member");
              return (
                "<div class='birthday-item'>" +
                "<div class='iwfsa-watermark'>IWFSA</div>" +
                "<div class='avatar avatar-fallback' aria-hidden='true'>" +
                escapeClientHtml(initialsFromName(item.fullName)) +
                "</div>" +
                "<div class='birthday-meta'>" +
                "<div class='birthday-name'>" +
                name +
                "</div>" +
                "<div class='birthday-date'>" +
                label +
                "</div>" +
                "</div>" +
                "</div>"
              );
            })
            .join("");
        }

        function renderMemberInvites(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            memberInviteList.innerHTML = "<p class='muted'>No current invitations.</p>";
            return;
          }

          memberInviteList.innerHTML = rows
            .map((item) => {
              const status = formatInvitationStatusLabel(item.invitationStatus);
              const startLabel = escapeClientHtml(formatEventDateTime(item.startAt));
              const venueLabel = [item.venueType === "online" ? "Online" : "Physical", item.venueName, item.venueAddress]
                .filter(Boolean)
                .join(" - ");
              const joinLink = item.onlineJoinUrl
                ? "<p><strong>Join:</strong> <a target='_blank' rel='noreferrer' href='" +
                  escapeClientHtml(item.onlineJoinUrl) +
                  "'>Open meeting link</a></p>"
                : "";
              return (
                "<article class='event-card'>" +
                "<h3>" +
                escapeClientHtml(item.title || "Event") +
                "</h3>" +
                "<p><strong>Status:</strong> " +
                escapeClientHtml(status) +
                "</p>" +
                "<p><strong>Starts:</strong> " +
                startLabel +
                "</p>" +
                "<p><strong>Audience:</strong> " +
                escapeClientHtml(item.audienceLabel || "All Active IWFSA Members") +
                "</p>" +
                "<p><strong>Venue:</strong> " +
                escapeClientHtml(venueLabel || "TBA") +
                "</p>" +
                joinLink +
                "<div class='member-actions'>" +
                "<a class='button-link button-link-ghost' href='#events'>Open in Events</a>" +
                "</div>" +
                "</article>"
              );
            })
            .join("");
        }

        function renderMemberNews(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            memberNewsList.innerHTML = "<p class='muted'>No organisation updates yet.</p>";
            return;
          }

          memberNewsList.innerHTML = rows
            .map((item) => {
              const isPinned = Boolean(item && item.isPinned);
              const pinnedBadge = isPinned
                ? "<span class='member-news-pin' aria-label='Pinned update'>Pinned</span>"
                : "";
              return (
                "<article class='thread-item'>" +
                "<div class='thread-item-head'>" +
                "<div>" +
                "<strong>" +
                escapeClientHtml(item.title || "IWFSA Update") +
                "</strong>" +
                "<p class='muted'>" +
                escapeClientHtml(formatRelativeTime(item.createdAt)) +
                "</p>" +
                "</div>" +
                pinnedBadge +
                "</div>" +
                "<p>" +
                escapeClientHtml(item.body || "") +
                "</p>" +
                "</article>"
              );
            })
            .join("");
        }

        async function loadMemberHome() {
          const token = getToken();
          if (!token) {
            memberInviteList.innerHTML = "<p class='muted'>Sign in to view your event invitations.</p>";
            memberNewsList.innerHTML = "<p class='muted'>Sign in to view relevant IWFSA news.</p>";
            memberDashboardBirthdays.innerHTML = "<p class='muted'>Sign in to load birthday highlights.</p>";
            memberHomeStatus.textContent = "Sign in to load invitations and news.";
            return;
          }

          memberHomeStatus.textContent = "Loading member home...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/home", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              memberHomeStatus.textContent = payload.message || "Unable to load member home.";
              return;
            }
            renderMemberInvites(payload.invites?.items || []);
            renderMemberNews(payload.news?.items || []);
            renderMemberHomeBirthdays(payload.birthdays?.items || []);
            memberHomeStatus.textContent =
              "Invites: " +
              String(payload.invites?.total || 0) +
              " | Awaiting response: " +
              String(payload.invites?.awaitingResponse || 0);
          } catch {
            memberHomeStatus.textContent = "Unable to reach API for member home.";
          }
        }

        function setMemberPhotoPreview(photoUrl) {
          const hasPhoto = Boolean(photoUrl);
          memberPhotoPreview.hidden = !hasPhoto;
          memberPhotoEmpty.hidden = hasPhoto;
          if (hasPhoto) {
            memberPhotoPreview.src = String(photoUrl);
          } else {
            memberPhotoPreview.removeAttribute("src");
          }
        }

        function formatProfessionalLinksText(links) {
          if (!Array.isArray(links) || links.length === 0) {
            return "";
          }
          return links
            .map((item) => {
              const label = String(item?.label || "").trim();
              const url = String(item?.url || "").trim();
              if (!url) {
                return "";
              }
              return label ? label + " | " + url : url;
            })
            .filter(Boolean)
            .join("\\n");
        }

        function parseProfessionalLinksText(value) {
          function looksLikeHttpUrl(input) {
            const normalized = String(input || "").trim().toLowerCase();
            return normalized.startsWith("http://") || normalized.startsWith("https://");
          }

          const lines = String(value || "")
            .split(/\\r?\\n/)
            .map((line) => line.trim())
            .filter(Boolean);
          const items = [];
          for (const line of lines) {
            const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
            if (parts.length === 0) {
              continue;
            }
            if (parts.length === 1) {
              if (!looksLikeHttpUrl(parts[0])) {
                throw new Error("Professional links must be a URL or Label | URL.");
              }
              items.push({ label: "Link", url: parts[0] });
              continue;
            }
            const url = parts[parts.length - 1];
            const label = parts.slice(0, -1).join(" | ");
            if (!looksLikeHttpUrl(url)) {
              throw new Error("Professional links must use http or https URLs.");
            }
            items.push({ label: label || "Link", url });
          }
          return items;
        }

        function memberProfileFieldFallback(profileVisibility, fieldName) {
          const source = profileVisibility || {};
          const fields = source.fields || {};
          if (fields[fieldName]) {
            return String(fields[fieldName]);
          }
          return fieldName === "linkedinUrl" || fieldName === "professionalLinks"
            ? String(source.links || "members_only")
            : String(source.profile || "members_only");
        }

        function formatListText(items) {
          return Array.isArray(items) ? items.filter(Boolean).join("\\n") : "";
        }

        function parseListText(value) {
          return String(value || "")
            .split(/\\r?\\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
        }

        function formatGalleryItemsText(items) {
          return Array.isArray(items)
            ? items
                .map((item) => {
                  const parts = [item?.sourceLabel || item?.sourceType || "Image", item?.imageUrl || "", item?.caption || ""];
                  return parts.filter(Boolean).join(" | ");
                })
                .filter(Boolean)
                .join("\\n")
            : "";
        }

        function parseGalleryItemsText(value) {
          const lines = String(value || "")
            .split(/\\r?\\n/)
            .map((line) => line.trim())
            .filter(Boolean);
          const items = [];
          for (const line of lines) {
            const parts = line.split("|").map((part) => part.trim());
            const sourceLabel = parts[0] || "Image";
            const imageUrl = parts[1] || parts[0] || "";
            const caption = parts.length > 2 ? parts.slice(2).join(" | ") : "";
            if (!imageUrl) {
              continue;
            }
            const normalizedSource = sourceLabel.toLowerCase().includes("linkedin")
              ? "linkedin"
              : sourceLabel.toLowerCase().includes("google")
                ? "google_photos"
                : "approved_url";
            items.push({
              id: "member-gallery-" + String(items.length + 1),
              mediaType: "image",
              imageUrl,
              thumbnailUrl: imageUrl,
              sourceType: normalizedSource,
              sourceLabel,
              caption,
              credit: "",
              visibility: "members_only",
              approved: false
            });
          }
          return items;
        }

        function populateMemberProfile(item) {
          const profile = item || {};
          const details = profile.directoryDetails || {};
          const contactPreferences = profile.contactPreferences || {};
          profileUsernameInput.value = String(profile.username || memberUsername || "");
          profileEmailInput.value = String(profile.email || "");
          profileFullNameInput.value = String(profile.fullName || "");
          profileCompanyInput.value = String(profile.company || "");
          profilePhoneInput.value = String(profile.phone || "");
          profileBusinessTitleInput.value = String(profile.businessTitle || "");
          profileIwfsaPositionInput.value = String(profile.iwfsaPosition || "");
          profileBioInput.value = String(profile.bio || "");
          profileExpertiseInput.value = String(profile.expertiseFreeText || "");
          profileLinkedinUrlInput.value = String(profile.linkedinUrl || "");
          profilePreferredNameInput.value = String(details.preferredName || "");
          profileTitleInput.value = String(details.title || "");
          profileHeadlineInput.value = String(details.profileHeadline || "");
          profileSectorInput.value = String(details.industrySector || "");
          profileCurrentRoleTitleInput.value = String(details.currentRoleTitle || "");
          profileCityInput.value = String(details.city || "");
          profileProvinceInput.value = String(details.province || "");
          profileCountryInput.value = String(details.country || "");
          profileWebsiteInput.value = String(details.website || "");
          profileMentorshipRoleInput.value = String(details.mentorshipRole || "");
          profileBoardStatusInput.value = String(details.boardStatus || "");
          profileFeaturedQuoteInput.value = String(details.featuredQuote || "");
          profileContributionsInput.value = String(details.contributionsToWomenLeadership || "");
          profileCommitteeInput.value = formatListText(details.committeeInvolvement || []);
          profileProgrammeInput.value = formatListText(details.leadershipProgrammeInvolvement || []);
          profileAchievementsInput.value = formatListText(details.achievements || []);
          profileExpertiseTagsInput.value = formatListText(details.expertiseTags || []);
          profileSpeakingTopicsInput.value = formatListText(details.speakingTopics || []);
          profileGalleryItemsInput.value = formatGalleryItemsText(profile.galleryItems || []);
          profileVisibilityInput.value = String(profile.profileVisibility?.profile || "members_only");
          profileLinksVisibilityInput.value = String(profile.profileVisibility?.links || "members_only");
          profileFieldVisibilityInputs.forEach((input) => {
            const fieldName = String(input.getAttribute("data-profile-field-visibility") || "").trim();
            input.value = memberProfileFieldFallback(profile.profileVisibility, fieldName);
          });
          profileShowEmailInput.checked = Boolean(contactPreferences.showEmail);
          profileShowPhoneInput.checked = Boolean(contactPreferences.showPhone);
          profileShowLocationInput.checked = contactPreferences.showLocation !== false;
          profileShowLinkedinInput.checked = contactPreferences.showLinkedIn !== false;
          profileShowGalleryInput.checked = contactPreferences.showGallery !== false;
          profileShowHighlightsInput.checked = contactPreferences.showProfessionalHighlights !== false;
          profilePublicEnabledInput.checked = contactPreferences.publicProfileEnabled !== false;
          profileProfessionalLinksInput.value = formatProfessionalLinksText(profile.professionalLinks || []);
          profileBirthdayMonthInput.value = profile.birthdayMonth ? String(profile.birthdayMonth) : "";
          profileBirthdayDayInput.value = profile.birthdayDay ? String(profile.birthdayDay) : "";
          profileBirthdayVisibilityInput.value = String(profile.birthdayVisibility || "hidden");
          memberPhotoUrlInput.value = String(profile.photoUrl || "");
          setMemberPhotoPreview(profile.photoUrl || null);
        }

        async function loadMemberProfile() {
          const token = getToken();
          if (!token) {
            profileStatus.textContent = "Sign in to edit your profile details and visibility.";
            memberPhotoStatus.textContent = "Sign in to upload your photo.";
            profileUsernameInput.value = "";
            profileEmailInput.value = "";
            profileFullNameInput.value = "";
            profileCompanyInput.value = "";
            profilePhoneInput.value = "";
            profileBusinessTitleInput.value = "";
            profileIwfsaPositionInput.value = "";
            profileBioInput.value = "";
            profileExpertiseInput.value = "";
            profileLinkedinUrlInput.value = "";
            profilePreferredNameInput.value = "";
            profileTitleInput.value = "";
            profileHeadlineInput.value = "";
            profileSectorInput.value = "";
            profileCurrentRoleTitleInput.value = "";
            profileCityInput.value = "";
            profileProvinceInput.value = "";
            profileCountryInput.value = "";
            profileWebsiteInput.value = "";
            profileMentorshipRoleInput.value = "";
            profileBoardStatusInput.value = "";
            profileFeaturedQuoteInput.value = "";
            profileContributionsInput.value = "";
            profileCommitteeInput.value = "";
            profileProgrammeInput.value = "";
            profileAchievementsInput.value = "";
            profileExpertiseTagsInput.value = "";
            profileSpeakingTopicsInput.value = "";
            profileGalleryItemsInput.value = "";
            profileVisibilityInput.value = "members_only";
            profileLinksVisibilityInput.value = "members_only";
            profileFieldVisibilityInputs.forEach((input) => {
              input.value = "members_only";
            });
            profileShowEmailInput.checked = false;
            profileShowPhoneInput.checked = false;
            profileShowLocationInput.checked = true;
            profileShowLinkedinInput.checked = true;
            profileShowGalleryInput.checked = true;
            profileShowHighlightsInput.checked = true;
            profilePublicEnabledInput.checked = true;
            profileProfessionalLinksInput.value = "";
            profileBirthdayMonthInput.value = "";
            profileBirthdayDayInput.value = "";
            profileBirthdayVisibilityInput.value = "hidden";
            memberPhotoUrlInput.value = "";
            setMemberPhotoPreview(null);
            return;
          }

          profileStatus.textContent = "Loading profile...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/profile", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              profileStatus.textContent = payload.message || "Unable to load member profile.";
              return;
            }
            populateMemberProfile(payload.item || {});
            profileStatus.textContent = "Profile ready.";
            memberPhotoStatus.textContent = payload.item?.photoUrl
              ? "Profile photo loaded."
              : "Upload a profile photo from camera or image file.";
          } catch {
            profileStatus.textContent = "Unable to reach API for profile.";
          }
        }

        function getSelectedPhotoFile() {
          const directFile = memberPhotoFileInput?.files && memberPhotoFileInput.files[0] ? memberPhotoFileInput.files[0] : null;
          const cameraFile = memberPhotoCameraInput?.files && memberPhotoCameraInput.files[0] ? memberPhotoCameraInput.files[0] : null;
          return cameraFile || directFile;
        }

        async function uploadMemberPhoto() {
          const token = getToken();
          if (!token) {
            memberPhotoStatus.textContent = "Sign in to upload your photo.";
            return;
          }

          const file = getSelectedPhotoFile();
          if (!file) {
            memberPhotoStatus.textContent = "Choose a photo file or capture with camera first.";
            return;
          }

          memberPhotoStatus.textContent = "Uploading photo...";
          try {
            const formData = new FormData();
            formData.append("photo", file, file.name || "member-photo");
            const response = await fetch("${config.apiBaseUrl}/api/member/profile/photo", {
              method: "POST",
              headers: { Authorization: "Bearer " + token },
              body: formData
            });
            const payload = await response.json();
            if (!response.ok) {
              memberPhotoStatus.textContent = payload.message || "Unable to upload profile photo.";
              return;
            }
            setMemberPhotoPreview(payload.photoUrl || null);
            memberPhotoStatus.textContent = "Profile photo uploaded.";
            if (memberPhotoFileInput) {
              memberPhotoFileInput.value = "";
            }
            if (memberPhotoCameraInput) {
              memberPhotoCameraInput.value = "";
            }
            await loadBirthdays();
          } catch {
            memberPhotoStatus.textContent = "Unable to reach API for profile photo upload.";
          }
        }

        async function removeMemberPhoto() {
          const token = getToken();
          if (!token) {
            memberPhotoStatus.textContent = "Sign in to remove your photo.";
            return;
          }

          memberPhotoStatus.textContent = "Removing photo...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/profile/photo", {
              method: "DELETE",
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              memberPhotoStatus.textContent = payload.message || "Unable to remove profile photo.";
              return;
            }
            setMemberPhotoPreview(null);
            memberPhotoStatus.textContent = "Profile photo removed.";
            await loadBirthdays();
          } catch {
            memberPhotoStatus.textContent = "Unable to reach API for profile photo removal.";
          }
        }

        async function saveMemberProfile({ clearBirthday = false } = {}) {
          const token = getToken();
          if (!token) {
            profileStatus.textContent = "Sign in to edit your profile details and visibility.";
            return false;
          }

          let professionalLinks;
          try {
            professionalLinks = parseProfessionalLinksText(profileProfessionalLinksInput.value);
          } catch (error) {
            profileStatus.textContent = String(error.message || error);
            return false;
          }

          const monthValue = String(profileBirthdayMonthInput.value || "").trim();
          const dayValue = String(profileBirthdayDayInput.value || "").trim();
          const payload = {
            fullName: String(profileFullNameInput.value || "").trim(),
            company: String(profileCompanyInput.value || "").trim(),
            phone: String(profilePhoneInput.value || "").trim(),
            businessTitle: String(profileBusinessTitleInput.value || "").trim(),
            iwfsaPosition: String(profileIwfsaPositionInput.value || "").trim(),
            bio: String(profileBioInput.value || "").trim(),
            expertiseFreeText: String(profileExpertiseInput.value || "").trim(),
            linkedinUrl: String(profileLinkedinUrlInput.value || "").trim(),
            photoUrl: String(memberPhotoUrlInput.value || "").trim(),
            directoryDetails: {
              preferredName: String(profilePreferredNameInput.value || "").trim(),
              title: String(profileTitleInput.value || "").trim(),
              profileHeadline: String(profileHeadlineInput.value || "").trim(),
              industrySector: String(profileSectorInput.value || "").trim(),
              currentRoleTitle: String(profileCurrentRoleTitleInput.value || "").trim(),
              city: String(profileCityInput.value || "").trim(),
              province: String(profileProvinceInput.value || "").trim(),
              country: String(profileCountryInput.value || "").trim(),
              website: String(profileWebsiteInput.value || "").trim(),
              mentorshipRole: String(profileMentorshipRoleInput.value || "").trim(),
              boardStatus: String(profileBoardStatusInput.value || "").trim(),
              featuredQuote: String(profileFeaturedQuoteInput.value || "").trim(),
              contributionsToWomenLeadership: String(profileContributionsInput.value || "").trim(),
              committeeInvolvement: parseListText(profileCommitteeInput.value),
              leadershipProgrammeInvolvement: parseListText(profileProgrammeInput.value),
              achievements: parseListText(profileAchievementsInput.value),
              expertiseTags: parseListText(profileExpertiseTagsInput.value),
              speakingTopics: parseListText(profileSpeakingTopicsInput.value)
            },
            galleryItems: parseGalleryItemsText(profileGalleryItemsInput.value),
            contactPreferences: {
              showEmail: Boolean(profileShowEmailInput.checked),
              showPhone: Boolean(profileShowPhoneInput.checked),
              showLocation: Boolean(profileShowLocationInput.checked),
              showLinkedIn: Boolean(profileShowLinkedinInput.checked),
              showGallery: Boolean(profileShowGalleryInput.checked),
              showProfessionalHighlights: Boolean(profileShowHighlightsInput.checked),
              publicProfileEnabled: Boolean(profilePublicEnabledInput.checked)
            },
            professionalLinks,
            profileVisibility: {
              profile: String(profileVisibilityInput.value || "members_only").trim(),
              links: String(profileLinksVisibilityInput.value || "members_only").trim(),
              fields: profileFieldVisibilityInputs.reduce((accumulator, input) => {
                const fieldName = String(input.getAttribute("data-profile-field-visibility") || "").trim();
                if (!fieldName) {
                  return accumulator;
                }
                accumulator[fieldName] = String(input.value || "members_only").trim() || "members_only";
                return accumulator;
              }, {})
            },
            birthdayVisibility: String(profileBirthdayVisibilityInput.value || "hidden").trim()
          };
          memberPhotoUrlInput.value = String(payload.photoUrl || "");

          if (clearBirthday) {
            payload.clearBirthday = true;
          } else if (monthValue || dayValue) {
            payload.birthdayMonth = Number(monthValue || 0);
            payload.birthdayDay = Number(dayValue || 0);
          }

          profileStatus.textContent = "Saving profile...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/profile", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify(payload)
            });
            const responsePayload = await response.json();
            if (!response.ok) {
              profileStatus.textContent = responsePayload.message || "Unable to save profile.";
              return false;
            }
            populateMemberProfile(responsePayload.item || {});
            profileStatus.textContent = "Profile saved.";
            await loadBirthdays();
            await loadMemberHome();
            return true;
          } catch {
            profileStatus.textContent = "Unable to reach API for profile updates.";
            return false;
          }
        }
        function renderBirthdays(items, windowDays) {
          if (!items || items.length === 0) {
            const window = Number(windowDays);
            const windowLabel = window === 7 ? "7 days" : window === 30 ? "30 days" : "14 days";
            birthdayList.innerHTML = "<p class='muted'>No birthdays in the next " + windowLabel + ".</p>";
            return;
          }

          birthdayList.innerHTML = items
            .map((item) => {
              const name = escapeClientHtml(item.fullName || "Member");
              const dateLabel = escapeClientHtml(formatBirthdayLabel(item.occursOn));
              const roles = Array.isArray(item.roles) ? item.roles.slice(0, 3) : [];
              const roleBadges = roles.length
                ? "<div class='badge-row'>" +
                  roles.map((role) => "<span class='badge'>" + escapeClientHtml(role) + "</span>").join("") +
                  "</div>"
                : "";
              const avatar = item.photoUrl
                ? "<img class='avatar' alt='Portrait of " + name + "' src='" + escapeClientHtml(item.photoUrl) + "' />"
                : "<div class='avatar avatar-fallback' aria-hidden='true'>" +
                  escapeClientHtml(initialsFromName(item.fullName)) +
                  "</div>";

              return (
                "<div class='birthday-item'>" +
                "<div class='iwfsa-watermark'>IWFSA</div>" +
                avatar +
                "<div class='birthday-meta'>" +
                "<div class='birthday-name'>" +
                name +
                "</div>" +
                "<div class='birthday-date'>" +
                dateLabel +
                "</div>" +
                roleBadges +
                "</div>" +
                "<div class='social-actions'>" +
                "<button class='btn-social' type='button' disabled title='Feature-flagged for Phase 4. Use manual post for now.'>Auto-Post to Social</button>" +
                "</div>" +
                "</div>"
              );
            })
            .join("");
        }

        async function loadBirthdays() {
          const token = getToken();
          if (!token) {
            birthdayList.innerHTML = "<p class='muted'>Sign in to load birthdays.</p>";
            return;
          }

          birthdayList.innerHTML = "<p class='muted'>Loading birthdays...</p>";
          const windowDays = Number(birthdayWindowSelect.value || 14);
          try {
            const response = await fetch(
              "${config.apiBaseUrl}/api/birthdays?window=" + encodeURIComponent(String(windowDays)),
              { headers: { Authorization: "Bearer " + token } }
            );
            const payload = await response.json();
            if (!response.ok) {
              birthdayList.innerHTML =
                "<p class='muted'>" + (payload.message || "Unable to load birthdays.") + "</p>";
              return;
            }
            renderBirthdays(payload.items || [], payload.windowDays || windowDays);
          } catch {
            birthdayList.innerHTML = "<p class='muted'>Unable to reach API for birthdays.</p>";
          }
        }

        function renderSmsSettings(item, limits) {
          const smsItem = item || {};
          const limitConfig = limits || {};
          smsEnabledInput.checked = Boolean(smsItem.enabled);
          smsPhoneInput.value = String(smsItem.phoneNumber || "");
          smsDailyLimitInput.value = String(smsItem.dailyLimit || "");
          smsPerEventLimitInput.value = String(smsItem.perEventLimit || "");
          smsQuietStartInput.value = String(smsItem.quietHoursStart || "21:00");
          smsQuietEndInput.value = String(smsItem.quietHoursEnd || "07:00");
          smsAllowUrgentInput.checked = Boolean(smsItem.allowUrgent);
          smsLimits.textContent =
            "Current limits: daily " +
            String(limitConfig.daily?.min || 1) +
            "-" +
            String(limitConfig.daily?.max || 10) +
            ", per-event " +
            String(limitConfig.perEvent?.min || 1) +
            "-" +
            String(limitConfig.perEvent?.max || 5) +
            ".";
        }

        async function loadSmsSettings() {
          const token = getToken();
          if (!token) {
            smsStatus.textContent = "Sign in to manage SMS preferences.";
            smsLimits.textContent = "Sign in to load SMS policy guidance.";
            return;
          }

          smsStatus.textContent = "Loading SMS settings...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/notifications/sms-settings", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              smsStatus.textContent = payload.message || "Unable to load SMS settings.";
              return;
            }
            renderSmsSettings(payload.item || {}, payload.limits || {});
            smsStatus.textContent = "SMS Settings ready.";
          } catch {
            smsStatus.textContent = "Unable to reach API for SMS settings.";
          }
        }

        function renderCelebrationRules(items) {
          const rules = Array.isArray(items) ? items : [];
          if (rules.length === 0) {
            celebrationRules.innerHTML = "<li>No rules are configured yet.</li>";
            return;
          }
          celebrationRules.innerHTML = rules
            .map((rule) => "<li>" + escapeClientHtml(rule) + "</li>")
            .join("");
        }

        function formatCelebrationTimestamp(value) {
          const date = new Date(value);
          if (!Number.isFinite(date.getTime())) {
            return "Just now";
          }
          return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          });
        }

        function renderCelebrations(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            celebrationList.innerHTML = "<p class='muted'>No celebration posts yet. Be the first to add one.</p>";
            return;
          }

          celebrationList.innerHTML = rows
            .map((item) => {
              const deleteButton = item.canDelete
                ? "<button type='button' class='ghost-link danger-link' data-delete-celebration-id='" +
                  escapeClientHtml(item.id) +
                  "'>Delete</button>"
                : "";
              return (
                "<article class='thread-item'>" +
                "<div class='thread-item-head'>" +
                "<div>" +
                "<strong>" +
                escapeClientHtml(item.authorUsername || "Member") +
                "</strong>" +
                "<p class='muted'>" +
                escapeClientHtml(formatCelebrationTimestamp(item.createdAt)) +
                "</p>" +
                "</div>" +
                deleteButton +
                "</div>" +
                "<p>" +
                escapeClientHtml(item.bodyText || "") +
                "</p>" +
                "</article>"
              );
            })
            .join("");
        }

        async function loadCelebrations() {
          const token = getToken();
          if (!token) {
            celebrationStatus.textContent = "Sign in to load the shared thread.";
            celebrationList.innerHTML = "<p class='muted'>Sign in to load celebration posts.</p>";
            celebrationRules.innerHTML = "<li>Sign in to load moderation rules.</li>";
            return;
          }

          celebrationStatus.textContent = "Loading celebration thread...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/social/celebrations?limit=25", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              celebrationStatus.textContent = payload.message || "Unable to load celebration thread.";
              celebrationList.innerHTML = "<p class='muted'>Unable to load celebration posts.</p>";
              return;
            }

            renderCelebrationRules(payload.rules || []);
            renderCelebrations(payload.items || []);
            celebrationStatus.textContent = payload.canModerate
              ? "Moderator access is enabled for this account."
              : "Post a short, community-relevant message to the shared thread.";
          } catch {
            celebrationStatus.textContent = "Unable to reach API for celebration posts.";
            celebrationList.innerHTML = "<p class='muted'>Unable to reach API for celebration posts.</p>";
          }
        }

        function buildGoogleCalendarUrl(eventItem) {
          const startMs = Date.parse(eventItem.startAt);
          const endMs = Date.parse(eventItem.endAt);
          if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "";
          const fmt = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
          const text = String(eventItem.title || "IWFSA Event");
          const dates = fmt(startMs) + "/" + fmt(endMs);
          const detailsParts = [];
          if (eventItem.description) detailsParts.push(String(eventItem.description));
          if (eventItem.onlineJoinUrl) detailsParts.push("Join link: " + String(eventItem.onlineJoinUrl));
          detailsParts.push("Open the IWFSA Member Portal for updates.");
          const details = detailsParts.filter(Boolean).join("\\n\\n");
          const location =
            eventItem.venueName || eventItem.venueAddress
              ? [eventItem.venueName, eventItem.venueAddress].filter(Boolean).join(" - ")
              : eventItem.venueType === "online" || eventItem.onlineJoinUrl
                ? "Online"
                : "";
          return (
            "https://calendar.google.com/calendar/render?action=TEMPLATE" +
            "&text=" +
            encodeURIComponent(text) +
            "&dates=" +
            encodeURIComponent(dates) +
            (details ? "&details=" + encodeURIComponent(details) : "") +
            (location ? "&location=" + encodeURIComponent(location) : "")
          );
        }

        function buildOutlookCalendarUrl(eventItem) {
          const startMs = Date.parse(eventItem.startAt);
          const endMs = Date.parse(eventItem.endAt);
          if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "";
          const startdt = new Date(startMs).toISOString();
          const enddt = new Date(endMs).toISOString();
          const subject = String(eventItem.title || "IWFSA Event");
          const bodyParts = [];
          if (eventItem.description) bodyParts.push(String(eventItem.description));
          if (eventItem.onlineJoinUrl) bodyParts.push("Join link: " + String(eventItem.onlineJoinUrl));
          bodyParts.push("Open the IWFSA Member Portal for updates.");
          const body = bodyParts.filter(Boolean).join("\\n\\n");
          const location =
            eventItem.venueName || eventItem.venueAddress
              ? [eventItem.venueName, eventItem.venueAddress].filter(Boolean).join(" - ")
              : eventItem.venueType === "online" || eventItem.onlineJoinUrl
                ? "Online"
                : "";
          return (
            "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent" +
            "&subject=" +
            encodeURIComponent(subject) +
            "&startdt=" +
            encodeURIComponent(startdt) +
            "&enddt=" +
            encodeURIComponent(enddt) +
            (location ? "&location=" + encodeURIComponent(location) : "") +
            (body ? "&body=" + encodeURIComponent(body) : "")
          );
        }

        function formatSignupStatus(value) {
          if (value === "confirmed") return "Confirmed";
          if (value === "waitlisted") return "Waitlisted";
          return "Not registered";
        }

        function computeCountdown(closeIso) {
          if (!closeIso) {
            return { state: "open", minutesToClose: null, label: "Open (no close deadline)" };
          }

          const closeMs = Date.parse(closeIso);
          if (!Number.isFinite(closeMs)) {
            return { state: "open", minutesToClose: null, label: "Open" };
          }

          const diffMs = closeMs - nowWithServerSkew();
          if (diffMs <= 0) {
            return { state: "closed", minutesToClose: 0, label: "Closed" };
          }

          const minutes = Math.ceil(diffMs / (60 * 1000));
          if (minutes <= 15) {
            return { state: "closing_soon", minutesToClose: minutes, label: "Closing in " + minutes + " min" };
          }
          return { state: "open", minutesToClose: minutes, label: "Closes in " + minutes + " min" };
        }

        function urgencyMessage(event) {
          if (event.registrationState !== "closing_soon") {
            return "";
          }
          if (event.urgencyVariant === "last_chance") {
            return "Last chance! Registration closes very soon.";
          }
          if (event.urgencyVariant === "final_hours") {
            return "Final hours. Complete your registration now.";
          }
          return "Registration is closing soon.";
        }

        function getDraftValue(event) {
          if (localDraftOverrides.has(event.id)) {
            return localDraftOverrides.get(event.id);
          }
          const serverDraft = event.registrationDraft || {};
          return String(serverDraft.note || "");
        }

        function registerButtonLabel(event) {
          const countdown = computeCountdown(event.countdownEndsAt);
          if (countdown.state === "closed") {
            return "Registration closed";
          }
          if (event.seatsRemaining > 0) {
            return "Sign up";
          }
          return "Join waitlist";
        }

        function canCancel(event) {
          return event.mySignupStatus === "confirmed" || event.mySignupStatus === "waitlisted";
        }

        async function syncServerTime() {
          try {
            const response = await fetch("${config.apiBaseUrl}/api/time");
            const payload = await response.json();
            if (response.ok && payload.serverTime) {
              const serverTimeMs = Date.parse(payload.serverTime);
              if (Number.isFinite(serverTimeMs)) {
                serverSkewMs = serverTimeMs - Date.now();
              }
            }
          } catch {
            // keep previous skew on failure
          }
        }

        async function saveDraft(eventId, noteText) {
          const token = getToken();
          if (!token) {
            return;
          }
          try {
            const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/registration-draft", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify({
                draft: {
                  note: noteText,
                  autosavedAt: new Date(nowWithServerSkew()).toISOString()
                }
              })
            });
            if (!response.ok) {
              return;
            }
            const statusNode = document.getElementById("draft-status-" + eventId);
            if (statusNode) {
              statusNode.textContent = "Draft auto-saved.";
            }
          } catch {
            // ignore temporary save failures
          }
        }

        function scheduleDraftAutosave(eventId, noteText) {
          localDraftOverrides.set(eventId, noteText);
          const timer = draftAutosaveTimers.get(eventId);
          if (timer) {
            clearTimeout(timer);
          }
          draftAutosaveTimers.set(
            eventId,
            setTimeout(() => {
              saveDraft(eventId, noteText);
            }, 650)
          );
        }

        async function registerForEvent(eventId) {
          const token = getToken();
          if (!token) {
            return;
          }

          const event = currentEvents.find((item) => item.id === eventId);
          if (!event) {
            return;
          }

          const countdown = computeCountdown(event.countdownEndsAt);
          if (countdown.minutesToClose !== null && countdown.minutesToClose > 0 && countdown.minutesToClose <= 15) {
            const proceed = window.confirm(
              "Registration closes in " +
                countdown.minutesToClose +
                " minutes. Complete your registration quickly!"
            );
            if (!proceed) {
              return;
            }
          }

          const draftText = getDraftValue(event);
          loginStatus.textContent = "Processing registration...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify({
                draft: {
                  note: draftText,
                  autosavedAt: new Date(nowWithServerSkew()).toISOString()
                }
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              loginStatus.textContent = payload.message || "Unable to register for this event.";
              await loadEvents();
              return;
            }
            loginStatus.textContent =
              payload.status === "confirmed"
                ? "Registration confirmed."
                : payload.status === "waitlisted"
                  ? "Event is full. You have been added to the waitlist."
                  : "Registration updated.";
            await loadEvents();
          } catch {
            loginStatus.textContent = "Unable to reach API to register.";
          }
        }

        async function cancelRegistration(eventId) {
          const token = getToken();
          if (!token) {
            return;
          }
          loginStatus.textContent = "Cancelling registration...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/cancel-registration", {
              method: "POST",
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              loginStatus.textContent = payload.message || "Unable to cancel registration.";
              return;
            }
            loginStatus.textContent =
              payload.promotedUserId
                ? "Registration cancelled. Waitlisted member promoted."
                : "Registration cancelled.";
            await loadEvents();
          } catch {
            loginStatus.textContent = "Unable to reach API to cancel registration.";
          }
        }

        function bindEventActions() {
          document.querySelectorAll("[data-event-action='register']").forEach((button) => {
            button.addEventListener("click", async () => {
              const eventId = Number(button.getAttribute("data-event-id"));
              if (Number.isInteger(eventId)) {
                await registerForEvent(eventId);
              }
            });
          });

          document.querySelectorAll("[data-event-action='cancel']").forEach((button) => {
            button.addEventListener("click", async () => {
              const eventId = Number(button.getAttribute("data-event-id"));
              if (Number.isInteger(eventId)) {
                await cancelRegistration(eventId);
              }
            });
          });

          document.querySelectorAll("[data-event-action='reminders']").forEach((button) => {
            button.addEventListener("click", async () => {
              const eventId = Number(button.getAttribute("data-event-id"));
              if (!Number.isInteger(eventId)) {
                return;
              }
              const input = prompt(
                "Reminder offsets in minutes (comma-separated). Example: 60, 30, 10",
                "60,30"
              );
              if (input === null) {
                return;
              }
              const offsets = String(input || "")
                .split(",")
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isInteger(value) && value > 0);

              const token = getToken();
              if (!token) {
                return;
              }

              try {
                const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/reminders", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                  },
                  body: JSON.stringify({ offsetMinutes: offsets })
                });
                const payload = await response.json();
                if (!response.ok) {
                  loginStatus.textContent = payload.message || "Unable to save reminder preferences.";
                  return;
                }
                loginStatus.textContent =
                  "Reminder preferences saved: " + (payload.offsets || []).join(", ") + " minute(s).";
              } catch {
                loginStatus.textContent = "Unable to reach API to save reminder preferences.";
              }
            });
          });

          document.querySelectorAll("[data-event-action='ics']").forEach((button) => {
            button.addEventListener("click", async () => {
              const eventId = Number(button.getAttribute("data-event-id"));
              if (!Number.isInteger(eventId)) {
                return;
              }
              const token = getToken();
              if (!token) {
                loginStatus.textContent = "Sign in to download calendar files.";
                return;
              }
              loginStatus.textContent = "Preparing calendar download...";
              try {
                const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/calendar.ics", {
                  headers: { Authorization: "Bearer " + token }
                });
                if (!response.ok) {
                  const payload = await response.json().catch(() => ({}));
                  loginStatus.textContent = payload.message || "Unable to generate calendar file.";
                  return;
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "event-" + eventId + ".ics";
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(url);
                loginStatus.textContent = "Calendar file downloaded.";
              } catch {
                loginStatus.textContent = "Unable to reach API for calendar download.";
              }
            });
          });

          document.querySelectorAll(".registration-draft-input").forEach((input) => {
            input.addEventListener("input", () => {
              const eventId = Number(input.getAttribute("data-event-id"));
              if (!Number.isInteger(eventId)) {
                return;
              }
              const noteText = String(input.value || "");
              scheduleDraftAutosave(eventId, noteText);
              const statusNode = document.getElementById("draft-status-" + eventId);
              if (statusNode) {
                statusNode.textContent = "Saving draft...";
              }
            });
          });
        }

        function renderEvents(items) {
          currentEvents = Array.isArray(items) ? items : [];
          if (currentEvents.length === 0) {
            const selectedView = String(viewSelect.value || "").trim();
            container.innerHTML = selectedView
              ? "<p class='muted'>No published events in this window.</p>"
              : "<p class='muted'>No published events yet.</p>";
            return;
          }

          container.innerHTML = currentEvents
            .map((event) => {
              const start = formatEventDateTime(event.startAt);
              const end = formatEventDateTime(event.endAt);
              const countdown = computeCountdown(event.countdownEndsAt);
              const urgency = urgencyMessage({ ...event, registrationState: countdown.state });
              const draftValue = getDraftValue(event);
              const audienceLabel = escapeClientHtml(event.audienceLabel || "All Active IWFSA Members");
              const registerDisabled =
                countdown.state === "closed" ||
                event.mySignupStatus === "confirmed" ||
                event.mySignupStatus === "waitlisted";
              const registerLabel = registerButtonLabel({ ...event, registrationState: countdown.state });
              const signupStatus = formatSignupStatus(event.mySignupStatus);
              const closeDisplay = event.countdownEndsAt
                ? formatEventDateTime(event.countdownEndsAt)
                : "No close deadline";
              const venueLabel = event.venueType === "online" ? "Online" : "Physical";
              const venueParts = [];
              if (venueLabel) venueParts.push(venueLabel);
              if (event.venueName) venueParts.push(event.venueName);
              if (event.venueAddress) venueParts.push(event.venueAddress);
              const venueDisplay = venueParts.filter(Boolean).join(" - ");
              const hostDisplay = event.hostName ? escapeClientHtml(event.hostName) : "TBA";
              const googleUrl = buildGoogleCalendarUrl(event);
              const outlookUrl = buildOutlookCalendarUrl(event);

              return (
                "<article class='event-card'>" +
                "<h3>" +
                escapeClientHtml(event.title) +
                "</h3>" +
                "<p><strong>Description:</strong> " +
                escapeClientHtml(event.description || "No description yet.") +
                "</p>" +
                "<p><strong>Host / Chair:</strong> " +
                hostDisplay +
                "</p>" +
                "<p><strong>Audience:</strong> " +
                audienceLabel +
                "</p>" +
                "<p><strong>Start:</strong> " +
                start +
                "</p>" +
                "<p><strong>End:</strong> " +
                end +
                "</p>" +
                "<p><strong>Venue:</strong> " +
                escapeClientHtml(venueDisplay || "TBA") +
                "</p>" +
                (event.onlineJoinUrl
                  ? "<p><strong>Join:</strong> <a target='_blank' rel='noreferrer' href='" +
                    escapeClientHtml(event.onlineJoinUrl) +
                    "'>Open meeting link</a></p>"
                  : "") +
                "<p><strong>Seats:</strong> " +
                Number(event.seatsRemaining || 0) +
                " remaining (" +
                Number(event.confirmedCount || 0) +
                " confirmed, " +
                Number(event.waitlistedCount || 0) +
                " waitlisted)</p>" +
                "<p><strong>Registration:</strong> " +
                countdown.label +
                " (closes " +
                closeDisplay +
                ")</p>" +
                "<p><strong>Your status:</strong> " +
                signupStatus +
                "</p>" +
                (urgency ? "<p class='muted'><strong>" + escapeClientHtml(urgency) + "</strong></p>" : "") +
                "<details class='event-details'>" +
                "<summary>Registration, notes, and calendar</summary>" +
                "<div class='event-details-body'>" +
                "<label for='draft-" +
                event.id +
                "' class='muted'>Registration note (auto-saved)</label>" +
                "<textarea id='draft-" +
                event.id +
                "' class='registration-draft-input' data-event-id='" +
                event.id +
                "' rows='2' placeholder='Optional note for your registration'>" +
                escapeClientHtml(draftValue) +
                "</textarea>" +
                "<p id='draft-status-" +
                event.id +
                "' class='muted'></p>" +
                "<div class='member-actions'>" +
                (canCancel(event)
                  ? "<button data-event-action='cancel' data-event-id='" + event.id + "'>Cancel</button>"
                  : "<button data-event-action='register' data-event-id='" +
                    event.id +
                    "'" +
                    (registerDisabled ? " disabled" : "") +
                    ">" +
                    escapeClientHtml(registerLabel) +
                    "</button>") +
                "<button data-event-action='reminders' data-event-id='" +
                event.id +
                "'>Set reminders</button>" +
                "<button data-event-action='ics' data-event-id='" +
                event.id +
                "'>Download .ics</button>" +
                (googleUrl
                  ? "<a target='_blank' rel='noreferrer' class='ghost' href='" +
                    escapeClientHtml(googleUrl) +
                    "'>Google</a>"
                  : "") +
                (outlookUrl
                  ? "<a target='_blank' rel='noreferrer' class='ghost' href='" +
                    escapeClientHtml(outlookUrl) +
                    "'>Outlook</a>"
                  : "") +
                "</div>" +
                "</div>" +
                "</details>" +
                "</article>"
              );
            })
            .join("");

          bindEventActions();
        }

        function renderNotifications(items) {
          if (!items || items.length === 0) {
            notificationList.innerHTML = "<p class='muted'>No notifications yet.</p>";
            return;
          }
          notificationList.innerHTML = items
            .map((item) => {
              const createdAt = new Date(item.createdAt).toLocaleString();
              const status = item.readAt ? "Read" : "Unread";
              return (
                "<article class='event-card'>" +
                "<h3>" +
                escapeClientHtml(item.title || "Notification") +
                "</h3>" +
                "<p>" +
                escapeClientHtml(item.body || "") +
                "</p>" +
                "<p class='muted'><strong>" +
                status +
                "</strong> &bull; " +
                createdAt +
                "</p>" +
                "</article>"
              );
            })
            .join("");
        }

        async function loadNotifications() {
          const token = getToken();
          if (!token) {
            notificationList.innerHTML = "<p class='muted'>Sign in to load notifications.</p>";
            return;
          }
          notificationList.innerHTML = "<p class='muted'>Loading notifications...</p>";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/notifications?limit=25", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              notificationList.innerHTML =
                "<p class='muted'>" + (payload.message || "Unable to load notifications.") + "</p>";
              return;
            }
            renderNotifications(payload.items || []);
          } catch {
            notificationList.innerHTML = "<p class='muted'>Unable to reach API for notifications.</p>";
          }
        }

        async function markAllNotificationsRead() {
          const token = getToken();
          if (!token) {
            return;
          }
          try {
            await fetch("${config.apiBaseUrl}/api/notifications/mark-read", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify({ markAll: true })
            });
            await loadNotifications();
          } catch {
            loginStatus.textContent = "Unable to reach API to mark notifications.";
          }
        }

        async function loadEvents() {
          const token = getToken();
          if (!token) {
            container.innerHTML = "<p class='muted'>Sign in to load events.</p>";
            if (memberEventCreateForm) {
              memberEventCreateForm.reset();
              setMemberEventStartDefault();
              clearMemberEventCreateErrors();
            }
            resetMemberEventInviteePicker();
            if (memberEventCreateStatus) {
              memberEventCreateStatus.textContent = "Sign in to create events.";
            }
            setSignedInState(false);
            return;
          }

          container.innerHTML = "<p class='muted'>Loading events...</p>";
          try {
            const selectedView = String(viewSelect.value || "").trim();
            const eventsUrl =
              "${config.apiBaseUrl}/api/events" +
              (selectedView ? "?view=" + encodeURIComponent(selectedView) : "");
            const response = await fetch(eventsUrl, {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              loginStatus.textContent = payload.message || "Unable to load events.";
              container.innerHTML = "<p class='muted'>Unable to load events.</p>";
              return;
            }

            if (payload.serverTime) {
              const serverTimeMs = Date.parse(payload.serverTime);
              if (Number.isFinite(serverTimeMs)) {
                serverSkewMs = serverTimeMs - Date.now();
              }
            }

            renderEvents(payload.items || []);
          } catch {
            container.innerHTML = "<p class='muted'>Unable to reach the event service. Refresh the page and try again.</p>";
          }
        }

        if (memberEventCreateResetButton) {
          memberEventCreateResetButton.addEventListener("click", () => {
            clearMemberEventCreateErrors();
            resetMemberEventInviteePicker();
            setTimeout(setMemberEventStartDefault, 0);
            if (memberEventCreateStatus) {
              memberEventCreateStatus.textContent = getToken()
                ? "Form cleared. Create a new event when ready."
                : "Sign in to create events.";
            }
          });
        }

        if (memberEventInviteeSearchInput) {
          memberEventInviteeSearchInput.addEventListener("input", () => {
            renderMemberEventInviteeResults(memberEventInviteeSearchInput.value);
          });
        }

        if (memberEventInviteeResults) {
          memberEventInviteeResults.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-add-member-invitee]");
            if (!button) return;
            const id = Number(button.getAttribute("data-add-member-invitee"));
            const member = memberInviteDirectory.find((item) => memberInviteeId(item) === id);
            if (!member) return;
            selectedMemberEventInvitees.set(id, member);
            if (memberEventInviteeSearchInput) {
              memberEventInviteeSearchInput.value = "";
              memberEventInviteeSearchInput.focus();
            }
            renderMemberEventInviteeSelections();
            renderMemberEventInviteeResults();
          });
        }

        if (memberEventSelectedInvitees) {
          memberEventSelectedInvitees.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-remove-member-invitee]");
            if (!button) return;
            const id = Number(button.getAttribute("data-remove-member-invitee"));
            selectedMemberEventInvitees.delete(id);
            renderMemberEventInviteeSelections();
            renderMemberEventInviteeResults(memberEventInviteeSearchInput?.value || "");
          });
        }

        if (memberEventInviteeClearButton) {
          memberEventInviteeClearButton.addEventListener("click", () => {
            resetMemberEventInviteePicker();
          });
        }

        if (memberEventCreateForm) {
          memberEventCreateForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const token = getToken();
            if (!token) {
              memberEventCreateStatus.textContent = "Sign in to create events.";
              setSignedInState(false);
              return;
            }

            const validation = buildMemberEventCreatePayload(new FormData(memberEventCreateForm));
            if (!validation.payload) {
              memberEventCreateStatus.textContent = validation.error || "Complete the required event fields.";
              return;
            }

            const publishNow = !memberEventPublishNowInput || memberEventPublishNowInput.checked;
            const attachmentFile = memberEventAttachmentInput?.files?.[0] || null;
            if (memberEventCreateSubmitButton) {
              memberEventCreateSubmitButton.disabled = true;
            }
            memberEventCreateStatus.textContent = publishNow
              ? "Creating event, uploading any file, and queueing invitations..."
              : "Creating event draft...";

            try {
              const createResponse = await fetch("${config.apiBaseUrl}/api/events", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token
                },
                body: JSON.stringify(validation.payload)
              });
              const createJson = await createResponse.json();
              if (!createResponse.ok) {
                memberEventCreateStatus.textContent = createJson.message || "Unable to create the event.";
                return;
              }

              let statusMessage = "Event draft created.";
              let attachmentMessage = "";
              if (attachmentFile) {
                await uploadMemberEventAttachment(createJson.id, attachmentFile, token);
                attachmentMessage = " File attached.";
                statusMessage += attachmentMessage;
              }
              if (publishNow) {
                const publishResponse = await fetch("${config.apiBaseUrl}/api/events/" + String(createJson.id) + "/submit", {
                  method: "POST",
                  headers: { Authorization: "Bearer " + token }
                });
                const publishJson = await publishResponse.json();
                if (!publishResponse.ok) {
                  memberEventCreateStatus.textContent =
                    (publishJson.message || "The event was created, but invitations could not be sent.") +
                    " Event id: " +
                    String(createJson.id) +
                    "." +
                    attachmentMessage;
                  await loadEvents();
                  return;
                }
                statusMessage = "Event created" + (attachmentFile ? " with attached file" : "") + " and invitations queued for the selected audience.";
              }

              if (createJson.clashWarning && createJson.clashWarning.hasClash) {
                statusMessage += " Time overlap warning: " + String(createJson.clashWarning.conflictCount || 0) + " existing event(s).";
              }

              memberEventCreateForm.reset();
              setMemberEventStartDefault();
              resetMemberEventInviteePicker();
              clearMemberEventCreateErrors();
              if (memberEventPublishNowInput) {
                memberEventPublishNowInput.checked = true;
              }
              if (viewSelect) {
                viewSelect.value = "";
              }
              memberEventCreateStatus.textContent = statusMessage;
              await loadEvents();
              await loadMemberHome();
            } catch (error) {
              memberEventCreateStatus.textContent = error?.message || "Unable to reach API to create the event.";
            } finally {
              if (memberEventCreateSubmitButton) {
                memberEventCreateSubmitButton.disabled = !Boolean(getToken());
              }
            }
          });
        }
/* Demo button removed */

        async function handleMemberLogout() {
          const token = getToken();
          if (token) {
            try {
              await fetch("${config.apiBaseUrl}/api/auth/logout", {
                method: "POST",
                headers: { Authorization: "Bearer " + token }
              });
            } catch {
              // ignore logout errors
            }
          }
          setToken(null);
          setSignedInState(false);
          if (window.location.hash) {
            history.replaceState(null, "", window.location.pathname + window.location.search);
          }
          if (loginStatus) {
            loginStatus.textContent = "Signed out.";
          }
          container.innerHTML = "<p class='muted'>Sign in to load events.</p>";
          if (memberEventCreateForm) {
            memberEventCreateForm.reset();
            clearMemberEventCreateErrors();
          }
          if (memberEventCreateStatus) {
            memberEventCreateStatus.textContent = "Sign in to create events.";
          }
          resetMemberEventInviteePicker();
          memberInviteList.innerHTML = "<p class='muted'>Sign in to view your event invitations.</p>";
          memberNewsList.innerHTML = "<p class='muted'>Sign in to view relevant IWFSA news.</p>";
          memberDashboardBirthdays.innerHTML = "<p class='muted'>Sign in to load birthday highlights.</p>";
          memberHomeStatus.textContent = "Sign in to load invitations and news.";
          birthdayList.innerHTML = "<p class='muted'>Sign in to load birthdays.</p>";
          notificationList.innerHTML = "<p class='muted'>Sign in to load notifications.</p>";
          profileStatus.textContent = "Sign in to edit your profile details and visibility.";
          memberPhotoStatus.textContent = "Sign in to upload your photo.";
          smsStatus.textContent = "Sign in to manage SMS preferences.";
          smsLimits.textContent = "Sign in to load SMS policy guidance.";
          celebrationStatus.textContent = "Sign in to load the shared thread.";
          celebrationList.innerHTML = "<p class='muted'>Sign in to load celebration posts.</p>";
          celebrationRules.innerHTML = "<li>Sign in to load moderation rules.</li>";
          populateMemberProfile({});
          window.location.href = MEMBER_SIGN_IN_URL;
        }

        document.querySelectorAll("#member-logout, .member-session-logout").forEach((button) => {
          button.addEventListener("click", handleMemberLogout);
        });

        setMemberEventStartDefault();

        refreshEventsButton.addEventListener("click", () => {
          loadEvents();
        });

        refreshHomeButton.addEventListener("click", () => {
          loadMemberHome();
        });

        profileForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          await saveMemberProfile({ clearBirthday: false });
        });

        profileClearBirthdayButton.addEventListener("click", async () => {
          profileBirthdayMonthInput.value = "";
          profileBirthdayDayInput.value = "";
          await saveMemberProfile({ clearBirthday: true });
        });

        memberPhotoUploadButton.addEventListener("click", async () => {
          await uploadMemberPhoto();
        });

        memberPhotoLinkSaveButton.addEventListener("click", async () => {
          const saved = await saveMemberProfile({ clearBirthday: false });
          if (!saved) {
            memberPhotoStatus.textContent = "Unable to save linked profile photo.";
            return;
          }
          memberPhotoStatus.textContent = memberPhotoUrlInput.value
            ? "Linked profile photo saved."
            : "Profile photo cleared.";
        });

        memberPhotoRemoveButton.addEventListener("click", async () => {
          await removeMemberPhoto();
        });

        refreshBirthdaysButton.addEventListener("click", () => {
          loadBirthdays();
        });

        birthdayWindowSelect.addEventListener("change", () => {
          loadBirthdays();
        });

        refreshNotificationsButton.addEventListener("click", () => {
          loadNotifications();
        });

        markNotificationsReadButton.addEventListener("click", () => {
          markAllNotificationsRead();
        });

        viewSelect.addEventListener("change", () => {
          loadEvents();
        });

        smsForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const token = getToken();
          if (!token) {
            smsStatus.textContent = "Sign in to manage SMS preferences.";
            return;
          }

          smsStatus.textContent = "Saving SMS settings...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/notifications/sms-settings", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify({
                enabled: smsEnabledInput.checked,
                phoneNumber: String(smsPhoneInput.value || "").trim(),
                dailyLimit: Number(smsDailyLimitInput.value || 0),
                perEventLimit: Number(smsPerEventLimitInput.value || 0),
                quietHoursStart: String(smsQuietStartInput.value || "").trim(),
                quietHoursEnd: String(smsQuietEndInput.value || "").trim(),
                allowUrgent: smsAllowUrgentInput.checked
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              smsStatus.textContent = payload.message || "Unable to save SMS settings.";
              return;
            }

            renderSmsSettings(payload.item || {}, {
              daily: { min: 1, max: 10 },
              perEvent: { min: 1, max: 5 }
            });
            smsStatus.textContent = "SMS settings saved.";
          } catch {
            smsStatus.textContent = "Unable to reach API for SMS settings.";
          }
        });

        celebrationForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const token = getToken();
          if (!token) {
            celebrationStatus.textContent = "Sign in to post to the celebration thread.";
            return;
          }

          celebrationStatus.textContent = "Posting celebration message...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/social/celebrations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
              },
              body: JSON.stringify({
                bodyText: String(celebrationBodyInput.value || "").trim(),
                acknowledgeRules: celebrationAcknowledgeInput.checked,
                relevantToIwfsa: celebrationRelevantInput.checked
              })
            });
            const payload = await response.json();
            if (!response.ok) {
              celebrationStatus.textContent = payload.message || "Unable to post celebration message.";
              return;
            }

            celebrationBodyInput.value = "";
            celebrationAcknowledgeInput.checked = false;
            celebrationRelevantInput.checked = false;
            celebrationStatus.textContent = "Celebration post added.";
            await loadCelebrations();
          } catch {
            celebrationStatus.textContent = "Unable to reach API for celebration posts.";
          }
        });

        celebrationList.addEventListener("click", async (event) => {
          const button = event.target.closest("[data-delete-celebration-id]");
          if (!button) {
            return;
          }

          const token = getToken();
          if (!token) {
            celebrationStatus.textContent = "Sign in to moderate posts.";
            return;
          }

          const postId = String(button.getAttribute("data-delete-celebration-id") || "").trim();
          if (!postId) {
            return;
          }

          celebrationStatus.textContent = "Removing celebration post...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/social/celebrations/" + postId, {
              method: "DELETE",
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              celebrationStatus.textContent = payload.message || "Unable to remove celebration post.";
              return;
            }

            celebrationStatus.textContent = "Celebration post removed.";
            await loadCelebrations();
          } catch {
            celebrationStatus.textContent = "Unable to reach API for celebration posts.";
          }
        });

        setInterval(() => {
          if (!getToken()) {
            return;
          }
          syncServerTime();
          renderEvents(currentEvents);
        }, 60 * 1000);

        syncServerTime();
        const hasStoredMemberSession = Boolean(getToken());
        setSignedInState(hasStoredMemberSession);
        if (hasStoredMemberSession) {
          if (loginStatus) {
            loginStatus.textContent = formatMemberSessionSummary();
          }
          showMemberModule(window.location.hash.substring(1) || "dashboard");
          loadMemberHome();
          loadMemberProfile();
          loadMemberInviteDirectory();
          loadEvents();
          loadBirthdays();
          loadNotifications();
          loadSmsSettings();
          loadCelebrations();
        } else {
          redirectToUnifiedSignIn();
        }
      </script>
    `
  });
}

export function renderProfileGalleryPage(config) {
  return htmlLayout({
    title: "IWFSA | Member Profiles",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/profiles",
    pageClass: "page-profiles",
    body: `
      <section class="panel panel-hero profile-gallery-hero">
        <div class="header-cluster">
          <div>
            <p class="eyebrow">Member Directory</p>
            <h1 class="page-title">Premium Member Leadership Directory</h1>
            <p class="lead">Browse read-only member profiles designed for stature, discoverability, and connection while keeping editing inside Profile Settings and governance review workflows.</p>
            <div class="hero-actions">
              <a id="profile-gallery-return-member" class="button-link button-link-ghost" href="${config.appBaseUrl}/member#profile">Profile Settings</a>
              <a id="profile-gallery-return-admin" class="button-link button-link-ghost" href="${config.appBaseUrl}/admin#members">Admin Member Management</a>
            </div>
          </div>
          <aside class="portal-hero-card" aria-label="Profile gallery promise">
            <div class="portal-hero-card-content">
              <p class="eyebrow">Read-Only Member View</p>
              <strong>This directory supports discovery, mentorship, and connection across IWFSA while preserving privacy, selective visibility, and admin stewardship.</strong>
              <div class="portal-hero-tags" aria-hidden="true">
                <span>Search</span>
                <span>Leadership</span>
                <span>Linked Media</span>
              </div>
            </div>
          </aside>
        </div>
        <p id="profile-gallery-status" class="muted">Checking your session and preparing the member directory.</p>
      </section>

      <section class="profile-gallery-shell" aria-label="Member profile gallery workspace">
        <aside class="panel profile-browser-rail">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Directory</p>
              <h2>Find members</h2>
            </div>
            <p class="muted">Search by name, sector, expertise, location, or leadership involvement.</p>
          </div>
          <div class="member-actions profile-browser-controls">
            <div class="profile-browser-search-shell">
              <label class="profile-browser-field" for="profile-browser-search">
                <span>Search directory</span>
                <input id="profile-browser-search" type="search" placeholder="Search member, expertise, role, city, or committee" autocomplete="off" aria-describedby="profile-browser-search-summary" aria-expanded="false" aria-controls="profile-browser-search-options" aria-autocomplete="list" />
              </label>
              <div id="profile-browser-search-options" class="profile-browser-search-options" hidden></div>
            </div>
            <label class="profile-browser-field" for="profile-browser-group">
              <span>Sector</span>
              <select id="profile-browser-group">
                <option value="">All sectors</option>
              </select>
            </label>
            <label class="profile-browser-field" for="profile-browser-standing">
              <span>Leadership area</span>
              <select id="profile-browser-standing">
                <option value="">All leadership areas</option>
              </select>
            </label>
          </div>
          <p id="profile-browser-search-summary" class="muted profile-browser-search-summary">Start typing to narrow the directory or pick a suggested name, sector, city, or expertise area.</p>
          <div id="profile-browser-list" class="profile-browser-list">
            <p class="muted">Profiles will appear here after sign-in.</p>
          </div>
        </aside>

        <section class="panel profile-browser-stage">
          <div class="profile-stage-toolbar">
            <div>
              <p class="eyebrow">Read-Only Profile</p>
              <p id="profile-stage-count" class="muted">0 profiles loaded</p>
            </div>
            <div class="member-actions member-actions-tight">
              <button id="profile-stage-prev" type="button" class="ghost">Previous member</button>
              <button id="profile-stage-next" type="button">Next member</button>
            </div>
          </div>
          <article id="profile-stage-card" class="profile-stage-card">
            <p class="muted">Select a member to open her profile.</p>
          </article>
        </section>
      </section>

      <script>
        const galleryStatus = document.getElementById("profile-gallery-status");
        const memberReturnLink = document.getElementById("profile-gallery-return-member");
        const adminReturnLink = document.getElementById("profile-gallery-return-admin");
        const browserSearchInput = document.getElementById("profile-browser-search");
        const browserSearchOptions = document.getElementById("profile-browser-search-options");
        const browserSearchSummary = document.getElementById("profile-browser-search-summary");
        const browserGroupSelect = document.getElementById("profile-browser-group");
        const browserStandingSelect = document.getElementById("profile-browser-standing");
        const browserList = document.getElementById("profile-browser-list");
        const stageCard = document.getElementById("profile-stage-card");
        const stageCount = document.getElementById("profile-stage-count");
        const stagePrevButton = document.getElementById("profile-stage-prev");
        const stageNextButton = document.getElementById("profile-stage-next");
        const SIGN_IN_URL = "${config.appBaseUrl}/sign-in";
        const EDIT_PROFILE_URL = "${config.appBaseUrl}/member#profile";
        const ADMIN_MEMBERS_URL = "${config.appBaseUrl}/admin#members";
        let allProfiles = [];
        let filteredProfiles = [];
        let selectedProfileId = 0;
        let viewedProfileIds = [];
        let searchSuggestionProfiles = [];
        let activeSearchSuggestionIndex = -1;

        function getSession() {
          const adminToken = sessionStorage.getItem("iwfsa_admin_token");
          if (adminToken) {
            return {
              token: adminToken,
              username: String(sessionStorage.getItem("iwfsa_admin_username") || "").trim(),
              role: String(sessionStorage.getItem("iwfsa_admin_role") || "admin").trim().toLowerCase()
            };
          }
          return {
            token: sessionStorage.getItem("iwfsa_token"),
            username: String(sessionStorage.getItem("iwfsa_member_username") || "").trim(),
            role: String(sessionStorage.getItem("iwfsa_member_role") || "member").trim().toLowerCase()
          };
        }

        function getToken() {
          return getSession().token;
        }

        function getStoredUsername() {
          return getSession().username;
        }

        function getStoredRole() {
          return getSession().role;
        }

        function clearStoredSession() {
          sessionStorage.removeItem("iwfsa_token");
          sessionStorage.removeItem("iwfsa_member_username");
          sessionStorage.removeItem("iwfsa_member_role");
          sessionStorage.removeItem("iwfsa_admin_token");
          sessionStorage.removeItem("iwfsa_admin_username");
          sessionStorage.removeItem("iwfsa_admin_role");
          sessionStorage.removeItem("iwfsa_admin_expires_at");
        }

        function escapeClientHtml(value) {
          return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function normalizeDisplayText(value) {
          return String(value || "").replace(/\\s+/g, " ").trim();
        }

        function isMissingDisplayText(value) {
          const normalized = normalizeDisplayText(value).toLowerCase();
          return !normalized || ["-", "--", "n/a", "na", "null", "undefined"].includes(normalized);
        }

        function displayText(value) {
          return isMissingDisplayText(value) ? "" : normalizeDisplayText(value);
        }

        function initialsFromName(fullName) {
          const parts = normalizeDisplayText(fullName).split(/\\s+/).filter(Boolean);
          if (parts.length === 0) return "?";
          const first = parts[0][0] ? parts[0][0].toUpperCase() : "?";
          const second = parts.length > 1 && parts[1][0] ? parts[1][0].toUpperCase() : "";
          return (first + second).slice(0, 2);
        }

        function currentSelectionIndex() {
          return filteredProfiles.findIndex((item) => Number(item.userId) === Number(selectedProfileId));
        }

        function profileDetails(profile) {
          return profile?.directoryDetails || {};
        }

        function profileContactPreferences(profile) {
          return profile?.contactPreferences || {};
        }

        function profileHeadline(profile) {
          const details = profileDetails(profile);
          return displayText(details.profileHeadline) || displayText(profile.businessTitle) || displayText(profile.iwfsaPosition) || "IWFSA Member";
        }

        function profileSector(profile) {
          return displayText(profileDetails(profile).industrySector);
        }

        function profileLocation(profile) {
          const details = profileDetails(profile);
          return [details.city, details.province, details.country].map(displayText).filter(Boolean).join(", ");
        }

        function profileLeadershipTags(profile) {
          const details = profileDetails(profile);
          return [...(details.committeeInvolvement || []), ...(details.leadershipProgrammeInvolvement || []), details.mentorshipRole, details.boardStatus]
            .map(displayText)
            .filter(Boolean);
        }

        function profileExpertiseTags(profile) {
          const details = profileDetails(profile);
          const tags = Array.isArray(details.expertiseTags) ? details.expertiseTags.filter(Boolean) : [];
          if (tags.length > 0) {
            return tags;
          }
          return displayText(profile.expertiseFreeText)
            ? displayText(profile.expertiseFreeText).split(",").map((item) => item.trim()).filter(Boolean)
            : [];
        }

        function profileSearchHaystack(profile) {
          return [
            profile.fullName,
            profile.username,
            profile.organisation,
            profile.businessTitle,
            profile.iwfsaPosition,
            profile.expertiseFreeText,
            profileSector(profile),
            profileLocation(profile),
            ...profileLeadershipTags(profile),
            ...profileExpertiseTags(profile)
          ]
            .map((value) => normalizeDisplayText(value).toLowerCase())
            .join(" ");
        }

        function hideSearchSuggestions() {
          searchSuggestionProfiles = [];
          activeSearchSuggestionIndex = -1;
          if (browserSearchOptions) {
            browserSearchOptions.hidden = true;
            browserSearchOptions.innerHTML = "";
          }
          if (browserSearchInput) {
            browserSearchInput.setAttribute("aria-expanded", "false");
            browserSearchInput.removeAttribute("aria-activedescendant");
          }
        }

        function searchSuggestionLabel(profile) {
          const company = displayText(profile.organisation) || profileSector(profile) || "IWFSA network";
          const location = profileLocation(profile) || "South Africa";
          return {
            name: displayText(profile.fullName) || displayText(profile.username) || "Member",
            headline: profileHeadline(profile),
            meta: company + " • " + location
          };
        }

        function updateSearchSuggestionHighlight() {
          if (!browserSearchOptions) {
            return;
          }
          const options = Array.from(browserSearchOptions.querySelectorAll("[data-profile-search-option]"));
          options.forEach((option, index) => {
            const isActive = index === activeSearchSuggestionIndex;
            option.classList.toggle("is-active", isActive);
            if (isActive) {
              browserSearchInput.setAttribute("aria-activedescendant", option.id);
            }
          });
          if (activeSearchSuggestionIndex < 0) {
            browserSearchInput.removeAttribute("aria-activedescendant");
          }
        }

        function applySearchSuggestion(profile) {
          if (!profile) {
            return;
          }
          browserSearchInput.value = displayText(profile.fullName) || displayText(profile.username) || "";
          selectedProfileId = Number(profile.userId);
          hideSearchSuggestions();
          applyFilters();
        }

        function trackViewedProfile(profileId) {
          const parsedProfileId = Number(profileId || 0);
          if (!parsedProfileId) {
            return;
          }
          viewedProfileIds = viewedProfileIds.filter((item) => Number(item) !== parsedProfileId);
          viewedProfileIds.unshift(parsedProfileId);
          viewedProfileIds = viewedProfileIds.slice(0, 8);
        }

        function renderSearchSuggestions() {
          if (!browserSearchOptions) {
            return;
          }
          const query = normalizeDisplayText(browserSearchInput.value).toLowerCase();
          const sector = normalizeDisplayText(browserGroupSelect.value);
          const leadership = normalizeDisplayText(browserStandingSelect.value);
          if (!query) {
            hideSearchSuggestions();
            return;
          }

          searchSuggestionProfiles = allProfiles
            .filter((profile) => {
              if (profileContactPreferences(profile).publicProfileEnabled === false) {
                return false;
              }
              if (sector && profileSector(profile) !== sector) {
                return false;
              }
              const leadershipTags = profileLeadershipTags(profile);
              if (leadership && !leadershipTags.includes(leadership)) {
                return false;
              }
              return profileSearchHaystack(profile).includes(query);
            })
            .slice(0, 6);

          if (!searchSuggestionProfiles.length) {
            hideSearchSuggestions();
            return;
          }

          activeSearchSuggestionIndex = 0;
          browserSearchOptions.hidden = false;
          browserSearchInput.setAttribute("aria-expanded", "true");
          browserSearchOptions.innerHTML = searchSuggestionProfiles
            .map((profile, index) => {
              const label = searchSuggestionLabel(profile);
              return "<button type='button' id='profile-search-option-" + String(profile.userId) + "' class='profile-browser-search-option" + (index === 0 ? " is-active" : "") + "' data-profile-search-option data-profile-search-id='" + String(profile.userId) + "'>" +
                "<span class='profile-browser-search-badge' aria-hidden='true'>" + escapeClientHtml(initialsFromName(profile.fullName)) + "</span>" +
                "<span class='profile-browser-search-copy'><strong>" + escapeClientHtml(label.name) + "</strong><span>" + escapeClientHtml(label.headline) + "</span><span>" + escapeClientHtml(label.meta) + "</span></span>" +
                "</button>";
            })
            .join("");
          updateSearchSuggestionHighlight();
        }

        function renderBrowserList() {
          if (!filteredProfiles.length) {
            browserList.innerHTML = "<p class='muted'>No member profiles match the current filters.</p>";
            stageCount.textContent = "0 matching profiles";
            stagePrevButton.disabled = true;
            stageNextButton.disabled = true;
            stageCard.innerHTML = "<p class='muted'>Adjust the filters to continue browsing.</p>";
            return;
          }

          stageCount.textContent = String(filteredProfiles.length) + (filteredProfiles.length === 1 ? " member profile" : " member profiles");
          browserList.innerHTML = filteredProfiles
            .map((profile) => {
              const details = profileDetails(profile);
              const isActive = Number(profile.userId) === Number(selectedProfileId);
              const name = escapeClientHtml(displayText(profile.fullName) || profile.username || "Member");
              const company = escapeClientHtml(profileSector(profile) || displayText(profile.organisation) || "Leadership network");
              const title = escapeClientHtml(profileHeadline(profile));
              const location = escapeClientHtml(profileLocation(profile) || "South Africa");
              const avatar = profile.photoUrl
                ? "<img class='profile-browser-avatar' alt='Portrait of " + name + "' src='" + escapeClientHtml(profile.photoUrl) + "' />"
                : "<div class='profile-browser-avatar profile-browser-avatar-fallback' aria-hidden='true'>" + escapeClientHtml(initialsFromName(profile.fullName)) + "</div>";
              return (
                "<button type='button' class='profile-browser-item" + (isActive ? " is-active" : "") + "' data-profile-browse-id='" + String(profile.userId) + "'>" +
                "<span class='profile-browser-visual'>" + avatar + "</span>" +
                "<span class='profile-browser-copy'><strong>" + name + "</strong><span>" + title + "</span><span>" + company + " | " + location + "</span>" +
                (displayText(details.featuredQuote) ? "<span class='profile-browser-quote'>&ldquo;" + escapeClientHtml(displayText(details.featuredQuote)) + "&rdquo;</span>" : "") +
                "<span class='profile-browser-link'>Open full profile</span>" +
                "</span>" +
                "</button>"
              );
            })
            .join("");
        }

        function renderProfileCard() {
          const profile = filteredProfiles.find((item) => Number(item.userId) === Number(selectedProfileId));
          const index = currentSelectionIndex();
          stagePrevButton.disabled = index <= 0;
          stageNextButton.disabled = index < 0 || index >= filteredProfiles.length - 1;

          if (!profile) {
            stageCard.innerHTML = "<p class='muted'>Select a member to open a profile.</p>";
            return;
          }

          const storedUsername = getStoredUsername();
          const storedRole = getStoredRole();
          const details = profileDetails(profile);
          const contactPrefs = profileContactPreferences(profile);
          trackViewedProfile(profile.userId);
          const isSelf = storedUsername && normalizeDisplayText(profile.username).toLowerCase() === storedUsername.toLowerCase();
          const groups = Array.isArray(profile.groups) ? profile.groups.filter(Boolean) : [];
          const location = profileLocation(profile);
          const expertiseTags = profileExpertiseTags(profile);
          const professionalHighlights = Array.isArray(details.achievements) ? details.achievements.filter(Boolean) : [];
          const leadershipTags = profileLeadershipTags(profile);
          const galleryItems = contactPrefs.showGallery === false ? [] : (Array.isArray(profile.galleryItems) ? profile.galleryItems : []);
          const viewedProfiles = viewedProfileIds
            .map((profileId) => allProfiles.find((item) => Number(item.userId) === Number(profileId)))
            .filter(Boolean);
          const links = [];
          if (contactPrefs.showLinkedIn !== false && displayText(profile.linkedinUrl)) {
            links.push({ label: "LinkedIn", url: profile.linkedinUrl });
          }
          if (contactPrefs.showLinkedIn !== false && displayText(details.website)) {
            links.push({ label: "Website", url: details.website });
          }
          if (Array.isArray(profile.professionalLinks)) {
            for (const link of profile.professionalLinks) {
              if (displayText(link?.url)) {
                links.push({ label: displayText(link?.label) || "Profile link", url: link.url });
              }
            }
          }

          const avatar = profile.photoUrl
            ? "<img class='profile-stage-photo' alt='Portrait of " + escapeClientHtml(displayText(profile.fullName) || profile.username || "Member") + "' src='" + escapeClientHtml(profile.photoUrl) + "' />"
            : "<div class='profile-stage-photo profile-stage-photo-fallback' aria-hidden='true'>" + escapeClientHtml(initialsFromName(profile.fullName)) + "</div>";
          const chips = [profileSector(profile), ...leadershipTags.slice(0, 2), ...groups.slice(0, 2)]
            .map(displayText)
            .filter(Boolean)
            .map((group) => "<span class='profile-directory-chip'>" + escapeClientHtml(group) + "</span>")
            .join("") || "<span class='profile-directory-chip'>IWFSA</span>";
          const linkHtml = links.length
            ? "<div class='profile-stage-links'>" +
              links
                .map((link) => "<a target='_blank' rel='noreferrer' class='button-link button-link-ghost' href='" + escapeClientHtml(link.url) + "'>" + escapeClientHtml(link.label) + "</a>")
                .join("") +
              "</div>"
            : "<p class='muted'>No external profile links are published yet.</p>";
          const editLink = isSelf && (storedRole === "member" || storedRole === "event_editor")
            ? "<a class='button-link' href='" + EDIT_PROFILE_URL + "'>View My Profile Settings</a>"
            : storedRole === "admin" || storedRole === "chief_admin"
              ? "<a class='button-link button-link-ghost' href='" + ADMIN_MEMBERS_URL + "'>Open admin member controls</a>"
              : "";
          const galleryHtml = galleryItems.length
            ? "<div class='profile-media-grid'>" +
              galleryItems
                .slice(0, 6)
                .map((item) => "<figure class='profile-media-card'><img loading='lazy' src='" + escapeClientHtml(item.imageUrl || item.thumbnailUrl || "") + "' alt='" + escapeClientHtml(item.caption || displayText(profile.fullName) || "Linked media") + "' /><figcaption>" + escapeClientHtml(displayText(item.caption) || displayText(item.sourceLabel) || "Linked media") + "</figcaption></figure>")
                .join("") +
              "</div>"
            : "<p class='muted'>This member has not published gallery media yet, or the gallery is limited to a more private audience.</p>";
          const contactHtml = [
            contactPrefs.showEmail && displayText(profile.email) ? "<div><dt>Email</dt><dd><a href='mailto:" + encodeURIComponent(profile.email) + "'>" + escapeClientHtml(profile.email) + "</a></dd></div>" : "",
            contactPrefs.showPhone && displayText(profile.phone) ? "<div><dt>Phone</dt><dd>" + escapeClientHtml(displayText(profile.phone)) + "</dd></div>" : "",
            "<div><dt>Location</dt><dd>" + (contactPrefs.showLocation === false ? "<span class='muted'>Hidden by member preference</span>" : escapeClientHtml(location || "Not shared")) + "</dd></div>",
            "<div><dt>Member cycle</dt><dd>" + escapeClientHtml(profile.membershipCycleYear ? String(profile.membershipCycleYear) : "Current") + "</dd></div>"
          ].filter(Boolean).join("");
          const viewedProfilesHtml = viewedProfiles.length
            ? "<section class='profile-stage-collection' aria-label='Viewed profiles'><div class='profile-stage-collection-heading'><div><p class='eyebrow'>Browsing path</p><h3>Viewed on this page</h3></div><p class='muted'>Keep paging, then jump back to any member you opened.</p></div><div class='profile-stage-collection-list'>" +
              viewedProfiles
                .map((item, itemIndex) => {
                  const displayName = displayText(item.fullName) || displayText(item.username) || "Member";
                  const thumb = item.photoUrl
                    ? "<img class='profile-stage-collection-avatar' alt='Portrait of " + escapeClientHtml(displayName) + "' src='" + escapeClientHtml(item.photoUrl) + "' />"
                    : "<span class='profile-stage-collection-avatar profile-stage-collection-avatar-fallback' aria-hidden='true'>" + escapeClientHtml(initialsFromName(item.fullName)) + "</span>";
                  return "<button type='button' class='profile-stage-collection-item" + (Number(item.userId) === Number(selectedProfileId) ? " is-active" : "") + "' data-profile-history-id='" + String(item.userId) + "'>" + thumb + "<span class='profile-stage-collection-copy'><strong>" + escapeClientHtml(displayName) + "</strong><span>Page " + String(itemIndex + 1) + " in your browse list</span></span></button>";
                })
                .join("") +
              "</div></section>"
            : "";
          const stagePageSummary = filteredProfiles.length ? "Profile page " + String(index + 1) + " of " + String(filteredProfiles.length) : "Profile page 0 of 0";

          stageCard.innerHTML =
            viewedProfilesHtml +
            "<div class='profile-stage-hero'>" +
            "<div class='profile-stage-media'>" + avatar + "</div>" +
            "<div class='profile-stage-copy'>" +
            "<p class='eyebrow'>Read-only profile</p>" +
            "<p class='profile-stage-page-marker'>" + escapeClientHtml(stagePageSummary) + "</p>" +
            "<h2>" + escapeClientHtml(displayText(profile.fullName) || profile.username || "Member") + "</h2>" +
            "<p class='profile-stage-role'>" + escapeClientHtml(profileHeadline(profile)) + "</p>" +
            "<p class='profile-stage-company'>" + escapeClientHtml(displayText(profile.organisation) || "International Women's Forum South Africa") + "</p>" +
            "<p class='profile-stage-company'>" + escapeClientHtml(location || "South Africa") + "</p>" +
            "<div class='profile-stage-chips'>" + chips + "</div>" +
            "<p class='profile-stage-bio'>" + escapeClientHtml(displayText(details.bioShort) || displayText(profile.bio) || "This member has not published a biography yet.") + "</p>" +
            (displayText(details.featuredQuote) ? "<blockquote class='profile-stage-quote'>" + escapeClientHtml(displayText(details.featuredQuote)) + "</blockquote>" : "") +
            (editLink ? "<div class='hero-actions'>" + editLink + "</div>" : "") +
            "</div>" +
            "</div>" +
            "<div class='profile-stage-grid'>" +
            "<div class='profile-stage-panel'><h3>About</h3><p>" + escapeClientHtml(displayText(details.bioLong) || displayText(profile.bio) || "No extended profile narrative has been published yet.") + "</p></div>" +
            "<div class='profile-stage-panel'><h3>Professional Highlights</h3>" + (contactPrefs.showProfessionalHighlights === false ? "<p class='muted'>Professional highlights are hidden by member preference.</p>" : professionalHighlights.length ? "<ul class='profile-stage-list'>" + professionalHighlights.map((item) => "<li>" + escapeClientHtml(item) + "</li>").join("") + "</ul>" : "<p class='muted'>Highlights have not been published yet.</p>") + "</div>" +
            "<div class='profile-stage-panel'><h3>Leadership &amp; Governance</h3>" + (leadershipTags.length ? "<ul class='profile-stage-list'>" + leadershipTags.map((item) => "<li>" + escapeClientHtml(item) + "</li>").join("") + "</ul>" : "<p class='muted'>Leadership roles have not been listed yet.</p>") + "</div>" +
            "<div class='profile-stage-panel'><h3>Advancing Women</h3><p>" + escapeClientHtml(displayText(details.contributionsToWomenLeadership) || displayText(details.mentorshipRole) || "Mentorship and contribution notes have not been published yet.") + "</p></div>" +
            "<div class='profile-stage-panel'><h3>Expertise Tags</h3>" + (expertiseTags.length ? "<div class='profile-stage-chips'>" + expertiseTags.map((item) => "<span class='profile-directory-chip'>" + escapeClientHtml(item) + "</span>").join("") + "</div>" : "<p class='muted'>Expertise tags are not available yet.</p>") + "</div>" +
            "<div class='profile-stage-panel'><h3>Contact and links</h3>" + linkHtml + "</div>" +
            "<div class='profile-stage-panel'><h3>Contact Preferences</h3><dl class='profile-stage-facts'>" + contactHtml + "</dl></div>" +
            "</div>" +
            "<div class='profile-stage-panel profile-stage-panel-wide'><h3>Photos &amp; Media</h3>" + galleryHtml + "</div>" +
            "<div class='profile-stage-panel profile-stage-panel-wide'><h3>Read-only notice</h3><p>This is a read-only member profile. Only the member herself and authorised administrators can update profile information, visibility settings, and linked media.</p></div>";
        }

        function applyFilters() {
          const query = normalizeDisplayText(browserSearchInput.value).toLowerCase();
          const sector = normalizeDisplayText(browserGroupSelect.value);
          const leadership = normalizeDisplayText(browserStandingSelect.value);

          filteredProfiles = allProfiles.filter((profile) => {
            if (profileContactPreferences(profile).publicProfileEnabled === false) {
              return false;
            }
            if (sector && profileSector(profile) !== sector) {
              return false;
            }
            const leadershipTags = profileLeadershipTags(profile);
            if (leadership && !leadershipTags.includes(leadership)) {
              return false;
            }
            if (!query) {
              return true;
            }
            const haystack = [
              profile.fullName
            ];
            return profileSearchHaystack(profile).includes(query);
          });

          filteredProfiles.sort((left, right) =>
            String(left.fullName || left.username || "").localeCompare(String(right.fullName || right.username || ""))
          );

          if (!filteredProfiles.some((item) => Number(item.userId) === Number(selectedProfileId))) {
            selectedProfileId = filteredProfiles[0] ? Number(filteredProfiles[0].userId) : 0;
          }

          if (browserSearchSummary) {
            const activeFilters = [];
            if (query) {
              activeFilters.push("search '" + normalizeDisplayText(browserSearchInput.value) + "'");
            }
            if (sector) {
              activeFilters.push("sector " + sector);
            }
            if (leadership) {
              activeFilters.push("leadership " + leadership);
            }
            browserSearchSummary.textContent = filteredProfiles.length
              ? "Showing " + String(filteredProfiles.length) + " of " + String(allProfiles.length) + " profiles" + (activeFilters.length ? " for " + activeFilters.join(", ") : ".")
              : "No members match the current search and filter combination.";
          }

          renderSearchSuggestions();
          renderBrowserList();
          renderProfileCard();
        }

        function populateGroupFilter() {
          const currentValue = browserGroupSelect.value;
          const currentLeadershipValue = browserStandingSelect.value;
          const sectors = new Set();
          const leadershipAreas = new Set();
          for (const profile of allProfiles) {
            const sector = profileSector(profile);
            if (sector) {
              sectors.add(sector);
            }
            for (const item of profileLeadershipTags(profile)) {
              if (item) {
                leadershipAreas.add(item);
              }
            }
          }
          browserGroupSelect.innerHTML = "<option value=''>All sectors</option>" +
            Array.from(sectors)
              .sort((left, right) => left.localeCompare(right))
              .map((group) => "<option value='" + escapeClientHtml(group) + "'>" + escapeClientHtml(group) + "</option>")
              .join("");
          browserStandingSelect.innerHTML = "<option value=''>All leadership areas</option>" +
            Array.from(leadershipAreas)
              .sort((left, right) => left.localeCompare(right))
              .map((item) => "<option value='" + escapeClientHtml(item) + "'>" + escapeClientHtml(item) + "</option>")
              .join("");
          browserGroupSelect.value = Array.from(sectors).includes(currentValue) ? currentValue : "";
          browserStandingSelect.value = Array.from(leadershipAreas).includes(currentLeadershipValue) ? currentLeadershipValue : "";
        }

        function pickInitialProfile() {
          const params = new URLSearchParams(window.location.search);
          const requestedMember = normalizeDisplayText(params.get("member"));
          const storedUsername = getStoredUsername();
          if (requestedMember.toLowerCase() === "self" && storedUsername) {
            const selfProfile = allProfiles.find((item) => normalizeDisplayText(item.username).toLowerCase() === storedUsername.toLowerCase());
            if (selfProfile) {
              return Number(selfProfile.userId);
            }
          }
          if (requestedMember) {
            const requestedProfile = allProfiles.find((item) => normalizeDisplayText(item.username).toLowerCase() === requestedMember.toLowerCase());
            if (requestedProfile) {
              return Number(requestedProfile.userId);
            }
          }
          return allProfiles[0] ? Number(allProfiles[0].userId) : 0;
        }

        async function loadProfiles() {
          const token = getToken();
          if (!token) {
            window.location.replace(SIGN_IN_URL);
            return;
          }

          galleryStatus.textContent = "Loading member profiles...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/member/profiles?limit=150", {
              headers: { Authorization: "Bearer " + token }
            });
            const payload = await response.json();
            if (!response.ok) {
              if (response.status === 401) {
                clearStoredSession();
                window.location.replace(SIGN_IN_URL);
                return;
              }
              galleryStatus.textContent = payload.message || "Unable to load member profiles.";
              return;
            }
            allProfiles = Array.isArray(payload.items) ? payload.items : [];
            selectedProfileId = pickInitialProfile();
            populateGroupFilter();
            applyFilters();
            galleryStatus.textContent = "Read-only profile gallery ready.";
          } catch {
            galleryStatus.textContent = "Unable to reach the API for member profiles.";
          }
        }

        browserSearchInput.addEventListener("input", applyFilters);
        browserSearchInput.addEventListener("focus", () => {
          renderSearchSuggestions();
        });
        browserSearchInput.addEventListener("keydown", (event) => {
          if (!searchSuggestionProfiles.length) {
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            activeSearchSuggestionIndex = (activeSearchSuggestionIndex + 1) % searchSuggestionProfiles.length;
            updateSearchSuggestionHighlight();
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            activeSearchSuggestionIndex = activeSearchSuggestionIndex <= 0 ? searchSuggestionProfiles.length - 1 : activeSearchSuggestionIndex - 1;
            updateSearchSuggestionHighlight();
            return;
          }
          if (event.key === "Enter" && activeSearchSuggestionIndex >= 0) {
            event.preventDefault();
            applySearchSuggestion(searchSuggestionProfiles[activeSearchSuggestionIndex]);
            return;
          }
          if (event.key === "Escape") {
            hideSearchSuggestions();
          }
        });
        browserSearchInput.addEventListener("blur", () => {
          setTimeout(() => {
            hideSearchSuggestions();
          }, 120);
        });
        browserGroupSelect.addEventListener("change", applyFilters);
        browserStandingSelect.addEventListener("change", applyFilters);
        if (browserSearchOptions) {
          browserSearchOptions.addEventListener("mousedown", (event) => {
            event.preventDefault();
          });
          browserSearchOptions.addEventListener("click", (event) => {
            const trigger = event.target instanceof Element ? event.target.closest("[data-profile-search-id]") : null;
            if (!trigger) return;
            const profileId = Number(trigger.getAttribute("data-profile-search-id") || 0);
            const profile = searchSuggestionProfiles.find((item) => Number(item.userId) === profileId);
            applySearchSuggestion(profile || null);
          });
        }
        browserList.addEventListener("click", (event) => {
          const trigger = event.target instanceof Element ? event.target.closest("[data-profile-browse-id]") : null;
          if (!trigger) return;
          selectedProfileId = Number(trigger.getAttribute("data-profile-browse-id") || 0);
          hideSearchSuggestions();
          renderBrowserList();
          renderProfileCard();
        });
        stageCard.addEventListener("click", (event) => {
          const trigger = event.target instanceof Element ? event.target.closest("[data-profile-history-id]") : null;
          if (!trigger) return;
          selectedProfileId = Number(trigger.getAttribute("data-profile-history-id") || 0);
          renderBrowserList();
          renderProfileCard();
        });
        stagePrevButton.addEventListener("click", () => {
          const index = currentSelectionIndex();
          if (index > 0) {
            selectedProfileId = Number(filteredProfiles[index - 1].userId);
            renderBrowserList();
            renderProfileCard();
          }
        });
        stageNextButton.addEventListener("click", () => {
          const index = currentSelectionIndex();
          if (index >= 0 && index < filteredProfiles.length - 1) {
            selectedProfileId = Number(filteredProfiles[index + 1].userId);
            renderBrowserList();
            renderProfileCard();
          }
        });

        document.querySelectorAll(".session-nav-signout").forEach((button) => {
          button.hidden = false;
          button.addEventListener("click", () => {
            clearStoredSession();
            window.location.assign(SIGN_IN_URL);
          });
        });

        const role = getStoredRole();
        memberReturnLink.hidden = role === "admin" || role === "chief_admin";
        adminReturnLink.hidden = !(role === "admin" || role === "chief_admin");
        loadProfiles();
      </script>
    `
  });
}

export function renderAdminPage(config) {
  return htmlLayout({
    title: "IWFSA | Admin Console",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/admin",
    pageClass: "page-admin",
    body: `
      <div id="admin-root">
        <section class="panel panel-hero portal-hero">
          <div class="header-cluster">
              <div>
                <p class="eyebrow">Operations</p>
                <h1 class="page-title">Admin Console</h1>
                <p class="lead">
                  Governance-first controls for members, imports, event operations, delivery monitoring, reporting,
                  and celebration moderation.
                </p>
                <p class="muted">
                  The system opens this console automatically for accounts with administrator permissions.
                </p>
              </div>
              <aside class="portal-hero-card" aria-label="Admin console areas">
                <div class="portal-hero-card-content">
                  <p class="eyebrow">Governance Console</p>
                  <strong>Use one navigation set for overview, members, fees, imports, event operations, notifications, news, reports, and audit.</strong>
                  <p class="muted">Audit opens the membership and fees workspace so governance history stays with the operational records.</p>
                </div>
              </aside>
           </div>

          <nav class="module-nav" id="admin-nav" aria-label="Admin modules">
             <a href="#overview" class="module-nav-link" data-module="overview" data-admin-module-link="overview">Overview</a>
             <a href="#members" class="module-nav-link" data-module="members" data-admin-module-link="members">Members</a>
             <a href="#fees" class="module-nav-link" data-module="fees" data-admin-module-link="fees">Membership &amp; Fees</a>
             <a href="#audit" class="module-nav-link" data-module="audit" data-admin-module-link="audit">Audit</a>
             <a href="#imports" class="module-nav-link" data-module="imports" data-admin-module-link="imports">Imports</a>
             <a href="#events" class="module-nav-link" data-module="events" data-admin-module-link="events">Event Hub</a>
             <a href="#notifications" class="module-nav-link" data-module="notifications" data-admin-module-link="notifications">Notifications</a>
             <a href="#news" class="module-nav-link" data-module="news" data-admin-module-link="news">News</a>
             <a href="#reports" class="module-nav-link" data-module="reports" data-admin-module-link="reports">Reports</a>
          </nav>
          <div id="admin-session-bar" class="session-bar admin-session-bar" hidden>
            <p id="admin-session-summary" class="sr-only">Admin console session active.</p>
          </div>
        </section>

          <section id="module-overview" class="panel module-section">
             <p class="muted">Select a module to manage the platform.</p>
             <div class="dashboard-cards">
                <button type="button" class="dashboard-card" onclick="window.location.hash='#events'">
                   <h4>Event Hub</h4>
                   <p>Manage drafts, publish meetings, and track RSVPs.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#members'">
                   <h4>Member Directory</h4>
                   <p>Onboard members and manage groups.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#fees'">
                   <h4>Membership &amp; Fees</h4>
                   <p>Run annual cycle checks and standing/access controls.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#imports'">
                   <h4>Bulk Import</h4>
                   <p>Upload member spreadsheets.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#notifications'">
                   <h4>Notifications</h4>
                   <p>Monitor delivery health and queues.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#news'">
                   <h4>Member News</h4>
                   <p>Publish curated IWFSA updates for the member dashboard.</p>
                </button>
                <button type="button" class="dashboard-card" onclick="window.location.hash='#reports'">
                   <h4>Reporting</h4>
                   <p>Review engagement metrics, SMS activity, and moderation controls.</p>
                </button>
             </div>
             <div class="admin-card public-hero-settings-card" data-admin-panel="public_page_hero">
               <div class="section-heading historical-heading">
                 <div>
                   <p class="eyebrow">Public Surface</p>
                   <h3>Public Page Hero</h3>
                 </div>
                 <div class="member-actions">
                   <button id="public-hero-refresh" type="button" disabled>Refresh hero settings</button>
                   <a class="button-link button-link-ghost" href="${config.appBaseUrl}/" target="_blank" rel="noreferrer">Open public page</a>
                 </div>
               </div>
               <p class="muted">Only admin and chief admin can change the lead image on the public homepage. Use either a stable https image link or upload a file into the site.</p>
               <div class="public-hero-settings-grid">
                 <div class="public-hero-settings-form-shell">
                   <form id="public-hero-settings-form" class="login-form" enctype="multipart/form-data">
                     <label for="public-hero-image-url">Linked image URL</label>
                     <input id="public-hero-image-url" type="url" maxlength="2048" placeholder="https://cdn.example.com/iwfsa-public-hero.jpg" disabled />
                     <label for="public-hero-upload-file">Upload image into the site</label>
                     <input id="public-hero-upload-file" type="file" accept="image/jpeg,image/png,image/webp" disabled />
                     <label for="public-hero-alt-text">Alt text</label>
                     <textarea id="public-hero-alt-text" rows="3" maxlength="280" placeholder="Describe the people, setting, and purpose of the image for screen-reader users." disabled></textarea>
                     <label for="public-hero-focal-point">Crop focus</label>
                     <select id="public-hero-focal-point" disabled>
                       <option value="top">Top focus</option>
                       <option value="center">Centre focus</option>
                       <option value="bottom">Bottom focus</option>
                       <option value="left">Left focus</option>
                       <option value="right">Right focus</option>
                     </select>
                     <div class="public-hero-settings-actions">
                       <button id="public-hero-save-link" type="button" disabled>Save linked image</button>
                       <button id="public-hero-upload-button" type="button" disabled>Upload to site</button>
                       <button id="public-hero-reset-button" type="button" class="ghost" disabled>Use default image</button>
                     </div>
                   </form>
                   <ul class="public-hero-guidance">
                     <li>Use a landscape image, ideally 1600 x 900 or larger, so it stays sharp on wide screens.</li>
                     <li>Keep the main subject in the upper middle of the image because the homepage crop uses a 16:9 cover frame.</li>
                     <li>JPG, PNG, or WebP uploads are accepted up to 5 MB. Avoid text-heavy or overly busy images.</li>
                     <li>Add alt text that describes the scene and purpose, not just the file name.</li>
                   </ul>
                   <p id="public-hero-status" class="muted">Sign in to manage the public page hero image.</p>
                 </div>
                 <aside class="public-hero-preview-shell" aria-label="Public hero preview">
                   <p class="eyebrow">Preview</p>
                   <div class="featured-photo-frame public-hero-admin-preview-frame">
                     <img
                       id="public-hero-preview-image"
                       class="featured-hero-image"
                       src="${config.appBaseUrl}/assets/iwfsa-home.jpg?v=${UI_BUILD}-public-refresh"
                       alt="Default public page hero preview"
                       loading="lazy"
                       decoding="async"
                     />
                   </div>
                   <p id="public-hero-preview-caption" class="muted">Default site image with the homepage crop applied.</p>
                 </aside>
               </div>
             </div>
          </section>

          <div id="module-members" class="module-section">
             <div class="admin-card" data-admin-panel="member_directory">
                <h3>Member Directory</h3>
                <div id="member-directory-help" class="help-banner">
                  <p class="muted">Select members to send onboarding invite links or credential reset links.</p>
                  <button type="button" class="help-dismiss" aria-label="Dismiss help" onclick="window.iwfsaDismissHelp('member-directory-help')">&times;</button>
                </div>
                <div class="member-actions">
                  <button id="refresh-members" type="button">Refresh list</button>
                  <button id="queue-invites" type="button" disabled>Send invite links</button>
                  <button id="queue-resets" type="button" disabled>Queue credential resets</button>
                  <a class="button-link button-link-ghost" href="${config.appBaseUrl}/profiles">Open read-only profile gallery</a>
                  <span id="member-count" class="muted"></span>
                </div>
                <!-- ..rest of member directory.. -->
                <div class="member-actions member-directory-controls" aria-label="Member directory filters">
                  <div class="member-search-wrap" id="member-search-wrap">
                    <input id="member-search" type="search" autocomplete="off" placeholder="Search name, email, organisation, or group" title="Start typing to filter the member list and pick a suggested member." />
                    <div id="member-search-dropdown" class="member-search-dropdown" role="listbox" hidden></div>
                  </div>
                  <select id="member-status-filter" aria-label="Filter members by status" title="Show members by current status such as active, invited, or paused.">
                    <option value="">All statuses</option>
                  </select>
                  <select id="member-role-filter" aria-label="Filter members by role" title="Limit the member list to one role.">
                    <option value="">All roles</option>
                  </select>
                  <select id="member-group-filter" aria-label="Filter members by group" title="Show only members assigned to a selected group.">
                    <option value="">All groups</option>
                  </select>
                  <select id="member-sort" aria-label="Sort member list" title="Choose how the filtered member list is ordered.">
                    <option value="name">Name A-Z</option>
                    <option value="organisation">Organisation A-Z</option>
                    <option value="status">Status</option>
                    <option value="recent">Newest first</option>
                  </select>
                  <button id="member-filter-reset" type="button" class="ghost" title="Clear the search, dropdown filters, and sort order.">Reset filters</button>
                </div>
                <div id="member-selection-basket" class="member-selection-basket" hidden>
                  <div class="msb-header">
                    <span class="msb-label">Selected members</span>
                    <button id="member-basket-clear" type="button" class="ghost-link">Clear all</button>
                  </div>
                  <div id="member-selection-chips" class="member-selection-chips"></div>
                </div>
                <form id="member-add-form" class="login-form member-add-form">
                  <div>
                    <label for="member-add-name">Full name</label>
                    <input id="member-add-name" name="fullName" autocomplete="name" required />
                  </div>
                  <div>
                    <label for="member-add-email">Email</label>
                    <input id="member-add-email" name="email" type="email" autocomplete="email" required />
                  </div>
                  <div>
                    <label for="member-add-organisation">Organisation</label>
                    <input id="member-add-organisation" name="company" autocomplete="organization" maxlength="180" />
                  </div>
                  <fieldset class="group-picker-fieldset field-span-full">
                    <legend>Group memberships</legend>
                    <p class="muted group-picker-help">Select one or more groups for targeted event visibility and invites.</p>
                    <div id="member-add-groups" class="group-picker"></div>
                  </fieldset>
                  <button type="submit">Add member</button>
                </form>
                <p id="member-add-status" class="muted"></p>
                <p id="member-status" class="muted">Loading members...</p>
                <pre id="member-output" class="muted"></pre>
                <div class="table-shell">
                  <table class="member-table">
                    <thead>
                      <tr>
                        <th><input id="select-all-members" type="checkbox" /></th>
                        <th>Name</th>
                <th>Organisation</th>
                <th>Membership</th>
                <th>Email</th>
                <th>Cell Phone</th>
                <th>Groups</th>
              </tr>
            </thead>
            <tbody id="member-table-body">
              <tr><td colspan="7" class="muted">Loading members...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="member-detail-shell" class="admin-card member-detail-card" hidden>
          <div class="member-detail-header">
            <div>
              <h4 id="member-detail-title">Member details</h4>
              <p id="member-detail-summary" class="muted">Select a member name to review and edit personal details.</p>
            </div>
            <button id="member-detail-close" type="button" class="ghost-link">Close</button>
          </div>
          <form id="member-detail-form" class="login-form member-detail-form">
            <div class="member-detail-form-grid">
              <div>
                <label for="member-detail-full-name">Full name</label>
                <input id="member-detail-full-name" maxlength="160" required />
              </div>
              <div>
                <label for="member-detail-email">Email</label>
                <input id="member-detail-email" type="email" maxlength="160" required />
              </div>
              <div>
                <label for="member-detail-company">Organisation</label>
                <input id="member-detail-company" maxlength="180" />
              </div>
              <div>
                <label for="member-detail-phone">Cell phone</label>
                <input id="member-detail-phone" maxlength="48" placeholder="+27 82 123 4567" />
              </div>
              <div>
                <label for="member-detail-business-title">Professional title</label>
                <input id="member-detail-business-title" maxlength="120" />
              </div>
              <div>
                <label for="member-detail-iwfsa-position">IWFSA position</label>
                <input id="member-detail-iwfsa-position" maxlength="160" />
              </div>
              <div class="field-span-full">
                <label for="member-detail-linkedin-url">LinkedIn URL</label>
                <input id="member-detail-linkedin-url" maxlength="2048" placeholder="https://www.linkedin.com/in/..." />
              </div>
              <div class="field-span-full">
                <label for="member-detail-expertise">Professional links or expertise</label>
                <input id="member-detail-expertise" maxlength="300" />
              </div>
              <div class="field-span-full">
                <label for="member-detail-bio">Short biography</label>
                <textarea id="member-detail-bio" rows="4" maxlength="300"></textarea>
              </div>
              <fieldset class="group-picker-fieldset field-span-full">
                <legend>Group memberships</legend>
                <p class="muted group-picker-help">Update the member's group access and event visibility.</p>
                <div id="member-detail-groups" class="group-picker"></div>
                <button id="member-detail-add-group" type="button" class="group-add-btn">+ Assign to a group…</button>
              </fieldset>
            </div>
            <div class="member-actions">
              <button id="member-detail-save" type="submit">Save member details</button>
            </div>
            <p id="member-detail-status" class="muted">Select a member name to edit their record.</p>
          </form>
        </div>
     </div>
        <div id="group-assign-dialog" class="group-assign-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="group-assign-title">
          <div class="group-assign-backdrop"></div>
          <div class="group-assign-panel">
            <div id="group-assign-picker">
              <h4 id="group-assign-title">Assign members to group</h4>
              <p id="group-assign-subtitle" class="muted"></p>
              <label for="group-assign-select" class="group-assign-label">Choose group to assign</label>
              <select id="group-assign-select" class="group-assign-select">
                <option value="" disabled selected>— Select a group —</option>
              </select>
              <p id="group-assign-preview" class="group-assign-preview" hidden></p>
              <div class="group-assign-actions">
                <button id="group-assign-continue" type="button">Continue</button>
                <button id="group-assign-abort" type="button" class="ghost">Cancel</button>
              </div>
            </div>
            <div id="group-assign-confirm" hidden>
              <h4 id="group-assign-question"></h4>
              <p id="group-assign-detail" class="muted"></p>
              <div class="group-assign-actions">
                <button id="group-assign-yes" type="button">Yes, assign</button>
                <button id="group-assign-skip" type="button" class="ghost">Skip</button>
                <button id="group-assign-cancel" type="button" class="ghost">Cancel all</button>
              </div>
            </div>
            <p id="group-assign-status" class="muted"></p>
          </div>
        </div>
     <div class="admin-card" data-admin-panel="public_profile_reviews">
        <h3>Public Profile Review</h3>
        <p class="muted">Review member requests for public-facing profile fields before they appear outside the portal.</p>
        <div class="member-actions">
          <button id="refresh-profile-reviews" type="button" disabled>Refresh review queue</button>
        </div>
        <p id="profile-review-status" class="muted">Sign in to review public profile submissions.</p>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Requested fields</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="profile-review-table-body">
              <tr><td colspan="4" class="muted">Sign in to load public profile submissions.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <section class="historical-section" data-admin-panel="historical_figures" aria-labelledby="historical-figures-title">
        <div class="section-heading historical-heading">
          <div>
            <p class="eyebrow">Institutional memory</p>
            <h3 id="historical-figures-title">Historical Figures &amp; Past Members</h3>
          </div>
          <p class="muted">Maintain the significant figures, honorary members, memorial records, and past members who helped establish and shape the organisation.</p>
        </div>
        <div class="historical-grid">
      <article class="historical-panel" data-admin-panel="honorary_members">
        <h4>Honorary Members</h4>
        <p class="muted">Record significant leaders and honorary members whose service, founding work, or contribution should remain part of IWFSA's institutional history.</p>
        <form id="honorary-member-form" class="login-form">
          <label for="honorary-member-full-name">Full name</label>
          <input id="honorary-member-full-name" maxlength="160" disabled />
          <label for="honorary-member-title">Title</label>
          <input id="honorary-member-title" maxlength="160" disabled />
          <label for="honorary-member-organisation">Organisation</label>
          <input id="honorary-member-organisation" maxlength="180" disabled />
          <label for="honorary-member-citation">Citation</label>
          <textarea id="honorary-member-citation" rows="3" maxlength="320" disabled></textarea>
          <label for="honorary-member-status">Status</label>
          <select id="honorary-member-status" disabled>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button id="honorary-member-submit" type="submit" disabled>Create honorary member</button>
        </form>
        <p id="honorary-member-status-text" class="muted">Sign in to manage honorary member entries.</p>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="honorary-member-table-body">
              <tr><td colspan="4" class="muted">Sign in to load honorary member entries.</td></tr>
            </tbody>
          </table>
        </div>
      </article>
      <article class="historical-panel" data-admin-panel="memorial_entries">
        <h4>Memorial &amp; Past Member Records</h4>
        <p class="muted">Capture memorial records and past-member tributes with governance oversight before they are used in remembrance or legacy surfaces.</p>
        <form id="memorial-entry-form" class="login-form">
          <label for="memorial-entry-full-name">Full name</label>
          <input id="memorial-entry-full-name" maxlength="160" disabled />
          <label for="memorial-entry-title">Title</label>
          <input id="memorial-entry-title" maxlength="160" disabled />
          <label for="memorial-entry-date">Date of passing</label>
          <input id="memorial-entry-date" maxlength="32" placeholder="YYYY-MM-DD" disabled />
          <label for="memorial-entry-tribute">Tribute</label>
          <textarea id="memorial-entry-tribute" rows="4" maxlength="4000" disabled></textarea>
          <label for="memorial-entry-status">Status</label>
          <select id="memorial-entry-status" disabled>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button id="memorial-entry-submit" type="submit" disabled>Create memorial entry</button>
        </form>
        <p id="memorial-entry-status-text" class="muted">Sign in to manage memorial entries.</p>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="memorial-entry-table-body">
              <tr><td colspan="4" class="muted">Sign in to load memorial entries.</td></tr>
            </tbody>
          </table>
        </div>
      </article>
        </div>
      </section>
     </div>

     <div id="module-fees" class="module-section">
      <div class="admin-card" data-admin-panel="membership_fees">
        <h3>Membership &amp; Fees</h3>
        <p class="muted">Manage annual cycle setup, standing reviews, and immediate access changes from one workspace.</p>
        <div class="member-actions">
          <label for="fee-cycle-year" class="muted">Cycle</label>
          <select id="fee-cycle-year" disabled>
            <option value="">Current cycle</option>
          </select>
          <button id="fee-refresh" type="button" disabled>Refresh workspace</button>
          <span id="fee-member-count" class="muted"></span>
        </div>
        <div class="member-actions">
          <input id="fee-cycle-create-year" type="number" min="2000" max="2100" placeholder="Cycle year (e.g. 2026)" />
          <input id="fee-cycle-due-date" type="date" />
          <select id="fee-cycle-status">
            <option value="open" selected>Open</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <button id="fee-cycle-save" type="button" disabled>Save cycle</button>
        </div>
        <p id="fee-cycle-status-text" class="muted">Sign in to manage membership cycles.</p>
        <div class="import-kpi-grid report-kpi-grid membership-fee-kpis">
          <div class="import-kpi">
            <p class="import-kpi-label">Total members</p>
            <p id="fee-kpi-total-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Active members</p>
            <p id="fee-kpi-active-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Good standing</p>
            <p id="fee-kpi-good-standing" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Outstanding</p>
            <p id="fee-kpi-outstanding-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Blocked</p>
            <p id="fee-kpi-blocked-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Deactivated</p>
            <p id="fee-kpi-deactivated-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Onboarding</p>
            <p id="fee-kpi-onboarding-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Fees collected</p>
            <p id="fee-kpi-fees-collected" class="import-kpi-value">R 0.00</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Outstanding balance</p>
            <p id="fee-kpi-outstanding-balance" class="import-kpi-value">R 0.00</p>
          </div>
        </div>
        <div class="member-actions">
          <input id="fee-search" type="search" placeholder="Search name, email, company, committee" />
          <select id="fee-standing-filter">
            <option value="all">All standing states</option>
            <option value="good_standing">Good standing</option>
            <option value="outstanding">Outstanding</option>
            <option value="partial">Partial</option>
            <option value="waived">Waived</option>
            <option value="pending_review">Pending review</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <select id="fee-account-filter">
            <option value="all">All account states</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
            <option value="invited">Invited</option>
            <option value="not_invited">Not invited</option>
          </select>
          <select id="fee-category-filter">
            <option value="">All categories</option>
          </select>
          <select id="fee-profile-filter">
            <option value="all">All profiles</option>
            <option value="complete">Profile complete</option>
            <option value="incomplete">Profile incomplete</option>
          </select>
          <button id="fee-filters-apply" type="button" disabled>Apply filters</button>
          <button id="fee-filters-reset" type="button" disabled>Reset</button>
        </div>
        <div id="fee-bulk-bar" class="event-bulk-bar fee-bulk-bar" hidden>
          <span id="fee-bulk-count" class="muted">0 selected</span>
          <select id="fee-bulk-standing" disabled>
            <option value="">Standing unchanged</option>
            <option value="good_standing">Good standing</option>
            <option value="outstanding">Outstanding</option>
            <option value="partial">Partial</option>
            <option value="waived">Waived</option>
            <option value="pending_review">Pending review</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <select id="fee-bulk-access" disabled>
            <option value="">Access unchanged</option>
            <option value="enabled">Enabled</option>
            <option value="blocked">Blocked</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <input id="fee-bulk-reason" type="text" placeholder="Bulk audit reason" disabled />
          <button id="fee-bulk-apply" type="button" disabled>Apply bulk update</button>
          <button id="fee-bulk-remind" type="button" disabled>Send dues reminder</button>
        </div>
        <p id="fee-members-status" class="muted">Sign in to load membership fee records.</p>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th><input id="fee-select-all-members" type="checkbox" aria-label="Select all fee rows" disabled /></th>
                <th>Member</th>
                <th>Membership</th>
                <th>Status</th>
                <th>Fees</th>
                <th>Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="fee-members-table-body">
              <tr><td colspan="7" class="muted">Sign in to load membership fee records.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
     </div>

     <div id="module-imports" class="module-section">
      <div class="admin-card" data-admin-panel="member_import">
        <h3>Member Import (Excel)</h3>
        <div id="member-import-help" class="help-banner">
          <p class="muted">Run dry-run validation first, then apply the batch when blocking issues are zero.</p>
          <button type="button" class="help-dismiss" aria-label="Dismiss help" onclick="window.iwfsaDismissHelp('member-import-help')">&times;</button>
        </div>
        <div class="import-workspace">
          <article class="import-card import-card-form">
            <h3>Invite Policy and Dry-Run</h3>
            <p class="muted">Configure onboarding behavior, then validate the spreadsheet before apply.</p>
            <form id="import-form" class="login-form import-form" enctype="multipart/form-data">
              <label for="import-file">Spreadsheet (.xlsx)</label>
              <input
                id="import-file"
                name="file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />
              <p class="muted">Leave file empty to reuse your most recently saved upload.</p>
              <label for="import-mode">Mode</label>
              <select id="import-mode" name="mode">
                <option value="create_or_update">Create + update</option>
                <option value="create_only">Create only</option>
              </select>
              <label for="import-default-status">Default status</label>
              <select id="import-default-status" name="default_status">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <label for="import-username-policy">Username policy</label>
              <select id="import-username-policy" name="username_policy">
                <option value="generate_random">Generate random</option>
                <option value="from_column_or_generate">Use column or generate</option>
              </select>
              <label for="import-activation-policy">Activation policy</label>
              <select id="import-activation-policy" name="activation_policy">
                <option value="password_change_required" selected>Password change required</option>
                <option value="password_and_username_personalization_required">
                  Password + username personalization required
                </option>
              </select>
              <label for="import-invite-policy">Invite policy</label>
              <select id="import-invite-policy" name="invite_policy">
                <option value="queue_on_apply">Queue on apply</option>
                <option value="none">Do not queue</option>
              </select>
              <label for="import-membership-cycle-year">Membership year</label>
              <input id="import-membership-cycle-year" name="membership_cycle_year" type="number" min="2000" max="2100" placeholder="e.g. 2026" />
              <label for="import-membership-category-default">Default category</label>
              <input id="import-membership-category-default" name="membership_category_default" type="text" value="Active Member" />
              <label for="import-standing-default">Default standing</label>
              <select id="import-standing-default" name="standing_default">
                <option value="pending_review" selected>Pending review</option>
                <option value="good_standing">Good standing</option>
                <option value="outstanding">Outstanding</option>
                <option value="partial">Partial</option>
                <option value="waived">Waived</option>
              </select>
              <button type="submit" id="import-submit">Run dry-run</button>
            </form>
            <label class="inline-checkbox" for="import-send-invites">
              <input id="import-send-invites" type="checkbox" checked />
              Queue onboarding invites on apply
            </label>
            <div class="member-actions">
              <input id="import-batch-id" type="text" placeholder="Batch ID (imp_...)" />
              <button id="refresh-import-batch" type="button" disabled>Load batch</button>
              <button id="apply-import" type="button" disabled>Apply batch</button>
              <button id="download-import-report" type="button" disabled>Download report CSV</button>
            </div>
            <p id="import-status" class="muted">Sign in to run imports.</p>
          </article>
          <article class="import-card import-card-summary" aria-live="polite">
            <div class="import-summary-head">
              <h3>Batch Summary</h3>
              <span id="import-status-badge" class="import-status-badge import-status-badge-neutral">Not loaded</span>
            </div>
            <p id="import-batch-meta" class="muted">No batch loaded yet.</p>
            <div class="import-kpi-grid">
              <div class="import-kpi">
                <p class="import-kpi-label">Total Rows</p>
                <p id="import-total-rows" class="import-kpi-value">0</p>
              </div>
              <div class="import-kpi">
                <p class="import-kpi-label">Created</p>
                <p id="import-created-rows" class="import-kpi-value">0</p>
              </div>
              <div class="import-kpi">
                <p class="import-kpi-label">Updated</p>
                <p id="import-updated-rows" class="import-kpi-value">0</p>
              </div>
            </div>
            <div class="import-progress-shell">
              <div class="import-progress-labels">
                <span>Processed</span>
                <span id="import-progress-text">0%</span>
              </div>
              <div
                id="import-progress-track"
                class="import-progress-track"
                role="progressbar"
                aria-label="Import processing progress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="0"
              >
                <span id="import-progress-fill" class="import-progress-fill" style="width: 0%"></span>
              </div>
            </div>
            <dl class="import-detail-list">
              <div>
                <dt>Mode</dt>
                <dd id="import-detail-mode">n/a</dd>
              </div>
              <div>
                <dt>Default status</dt>
                <dd id="import-detail-default-status">n/a</dd>
              </div>
              <div>
                <dt>Username policy</dt>
                <dd id="import-detail-username-policy">n/a</dd>
              </div>
              <div>
                <dt>Activation policy</dt>
                <dd id="import-detail-activation-policy">n/a</dd>
              </div>
              <div>
                <dt>Invite policy</dt>
                <dd id="import-detail-invite-policy">n/a</dd>
              </div>
              <div>
                <dt>Membership year</dt>
                <dd id="import-detail-membership-year">n/a</dd>
              </div>
              <div>
                <dt>Default category</dt>
                <dd id="import-detail-membership-category">n/a</dd>
              </div>
              <div>
                <dt>Default standing</dt>
                <dd id="import-detail-standing-default">n/a</dd>
              </div>
              <div>
                <dt>Blocking issues</dt>
                <dd id="import-detail-blocking-issues">0</dd>
              </div>
              <div>
                <dt>Invites</dt>
                <dd id="import-detail-invites">Queued: 0 | Failed: 0</dd>
              </div>
            </dl>
          </article>
        </div>
        <article class="import-card import-card-results">
          <h3>Membership Set Preview</h3>
          <p class="muted">Single merged view of Member Directory and import data. Click imported names to edit before apply.</p>
          <div class="table-shell">
            <table class="member-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Status</th>
                  <th>Import State</th>
                </tr>
              </thead>
              <tbody id="import-rows-body">
                <tr><td colspan="4" class="muted">Sign in and run dry-run to load membership preview.</td></tr>
              </tbody>
            </table>
          </div>
          <section id="import-edit-panel" class="import-edit-panel" hidden>
            <div class="import-edit-head">
              <h4>Edit Imported Record</h4>
              <button id="import-edit-close" type="button" class="ghost-link">Close</button>
            </div>
            <p id="import-edit-context" class="muted">Select an imported record to edit.</p>
            <form id="import-edit-form" class="login-form import-edit-form">
              <label for="import-edit-email">Email</label>
              <input id="import-edit-email" type="email" required />
              <label for="import-edit-full-name">Full name</label>
              <input id="import-edit-full-name" type="text" required />
              <label for="import-edit-status">Status</label>
              <select id="import-edit-status" required>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <label for="import-edit-phone">Phone</label>
              <input id="import-edit-phone" type="text" placeholder="+27..." />
              <label for="import-edit-organisation">Organisation</label>
              <input id="import-edit-organisation" type="text" />
              <fieldset class="group-picker-fieldset">
                <legend>Group memberships</legend>
                <p class="muted group-picker-help">Select one or more audience groups for this member.</p>
                <div id="import-edit-groups" class="group-picker"></div>
              </fieldset>
              <div class="member-actions">
                <button id="import-edit-save" type="submit">Save record</button>
                <button id="import-edit-cancel" type="button">Cancel</button>
              </div>
            </form>
            <p id="import-edit-status-text" class="muted"></p>
          </section>
        </article>
      </div>
     </div>

     <div id="module-events" class="module-section">
      <div class="admin-card" data-admin-panel="event_hub">
        <h3>Event Hub</h3>
        <div id="event-hub-help" class="help-banner">
          <p class="muted">Members can create and publish meetings immediately, target group-based audiences, and manage planning communications.</p>
          <button type="button" class="help-dismiss" aria-label="Dismiss help" onclick="window.iwfsaDismissHelp('event-hub-help')">&times;</button>
        </div>
        <div id="event-form-shell" class="event-form-shell">
        <form id="event-form" class="login-form">
          <label for="event-title">Title</label>
          <input id="event-title" name="title" required />
          <label for="event-description">Description</label>
          <textarea id="event-description" name="description" rows="3"></textarea>
          <label for="event-start">Start date &amp; time</label>
          <input id="event-start" name="startAt" type="datetime-local" required />
          <label for="event-end">End date &amp; time</label>
          <input id="event-end" name="endAt" type="datetime-local" required />
          <label for="event-venue">Venue Type</label>
          <select id="event-venue" name="venueType" required>
            <option value="physical">Physical</option>
            <option value="online">Online</option>
          </select>
          <label for="event-venue-name">Venue Name</label>
          <input id="event-venue-name" name="venueName" />
          <label for="event-host">Host / Chairperson</label>
          <div class="host-picker-shell">
            <input id="event-host" name="hostName" autocomplete="off" placeholder="Search members by name" />
            <div id="event-host-suggestions" class="host-suggestions" hidden></div>
          </div>
          <label for="event-capacity">Capacity</label>
          <input id="event-capacity" name="capacity" type="number" min="0" value="0" required />
          <label for="event-registration-close">Registration close deadline (optional)</label>
          <input id="event-registration-close" name="registrationClosesAt" type="datetime-local" />
          <label for="event-audience">Audience</label>
          <select id="event-audience" name="audienceCode" required>
            <option value="all_members">All Active IWFSA Members</option>
            <option value="external_stakeholders">External Stakeholders</option>
            <option value="iwfsa_programme_sponsors">IWFSA Programme Sponsors</option>
            <option value="honourary_members">Honourary Members</option>
            <option value="board_of_directors">Board of Directors</option>
            <option value="advocacy_and_voice">Advocacy and Voice</option>
            <option value="catalytic_strategy">Catalytic Strategy</option>
            <option value="leadership_development_committee">Leadership Development Committee</option>
            <option value="member_affairs">Member Affairs</option>
            <option value="brand_and_reputation">Brand and Reputation</option>
          </select>
          <fieldset class="group-picker-fieldset">
            <legend>Invite groups (optional)</legend>
            <p class="muted group-picker-help">
              Select one or more groups to invite. If any are selected, the event is visible to those groups only.
            </p>
            <div id="event-audience-groups" class="group-picker"></div>
          </fieldset>
          <fieldset class="invitee-picker-fieldset">
            <legend>Invite individual members (optional)</legend>
            <p class="muted group-picker-help">Type a member name or email, then add them to the event audience alongside any selected groups.</p>
            <div class="invitee-search-row">
              <input id="event-invitee-search" type="search" placeholder="Search active members by name or email" autocomplete="off" />
              <button id="event-invitee-clear" type="button" class="ghost">Clear selected</button>
            </div>
            <div id="event-invitee-results" class="invitee-results" aria-live="polite">
              <p class="muted">Sign in and load members to search the directory.</p>
            </div>
            <div id="event-selected-invitees" class="invitee-selected-list" aria-live="polite"></div>
          </fieldset>
          <div class="event-attachment-field">
            <label for="event-attachment">Optional event file</label>
            <input id="event-attachment" name="eventAttachment" type="file" accept=".pdf,.txt,application/pdf,text/plain" />
            <p class="muted form-hint">Attach a PDF or text file to this event. It will be linked to the event details.</p>
          </div>
          <label class="inline-checkbox" for="event-publish-now">
            <input id="event-publish-now" name="publishNow" type="checkbox" />
            Publish now and email invitations to the selected audience
          </label>
          <button type="submit" id="event-submit">Create meeting</button>
          <button type="button" id="event-cancel" hidden>Cancel edit</button>
        </form>
        <div id="event-collaboration-shell" class="event-collaboration-shell" hidden>
          <h3>Collaboration</h3>
          <p class="muted">Internal notes and comments for meeting editors (Markdown supported). Not shown in the member event directory.</p>
          <label for="event-draft-notes">Draft notes (Markdown)</label>
          <textarea id="event-draft-notes" rows="6" class="registration-draft-input" placeholder="Optional internal notes for collaborators..."></textarea>
          <div class="member-actions">
            <button id="event-save-draft-notes" type="button" class="ghost">Save notes</button>
            <span id="event-draft-notes-status" class="muted"></span>
          </div>
          <h4>Internal comments</h4>
          <div id="event-internal-comments" class="event-comments-list">
            <p class="muted">No comments yet.</p>
          </div>
          <label for="event-internal-comment-body" class="muted">New comment (Markdown)</label>
          <textarea id="event-internal-comment-body" rows="3" class="registration-draft-input" placeholder="Write a comment for collaborators..."></textarea>
          <div class="member-actions">
            <button id="event-post-internal-comment" type="button">Post comment</button>
            <span id="event-internal-comment-status" class="muted"></span>
          </div>
        </div>
        </div>
        <p id="event-status" class="muted"></p>
        <div class="event-toolbar">
          <label for="event-view" class="muted">View Events</label>
          <select id="event-view" disabled>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
            <option value="drafts">Drafts</option>
          </select>
          <button id="refresh-events" type="button" aria-label="Refresh events">&#x21bb;</button>
          <button id="dispatch-reminders" type="button" disabled>
            Send Reminders
            <span id="reminders-badge" class="count-badge" hidden>0</span>
          </button>
          <button id="create-event-fab" type="button" class="event-fab" aria-label="Create new meeting">
            + Create Meeting
          </button>
        </div>
        <div id="event-bulk-bar" class="event-bulk-bar" hidden>
          <span id="event-bulk-count" class="muted">0 selected</span>
          <button id="bulk-extend-events" type="button">Extend deadline</button>
          <button id="bulk-delete-events" type="button" class="danger-link">Delete selected</button>
        </div>
        <div id="event-card-list" class="event-card-list">
          <p class="muted">No events loaded.</p>
        </div>
      </div>
     </div>

     <div id="module-notifications" class="module-section">
      <div class="admin-card" data-admin-panel="delivery_report">
        <h3>Notification Delivery Report</h3>
        <p class="muted">Review which members were targeted by recent notifications and whether delivery succeeded.</p>
        <div class="member-actions">
          <button id="refresh-deliveries" type="button" disabled>Refresh deliveries</button>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Organisation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="delivery-table-body">
              <tr><td colspan="5" class="muted">Sign in to load deliveries.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="admin-card" data-admin-panel="queue_status">
        <h3>Notification Queue Status</h3>
        <div id="queue-status-help" class="help-banner">
          <div class="queue-help">
            <p><strong>What this panel does:</strong> shows simple queue health so you know if notifications are flowing.</p>
            <p class="muted">If attention is needed here, open <strong>Notification Delivery Report</strong> to see which members were affected.</p>
          </div>
          <button type="button" class="help-dismiss" aria-label="Dismiss help" onclick="window.iwfsaDismissHelp('queue-status-help')">&times;</button>
        </div>
        <p id="queue-summary" class="queue-summary muted" role="status" aria-live="polite">
          Refresh queue to view summary.
        </p>
        <div class="member-actions">
          <button id="refresh-queue" type="button" disabled>Refresh queue</button>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody id="queue-table-body">
              <tr><td colspan="2" class="muted">Sign in to load queue status.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
     </div>

     <div id="module-news" class="module-section">
      <div class="admin-card" data-admin-panel="member_news">
        <h3>Member News Publishing</h3>
        <p class="muted">Create and curate official IWFSA updates shown on the member dashboard home feed.</p>
        <form id="news-form" class="login-form">
          <label for="news-title">Title</label>
          <input id="news-title" name="title" maxlength="180" placeholder="Headline for members" required />
          <label for="news-body">Update body</label>
          <textarea id="news-body" name="body" rows="5" maxlength="5000" placeholder="Share relevant IWFSA news, milestones, and member-focused updates." required></textarea>
          <label for="news-status">Status</label>
          <select id="news-status" name="status">
            <option value="draft">Draft</option>
            <option value="published">Publish immediately</option>
            <option value="archived">Archive</option>
          </select>
          <label class="inline-checkbox" for="news-is-pinned">
            <input id="news-is-pinned" type="checkbox" />
            Pin this update to the top of the member news feed
          </label>
          <div class="member-actions">
            <button id="news-submit" type="submit" disabled>Create news post</button>
            <button id="news-cancel" type="button" class="ghost" hidden>Cancel edit</button>
          </div>
        </form>
        <p id="news-status-text" class="muted">Sign in to manage curated member news.</p>
      </div>
      <div class="admin-card">
        <div class="member-actions">
          <label for="news-filter-status" class="muted">Filter</label>
          <select id="news-filter-status" disabled>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button id="refresh-news" type="button" disabled>Refresh news</button>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Pinned</th>
                <th>Published</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="news-table-body">
              <tr><td colspan="6" class="muted">Sign in to load member news posts.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
     </div>

     <div id="module-reports" class="module-section">
      <div class="admin-card" data-admin-panel="reporting_dashboard">
        <h3>Reporting and Exports Dashboard</h3>
        <p class="muted">Track activity across events, SMS usage, document publishing, and celebration workflows.</p>
        <div class="member-actions">
          <label for="report-window-days" class="muted">Window</label>
          <select id="report-window-days" disabled>
            <option value="30" selected>30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
          </select>
          <button id="refresh-reports" type="button" disabled>Refresh dashboard</button>
          <button id="export-reports" type="button" disabled>Export CSV</button>
        </div>
        <div class="import-kpi-grid report-kpi-grid">
          <div class="import-kpi">
            <p class="import-kpi-label">Active members</p>
            <p id="report-active-members" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Published events</p>
            <p id="report-published-events" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Confirmed signups</p>
            <p id="report-confirmed-signups" class="import-kpi-value">0</p>
          </div>
          <div class="import-kpi">
            <p class="import-kpi-label">Published documents</p>
            <p id="report-published-documents" class="import-kpi-value">0</p>
          </div>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Top Event</th>
                <th class="numeric-col">Confirmed</th>
                <th class="numeric-col">Waitlisted</th>
                <th class="numeric-col">Attended</th>
              </tr>
            </thead>
            <tbody id="report-events-body">
              <tr><td colspan="4" class="muted">Sign in to load reporting data.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Recent SMS</th>
                <th>Status</th>
                <th>Event</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody id="report-sms-body">
              <tr><td colspan="4" class="muted">Sign in to load SMS activity.</td></tr>
            </tbody>
          </table>
        </div>
        <p id="report-status" class="muted">Sign in to load reporting data.</p>
      </div>
      <div class="admin-card" data-admin-panel="social_moderators">
        <h3>Celebration Moderators</h3>
        <p class="muted">Assign trusted members who can remove celebration posts when moderation is needed.</p>
        <div class="member-actions">
          <label for="moderator-user-id" class="muted">Member user</label>
          <select id="moderator-user-id" disabled>
            <option value="">Select member</option>
          </select>
          <button id="add-moderator" type="button" disabled>Add moderator</button>
        </div>
        <div class="table-shell">
          <table class="member-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Assigned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="moderator-table-body">
              <tr><td colspan="4" class="muted">Sign in to load moderators.</td></tr>
            </tbody>
          </table>
        </div>
        <p id="moderator-status" class="muted">Sign in to manage moderators.</p>
      </div>
     </div>
    </div>
      <script>
        const DEFAULT_IMPORT_ACTIVATION_POLICY = "password_change_required";
        
        const ADMIN_MODULES = ["overview", "members", "fees", "audit", "imports", "events", "notifications", "news", "reports"];
        const ADMIN_SIGN_IN_URL = "${config.appBaseUrl}/sign-in";

        function getAdminModuleSection(moduleName) {
          return moduleName === "audit" ? "fees" : moduleName;
        }

        function getToken() {
          return sessionStorage.getItem("iwfsa_admin_token");
        }

        function clearStoredAdminSession() {
          sessionStorage.removeItem("iwfsa_admin_token");
          sessionStorage.removeItem("iwfsa_admin_role");
          sessionStorage.removeItem("iwfsa_admin_username");
          sessionStorage.removeItem("iwfsa_admin_expires_at");
        }

        function isStoredAdminSessionExpired() {
          const expiresAt = sessionStorage.getItem("iwfsa_admin_expires_at") || "";
          const expiresAtMs = Date.parse(expiresAt);
          return !expiresAt || !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();
        }

        function showAdminModule(moduleName, { scroll = false } = {}) {
          const nextModule = ADMIN_MODULES.includes(moduleName)
            ? moduleName
            : "overview";
          if (window.location.hash.substring(1) !== nextModule) {
            window.location.hash = "#" + nextModule;
          }
          handleHashChange();
          if (scroll) {
            const target = document.getElementById("module-" + getAdminModuleSection(nextModule)) || document.getElementById("admin-session-bar");
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }

        function handleHashChange() {
           const requestedModule = window.location.hash.substring(1) || "overview";
           let activeModule = ADMIN_MODULES.includes(requestedModule) ? requestedModule : "overview";
           const activeSection = getAdminModuleSection(activeModule);

           document.querySelectorAll('.module-nav-link').forEach(link => {
              link.classList.toggle('active', link.getAttribute('data-module') === activeModule);
           });

           document.querySelectorAll('.module-section').forEach(section => {
              section.classList.toggle('active', section.id === 'module-' + activeSection);
           });
        }

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        function formatEventDateTime(value) {
          if (!value) return "";
          const date = new Date(value);
          if (!Number.isFinite(date.getTime())) return "";

          const day = date.getDate();
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          const month = monthNames[date.getMonth()] || "";
          const year = date.getFullYear();

          const hours24 = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours24 >= 12 ? "pm" : "am";
          const hours12 = hours24 % 12 || 12;

          return day + " " + month + " " + year + " at " + hours12 + ":" + String(minutes).padStart(2, "0") + ampm;
        }

        const adminPanelGrid = document.getElementById("admin-panel-grid");
        const status = null;
        const logoutButton = document.getElementById("admin-logout");
        const adminSessionBar = document.getElementById("admin-session-bar");
        const adminSessionSummary = document.getElementById("admin-session-summary");
        const memberStatus = document.getElementById("member-status");
        const memberCount = document.getElementById("member-count");
        const memberTableBody = document.getElementById("member-table-body");
        const refreshButton = document.getElementById("refresh-members");
        const queueButton = document.getElementById("queue-invites");
        const resetButton = document.getElementById("queue-resets");
        const memberSearch = document.getElementById("member-search");
        const memberSearchDropdown = document.getElementById("member-search-dropdown");
        const memberSelectionBasket = document.getElementById("member-selection-basket");
        const memberSelectionChips = document.getElementById("member-selection-chips");
        const memberBasketClear = document.getElementById("member-basket-clear");
        let basketMembers = new Map(); // memberId (number) → member object
        const memberDetailAddGroupButton = document.getElementById("member-detail-add-group");
        let groupAssignSingleMemberId = null;
        const groupAssignDialog = document.getElementById("group-assign-dialog");
        const groupAssignPickerPanel = document.getElementById("group-assign-picker");
        const groupAssignConfirmPanel = document.getElementById("group-assign-confirm");
        const groupAssignSubtitle = document.getElementById("group-assign-subtitle");
        const groupAssignSelect = document.getElementById("group-assign-select");
        const groupAssignQuestion = document.getElementById("group-assign-question");
        const groupAssignDetail = document.getElementById("group-assign-detail");
        const groupAssignStatus = document.getElementById("group-assign-status");
        const groupAssignContinueButton = document.getElementById("group-assign-continue");
        const groupAssignAbortButton = document.getElementById("group-assign-abort");
        const groupAssignYesButton = document.getElementById("group-assign-yes");
        const groupAssignSkipButton = document.getElementById("group-assign-skip");
        const groupAssignCancelButton = document.getElementById("group-assign-cancel");
        const groupAssignPreview = document.getElementById("group-assign-preview");
        const memberStatusFilter = document.getElementById("member-status-filter");
        const memberRoleFilter = document.getElementById("member-role-filter");
        const memberGroupFilter = document.getElementById("member-group-filter");
        const memberSortInput = document.getElementById("member-sort");
        const memberFilterResetButton = document.getElementById("member-filter-reset");
        const memberAddForm = document.getElementById("member-add-form");
        const memberAddNameInput = document.getElementById("member-add-name");
        const memberAddEmailInput = document.getElementById("member-add-email");
        const memberAddGroups = document.getElementById("member-add-groups");
        const memberAddOrgInput = document.getElementById("member-add-organisation");
        const memberAddStatus = document.getElementById("member-add-status");
        const selectAll = document.getElementById("select-all-members");
        const memberOutput = document.getElementById("member-output");
        const CURATED_AUDIENCE_GROUPS = [
          { value: "Board of Directors", label: "IWFSA Board of Director" },
          { value: "Advocacy and Voice", label: "Advocacy and Voice" },
          { value: "Catalytic Strategy", label: "Catalytic Strategy" },
          { value: "Leadership Development Committee", label: "Leadership Development" },
          { value: "Member Affairs", label: "Member Affairs" },
          { value: "Brand and Reputation", label: "Brand and Reputation" }
        ];
        const memberDetailShell = document.getElementById("member-detail-shell");
        const memberDetailForm = document.getElementById("member-detail-form");
        const memberDetailCloseButton = document.getElementById("member-detail-close");
        const memberDetailTitle = document.getElementById("member-detail-title");
        const memberDetailSummary = document.getElementById("member-detail-summary");
        const memberDetailFullNameInput = document.getElementById("member-detail-full-name");
        const memberDetailEmailInput = document.getElementById("member-detail-email");
        const memberDetailCompanyInput = document.getElementById("member-detail-company");
        const memberDetailPhoneInput = document.getElementById("member-detail-phone");
        const memberDetailBusinessTitleInput = document.getElementById("member-detail-business-title");
        const memberDetailIwfsaPositionInput = document.getElementById("member-detail-iwfsa-position");
        const memberDetailLinkedinUrlInput = document.getElementById("member-detail-linkedin-url");
        const memberDetailExpertiseInput = document.getElementById("member-detail-expertise");
        const memberDetailBioInput = document.getElementById("member-detail-bio");
        const memberDetailGroups = document.getElementById("member-detail-groups");
        const memberDetailSaveButton = document.getElementById("member-detail-save");
        const memberDetailStatus = document.getElementById("member-detail-status");
        const eventForm = document.getElementById("event-form");
        const eventTitleInput = document.getElementById("event-title");
        const eventDescriptionInput = document.getElementById("event-description");
        const eventStartInput = document.getElementById("event-start");
        const eventEndInput = document.getElementById("event-end");
        const eventVenueInput = document.getElementById("event-venue");
        const eventVenueNameInput = document.getElementById("event-venue-name");
        const eventHostInput = document.getElementById("event-host");
        const eventHostSuggestions = document.getElementById("event-host-suggestions");
        const eventCapacityInput = document.getElementById("event-capacity");
        const eventRegistrationCloseInput = document.getElementById("event-registration-close");
        const eventCollaborationShell = document.getElementById("event-collaboration-shell");
        const eventDraftNotesInput = document.getElementById("event-draft-notes");
        const eventSaveDraftNotesButton = document.getElementById("event-save-draft-notes");
        const eventDraftNotesStatus = document.getElementById("event-draft-notes-status");
        const eventInternalCommentsList = document.getElementById("event-internal-comments");
        const eventInternalCommentBody = document.getElementById("event-internal-comment-body");
        const eventPostInternalCommentButton = document.getElementById("event-post-internal-comment");
        const eventInternalCommentStatus = document.getElementById("event-internal-comment-status");
        const eventAudienceInput = document.getElementById("event-audience");
        const eventAudienceGroups = document.getElementById("event-audience-groups");
        const eventInviteeSearchInput = document.getElementById("event-invitee-search");
        const eventInviteeResults = document.getElementById("event-invitee-results");
        const eventSelectedInvitees = document.getElementById("event-selected-invitees");
        const eventInviteeClearButton = document.getElementById("event-invitee-clear");
        const eventAttachmentInput = document.getElementById("event-attachment");
        const eventPublishNowInput = document.getElementById("event-publish-now");
        const eventSubmitButton = document.getElementById("event-submit");
        const eventCancelButton = document.getElementById("event-cancel");
        const eventStatus = document.getElementById("event-status");
        const eventCardList = document.getElementById("event-card-list");
        const refreshEventsButton = document.getElementById("refresh-events");
        const dispatchRemindersButton = document.getElementById("dispatch-reminders");
        const remindersBadge = document.getElementById("reminders-badge");
        const createEventFab = document.getElementById("create-event-fab");
        const eventFormShell = document.getElementById("event-form-shell");
        const eventBulkBar = document.getElementById("event-bulk-bar");
        const eventBulkCount = document.getElementById("event-bulk-count");
        const bulkExtendEventsButton = document.getElementById("bulk-extend-events");
        const bulkDeleteEventsButton = document.getElementById("bulk-delete-events");
        const eventViewInput = document.getElementById("event-view");
        const deliveryTableBody = document.getElementById("delivery-table-body");
        const refreshDeliveriesButton = document.getElementById("refresh-deliveries");
        const queueTableBody = document.getElementById("queue-table-body");
        const queueSummary = document.getElementById("queue-summary");
        const refreshQueueButton = document.getElementById("refresh-queue");
        const newsForm = document.getElementById("news-form");
        const newsTitleInput = document.getElementById("news-title");
        const newsBodyInput = document.getElementById("news-body");
        const newsStatusInput = document.getElementById("news-status");
        const newsPinnedInput = document.getElementById("news-is-pinned");
        const newsSubmitButton = document.getElementById("news-submit");
        const newsCancelButton = document.getElementById("news-cancel");
        const newsStatusText = document.getElementById("news-status-text");
        const newsFilterStatusInput = document.getElementById("news-filter-status");
        const refreshNewsButton = document.getElementById("refresh-news");
        const newsTableBody = document.getElementById("news-table-body");
        const publicHeroRefreshButton = document.getElementById("public-hero-refresh");
        const publicHeroSettingsForm = document.getElementById("public-hero-settings-form");
        const publicHeroImageUrlInput = document.getElementById("public-hero-image-url");
        const publicHeroUploadFileInput = document.getElementById("public-hero-upload-file");
        const publicHeroAltTextInput = document.getElementById("public-hero-alt-text");
        const publicHeroFocalPointInput = document.getElementById("public-hero-focal-point");
        const publicHeroSaveLinkButton = document.getElementById("public-hero-save-link");
        const publicHeroUploadButton = document.getElementById("public-hero-upload-button");
        const publicHeroResetButton = document.getElementById("public-hero-reset-button");
        const publicHeroStatus = document.getElementById("public-hero-status");
        const publicHeroPreviewImage = document.getElementById("public-hero-preview-image");
        const publicHeroPreviewCaption = document.getElementById("public-hero-preview-caption");
        const importSubmitButton = document.getElementById("import-submit");
        const importForm = document.getElementById("import-form");
        const importFileInput = document.getElementById("import-file");
        const importModeInput = document.getElementById("import-mode");
        const importDefaultStatusInput = document.getElementById("import-default-status");
        const importUsernamePolicyInput = document.getElementById("import-username-policy");
        const importActivationPolicyInput = document.getElementById("import-activation-policy");
        const importInvitePolicyInput = document.getElementById("import-invite-policy");
        const importMembershipCycleYearInput = document.getElementById("import-membership-cycle-year");
        const importMembershipCategoryDefaultInput = document.getElementById("import-membership-category-default");
        const importStandingDefaultInput = document.getElementById("import-standing-default");
        const importSendInvitesInput = document.getElementById("import-send-invites");
        const importBatchIdInput = document.getElementById("import-batch-id");
        const refreshImportBatchButton = document.getElementById("refresh-import-batch");
        const applyImportButton = document.getElementById("apply-import");
        const reportImportButton = document.getElementById("download-import-report");
        const importStatus = document.getElementById("import-status");
        const importBatchMeta = document.getElementById("import-batch-meta");
        const importStatusBadge = document.getElementById("import-status-badge");
        const importTotalRows = document.getElementById("import-total-rows");
        const importCreatedRows = document.getElementById("import-created-rows");
        const importUpdatedRows = document.getElementById("import-updated-rows");
        const importProgressTrack = document.getElementById("import-progress-track");
        const importProgressFill = document.getElementById("import-progress-fill");
        const importProgressText = document.getElementById("import-progress-text");
        const importDetailMode = document.getElementById("import-detail-mode");
        const importDetailDefaultStatus = document.getElementById("import-detail-default-status");
        const importDetailUsernamePolicy = document.getElementById("import-detail-username-policy");
        const importDetailActivationPolicy = document.getElementById("import-detail-activation-policy");
        const importDetailInvitePolicy = document.getElementById("import-detail-invite-policy");
        const importDetailMembershipYear = document.getElementById("import-detail-membership-year");
        const importDetailMembershipCategory = document.getElementById("import-detail-membership-category");
        const importDetailStandingDefault = document.getElementById("import-detail-standing-default");
        const importDetailBlockingIssues = document.getElementById("import-detail-blocking-issues");
        const importDetailInvites = document.getElementById("import-detail-invites");
        const importRowsBody = document.getElementById("import-rows-body");
        const importEditPanel = document.getElementById("import-edit-panel");
        const importEditForm = document.getElementById("import-edit-form");
        const importEditCloseButton = document.getElementById("import-edit-close");
        const importEditCancelButton = document.getElementById("import-edit-cancel");
        const importEditContext = document.getElementById("import-edit-context");
        const importEditEmailInput = document.getElementById("import-edit-email");
        const importEditFullNameInput = document.getElementById("import-edit-full-name");
        const importEditStatusInput = document.getElementById("import-edit-status");
        const importEditPhoneInput = document.getElementById("import-edit-phone");
        const importEditOrganisationInput = document.getElementById("import-edit-organisation");
        const importEditGroupsShell = document.getElementById("import-edit-groups");
        const importEditStatusText = document.getElementById("import-edit-status-text");
        const importEditSaveButton = document.getElementById("import-edit-save");
        const reportWindowDaysInput = document.getElementById("report-window-days");
        const refreshReportsButton = document.getElementById("refresh-reports");
        const exportReportsButton = document.getElementById("export-reports");
        const reportActiveMembers = document.getElementById("report-active-members");
        const reportPublishedEvents = document.getElementById("report-published-events");
        const reportConfirmedSignups = document.getElementById("report-confirmed-signups");
        const reportPublishedDocuments = document.getElementById("report-published-documents");
        const reportEventsBody = document.getElementById("report-events-body");
        const reportSmsBody = document.getElementById("report-sms-body");
        const reportStatus = document.getElementById("report-status");
        const moderatorUserIdInput = document.getElementById("moderator-user-id");
        const addModeratorButton = document.getElementById("add-moderator");
        const moderatorTableBody = document.getElementById("moderator-table-body");
        const moderatorStatus = document.getElementById("moderator-status");
        const feeCycleYearInput = document.getElementById("fee-cycle-year");
        const feeRefreshButton = document.getElementById("fee-refresh");
        const feeCycleCreateYearInput = document.getElementById("fee-cycle-create-year");
        const feeCycleDueDateInput = document.getElementById("fee-cycle-due-date");
        const feeCycleStatusInput = document.getElementById("fee-cycle-status");
        const feeCycleSaveButton = document.getElementById("fee-cycle-save");
        const feeCycleStatusText = document.getElementById("fee-cycle-status-text");
        const feeMemberCount = document.getElementById("fee-member-count");
        const feeSearchInput = document.getElementById("fee-search");
        const feeStandingFilterInput = document.getElementById("fee-standing-filter");
        const feeAccountFilterInput = document.getElementById("fee-account-filter");
        const feeCategoryFilterInput = document.getElementById("fee-category-filter");
        const feeProfileFilterInput = document.getElementById("fee-profile-filter");
        const feeFiltersApplyButton = document.getElementById("fee-filters-apply");
        const feeFiltersResetButton = document.getElementById("fee-filters-reset");
        const feeBulkBar = document.getElementById("fee-bulk-bar");
        const feeBulkCount = document.getElementById("fee-bulk-count");
        const feeBulkStandingInput = document.getElementById("fee-bulk-standing");
        const feeBulkAccessInput = document.getElementById("fee-bulk-access");
        const feeBulkReasonInput = document.getElementById("fee-bulk-reason");
        const feeBulkApplyButton = document.getElementById("fee-bulk-apply");
        const feeBulkReminderButton = document.getElementById("fee-bulk-remind");
        const feeSelectAllMembersInput = document.getElementById("fee-select-all-members");
        const feeMembersStatus = document.getElementById("fee-members-status");
        const feeMembersTableBody = document.getElementById("fee-members-table-body");
        const feeKpiTotalMembers = document.getElementById("fee-kpi-total-members");
        const feeKpiActiveMembers = document.getElementById("fee-kpi-active-members");
        const feeKpiGoodStanding = document.getElementById("fee-kpi-good-standing");
        const feeKpiOutstandingMembers = document.getElementById("fee-kpi-outstanding-members");
        const feeKpiBlockedMembers = document.getElementById("fee-kpi-blocked-members");
        const feeKpiDeactivatedMembers = document.getElementById("fee-kpi-deactivated-members");
        const feeKpiOnboardingMembers = document.getElementById("fee-kpi-onboarding-members");
        const feeKpiFeesCollected = document.getElementById("fee-kpi-fees-collected");
        const feeKpiOutstandingBalance = document.getElementById("fee-kpi-outstanding-balance");
        const refreshProfileReviewsButton = document.getElementById("refresh-profile-reviews");
        const profileReviewStatus = document.getElementById("profile-review-status");
        const profileReviewTableBody = document.getElementById("profile-review-table-body");
        const honoraryMemberForm = document.getElementById("honorary-member-form");
        const honoraryMemberFullNameInput = document.getElementById("honorary-member-full-name");
        const honoraryMemberTitleInput = document.getElementById("honorary-member-title");
        const honoraryMemberOrganisationInput = document.getElementById("honorary-member-organisation");
        const honoraryMemberCitationInput = document.getElementById("honorary-member-citation");
        const honoraryMemberStatusInput = document.getElementById("honorary-member-status");
        const honoraryMemberSubmitButton = document.getElementById("honorary-member-submit");
        const honoraryMemberStatusText = document.getElementById("honorary-member-status-text");
        const honoraryMemberTableBody = document.getElementById("honorary-member-table-body");
        const memorialEntryForm = document.getElementById("memorial-entry-form");
        const memorialEntryFullNameInput = document.getElementById("memorial-entry-full-name");
        const memorialEntryTitleInput = document.getElementById("memorial-entry-title");
        const memorialEntryDateInput = document.getElementById("memorial-entry-date");
        const memorialEntryTributeInput = document.getElementById("memorial-entry-tribute");
        const memorialEntryStatusInput = document.getElementById("memorial-entry-status");
        const memorialEntrySubmitButton = document.getElementById("memorial-entry-submit");
        const memorialEntryStatusText = document.getElementById("memorial-entry-status-text");
        const memorialEntryTableBody = document.getElementById("memorial-entry-table-body");

        if (importActivationPolicyInput && !importActivationPolicyInput.value) {
          importActivationPolicyInput.value = DEFAULT_IMPORT_ACTIVATION_POLICY;
        }
        if (importMembershipCycleYearInput && !importMembershipCycleYearInput.value) {
          importMembershipCycleYearInput.value = String(new Date().getFullYear());
        }

        function toIsoStringFromLocalInput(value) {
          const raw = String(value || "").trim();
          if (!raw) return "";
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) return "";
          return date.toISOString();
        }

        function toLocalInputValue(value) {
          const raw = String(value || "").trim();
          if (!raw) return "";
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) return "";
          const localMs = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
          return new Date(localMs).toISOString().slice(0, 16);
        }

        function clearEventFieldError(input) {
          if (!input) return;
          input.classList.remove("field-error");
          input.removeAttribute("aria-invalid");
        }

        function markEventFieldError(input) {
          if (!input) return;
          input.classList.add("field-error");
          input.setAttribute("aria-invalid", "true");
        }

        function resetEventFormValidation() {
          [
            eventTitleInput,
            eventStartInput,
            eventEndInput,
            eventVenueInput,
            eventHostInput,
            eventCapacityInput,
            eventRegistrationCloseInput,
            eventAudienceInput
          ].forEach(
            (input) => clearEventFieldError(input)
          );
        }

        let activeEventId = null;
        let activeEventSnapshot = null;
        let selectedEventIds = new Set();
        let currentEvents = [];
        let publicProfileReviewItems = [];
        let honoraryMemberItems = [];
        let memorialEntryItems = [];
        const selectedEventInvitees = new Map();

        function resolveEventAudienceSelection(formData) {
          const selectedGroups = selectedEventGroups();
          const inviteeUserIds = selectedEventInviteeIds();
          if (selectedGroups.length > 0 || inviteeUserIds.length > 0) {
            return {
              audienceType: "groups",
              groupNames: selectedGroups,
              inviteeUserIds,
              audienceCode: "groups"
            };
          }
          const audienceCode = String(formData.get("audienceCode") || "all_members").trim() || "all_members";
          if (audienceCode !== "all_members") {
            const label = eventAudienceInput?.selectedOptions?.[0]?.textContent || "";
            if (label && label.toLowerCase() !== "legacy audience") {
              return { audienceType: "groups", groupNames: [label], inviteeUserIds, audienceCode: "groups" };
            }
          }
          return { audienceCode, inviteeUserIds };
        }

        function buildEventPayload(formData) {
          resetEventFormValidation();
          const title = String(formData.get("title") || "").trim();
          const description = String(formData.get("description") || "").trim();
          const startAt = toIsoStringFromLocalInput(formData.get("startAt"));
          const endAt = toIsoStringFromLocalInput(formData.get("endAt"));
          const venueType = String(formData.get("venueType") || "").trim();
          const venueName = String(formData.get("venueName") || "").trim();
          const hostName = String(formData.get("hostName") || "").trim();
          const capacity = Number(formData.get("capacity") || 0);
          const registrationClosesAt = toIsoStringFromLocalInput(formData.get("registrationClosesAt"));
          const audienceSelection = resolveEventAudienceSelection(formData);
          const errors = [];

          if (!title) {
            markEventFieldError(eventTitleInput);
            errors.push("Title is required.");
          }
          if (!startAt) {
            markEventFieldError(eventStartInput);
            errors.push("Start date and time is required.");
          }
          if (!endAt) {
            markEventFieldError(eventEndInput);
            errors.push("End date and time is required.");
          }
          if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
            markEventFieldError(eventStartInput);
            markEventFieldError(eventEndInput);
            errors.push("End date and time must be later than start date and time.");
          }
          if (!venueType) {
            markEventFieldError(eventVenueInput);
            errors.push("Venue type is required.");
          }
          if (!hostName) {
            markEventFieldError(eventHostInput);
            errors.push("Host / chairperson is required.");
          }
          if (!Number.isFinite(capacity) || capacity < 0) {
            markEventFieldError(eventCapacityInput);
            errors.push("Capacity must be 0 or greater.");
          }
          if (errors.length > 0) {
            return { error: errors[0] };
          }

          if (audienceSelection.audienceType === "groups" && !(audienceSelection.groupNames || []).length && !(audienceSelection.inviteeUserIds || []).length) {
            markEventFieldError(eventAudienceInput);
            return { error: "Select at least one group or individual member for targeted events." };
          }

          return {
            payload: {
              title,
              description,
              startAt,
              endAt,
              venueType,
              venueName,
              hostName,
              capacity,
              registrationClosesAt,
              ...audienceSelection
            }
          };
        }

        function buildEventUpdatePayload(formData, originalEvent) {
          if (!originalEvent) {
            return { error: "Select an event to edit first." };
          }
          resetEventFormValidation();
          const title = String(formData.get("title") || "").trim();
          const description = String(formData.get("description") || "").trim();
          const startAt = toIsoStringFromLocalInput(formData.get("startAt"));
          const endAt = toIsoStringFromLocalInput(formData.get("endAt"));
          const venueType = String(formData.get("venueType") || "").trim();
          const venueName = String(formData.get("venueName") || "").trim();
          const hostName = String(formData.get("hostName") || "").trim();
          const capacity = Number(formData.get("capacity") || 0);
          const registrationClosesAt = toIsoStringFromLocalInput(formData.get("registrationClosesAt"));
          const audienceSelection = resolveEventAudienceSelection(formData);
          const errors = [];

          if (!title) {
            markEventFieldError(eventTitleInput);
            errors.push("Title is required.");
          }
          if (!startAt) {
            markEventFieldError(eventStartInput);
            errors.push("Start date and time is required.");
          }
          if (!endAt) {
            markEventFieldError(eventEndInput);
            errors.push("End date and time is required.");
          }
          if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
            markEventFieldError(eventStartInput);
            markEventFieldError(eventEndInput);
            errors.push("End date and time must be later than start date and time.");
          }
          if (!venueType) {
            markEventFieldError(eventVenueInput);
            errors.push("Venue type is required.");
          }
          if (!hostName) {
            markEventFieldError(eventHostInput);
            errors.push("Host / chairperson is required.");
          }
          if (!Number.isFinite(capacity) || capacity < 0) {
            markEventFieldError(eventCapacityInput);
            errors.push("Capacity must be 0 or greater.");
          }

          const resolvedAudienceCode =
            audienceSelection.audienceCode ||
            originalEvent.audienceCode ||
            originalEvent.audienceType ||
            "all_members";
          if (resolvedAudienceCode === "groups" && !(audienceSelection.groupNames || []).length && !(audienceSelection.inviteeUserIds || []).length) {
            markEventFieldError(eventAudienceInput);
            errors.push("Select at least one group or individual member for targeted events.");
          }
          if (errors.length > 0) {
            return { error: errors[0] };
          }

          const payload = {
            title,
            description,
            startAt,
            endAt,
            venueType,
            venueName,
            hostName,
            capacity,
            registrationClosesAt,
            ...audienceSelection,
            audienceCode: resolvedAudienceCode
          };
          return { payload };
        }

        [
          eventTitleInput,
          eventStartInput,
          eventEndInput,
          eventVenueInput,
          eventHostInput,
          eventCapacityInput,
          eventRegistrationCloseInput,
          eventAudienceInput
        ].forEach(
          (input) => {
            if (!input) return;
            const eventType = input.tagName === "SELECT" ? "change" : "input";
            input.addEventListener(eventType, () => clearEventFieldError(input));
          }
        );

        eventAudienceInput.addEventListener("change", () => {
          clearEventFieldError(eventAudienceInput);
          renderMemberGroupOptions();
          const currentGroups = selectedEventGroups();
          renderEventGroupOptions(currentGroups);
          if (eventAudienceInput.value === "all_members") {
            setEventGroupSelections([]);
          } else if (selectedEventGroups().length === 0) {
            const selectedLabel = eventAudienceInput.selectedOptions?.[0]?.textContent || "";
            if (selectedLabel && selectedLabel.toLowerCase() !== "legacy audience") {
              setEventGroupSelections([selectedLabel]);
            }
          }
          if (activeImportRowId) {
            const row = findImportRow(activeImportRowId);
            renderImportEditGroupOptions(row ? row.groups : []);
          }
        });

        if (eventHostInput) {
          eventHostInput.addEventListener("input", () => {
            const term = String(eventHostInput.value || "").trim().toLowerCase();
            if (!term) {
              hideHostSuggestions();
              return;
            }
            const source = Array.isArray(memberDirectorySource) ? memberDirectorySource : [];
            const matches = source.filter((member) => {
              const name = String(member.fullName || member.username || "").toLowerCase();
              const email = String(member.email || "").toLowerCase();
              return name.includes(term) || email.includes(term);
            });
            showHostSuggestions(matches);
          });

          eventHostInput.addEventListener("blur", () => {
            setTimeout(() => {
              hideHostSuggestions();
            }, 150);
          });
        }

        let memberDirectorySource = [];
        let authToken = sessionStorage.getItem("iwfsa_admin_token");
        let authRole = sessionStorage.getItem("iwfsa_admin_role") || "";
        let authUsername = sessionStorage.getItem("iwfsa_admin_username") || "";
        let authExpiresAt = sessionStorage.getItem("iwfsa_admin_expires_at") || "";
        if (authToken && isStoredAdminSessionExpired()) {
          clearStoredAdminSession();
          authToken = null;
          authRole = "";
          authUsername = "";
          authExpiresAt = "";
        }
        let activeImportBatch = null;
        let activeImportBatchId = "";
        let importRowsCache = [];
        let activeImportRowId = 0;
        let importRestoreRequested = false;
        let activeMemberDetailId = 0;
        let activeNewsPostId = null;
        let newsItemsCache = [];
        let publicHeroSettings = null;
        let membershipFeeCycles = [];
        let membershipFeeOverview = null;
        let membershipFeeMembers = [];
        let membershipFeeCategories = [];
        let selectedMembershipFeeUserIds = new Set();
        const IMPORT_BATCH_STORAGE_KEY = "iwfsa_admin_last_import_batch_v1";
        const PUBLIC_HERO_DEFAULT_IMAGE_URL = "${config.appBaseUrl}/assets/iwfsa-home.jpg?v=${UI_BUILD}-public-refresh";
        const PUBLIC_HERO_DEFAULT_ALT_TEXT = "IWFSA leaders meeting around a conference table in Sandton while a presentation screen reads Ignite. Inspire. Impact.";
        const PUBLIC_HERO_DEFAULT_FOCAL_POINT = "center top";

        function hideHostSuggestions() {
          if (eventHostSuggestions) {
            eventHostSuggestions.innerHTML = "";
            eventHostSuggestions.hidden = true;
          }
        }

        function showHostSuggestions(matches) {
          if (!eventHostSuggestions) return;
          if (!matches || !matches.length) {
            hideHostSuggestions();
            return;
          }
          const items = matches
            .slice(0, 8)
            .map((member) => {
              const label = String(member.fullName || member.username || member.email || "").trim();
              const org = normalizeDisplayText(member.organisation || "");
              const detail = isMissingDisplayText(org) ? "" : " (" + org + ")";
              return (
                "<button type='button' class='host-suggestion' data-host-label='" +
                escapeClientHtml(label) +
                "'>" +
                escapeClientHtml(label + detail) +
                "</button>"
              );
            })
            .join("");
          eventHostSuggestions.innerHTML = items;
          eventHostSuggestions.hidden = false;
          eventHostSuggestions.querySelectorAll("button.host-suggestion").forEach((button) => {
            button.addEventListener("click", () => {
              const label = button.getAttribute("data-host-label") || "";
              if (eventHostInput) {
                eventHostInput.value = label;
                clearEventFieldError(eventHostInput);
                eventHostInput.focus();
              }
              hideHostSuggestions();
            });
          });
        }

        function configuredAudienceGroups() {
          return CURATED_AUDIENCE_GROUPS.map((group) => ({ ...group }));
        }

        function listConfiguredAudienceGroups() {
          return configuredAudienceGroups().map((group) => group.value);
        }

        function renderMemberGroupOptions() {
          if (!memberAddGroups) {
            return;
          }
          const groups = configuredAudienceGroups();
          if (groups.length === 0) {
            memberAddGroups.innerHTML = "<p class='muted'>No audience groups configured yet.</p>";
            return;
          }
          memberAddGroups.innerHTML = groups
            .map(
              (group) =>
                "<label class='group-option'>" +
                "<input type='checkbox' name='member-add-group' value='" +
                escapeClientHtml(group.value) +
                "' />" +
                "<span class='group-option-copy'>" + escapeClientHtml(group.label) + "</span>" +
                "</label>"
            )
            .join("");
        }

        function renderEventGroupOptions(selected = []) {
          if (!eventAudienceGroups) {
            return;
          }
          const groups = configuredAudienceGroups();
          if (groups.length === 0) {
            eventAudienceGroups.innerHTML = "<p class='muted'>No audience groups configured yet.</p>";
            return;
          }
          const selectedLower = new Set(selected.map((label) => String(label || "").toLowerCase()));
          eventAudienceGroups.innerHTML = groups
            .map((group) => {
              const isChecked = selectedLower.has(String(group.value || "").toLowerCase()) ? " checked" : "";
              return (
                "<label class='group-option'>" +
                "<input type='checkbox' name='event-audience-group' value='" +
                escapeClientHtml(group.value) +
                "'" +
                isChecked +
                " />" +
                "<span class='group-option-copy'>" + escapeClientHtml(group.label) + "</span>" +
                "</label>"
              );
            })
            .join("");
        }

        function selectedEventGroups() {
          if (!eventAudienceGroups) {
            return [];
          }
          return Array.from(eventAudienceGroups.querySelectorAll("input[name='event-audience-group']:checked"))
            .map((input) => String(input.value || "").trim())
            .filter(Boolean);
        }

        function setEventGroupSelections(groups) {
          if (!eventAudienceGroups) {
            return;
          }
          const normalized = new Set(
            (Array.isArray(groups) ? groups : [])
              .map((label) => String(label || "").trim().toLowerCase())
              .filter(Boolean)
          );
          eventAudienceGroups.querySelectorAll("input[name='event-audience-group']").forEach((input) => {
            const value = String(input.value || "").trim().toLowerCase();
            input.checked = normalized.has(value);
          });
        }

        function eventInviteeId(member) {
          const id = Number(member?.userId || member?.id || 0);
          return Number.isInteger(id) && id > 0 ? id : 0;
        }

        function eventInviteeLabel(member) {
          return String(member?.fullName || member?.username || member?.email || "Member").trim();
        }

        function selectedEventInviteeIds() {
          return Array.from(selectedEventInvitees.keys()).filter((id) => Number.isInteger(id) && id > 0);
        }

        function renderEventInviteeSelections() {
          if (!eventSelectedInvitees) return;
          const selected = Array.from(selectedEventInvitees.values());
          if (selected.length === 0) {
            eventSelectedInvitees.innerHTML = "<p class='muted'>No individual members selected yet.</p>";
            return;
          }
          eventSelectedInvitees.innerHTML = selected
            .map((member) => {
              const id = eventInviteeId(member);
              const label = eventInviteeLabel(member);
              const detail = member.email ? "<span>" + escapeClientHtml(member.email) + "</span>" : "";
              return (
                "<span class='invitee-chip'>" +
                "<span><strong>" + escapeClientHtml(label) + "</strong>" + detail + "</span>" +
                "<button type='button' data-remove-event-invitee='" + id + "' aria-label='Remove " + escapeClientHtml(label) + "'>Remove</button>" +
                "</span>"
              );
            })
            .join("");
        }

        function renderEventInviteeResults(term = "") {
          if (!eventInviteeResults) return;
          const query = String(term || eventInviteeSearchInput?.value || "").trim().toLowerCase();
          const source = Array.isArray(memberDirectorySource)
            ? memberDirectorySource.filter((member) => !member.status || member.status === "active")
            : [];
          if (source.length === 0) {
            eventInviteeResults.innerHTML = authToken
              ? "<p class='muted'>No active members are available to invite yet.</p>"
              : "<p class='muted'>Sign in and load members to search the directory.</p>";
            return;
          }
          if (!query) {
            eventInviteeResults.innerHTML = "<p class='muted'>Start typing a member name or email to add individual invitees.</p>";
            return;
          }
          const matches = source
            .filter((member) => {
              const id = eventInviteeId(member);
              if (!id || selectedEventInvitees.has(id)) return false;
              const haystack = [member.fullName, member.username, member.email, member.organisation || member.company, ...(Array.isArray(member.groups) ? member.groups : [])]
                .map((value) => normalizeDisplayText(value).toLowerCase())
                .join(" ");
              return haystack.includes(query);
            })
            .slice(0, 8);
          if (matches.length === 0) {
            eventInviteeResults.innerHTML = "<p class='muted'>No matching active members found.</p>";
            return;
          }
          eventInviteeResults.innerHTML = matches
            .map((member) => {
              const id = eventInviteeId(member);
              const label = eventInviteeLabel(member);
              const detailParts = [member.email, member.organisation || member.company]
                .map((value) => normalizeDisplayText(value))
                .filter((value) => !isMissingDisplayText(value))
                .join(" | ");
              return (
                "<button type='button' class='invitee-result' data-add-event-invitee='" + id + "'>" +
                "<strong>" + escapeClientHtml(label) + "</strong>" +
                (detailParts ? "<span>" + escapeClientHtml(detailParts) + "</span>" : "") +
                "</button>"
              );
            })
            .join("");
        }

        function setEventInviteeSelections(items = []) {
          selectedEventInvitees.clear();
          const list = Array.isArray(items) ? items : [];
          for (const item of list) {
            const candidate = typeof item === "number" ? { id: item } : item;
            const id = eventInviteeId(candidate);
            if (!id) continue;
            const member = memberDirectorySource.find((entry) => eventInviteeId(entry) === id) || candidate;
            selectedEventInvitees.set(id, member);
          }
          if (eventInviteeSearchInput) {
            eventInviteeSearchInput.value = "";
          }
          renderEventInviteeSelections();
          renderEventInviteeResults();
        }

        async function uploadAdminEventAttachment(eventId, file, token) {
          if (!file) return null;
          const formData = new FormData();
          formData.set("documentType", "attachment");
          formData.set("availabilityMode", "immediate");
          formData.set("memberAccessScope", "all_visible");
          formData.set("publishNow", "true");
          formData.set("file", file, file.name || "event-attachment.txt");
          const response = await fetch("${config.apiBaseUrl}/api/events/" + String(eventId) + "/documents", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
          });
          const json = await response.json();
          if (!response.ok) {
            throw new Error(json.message || "The meeting was saved, but the attachment could not be uploaded.");
          }
          return json.item || null;
        }

        function selectedMemberGroups() {
          if (!memberAddGroups) {
            return [];
          }
          return Array.from(memberAddGroups.querySelectorAll("input[name='member-add-group']:checked"))
            .map((input) => String(input.value || "").trim())
            .filter(Boolean);
        }

        function splitCsvValues(value) {
          return String(value || "")
            .split(",")
            .map((entry) => String(entry || "").trim())
            .filter(Boolean);
        }

        function normalizeGroupList(values) {
          const list = Array.isArray(values) ? values : splitCsvValues(values);
          const normalized = [];
          const seen = new Set();
          for (const value of list) {
            const text = String(value || "").trim();
            if (!text) {
              continue;
            }
            const key = text.toLowerCase();
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            normalized.push(text);
          }
          return normalized;
        }

        function persistLastImportBatchId(batchId) {
          const value = String(batchId || "").trim();
          if (!value) {
            return;
          }
          try {
            localStorage.setItem(IMPORT_BATCH_STORAGE_KEY, value);
          } catch {
            // no-op
          }
        }

        function getDefaultPublicHeroSettings() {
          return {
            sourceType: "default",
            imageUrl: null,
            altText: PUBLIC_HERO_DEFAULT_ALT_TEXT,
            focalPoint: "top",
            focalPointCss: PUBLIC_HERO_DEFAULT_FOCAL_POINT,
            hasCustomImage: false,
            usesDefaultImage: true
          };
        }

        function resolvePublicHeroPreviewSource(item) {
          return item && item.imageUrl ? item.imageUrl : PUBLIC_HERO_DEFAULT_IMAGE_URL;
        }

        function applyPublicHeroPreview(item) {
          const resolved = item || getDefaultPublicHeroSettings();
          if (publicHeroPreviewImage) {
            publicHeroPreviewImage.src = resolvePublicHeroPreviewSource(resolved);
            publicHeroPreviewImage.alt = resolved.altText || PUBLIC_HERO_DEFAULT_ALT_TEXT;
            publicHeroPreviewImage.style.objectPosition = resolved.focalPointCss || PUBLIC_HERO_DEFAULT_FOCAL_POINT;
          }
          if (publicHeroPreviewCaption) {
            if (resolved.sourceType === "external") {
              publicHeroPreviewCaption.textContent = "Linked image on the public page with the homepage crop applied.";
            } else if (resolved.sourceType === "upload") {
              publicHeroPreviewCaption.textContent = "Uploaded site image on the public page with the homepage crop applied.";
            } else {
              publicHeroPreviewCaption.textContent = "Default site image with the homepage crop applied.";
            }
          }
        }

        function populatePublicHeroSettings(item) {
          const resolved = item || getDefaultPublicHeroSettings();
          publicHeroSettings = resolved;
          if (publicHeroImageUrlInput) {
            publicHeroImageUrlInput.value = resolved.sourceType === "external" ? String(resolved.imageUrl || "") : "";
          }
          if (publicHeroAltTextInput) {
            publicHeroAltTextInput.value = resolved.altText || PUBLIC_HERO_DEFAULT_ALT_TEXT;
          }
          if (publicHeroFocalPointInput) {
            publicHeroFocalPointInput.value = resolved.focalPoint || "top";
          }
          if (publicHeroUploadFileInput) {
            publicHeroUploadFileInput.value = "";
          }
          applyPublicHeroPreview(resolved);
        }

        async function loadPublicHeroSettings() {
          if (!authToken) {
            populatePublicHeroSettings(getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Sign in to manage the public page hero image.";
            return;
          }
          if (!canUseAdminActions()) {
            populatePublicHeroSettings(getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Only admin and chief admin roles can manage the public page hero image.";
            return;
          }

          publicHeroStatus.textContent = "Loading public page hero settings...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/site-settings/public-hero", {
              headers: { Authorization: "Bearer " + authToken }
            });
            if (clearAdminAuthOnUnauthorized(response)) {
              return;
            }
            const json = await response.json();
            if (!response.ok) {
              publicHeroStatus.textContent = json.message || "Unable to load public page hero settings.";
              return;
            }
            populatePublicHeroSettings(json.item || getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = json.item && json.item.hasCustomImage
              ? "Public page hero settings loaded."
              : "Using the default public page hero image.";
          } catch {
            publicHeroStatus.textContent = "Unable to reach API for public page hero settings.";
          }
        }

        async function saveLinkedPublicHero() {
          if (!authToken || !canUseAdminActions()) {
            publicHeroStatus.textContent = "Only admin and chief admin roles can manage the public page hero image.";
            return;
          }

          const imageUrl = String(publicHeroImageUrlInput?.value || "").trim();
          const altText = String(publicHeroAltTextInput?.value || "").trim();
          const focalPoint = String(publicHeroFocalPointInput?.value || "top").trim();
          if (!imageUrl) {
            publicHeroStatus.textContent = "Add an https image URL before saving a linked image.";
            return;
          }
          if (!altText) {
            publicHeroStatus.textContent = "Add alt text before saving the public page image.";
            return;
          }

          publicHeroStatus.textContent = "Saving linked image...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/site-settings/public-hero", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ imageUrl, altText, focalPoint })
            });
            if (clearAdminAuthOnUnauthorized(response)) {
              return;
            }
            const json = await response.json();
            if (!response.ok) {
              publicHeroStatus.textContent = json.message || "Unable to save linked image.";
              return;
            }
            populatePublicHeroSettings(json.item || getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Public page hero updated from linked image.";
          } catch {
            publicHeroStatus.textContent = "Unable to reach API for public page hero settings.";
          }
        }

        async function uploadPublicHeroImage() {
          if (!authToken || !canUseAdminActions()) {
            publicHeroStatus.textContent = "Only admin and chief admin roles can manage the public page hero image.";
            return;
          }

          const file = publicHeroUploadFileInput?.files && publicHeroUploadFileInput.files[0] ? publicHeroUploadFileInput.files[0] : null;
          const altText = String(publicHeroAltTextInput?.value || "").trim();
          const focalPoint = String(publicHeroFocalPointInput?.value || "top").trim();
          if (!file) {
            publicHeroStatus.textContent = "Choose a JPG, PNG, or WebP file before uploading.";
            return;
          }
          if (!altText) {
            publicHeroStatus.textContent = "Add alt text before uploading the public page image.";
            return;
          }

          const formData = new FormData();
          formData.set("altText", altText);
          formData.set("focalPoint", focalPoint);
          formData.set("file", file, file.name || "public-hero-image");

          publicHeroStatus.textContent = "Uploading public page image...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/site-settings/public-hero/upload", {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken },
              body: formData
            });
            if (clearAdminAuthOnUnauthorized(response)) {
              return;
            }
            const json = await response.json();
            if (!response.ok) {
              publicHeroStatus.textContent = json.message || "Unable to upload public page image.";
              return;
            }
            populatePublicHeroSettings(json.item || getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Public page hero uploaded into the site.";
          } catch {
            publicHeroStatus.textContent = "Unable to reach API for public page hero settings.";
          }
        }

        async function resetPublicHeroToDefault() {
          if (!authToken || !canUseAdminActions()) {
            publicHeroStatus.textContent = "Only admin and chief admin roles can manage the public page hero image.";
            return;
          }

          publicHeroStatus.textContent = "Restoring default public page image...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/site-settings/public-hero", {
              method: "DELETE",
              headers: { Authorization: "Bearer " + authToken }
            });
            if (clearAdminAuthOnUnauthorized(response)) {
              return;
            }
            const json = await response.json();
            if (!response.ok) {
              publicHeroStatus.textContent = json.message || "Unable to restore default public page image.";
              return;
            }
            populatePublicHeroSettings(json.item || getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Default public page hero restored.";
          } catch {
            publicHeroStatus.textContent = "Unable to reach API for public page hero settings.";
          }
        }

        function readPersistedImportBatchId() {
          try {
            return String(localStorage.getItem(IMPORT_BATCH_STORAGE_KEY) || "").trim();
          } catch {
            return "";
          }
        }

        function clearPersistedImportBatchId(batchId = "") {
          const target = String(batchId || "").trim();
          try {
            if (!target) {
              localStorage.removeItem(IMPORT_BATCH_STORAGE_KEY);
              return;
            }
            const current = String(localStorage.getItem(IMPORT_BATCH_STORAGE_KEY) || "").trim();
            if (current === target) {
              localStorage.removeItem(IMPORT_BATCH_STORAGE_KEY);
            }
          } catch {
            // no-op
          }
        }

        function collectImportGroupUniverse(extraGroups = []) {
          const configured = listConfiguredAudienceGroups();
          const fromRows = importRowsCache.flatMap((row) => normalizeGroupList(row.groups || []));
          return normalizeGroupList([...(configured || []), ...(fromRows || []), ...(extraGroups || [])]);
        }

        function renderImportEditGroupOptions(selectedGroups = []) {
          if (!importEditGroupsShell) {
            return;
          }
          const options = collectImportGroupUniverse(selectedGroups);
          if (options.length === 0) {
            importEditGroupsShell.innerHTML = "<p class='muted'>No groups available.</p>";
            return;
          }
          const selectedSet = new Set(normalizeGroupList(selectedGroups).map((value) => value.toLowerCase()));
          importEditGroupsShell.innerHTML = options
            .map(
              (groupLabel) =>
                "<label class='group-option'>" +
                "<input type='checkbox' name='import-edit-group' value='" +
                escapeClientHtml(groupLabel) +
                "'" +
                (selectedSet.has(groupLabel.toLowerCase()) ? " checked" : "") +
                " />" +
                escapeClientHtml(groupLabel) +
                "</label>"
            )
            .join("");
        }

        function selectedImportEditGroups() {
          if (!importEditGroupsShell) {
            return [];
          }
          return Array.from(importEditGroupsShell.querySelectorAll("input[name='import-edit-group']:checked"))
            .map((input) => String(input.value || "").trim())
            .filter(Boolean);
        }

        function resetEventFormState(message) {
          activeEventId = null;
          activeEventSnapshot = null;
          eventForm.reset();
          setEventGroupSelections([]);
          setEventInviteeSelections([]);
          if (eventAttachmentInput) {
            eventAttachmentInput.value = "";
          }
          if (eventPublishNowInput) {
            eventPublishNowInput.checked = false;
          }
          resetEventFormValidation();
          if (eventSubmitButton) {
            eventSubmitButton.textContent = "Create meeting";
          }
          if (eventCancelButton) {
            eventCancelButton.hidden = true;
          }
          if (eventCollaborationShell) {
            eventCollaborationShell.hidden = true;
          }
          if (eventDraftNotesInput) {
            eventDraftNotesInput.value = "";
          }
          if (eventInternalCommentsList) {
            eventInternalCommentsList.innerHTML = "<p class='muted'>No comments yet.</p>";
          }
          if (eventInternalCommentBody) {
            eventInternalCommentBody.value = "";
          }
          if (eventDraftNotesStatus) {
            eventDraftNotesStatus.textContent = "";
          }
          if (eventInternalCommentStatus) {
            eventInternalCommentStatus.textContent = "";
          }
          if (message) {
            eventStatus.textContent = message;
          }
        }

        function renderInternalComments(comments) {
          const items = Array.isArray(comments) ? comments : [];
          if (!eventInternalCommentsList) {
            return;
          }

          if (!items.length) {
            eventInternalCommentsList.innerHTML = "<p class='muted'>No comments yet.</p>";
            return;
          }

          eventInternalCommentsList.innerHTML = items
            .map((comment) => {
              const author = escapeClientHtml(comment.authorName || "Unknown");
              const timestamp = escapeClientHtml(formatEventDateTime(comment.createdAt));
              const body = escapeClientHtml(String(comment.bodyMarkdown || ""));
              return (
                "<article class='event-comment'>" +
                "<div class='event-comment-meta'><strong>" +
                author +
                "</strong><span class='muted'>" +
                timestamp +
                "</span></div>" +
                "<div class='event-comment-body'>" +
                body +
                "</div>" +
                "</article>"
              );
            })
            .join("");
        }

        async function loadEventCollaboration(eventId) {
          if (!eventCollaborationShell || !eventDraftNotesStatus) {
            return;
          }
          if (!authToken) {
            eventCollaborationShell.hidden = true;
            return;
          }
          eventDraftNotesStatus.textContent = "Loading collaboration...";
          if (eventInternalCommentStatus) {
            eventInternalCommentStatus.textContent = "";
          }
          try {
            const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/collaboration", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              eventCollaborationShell.hidden = true;
              eventDraftNotesStatus.textContent = "";
              return;
            }
            eventCollaborationShell.hidden = false;
            if (eventDraftNotesInput) {
              eventDraftNotesInput.value = String(json.draftNotesMarkdown || "");
            }
            renderInternalComments(json.comments || []);
            eventDraftNotesStatus.textContent = "";
          } catch {
            eventCollaborationShell.hidden = true;
            eventDraftNotesStatus.textContent = "";
          }
        }

        function beginEventEdit(eventItem) {
          if (!eventItem) {
            eventStatus.textContent = "Select a valid event to edit.";
            return;
          }
          activeEventId = eventItem.id;
          activeEventSnapshot = eventItem;
          eventTitleInput.value = eventItem.title || "";
          if (eventDescriptionInput) {
            eventDescriptionInput.value = eventItem.description || "";
          }
          eventStartInput.value = toLocalInputValue(eventItem.startAt);
          eventEndInput.value = toLocalInputValue(eventItem.endAt);
          eventVenueInput.value = eventItem.venueType || "physical";
          if (eventVenueNameInput) {
            eventVenueNameInput.value = eventItem.venueName || "";
          }
          if (eventHostInput) {
            eventHostInput.value = eventItem.hostName || "";
          }
          if (eventRegistrationCloseInput) {
            const registrationSource =
              eventItem.registrationClosesAt || eventItem.effectiveRegistrationClosesAt || "";
            eventRegistrationCloseInput.value = toLocalInputValue(registrationSource);
          }
          const selectedAudience =
            eventItem.audienceCode || eventItem.audience_type || eventItem.audienceType || "all_members";
          if (eventAudienceInput) {
            if (!eventAudienceInput.querySelector("option[value='" + selectedAudience + "']")) {
              const fallbackOption = document.createElement("option");
              fallbackOption.value = selectedAudience;
              fallbackOption.textContent = "Legacy audience";
              eventAudienceInput.appendChild(fallbackOption);
            }
            eventAudienceInput.value = selectedAudience;
          }
          const existingGroups = Array.isArray(eventItem.audienceGroupNames) ? eventItem.audienceGroupNames : [];
          if (existingGroups.length) {
            setEventGroupSelections(existingGroups);
          } else if (selectedAudience && selectedAudience !== "all_members") {
            const fallbackLabel = eventItem.audienceLabel || "";
            if (fallbackLabel && fallbackLabel.toLowerCase() !== "groups") {
              setEventGroupSelections([fallbackLabel]);
            }
          } else {
            setEventGroupSelections([]);
          }
          setEventInviteeSelections(eventItem.audienceInvitees || []);
          if (eventAttachmentInput) {
            eventAttachmentInput.value = "";
          }
          if (eventPublishNowInput) {
            eventPublishNowInput.checked = false;
          }
          resetEventFormValidation();
          if (eventSubmitButton) {
            eventSubmitButton.textContent = "Update meeting";
          }
          if (eventCancelButton) {
            eventCancelButton.hidden = false;
          }
          eventStatus.textContent = "Editing event: " + (eventItem.title || "");
          loadEventCollaboration(activeEventId);
          eventForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (eventSaveDraftNotesButton) {
          eventSaveDraftNotesButton.addEventListener("click", async () => {
            if (!authToken || !activeEventId) {
              return;
            }
            if (eventDraftNotesStatus) {
              eventDraftNotesStatus.textContent = "Saving...";
            }
            try {
              const response = await fetch("${config.apiBaseUrl}/api/events/" + activeEventId + "/draft-notes", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ draftNotesMarkdown: String(eventDraftNotesInput?.value || "") })
              });
              const json = await response.json();
              if (!response.ok) {
                if (eventDraftNotesStatus) {
                  eventDraftNotesStatus.textContent = json.message || "Unable to save notes.";
                }
                return;
              }
              if (eventDraftNotesStatus) {
                eventDraftNotesStatus.textContent = "Saved.";
              }
            } catch {
              if (eventDraftNotesStatus) {
                eventDraftNotesStatus.textContent = "Unable to reach API to save notes.";
              }
            }
          });
        }

        if (eventPostInternalCommentButton) {
          eventPostInternalCommentButton.addEventListener("click", async () => {
            if (!authToken || !activeEventId) {
              return;
            }
            const body = String(eventInternalCommentBody?.value || "").trim();
            if (!body) {
              if (eventInternalCommentStatus) {
                eventInternalCommentStatus.textContent = "Enter a comment first.";
              }
              return;
            }
            if (eventInternalCommentStatus) {
              eventInternalCommentStatus.textContent = "Posting...";
            }
            try {
              const response = await fetch(
                "${config.apiBaseUrl}/api/events/" + activeEventId + "/internal-comments",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken
                  },
                  body: JSON.stringify({ bodyMarkdown: body })
                }
              );
              const json = await response.json();
              if (!response.ok) {
                if (eventInternalCommentStatus) {
                  eventInternalCommentStatus.textContent = json.message || "Unable to post comment.";
                }
                return;
              }
              if (eventInternalCommentBody) {
                eventInternalCommentBody.value = "";
              }
              if (eventInternalCommentStatus) {
                eventInternalCommentStatus.textContent = "Posted.";
              }
              await loadEventCollaboration(activeEventId);
            } catch {
              if (eventInternalCommentStatus) {
                eventInternalCommentStatus.textContent = "Unable to reach API to post comment.";
              }
            }
          });
        }

        function setAuthToken(token, role, username, expiresAt) {
          authToken = token || null;
          authRole = role || authRole || "";
          authUsername = username || authUsername || "";
          authExpiresAt = expiresAt || authExpiresAt || "";
          document.body.classList.toggle("admin-signed-in", Boolean(authToken));
          if (authToken) {
            sessionStorage.setItem("iwfsa_admin_token", authToken);
            if (authRole) {
              sessionStorage.setItem("iwfsa_admin_role", authRole);
            }
            if (authUsername) {
              sessionStorage.setItem("iwfsa_admin_username", authUsername);
            }
            if (authExpiresAt) {
              sessionStorage.setItem("iwfsa_admin_expires_at", authExpiresAt);
            } else {
              sessionStorage.removeItem("iwfsa_admin_expires_at");
            }
          } else {
            clearStoredAdminSession();
            authRole = "";
            authUsername = "";
            authExpiresAt = "";
          }
          if (status) {
            status.textContent = authToken
              ? "Signed in as " +
                (authUsername || "admin") +
                (authRole ? " (" + authRole + ")" : "") +
                "."
              : "Not signed in.";
          }
          if (adminSessionBar) {
            adminSessionBar.hidden = !authToken;
          }
          if (adminSessionSummary) {
            adminSessionSummary.textContent = authToken
              ? "Signed in as " +
                (authUsername || "admin") +
                (authRole ? " (" + authRole + ")" : "") +
                ". Full admin editing is enabled for member and event operations."
              : "Not signed in.";
          }
          document.querySelectorAll(".session-nav-signout").forEach((button) => {
            button.hidden = !authToken;
          });
          if (logoutButton) {
            logoutButton.disabled = !authToken;
            logoutButton.hidden = !authToken;
          }
          refreshEventsButton.disabled = !authToken;
          dispatchRemindersButton.disabled = !authToken || !canUseAdminActions();
          eventViewInput.disabled = !authToken;
          if (createEventFab) {
            createEventFab.disabled = !authToken;
          }
          if (eventForm) {
            Array.from(eventForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !authToken);
              }
            });
          }
          refreshDeliveriesButton.disabled = !authToken;
          refreshQueueButton.disabled = !authToken;
          refreshReportsButton.disabled = !authToken;
          exportReportsButton.disabled = !authToken;
          reportWindowDaysInput.disabled = !authToken;
          addModeratorButton.disabled = !authToken;
          moderatorUserIdInput.disabled = !authToken;
          const canManagePublicHero = Boolean(authToken) && canUseAdminActions();
          if (publicHeroSettingsForm) {
            Array.from(publicHeroSettingsForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !canManagePublicHero);
              }
            });
          }
          if (publicHeroRefreshButton) {
            publicHeroRefreshButton.disabled = !canManagePublicHero;
          }
          if (publicHeroSaveLinkButton) {
            publicHeroSaveLinkButton.disabled = !canManagePublicHero;
          }
          if (publicHeroUploadButton) {
            publicHeroUploadButton.disabled = !canManagePublicHero;
          }
          if (publicHeroResetButton) {
            publicHeroResetButton.disabled = !canManagePublicHero;
          }
          const canManageFees = Boolean(authToken) && canUseAdminActions();
          feeCycleYearInput.disabled = !canManageFees;
          feeRefreshButton.disabled = !canManageFees;
          feeCycleCreateYearInput.disabled = !canManageFees;
          feeCycleDueDateInput.disabled = !canManageFees;
          feeCycleStatusInput.disabled = !canManageFees;
          feeCycleSaveButton.disabled = !canManageFees;
          feeSearchInput.disabled = !canManageFees;
          feeStandingFilterInput.disabled = !canManageFees;
          feeAccountFilterInput.disabled = !canManageFees;
          feeCategoryFilterInput.disabled = !canManageFees;
          feeProfileFilterInput.disabled = !canManageFees;
          feeFiltersApplyButton.disabled = !canManageFees;
          feeFiltersResetButton.disabled = !canManageFees;
          feeBulkStandingInput.disabled = !canManageFees;
          feeBulkAccessInput.disabled = !canManageFees;
          feeBulkReasonInput.disabled = !canManageFees;
          feeSelectAllMembersInput.disabled = !canManageFees;
          updateMembershipFeeBulkBar();
          const canManageNews = Boolean(authToken) && canUseAdminActions();
          refreshNewsButton.disabled = !authToken || !canManageNews;
          newsFilterStatusInput.disabled = !authToken || !canManageNews;
          if (newsForm) {
            Array.from(newsForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !canManageNews);
              }
            });
          }
          if (newsSubmitButton) {
            newsSubmitButton.disabled = !canManageNews;
          }
          if (refreshProfileReviewsButton) {
            refreshProfileReviewsButton.disabled = !authToken || !canManageNews;
          }
          if (honoraryMemberForm) {
            Array.from(honoraryMemberForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !canManageNews);
              }
            });
          }
          if (honoraryMemberSubmitButton) {
            honoraryMemberSubmitButton.disabled = !canManageNews;
          }
          if (memorialEntryForm) {
            Array.from(memorialEntryForm.elements || []).forEach((element) => {
              if (element instanceof HTMLElement) {
                element.toggleAttribute("disabled", !canManageNews);
              }
            });
          }
          if (memorialEntrySubmitButton) {
            memorialEntrySubmitButton.disabled = !canManageNews;
          }
          if (!authToken) {
            importRestoreRequested = false;
            resetImportView("Sign in to run imports.");
            selectedEventIds = new Set();
            updateEventBulkBar();
            reportStatus.textContent = "Sign in to load reporting data.";
            reportEventsBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load reporting data.</td></tr>";
            reportSmsBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load SMS activity.</td></tr>";
            moderatorStatus.textContent = "Sign in to manage moderators.";
            moderatorTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load moderators.</td></tr>";
            moderatorUserIdInput.innerHTML = "<option value=''>Select member</option>";
            populatePublicHeroSettings(getDefaultPublicHeroSettings());
            publicHeroStatus.textContent = "Sign in to manage the public page hero image.";
            newsStatusText.textContent = "Sign in to manage curated member news.";
            newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Sign in to load member news posts.</td></tr>";
            profileReviewStatus.textContent = "Sign in to review public profile submissions.";
            profileReviewTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load public profile submissions.</td></tr>";
            honoraryMemberStatusText.textContent = "Sign in to manage honorary member entries.";
            honoraryMemberTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load honorary member entries.</td></tr>";
            memorialEntryStatusText.textContent = "Sign in to manage memorial entries.";
            memorialEntryTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load memorial entries.</td></tr>";
            activeNewsPostId = null;
            newsItemsCache = [];
            resetMembershipFeesView("Sign in to manage membership fee records.");
          } else {
            importStatus.textContent = "Run dry-run to create a new batch, or load an existing batch id.";
            updateImportButtons();
            newsStatusText.textContent = canUseAdminActions()
              ? "Create or edit curated IWFSA news for members."
              : "Only admin and chief admin roles can manage member news.";
            if (canUseAdminActions()) {
              feeCycleStatusText.textContent = "Membership cycle and standing workspace ready.";
              feeMembersStatus.textContent = "Use refresh to load membership fee records.";
            } else {
              resetMembershipFeesView("Only admin and chief admin roles can manage membership fee records.");
            }
          }
        }

        function clearAdminAuthOnUnauthorized(response) {
          if (!response || response.status !== 401) {
            return false;
          }
          setAuthToken(null, "", "");
          if (status) {
            status.textContent = "Admin session expired. Please sign in again.";
          }
          window.location.replace(ADMIN_SIGN_IN_URL);
          return true;
        }

        async function loadAdminWorkspace() {
          if (!authToken) {
            return;
          }
          await loadMembers();
          if (!authToken) return;
          await loadPublicHeroSettings();
          if (!authToken) return;
          await loadPublicProfileReviews();
          if (!authToken) return;
          await loadHonoraryMembers();
          if (!authToken) return;
          await loadMemorialEntries();
          if (!authToken) return;
          await loadMembershipFeesWorkspace({ reloadCycles: true });
          if (!authToken) return;
          await loadEvents();
          if (!authToken) return;
          await restoreImportBatchContext();
          if (!authToken) return;
          await loadDeliveries();
          if (!authToken) return;
          await loadQueueStatus();
          if (!authToken) return;
          await loadAdminNews();
          if (!authToken) return;
          await loadReports();
          if (!authToken) return;
          await loadModerators();
        }

        const ADMIN_HELP_STORAGE_KEY = "iwfsa_admin_help_v1";
        const ADMIN_PANEL_STORAGE_KEY = "iwfsa_admin_panel_config_v1";
        const DISMISSED_HELP_STORAGE_KEY = "iwfsa_admin_dismissed_help_v1";
        const DEFAULT_HELP_TEXT = {
          "refresh-members": "Reload the member directory from the API.",
          "queue-invites": "Queue onboarding invite links for selected members.",
          "queue-resets": "Queue credential reset links for selected members.",
          "member-search": "Start typing to filter the member directory and choose a suggested member.",
          "member-status-filter": "Show members by current status such as active, invited, or paused.",
          "member-role-filter": "Limit the directory to a specific member role.",
          "member-group-filter": "Show members assigned to one governance or working group.",
          "member-sort": "Choose how the filtered member list is ordered.",
          "member-filter-reset": "Clear the search term, dropdown filters, and sort order.",
          "member-add-groups": "Assign one or more groups so targeted events and invites reach the right members.",
          "import-file": "Select an .xlsx workbook for dry-run, or leave empty to reuse the latest saved upload.",
          "apply-import": "Apply the loaded batch when blocking issues are zero.",
          "event-title": "Clear event title shown to eligible members.",
          "event-start": "Event start date/time in your local timezone.",
          "event-end": "Event end date/time in your local timezone.",
          "event-audience": "Audience visibility for this event.",
          "create-event-fab": "Open form to create a new meeting quickly.",
          "event-view": "Filter Event Hub cards by lifecycle/time state.",
          "refresh-events": "Refresh Event Hub cards from the API.",
          "dispatch-reminders": "Send due registration reminders now.",
          "public-hero-image-url": "Paste a stable https image link for the public homepage hero.",
          "public-hero-upload-file": "Upload a JPG, PNG, or WebP hero image directly into the site.",
          "public-hero-alt-text": "Describe the hero image clearly for screen-reader users.",
          "public-hero-focal-point": "Choose which part of the photo stays visible inside the homepage crop.",
          "refresh-deliveries": "Reload recent notification delivery outcomes.",
          "refresh-queue": "Reload notification queue status rows.",
          "fee-cycle-year": "Select the membership cycle year to review or edit.",
          "fee-cycle-save": "Create or update a membership cycle and control open/closed status.",
          "fee-search": "Find members by name, email, company, category, or committee labels.",
          "fee-filters-apply": "Apply standing/account/profile filters to the membership fee grid.",
          "fee-refresh": "Reload cycle summary and membership fee records from the API.",
          "refresh-news": "Reload the curated member news feed.",
          "news-submit": "Create or update a curated member news post.",
          "news-is-pinned": "Pin this update to keep it at the top of member news.",
        };

        function safeParseJson(text) {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        }

        window.iwfsaDismissHelp = function(id) {
          const el = document.getElementById(id);
          if (el) el.hidden = true;
          let dismissed = safeParseJson(localStorage.getItem(DISMISSED_HELP_STORAGE_KEY)) || [];
          if (!Array.isArray(dismissed)) dismissed = [];
          if (!dismissed.includes(id)) {
            dismissed.push(id);
            localStorage.setItem(DISMISSED_HELP_STORAGE_KEY, JSON.stringify(dismissed));
          }
        };

        function persistHelpAndTooltips() {
          let persisted = {};
          try {
            persisted = safeParseJson(localStorage.getItem(ADMIN_HELP_STORAGE_KEY) || "{}") || {};
          } catch {
            persisted = {};
          }
          const merged = { ...DEFAULT_HELP_TEXT, ...persisted };
          try {
            localStorage.setItem(ADMIN_HELP_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // no-op
          }

          const controls = document.querySelectorAll("button, input, select, textarea");
          controls.forEach((control) => {
            const controlId = control.id || "";
            const explicit = merged[controlId];
            const label = controlId
              ? document.querySelector("label[for='" + controlId + "']")?.textContent?.trim()
              : "";
            const fallback = explicit || label || control.getAttribute("placeholder") || control.textContent || "Admin control";
            const helpText = String(fallback || "").trim();
            if (!helpText) {
              return;
            }
            control.setAttribute("title", helpText);
            if (!control.getAttribute("aria-label")) {
              control.setAttribute("aria-label", helpText);
            }
          });

          // Apply dismissed help state
          let dismissed = safeParseJson(localStorage.getItem(DISMISSED_HELP_STORAGE_KEY)) || [];
          if (Array.isArray(dismissed)) {
            dismissed.forEach(id => {
              const el = document.getElementById(id);
              if (el) el.hidden = true;
            });
          }
        }


        function formatStatus(value) {
          if (value === "active") return "Active";
          if (value === "invited") return "Invited";
          if (value === "not_invited") return "Not invited";
          if (value === "suspended") return "Suspended";
          return value || "Unknown";
        }

        function selectedIds() {
          return Array.from(document.querySelectorAll(".member-checkbox:checked")).map((input) =>
            Number(input.value)
          );
        }

        function updateQueueButton() {
          const count = selectedIds().length;
          queueButton.disabled = count === 0;
          resetButton.disabled = count === 0;
          queueButton.textContent =
            count === 0 ? "Send invite links" : "Send invite links (" + count + ")";
          resetButton.textContent =
            count === 0 ? "Queue credential resets" : "Queue credential resets (" + count + ")";
        }

        function renderMemberGroups(groups) {
          if (!Array.isArray(groups) || groups.length === 0) {
            return "<span class='muted'>Unassigned</span>";
          }
          return (
            "<div class='badge-row member-group-badges'>" +
            groups.map((name) => "<span class='badge'>" + escapeClientHtml(name) + "</span>").join("") +
            "</div>"
          );
        }

        function renderMemberRoles(roles) {
          if (!Array.isArray(roles) || roles.length === 0) {
            return "<span class='muted'>Member</span>";
          }
          return (
            "<div class='badge-row member-role-badges'>" +
            roles.map((name) => "<span class='badge'>" + escapeClientHtml(name) + "</span>").join("") +
            "</div>"
          );
        }

        function normalizeSouthAfricanPhone(value) {
          const raw = String(value || "").trim();
          if (!raw) {
            return "";
          }
          const digits = raw.replace(/\D+/g, "");
          if (digits.startsWith("27") && digits.length === 11) {
            return "+" + digits;
          }
          if (digits.startsWith("0") && digits.length === 10) {
            return "+27" + digits.slice(1);
          }
          return raw.startsWith("+") ? raw : "";
        }

        function formatSouthAfricanPhoneLabel(value) {
          const normalized = normalizeSouthAfricanPhone(value);
          if (!normalized) {
            return String(value || "").trim();
          }
          const digits = normalized.replace(/\D+/g, "");
          if (digits.length !== 11 || !digits.startsWith("27")) {
            return normalized;
          }
          return "+27 " + digits.slice(2, 4) + " " + digits.slice(4, 7) + " " + digits.slice(7);
        }

        function renderWhatsappPhoneCell(value) {
          const raw = String(value || "").trim();
          if (!raw) {
            return "<span class='muted'>&mdash;</span>";
          }
          const normalized = normalizeSouthAfricanPhone(raw);
          if (!normalized) {
            return escapeClientHtml(raw);
          }
          const digits = normalized.replace(/\D+/g, "");
          return (
            "<a class='whatsapp-link' href='https://wa.me/" +
            escapeClientHtml(digits) +
            "' target='_blank' rel='noopener noreferrer'>" +
            escapeClientHtml(formatSouthAfricanPhoneLabel(normalized)) +
            "</a>"
          );
        }

        function availableMemberDetailGroups(selected = []) {
          return normalizeGroupList([].concat(listConfiguredAudienceGroups(), Array.isArray(selected) ? selected : []));
        }

        function renderMemberDetailGroups(selected = []) {
          if (!memberDetailGroups) {
            return;
          }
          const groups = availableMemberDetailGroups(selected);
          const selectedKeys = new Set(normalizeGroupList(selected).map((value) => value.toLowerCase()));
          if (!groups.length) {
            memberDetailGroups.innerHTML = "<p class='muted'>No groups configured yet.</p>";
            return;
          }
          memberDetailGroups.innerHTML = groups
            .map((groupLabel) => {
              const checked = selectedKeys.has(String(groupLabel || "").toLowerCase()) ? " checked" : "";
              return (
                "<label class='group-option'>" +
                "<input type='checkbox' name='member-detail-group' value='" +
                escapeClientHtml(groupLabel) +
                "'" +
                checked +
                " />" +
                escapeClientHtml(groupLabel) +
                "</label>"
              );
            })
            .join("");
        }

        function selectedMemberDetailGroups() {
          if (!memberDetailGroups) {
            return [];
          }
          return Array.from(memberDetailGroups.querySelectorAll("input[name='member-detail-group']:checked"))
            .map((input) => String(input.value || "").trim())
            .filter(Boolean);
        }

        function setMemberDetailEnabled(enabled) {
          if (!memberDetailForm) {
            return;
          }
          memberDetailForm.querySelectorAll("input, textarea, button").forEach((element) => {
            if (element === memberDetailCloseButton) {
              return;
            }
            element.disabled = !enabled;
          });
        }

        function resetMemberDetail(message = "Select a member name to edit their record.") {
          activeMemberDetailId = 0;
          if (memberDetailForm) {
            memberDetailForm.reset();
          }
          if (memberDetailShell) {
            memberDetailShell.hidden = true;
          }
          if (memberDetailTitle) {
            memberDetailTitle.textContent = "Member details";
          }
          if (memberDetailSummary) {
            memberDetailSummary.textContent = "Select a member name to review and edit personal details.";
          }
          if (memberDetailStatus) {
            memberDetailStatus.textContent = message;
          }
          renderMemberDetailGroups([]);
          setMemberDetailEnabled(false);
        }

        function applyMemberDetail(item) {
          if (!item || !memberDetailShell) {
            return;
          }
          activeMemberDetailId = Number(item.userId || item.id || 0) || 0;
          memberDetailShell.hidden = false;
          setMemberDetailEnabled(true);
          memberDetailTitle.textContent = String(item.fullName || item.username || "Member details");
          memberDetailSummary.textContent =
            (String(item.email || "").trim() || "No email") +
            " | " +
            (String(item.username || "").trim() || "No username");
          memberDetailFullNameInput.value = String(item.fullName || "");
          memberDetailEmailInput.value = String(item.email || "");
          memberDetailCompanyInput.value = displayInputValue(item.company || item.organisation || "");
          memberDetailPhoneInput.value = String(item.phone || "");
          memberDetailBusinessTitleInput.value = String(item.businessTitle || "");
          memberDetailIwfsaPositionInput.value = String(item.iwfsaPosition || "");
          memberDetailLinkedinUrlInput.value = String(item.linkedinUrl || "");
          memberDetailExpertiseInput.value = String(item.expertiseFreeText || "");
          memberDetailBioInput.value = String(item.bio || "");
          renderMemberDetailGroups(item.groups || []);
          memberDetailStatus.textContent = "Editing member record.";
        }

        function upsertMemberDirectoryItem(item) {
          const userId = Number(item?.id || item?.userId || 0);
          if (!userId) {
            return;
          }
          const nextItem = {
            ...item,
            id: userId,
            userId,
            organisation: displayInputValue(item.organisation || item.company || "")
          };
          const index = memberDirectorySource.findIndex((entry) => Number(entry.id || entry.userId || 0) === userId);
          if (index >= 0) {
            memberDirectorySource[index] = { ...memberDirectorySource[index], ...nextItem };
          } else {
            memberDirectorySource.push(nextItem);
          }
        }

        async function openMemberDetail(memberId) {
          const parsedUserId = Number(memberId || 0);
          if (!parsedUserId || !authToken) {
            return;
          }
          memberDetailShell.hidden = false;
          setMemberDetailEnabled(false);
          memberDetailTitle.textContent = "Loading member details...";
          memberDetailSummary.textContent = "Fetching the latest profile data from the API.";
          memberDetailStatus.textContent = "Loading member record...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/members/" + String(parsedUserId), {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              memberDetailStatus.textContent = json.message || "Unable to load member record.";
              return;
            }
            upsertMemberDirectoryItem(json.item || {});
            applyMemberDetail(json.item || {});
            memberDetailShell.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch {
            memberDetailStatus.textContent = "Unable to reach API for member details.";
          }
        }

        function memberStatusLabel(value) {
          const normalized = String(value || "active").trim().toLowerCase();
          if (!normalized) return "Active";
          return normalized
            .replace(/_/g, " ")
            .replace(/\b[a-z]/g, (char) => char.toUpperCase());
        }

        function updateMemberFilterOptions() {
          const members = Array.isArray(memberDirectorySource) ? memberDirectorySource : [];
          const currentStatus = String(memberStatusFilter?.value || "");
          const currentRole = String(memberRoleFilter?.value || "");
          const currentGroup = String(memberGroupFilter?.value || "");
          const statuses = new Set();
          const roles = new Set();
          const groups = new Set();

          for (const member of members) {
            statuses.add(String(member.status || "active").trim().toLowerCase() || "active");
            (Array.isArray(member.roles) ? member.roles : []).forEach((role) => {
              const label = normalizeDisplayText(role);
              if (label) roles.add(label);
            });
            normalizeGroupList(member.groups || []).forEach((group) => {
              const label = normalizeDisplayText(group);
              if (label) groups.add(label);
            });
          }

          function renderOptions(select, defaultLabel, values, selectedValue, formatter = (value) => value) {
            if (!select) return;
            const sorted = Array.from(values).sort((left, right) => formatter(left).localeCompare(formatter(right)));
            select.innerHTML =
              "<option value=''>" +
              escapeClientHtml(defaultLabel) +
              "</option>" +
              sorted
                .map((value) => {
                  const selected = String(value).toLowerCase() === String(selectedValue).toLowerCase() ? " selected" : "";
                  return (
                    "<option value='" +
                    escapeClientHtml(value) +
                    "'" +
                    selected +
                    ">" +
                    escapeClientHtml(formatter(value)) +
                    "</option>"
                  );
                })
                .join("");
          }

          renderOptions(memberStatusFilter, "All statuses", statuses, currentStatus, memberStatusLabel);
          renderOptions(memberRoleFilter, "All roles", roles, currentRole);
          renderOptions(memberGroupFilter, "All groups", groups, currentGroup);
        }

        function renderMembers(items) {
          const visibleItems = Array.isArray(items) ? items : [];
          const totalCount = memberDirectorySource.length;
          if (!visibleItems.length) {
            memberTableBody.innerHTML =
              totalCount > 0
                ? "<tr><td colspan='7' class='muted'>No members match the current search.</td></tr>"
                : "<tr><td colspan='7' class='muted'>No members found.</td></tr>";
            memberStatus.textContent = totalCount > 0 ? "" : "No members loaded.";
            memberCount.textContent = totalCount > 0 ? "0 of " + totalCount + " members" : "";
            queueButton.disabled = true;
            resetButton.disabled = true;
            selectAll.checked = false;
            return;
          }

          memberCount.textContent =
            visibleItems.length === totalCount
              ? totalCount + " members"
              : visibleItems.length + " of " + totalCount + " members";
          memberStatus.textContent = "";
          memberOutput.textContent = "";

          memberTableBody.innerHTML = visibleItems
            .map((member) => {
              const name = member.fullName || member.username || "(No name)";
              const organisation = member.organisation || member.company || "";
              const cellPhone = member.cellPhone || member.mobile || member.phone || "";
              const roles = Array.isArray(member.roles) ? member.roles : [];
              const email = String(member.email || "").trim();
              const emailCell = email
                ? "<a href='mailto:" + encodeURIComponent(email) + "'>" + escapeClientHtml(email) + "</a>"
                : "<span class='muted'>n/a</span>";
              return (
                "<tr>" +
                "<td><input class='member-checkbox' type='checkbox' value='" +
                escapeClientHtml(member.id) +
                "' /></td>" +
                "<td>" +
                "<button type='button' class='member-name-button' data-member-edit-id='" +
                escapeClientHtml(member.id) +
                "'>" +
                escapeClientHtml(name) +
                "</button>" +
                "</td>" +
                "<td>" +
                displayTextHtml(organisation) +
                "</td>" +
                "<td>" +
                renderMemberRoles(roles) +
                "</td>" +
                "<td>" +
                emailCell +
                "</td>" +
                "<td>" +
                renderWhatsappPhoneCell(cellPhone) +
                "</td>" +
                "<td>" +
                renderMemberGroups(member.groups || []) +
                "</td>" +
                "</tr>"
              );
            })
            .join("");

          selectAll.checked = false;
          updateQueueButton();

          document.querySelectorAll(".member-checkbox").forEach((checkbox) => {
            checkbox.checked = basketMembers.has(Number(checkbox.value));
            checkbox.addEventListener("change", () => {
              const id = Number(checkbox.value);
              if (checkbox.checked) {
                const member = memberDirectorySource.find((m) => Number(m.id || m.userId || 0) === id);
                if (member) basketMembers.set(id, member);
              } else {
                basketMembers.delete(id);
              }
              renderMemberBasket();
              const checked = selectedIds().length;
              selectAll.checked = checked > 0 && checked === visibleItems.length;
              updateQueueButton();
            });
          });

          memberTableBody.querySelectorAll("[data-member-edit-id]").forEach((button) => {
            button.addEventListener("click", () => {
              openMemberDetail(button.getAttribute("data-member-edit-id"));
            });
          });
        }

        function prettyDeliveryStatus(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (!normalized) return "Unknown";
          const labels = {
            pending: "Pending",
            processing: "Processing",
            sent: "Sent",
            delivered: "Delivered",
            failed: "Failed",
            bounced: "Bounced"
          };
          if (labels[normalized]) return labels[normalized];
          return normalized.charAt(0).toUpperCase() + normalized.slice(1);
        }

        function deliveryStatusTone(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (normalized === "sent" || normalized === "delivered") return "status-sent";
          if (normalized === "pending" || normalized === "processing") return "status-pending";
          if (normalized === "failed" || normalized === "bounced" || normalized === "error") return "status-failed";
          return "status-neutral";
        }

        function renderDeliveries(items) {
          if (!items || items.length === 0) {
            deliveryTableBody.innerHTML =
              "<tr><td colspan='5'>" +
              "<div class='import-empty-state'>" +
              "<div class='import-empty-illustration' aria-hidden='true'>Mail</div>" +
              "<div class='import-empty-text'>" +
              "<h4>No deliveries yet</h4>" +
              "<p class='muted'>Deliveries will appear here after notifications are sent.</p>" +
              "</div></div></td></tr>";
            return;
          }
          deliveryTableBody.innerHTML = items
            .map((item) => {
              const statusLabel = prettyDeliveryStatus(item.status || "");
              const toneClass = deliveryStatusTone(item.status || "");
              const memberName = item.memberName || item.fullName || String(item.userId || "Member");
              const email = item.email || "";
              const phone = item.phone || "";
              const organisation = item.organisation || item.company || "";
              return (
                "<tr>" +
                "<td>" +
                escapeClientHtml(memberName) +
                "</td>" +
                "<td>" +
                displayTextHtml(email) +
                "</td>" +
                "<td>" +
                displayTextHtml(phone) +
                "</td>" +
                "<td>" +
                displayTextHtml(organisation) +
                "</td>" +
                "<td><span class='status-pill " +
                toneClass +
                "'>" +
                escapeClientHtml(statusLabel) +
                "</span></td>" +
                "</tr>"
              );
            })
            .join("");
        }

        function summarizeQueue(data) {
          if (!queueSummary) {
            return;
          }
          
          let counts = { pending: 0, processing: 0, sent: 0, failed: 0, other: 0, total: 0 };
          let health = "Healthy";
          
          // Case 1: New API response (Object with counts)
          if (data && !Array.isArray(data) && data.counts) {
             counts = { ...data.counts, other: 0 };
             health = data.health || "Healthy";
          } 
          // Case 2: Legacy/Fallback (Array of items)
          else {
             const items = Array.isArray(data) ? data : (data && data.items ? data.items : []);
             if (items.length === 0) {
                queueSummary.textContent = "Queue is empty. No notification jobs are waiting.";
                return;
             }
             
             let stalePending = 0;
             let staleProcessing = 0;
             const nowMs = Date.now();
             
             counts.total = items.length;
             for (const item of items) {
               const status = String(item.status || "").trim().toLowerCase();
               if (status in counts) {
                 counts[status] += 1;
               } else {
                 counts.other += 1;
               }
  
               const referenceMs = Date.parse(String(item.updatedAt || item.createdAt || ""));
               if (Number.isFinite(referenceMs)) {
                  const ageMs = nowMs - referenceMs;
                  if (status === "pending" && ageMs > 10 * 60 * 1000) stalePending += 1;
                  if (status === "processing" && ageMs > 10 * 60 * 1000) staleProcessing += 1;
               }
             }
             
             const attentionNeeded = counts.failed > 0 || stalePending > 0 || staleProcessing > 0;
             health = attentionNeeded ? "Attention needed" : "Healthy";
          }

          const summary =
            "Queue: " +
            counts.total +
            " jobs (" +
            (counts.pending||0) +
            " pending, " +
            (counts.processing||0) +
            " processing, " +
            (counts.failed||0) +
            " failed). Health: " +
            health +
            ". " +
            "Open Delivery Report to see which members were affected if failures are present.";
          queueSummary.textContent = summary;
        }

        function renderQueue(data) {
          // Normalize input
          let items = [];
          let counts = null;
          
          if (Array.isArray(data)) {
             items = data;
          } else if (data && typeof data === 'object') {
             items = data.items || [];
             counts = data.counts || null;
          }
          
          if ((!items || items.length === 0) && (!counts || counts.total === 0)) {
            queueTableBody.innerHTML =
              "<tr><td colspan='2'>" +
              "<div class='import-empty-state'>" +
              "<div class='import-empty-illustration' aria-hidden='true'>&#9201;</div>" +
              "<div class='import-empty-text'>" +
              "<h4>No queue items yet</h4>" +
              "<p class='muted'>Refresh the queue to check for new notification jobs.</p>" +
              "</div></div></td></tr>";
            summarizeQueue(data);
            return;
          }
          
          summarizeQueue(data);
          
          // Calculate counts for table if not provided by server
          if (!counts) {
            counts = { pending: 0, processing: 0, sent: 0, failed: 0, other: 0 };
            for (const item of items) {
              const status = String(item.status || "").trim().toLowerCase();
              if (status in counts) {
                counts[status] += 1;
              } else {
                counts['other'] = (counts['other'] || 0) + 1;
              }
            }
          }
          
          const rows = [];
          const order = ["pending", "processing", "sent", "failed", "other"];
          const labels = {
            pending: "Pending",
            processing: "Processing",
            sent: "Sent",
            failed: "Failed",
            other: "Other"
          };
          
          for (const key of order) {
            const count = counts[key];
            if (!count) continue;
            rows.push(
              "<tr>" +
                "<td>" + escapeClientHtml(labels[key] || key) + "</td>" +
                "<td>" + escapeClientHtml(String(count)) + "</td>" +
              "</tr>"
            );
          }
          queueTableBody.innerHTML = rows.join("");
        }

        async function loadDeliveries() {
          if (!authToken) {
            deliveryTableBody.innerHTML = "<tr><td colspan='5' class='muted'>Sign in required.</td></tr>";
            return;
          }
          deliveryTableBody.innerHTML = "<tr><td colspan='5' class='muted'>Loading deliveries...</td></tr>";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/notification-deliveries?limit=50", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              deliveryTableBody.innerHTML =
                "<tr><td colspan='5' class='muted'>" +
                (json.message || "Unable to load deliveries.") +
                "</td></tr>";
              return;
            }
            renderDeliveries(json.items || []);
          } catch {
            deliveryTableBody.innerHTML = "<tr><td colspan='5' class='muted'>Unable to reach API.</td></tr>";
          }
        }

        async function loadQueueStatus() {
          if (!authToken) {
            queueTableBody.innerHTML = "<tr><td colspan='2' class='muted'>Sign in required.</td></tr>";
            if (queueSummary) {
              queueSummary.textContent = "Sign in to view queue health summary.";
            }
            return;
          }
          queueTableBody.innerHTML = "<tr><td colspan='2' class='muted'>Loading queue...</td></tr>";
          if (queueSummary) {
            queueSummary.textContent = "Loading queue summary...";
          }
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/notification-queue?limit=50", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              queueTableBody.innerHTML =
                "<tr><td colspan='2' class='muted'>" +
                (json.message || "Unable to load queue.") +
                "</td></tr>";
              if (queueSummary) {
                queueSummary.textContent = "Unable to load queue summary.";
              }
              return;
            }
            renderQueue(json);
          } catch {
            queueTableBody.innerHTML = "<tr><td colspan='2' class='muted'>Unable to reach API.</td></tr>";
            if (queueSummary) {
              queueSummary.textContent = "Unable to reach API for queue summary.";
            }
          }
        }

        function formatNewsStatus(value) {
          if (value === "draft") return "Draft";
          if (value === "published") return "Published";
          if (value === "archived") return "Archived";
          return value || "Unknown";
        }

        function newsStatusTone(value) {
          if (value === "draft") return "status-draft";
          if (value === "published") return "status-published";
          return "status-neutral";
        }

        function resetNewsComposer(message) {
          activeNewsPostId = null;
          if (newsForm) {
            newsForm.reset();
          }
          if (newsStatusInput) {
            newsStatusInput.value = "draft";
          }
          if (newsPinnedInput) {
            newsPinnedInput.checked = false;
          }
          if (newsSubmitButton) {
            newsSubmitButton.textContent = "Create news post";
          }
          if (newsCancelButton) {
            newsCancelButton.hidden = true;
          }
          if (message && newsStatusText) {
            newsStatusText.textContent = message;
          }
        }

        function beginNewsEdit(newsItem) {
          if (!newsItem) {
            return;
          }
          activeNewsPostId = Number(newsItem.id || 0) || null;
          newsTitleInput.value = String(newsItem.title || "");
          newsBodyInput.value = String(newsItem.body || "");
          newsStatusInput.value = String(newsItem.status || "draft");
          if (newsPinnedInput) {
            newsPinnedInput.checked = Boolean(newsItem.isPinned);
          }
          if (newsSubmitButton) {
            newsSubmitButton.textContent = "Save changes";
          }
          if (newsCancelButton) {
            newsCancelButton.hidden = false;
          }
          newsStatusText.textContent = "Editing news post #" + String(newsItem.id || "") + ".";
          newsForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function renderAdminNews(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>No member news posts match this filter.</td></tr>";
            return;
          }

          newsTableBody.innerHTML = rows
            .map((item) => {
              const status = String(item.status || "draft");
              const isPinned = Boolean(item.isPinned);
              const bodyText = String(item.body || "");
              const bodyPreview = bodyText.slice(0, 140) + (bodyText.length > 140 ? "..." : "");
              const publishedAt = item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Not published";
              const updatedAt = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "n/a";
              const pinCell = isPinned
                ? "<span class='status-pill status-active'>Pinned</span>"
                : "<span class='muted'>No</span>";
              const actions = canUseAdminActions()
                ? [
                    "<button type='button' class='ghost' data-news-edit-id='" + escapeClientHtml(item.id) + "'>Edit</button>",
                    status !== "published"
                      ? "<button type='button' data-news-publish-id='" + escapeClientHtml(item.id) + "'>Publish</button>"
                      : "",
                    status !== "archived"
                      ? "<button type='button' class='ghost' data-news-pin-id='" + escapeClientHtml(item.id) + "' data-news-pin-value='" + (isPinned ? "0" : "1") + "'>" + (isPinned ? "Unpin" : "Pin to top") + "</button>"
                      : "",
                    status !== "archived"
                      ? "<button type='button' class='ghost' data-news-archive-id='" + escapeClientHtml(item.id) + "'>Archive</button>"
                      : ""
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "<span class='muted'>Admin only</span>";

              return (
                "<tr>" +
                "<td><strong>" +
                escapeClientHtml(item.title || "IWFSA Update") +
                "</strong><br /><span class='muted'>" +
                escapeClientHtml(bodyPreview) +
                "</span></td>" +
                "<td><span class='status-pill " +
                newsStatusTone(status) +
                "'>" +
                escapeClientHtml(formatNewsStatus(status)) +
                "</span></td>" +
                "<td>" +
                pinCell +
                "</td>" +
                "<td>" +
                escapeClientHtml(publishedAt) +
                "</td>" +
                "<td>" +
                escapeClientHtml(updatedAt) +
                "</td>" +
                "<td>" +
                actions +
                "</td>" +
                "</tr>"
              );
            })
            .join("");
        }

        async function loadAdminNews() {
          if (!authToken) {
            newsStatusText.textContent = "Sign in to manage curated member news.";
            newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Sign in to load member news posts.</td></tr>";
            return;
          }
          if (!canUseAdminActions()) {
            newsStatusText.textContent = "Only admin and chief admin roles can manage member news.";
            newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Your role does not have member news publishing access.</td></tr>";
            return;
          }

          newsStatusText.textContent = "Loading member news posts...";
          newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Loading member news posts...</td></tr>";
          try {
            const statusFilter = String(newsFilterStatusInput.value || "all");
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/news?status=" + encodeURIComponent(statusFilter) + "&limit=100",
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );
            const json = await response.json();
            if (!response.ok) {
              newsStatusText.textContent = json.message || "Unable to load member news posts.";
              newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Unable to load member news posts.</td></tr>";
              return;
            }

            newsItemsCache = Array.isArray(json.items) ? json.items : [];
            renderAdminNews(newsItemsCache);
            newsStatusText.textContent = "Loaded " + String(newsItemsCache.length) + " news post(s).";
          } catch {
            newsStatusText.textContent = "Unable to reach API for member news.";
            newsTableBody.innerHTML = "<tr><td colspan='6' class='muted'>Unable to reach API for member news.</td></tr>";
          }
        }

        async function saveAdminNews(event) {
          event.preventDefault();
          if (!authToken || !canUseAdminActions()) {
            newsStatusText.textContent = "Only admin and chief admin roles can manage member news.";
            return;
          }

          const title = String(newsTitleInput.value || "").trim();
          const body = String(newsBodyInput.value || "").trim();
          const statusValue = String(newsStatusInput.value || "draft").trim();
          const isPinned = Boolean(newsPinnedInput && newsPinnedInput.checked);
          if (!title || !body) {
            newsStatusText.textContent = "Title and body are required.";
            return;
          }

          const isEdit = Number.isInteger(activeNewsPostId) && activeNewsPostId > 0;
          newsStatusText.textContent = isEdit ? "Saving news changes..." : "Creating news post...";
          try {
            const response = await fetch(
              isEdit
                ? "${config.apiBaseUrl}/api/admin/news/" + String(activeNewsPostId)
                : "${config.apiBaseUrl}/api/admin/news",
              {
                method: isEdit ? "PATCH" : "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ title, body, status: statusValue, isPinned })
              }
            );
            const json = await response.json();
            if (!response.ok) {
              newsStatusText.textContent = json.message || (isEdit ? "Unable to update news post." : "Unable to create news post.");
              return;
            }

            resetNewsComposer(isEdit ? "News post updated." : "News post created.");
            await loadAdminNews();
          } catch {
            newsStatusText.textContent = "Unable to reach API for member news.";
          }
        }

        async function updateNewsPinnedState(newsId, shouldPin) {
          if (!authToken || !canUseAdminActions()) {
            newsStatusText.textContent = "Only admin and chief admin roles can manage member news.";
            return;
          }
          newsStatusText.textContent = shouldPin ? "Pinning news post..." : "Removing pin...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/news/" + String(newsId), {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ isPinned: Boolean(shouldPin) })
            });
            const json = await response.json();
            if (!response.ok) {
              newsStatusText.textContent = json.message || "Unable to update pin state.";
              return;
            }
            newsStatusText.textContent = shouldPin ? "News post pinned to top." : "News post unpinned.";
            await loadAdminNews();
          } catch {
            newsStatusText.textContent = "Unable to reach API for member news.";
          }
        }

        async function publishAdminNews(newsId) {
          if (!authToken || !canUseAdminActions()) {
            newsStatusText.textContent = "Only admin and chief admin roles can manage member news.";
            return;
          }
          newsStatusText.textContent = "Publishing news post...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/news/" + String(newsId) + "/publish", {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              newsStatusText.textContent = json.message || "Unable to publish news post.";
              return;
            }
            newsStatusText.textContent = "News post published.";
            await loadAdminNews();
          } catch {
            newsStatusText.textContent = "Unable to reach API for member news.";
          }
        }

        async function archiveAdminNews(newsId) {
          if (!authToken || !canUseAdminActions()) {
            newsStatusText.textContent = "Only admin and chief admin roles can manage member news.";
            return;
          }
          newsStatusText.textContent = "Archiving news post...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/news/" + String(newsId) + "/archive", {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              newsStatusText.textContent = json.message || "Unable to archive news post.";
              return;
            }
            newsStatusText.textContent = "News post archived.";
            await loadAdminNews();
          } catch {
            newsStatusText.textContent = "Unable to reach API for member news.";
          }
        }

        function renderPublicProfileReviews(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            profileReviewTableBody.innerHTML = "<tr><td colspan='4' class='muted'>No public profile submissions are waiting for review.</td></tr>";
            return;
          }
          profileReviewTableBody.innerHTML = rows
            .map((item) => {
              const requestedFields = Array.isArray(item.requestedFieldKeys) && item.requestedFieldKeys.length
                ? item.requestedFieldKeys.join(", ")
                : "No fields listed";
              return (
                "<tr>" +
                "<td><strong>" + escapeClientHtml(item.fullName || item.username || "Member") + "</strong><br /><span class='muted'>" + escapeClientHtml(item.email || "") + "</span></td>" +
                "<td>" + escapeClientHtml(requestedFields) + "</td>" +
                "<td>" + escapeClientHtml(item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "n/a") + "</td>" +
                "<td><button type='button' data-profile-review-decision='approved' data-profile-review-user-id='" + escapeClientHtml(item.userId) + "'>Approve</button> <button type='button' class='ghost' data-profile-review-decision='rejected' data-profile-review-user-id='" + escapeClientHtml(item.userId) + "'>Reject</button></td>" +
                "</tr>"
              );
            })
            .join("");
        }

        async function loadPublicProfileReviews() {
          if (!authToken) {
            profileReviewStatus.textContent = "Sign in to review public profile submissions.";
            profileReviewTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load public profile submissions.</td></tr>";
            return;
          }
          if (!canUseAdminActions()) {
            profileReviewStatus.textContent = "Only admin and chief admin roles can review public profile submissions.";
            profileReviewTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Your role does not have public profile review access.</td></tr>";
            return;
          }
          profileReviewStatus.textContent = "Loading public profile submissions...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/member-profile-reviews?status=pending", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              profileReviewStatus.textContent = json.message || "Unable to load public profile submissions.";
              return;
            }
            publicProfileReviewItems = Array.isArray(json.items) ? json.items : [];
            renderPublicProfileReviews(publicProfileReviewItems);
            profileReviewStatus.textContent = "Loaded " + String(publicProfileReviewItems.length) + " pending submission(s).";
          } catch {
            profileReviewStatus.textContent = "Unable to reach API for public profile reviews.";
          }
        }

        async function reviewPublicProfile(userId, decision) {
          if (!authToken || !canUseAdminActions()) {
            profileReviewStatus.textContent = "Only admin and chief admin roles can review public profile submissions.";
            return;
          }
          profileReviewStatus.textContent = decision === "approved" ? "Approving profile request..." : "Rejecting profile request...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/member-profile-reviews/" + String(userId) + "/decision", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ decision, reviewerNote: decision === "approved" ? "Approved from admin console." : "Rejected from admin console." })
            });
            const json = await response.json();
            if (!response.ok) {
              profileReviewStatus.textContent = json.message || "Unable to process public profile review.";
              return;
            }
            profileReviewStatus.textContent = decision === "approved" ? "Public profile request approved." : "Public profile request rejected.";
            await loadPublicProfileReviews();
          } catch {
            profileReviewStatus.textContent = "Unable to reach API for public profile reviews.";
          }
        }

        function renderHonoraryMembers(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            honoraryMemberTableBody.innerHTML = "<tr><td colspan='4' class='muted'>No honorary member entries yet.</td></tr>";
            return;
          }
          honoraryMemberTableBody.innerHTML = rows
            .map((item) => (
              "<tr>" +
              "<td><strong>" + escapeClientHtml(item.fullName || "Honorary member") + "</strong></td>" +
              "<td>" + escapeClientHtml(item.title || "") + "</td>" +
              "<td>" + escapeClientHtml(item.status || "draft") + "</td>" +
              "<td><button type='button' class='ghost danger-link' data-remove-honorary-id='" + escapeClientHtml(item.id) + "'>Delete</button></td>" +
              "</tr>"
            ))
            .join("");
        }

        async function loadHonoraryMembers() {
          if (!authToken) {
            honoraryMemberStatusText.textContent = "Sign in to manage honorary member entries.";
            honoraryMemberTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load honorary member entries.</td></tr>";
            return;
          }
          honoraryMemberStatusText.textContent = "Loading honorary member entries...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/honorary-members", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              honoraryMemberStatusText.textContent = json.message || "Unable to load honorary member entries.";
              return;
            }
            honoraryMemberItems = Array.isArray(json.items) ? json.items : [];
            renderHonoraryMembers(honoraryMemberItems);
            honoraryMemberStatusText.textContent = "Loaded " + String(honoraryMemberItems.length) + " honorary member entry(ies).";
          } catch {
            honoraryMemberStatusText.textContent = "Unable to reach API for honorary member entries.";
          }
        }

        async function saveHonoraryMember(event) {
          event.preventDefault();
          if (!authToken || !canUseAdminActions()) {
            honoraryMemberStatusText.textContent = "Only admin and chief admin roles can manage honorary members.";
            return;
          }
          honoraryMemberStatusText.textContent = "Creating honorary member entry...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/honorary-members", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({
                fullName: String(honoraryMemberFullNameInput.value || "").trim(),
                title: String(honoraryMemberTitleInput.value || "").trim(),
                organisation: String(honoraryMemberOrganisationInput.value || "").trim(),
                citation: String(honoraryMemberCitationInput.value || "").trim(),
                status: String(honoraryMemberStatusInput.value || "draft").trim()
              })
            });
            const json = await response.json();
            if (!response.ok) {
              honoraryMemberStatusText.textContent = json.message || "Unable to create honorary member entry.";
              return;
            }
            honoraryMemberForm.reset();
            honoraryMemberStatusInput.value = "draft";
            honoraryMemberStatusText.textContent = "Honorary member entry created.";
            await loadHonoraryMembers();
          } catch {
            honoraryMemberStatusText.textContent = "Unable to reach API for honorary member entries.";
          }
        }

        async function removeHonoraryMember(id) {
          if (!authToken || !canUseAdminActions()) {
            honoraryMemberStatusText.textContent = "Only admin and chief admin roles can manage honorary members.";
            return;
          }
          honoraryMemberStatusText.textContent = "Removing honorary member entry...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/honorary-members/" + String(id), {
              method: "DELETE",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              honoraryMemberStatusText.textContent = json.message || "Unable to remove honorary member entry.";
              return;
            }
            honoraryMemberStatusText.textContent = "Honorary member entry removed.";
            await loadHonoraryMembers();
          } catch {
            honoraryMemberStatusText.textContent = "Unable to reach API for honorary member entries.";
          }
        }

        function renderMemorialEntries(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            memorialEntryTableBody.innerHTML = "<tr><td colspan='4' class='muted'>No memorial entries yet.</td></tr>";
            return;
          }
          memorialEntryTableBody.innerHTML = rows
            .map((item) => (
              "<tr>" +
              "<td><strong>" + escapeClientHtml(item.fullName || "Memorial entry") + "</strong></td>" +
              "<td>" + escapeClientHtml(item.title || "") + "</td>" +
              "<td>" + escapeClientHtml(item.status || "draft") + "</td>" +
              "<td><button type='button' class='ghost danger-link' data-remove-memorial-id='" + escapeClientHtml(item.id) + "'>Delete</button></td>" +
              "</tr>"
            ))
            .join("");
        }

        async function loadMemorialEntries() {
          if (!authToken) {
            memorialEntryStatusText.textContent = "Sign in to manage memorial entries.";
            memorialEntryTableBody.innerHTML = "<tr><td colspan='4' class='muted'>Sign in to load memorial entries.</td></tr>";
            return;
          }
          memorialEntryStatusText.textContent = "Loading memorial entries...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/memorials", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              memorialEntryStatusText.textContent = json.message || "Unable to load memorial entries.";
              return;
            }
            memorialEntryItems = Array.isArray(json.items) ? json.items : [];
            renderMemorialEntries(memorialEntryItems);
            memorialEntryStatusText.textContent = "Loaded " + String(memorialEntryItems.length) + " memorial entrie(s).";
          } catch {
            memorialEntryStatusText.textContent = "Unable to reach API for memorial entries.";
          }
        }

        async function saveMemorialEntry(event) {
          event.preventDefault();
          if (!authToken || !canUseAdminActions()) {
            memorialEntryStatusText.textContent = "Only admin and chief admin roles can manage memorial entries.";
            return;
          }
          memorialEntryStatusText.textContent = "Creating memorial entry...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/memorials", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({
                fullName: String(memorialEntryFullNameInput.value || "").trim(),
                title: String(memorialEntryTitleInput.value || "").trim(),
                dateOfPassing: String(memorialEntryDateInput.value || "").trim(),
                tributeText: String(memorialEntryTributeInput.value || "").trim(),
                status: String(memorialEntryStatusInput.value || "draft").trim()
              })
            });
            const json = await response.json();
            if (!response.ok) {
              memorialEntryStatusText.textContent = json.message || "Unable to create memorial entry.";
              return;
            }
            memorialEntryForm.reset();
            memorialEntryStatusInput.value = "draft";
            memorialEntryStatusText.textContent = "Memorial entry created.";
            await loadMemorialEntries();
          } catch {
            memorialEntryStatusText.textContent = "Unable to reach API for memorial entries.";
          }
        }

        async function removeMemorialEntry(id) {
          if (!authToken || !canUseAdminActions()) {
            memorialEntryStatusText.textContent = "Only admin and chief admin roles can manage memorial entries.";
            return;
          }
          memorialEntryStatusText.textContent = "Removing memorial entry...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/memorials/" + String(id), {
              method: "DELETE",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              memorialEntryStatusText.textContent = json.message || "Unable to remove memorial entry.";
              return;
            }
            memorialEntryStatusText.textContent = "Memorial entry removed.";
            await loadMemorialEntries();
          } catch {
            memorialEntryStatusText.textContent = "Unable to reach API for memorial entries.";
          }
        }

        async function loadMembers() {
          if (!authToken) {
            memberStatus.textContent = "Sign in to load members.";
            memberDirectorySource = [];
            updateMemberSearchSuggestions([], "");
            memberTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Sign in required.</td></tr>";
            memberOutput.textContent = "";
            memberCount.textContent = "";
            return;
          }
          memberStatus.textContent = "Loading members...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/members", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              memberStatus.textContent = json.message || "Unable to load members.";
              memberDirectorySource = [];
              updateMemberSearchSuggestions([], "");
              memberTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to load members.</td></tr>";
              memberOutput.textContent = "";
              memberCount.textContent = "";
              return;
            }
            memberDirectorySource = Array.isArray(json.items) ? json.items : [];
            updateMemberFilterOptions();
            applyMemberFilter();
            updateModeratorOptions();
            renderMemberGroupOptions();
            if (activeMemberDetailId) {
              const refreshed = memberDirectorySource.find(
                (member) => Number(member.id || member.userId || 0) === Number(activeMemberDetailId)
              );
              if (refreshed) {
                openMemberDetail(activeMemberDetailId);
              }
            }
            renderEventGroupOptions(selectedEventGroups());
            renderEventInviteeResults(eventInviteeSearchInput?.value || "");
            renderEventInviteeSelections();
            if (activeImportBatch) {
              renderImportRows(importRowsCache);
            }
          } catch {
            memberStatus.textContent = "Unable to reach the member service. Refresh the page and try again.";
            memberDirectorySource = [];
            updateMemberSearchSuggestions([], "");
            memberTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to reach API.</td></tr>";
            memberOutput.textContent = "";
            memberCount.textContent = "";
            updateModeratorOptions();
          }
        }

        async function handleAdminLogout() {
            if (!authToken) {
              window.location.href = ADMIN_SIGN_IN_URL;
              return;
            }

            try {
              await fetch("${config.apiBaseUrl}/api/auth/logout", {
                method: "POST",
                headers: { Authorization: "Bearer " + authToken }
              });
            } catch {
              // Ignore network errors and clear the local session anyway.
            } finally {
              setAuthToken(null, "");
              window.location.href = ADMIN_SIGN_IN_URL;
            }
        }

        document.querySelectorAll("#admin-logout, .admin-session-logout").forEach((button) => {
          button.addEventListener("click", handleAdminLogout);
        });

        if (memberDetailCloseButton) {
          memberDetailCloseButton.addEventListener("click", () => resetMemberDetail());
        }

        if (memberDetailForm) {
          memberDetailForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const userId = Number(activeMemberDetailId || 0);
            if (!userId || !authToken) {
              memberDetailStatus.textContent = "Select a member before saving changes.";
              return;
            }
            memberDetailSaveButton.disabled = true;
            memberDetailStatus.textContent = "Saving member details...";
            try {
              const payload = {
                fullName: String(memberDetailFullNameInput.value || "").trim(),
                email: String(memberDetailEmailInput.value || "").trim(),
                company: String(memberDetailCompanyInput.value || "").trim(),
                phone: String(memberDetailPhoneInput.value || "").trim(),
                businessTitle: String(memberDetailBusinessTitleInput.value || "").trim(),
                iwfsaPosition: String(memberDetailIwfsaPositionInput.value || "").trim(),
                linkedinUrl: String(memberDetailLinkedinUrlInput.value || "").trim(),
                expertiseFreeText: String(memberDetailExpertiseInput.value || "").trim(),
                bio: String(memberDetailBioInput.value || "").trim(),
                groups: selectedMemberDetailGroups()
              };
              const response = await fetch("${config.apiBaseUrl}/api/members/" + String(userId), {
                method: "PATCH",
                headers: {
                  Authorization: "Bearer " + authToken,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
              });
              const json = await response.json();
              if (!response.ok) {
                if (clearAdminAuthOnUnauthorized(response)) return;
                memberDetailStatus.textContent = json.message || "Unable to save member details.";
                return;
              }
              upsertMemberDirectoryItem(json.item || {});
              applyMemberFilter();
              applyMemberDetail(json.item || {});
              updateModeratorOptions();
              renderMemberGroupOptions();
              memberDetailStatus.textContent = "Member details saved.";
            } catch {
              memberDetailStatus.textContent = "Unable to reach API while saving member details.";
            } finally {
              memberDetailSaveButton.disabled = false;
            }
          });
        }

        function updateModeratorOptions() {
          const items = Array.isArray(memberDirectorySource) ? memberDirectorySource : [];
          const options = ["<option value=''>Select member</option>"]
            .concat(
              items.map((member) => {
                const label = String(member.fullName || member.username || "Member").trim();
                const email = String(member.email || "").trim();
                return (
                  "<option value='" +
                  escapeClientHtml(member.id) +
                  "'>" +
                  escapeClientHtml(label + (email ? " (" + email + ")" : "")) +
                  "</option>"
                );
              })
            )
            .join("");
          moderatorUserIdInput.innerHTML = options;
        }

        function renderReportSummary(report) {
          const summary = report?.summary || {};
          reportActiveMembers.textContent = String(summary.activeMembers || 0);
          reportPublishedEvents.textContent = String(summary.publishedEvents || 0);
          reportConfirmedSignups.textContent = String(summary.confirmedSignups || 0);
          reportPublishedDocuments.textContent = String(summary.publishedDocuments || 0);
        }

        function renderReportEvents(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            reportEventsBody.innerHTML = "<tr><td colspan='4' class='muted'>No event activity in this window.</td></tr>";
            return;
          }

          reportEventsBody.innerHTML = rows
            .map(
              (item) =>
                "<tr>" +
                "<td>" +
                escapeClientHtml(item.title || "Untitled Event") +
                "</td>" +
                "<td class='numeric-cell'>" +
                escapeClientHtml(item.confirmedCount) +
                "</td>" +
                "<td class='numeric-cell'>" +
                escapeClientHtml(item.waitlistedCount) +
                "</td>" +
                "<td class='numeric-cell'>" +
                escapeClientHtml(item.attendedCount) +
                "</td>" +
                "</tr>"
            )
            .join("");
        }

        function renderRecentSms(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            reportSmsBody.innerHTML = "<tr><td colspan='4' class='muted'>No SMS activity logged yet.</td></tr>";
            return;
          }

          reportSmsBody.innerHTML = rows
            .map((item) => {
              const memberLabel = String(item.username || item.email || "Member");
              const eventLabel = item.eventId ? "Event #" + String(item.eventId) : String(item.eventType || "n/a");
              const detail = item.blockedReason ? item.status + " (" + item.blockedReason + ")" : item.status;
              return (
                "<tr>" +
                "<td>" +
                escapeClientHtml(memberLabel) +
                "</td>" +
                "<td>" +
                escapeClientHtml(detail || "n/a") +
                "</td>" +
                "<td>" +
                escapeClientHtml(eventLabel) +
                "</td>" +
                "<td>" +
                escapeClientHtml(item.createdAt || "") +
                "</td>" +
                "</tr>"
              );
            })
            .join("");
        }

        async function loadReports() {
          if (!authToken) {
            reportStatus.textContent = "Sign in to load reporting data.";
            return;
          }

          reportStatus.textContent = "Loading reporting dashboard...";
          try {
            const windowDays = Number(reportWindowDaysInput.value || 30);
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/reports/dashboard?days=" + encodeURIComponent(String(windowDays)),
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );
            const json = await response.json();
            if (!response.ok) {
              reportStatus.textContent = json.message || "Unable to load reporting dashboard.";
              return;
            }

            renderReportSummary(json);
            renderReportEvents(json.topEvents || []);
            renderRecentSms(json.recentSms || []);
            reportStatus.textContent =
              "Dashboard updated for the last " + String(json.windowDays || windowDays) + " days.";
          } catch {
            reportStatus.textContent = "Unable to reach API for reporting dashboard.";
          }
        }

        function renderModerators(items) {
          const rows = Array.isArray(items) ? items : [];
          if (rows.length === 0) {
            moderatorTableBody.innerHTML = "<tr><td colspan='4' class='muted'>No moderators assigned yet.</td></tr>";
            return;
          }

          moderatorTableBody.innerHTML = rows
            .map((item) => {
              return (
                "<tr>" +
                "<td>" +
                escapeClientHtml(item.username || "Member") +
                "</td>" +
                "<td>" +
                escapeClientHtml(item.email || "") +
                "</td>" +
                "<td>" +
                escapeClientHtml(item.createdAt || "") +
                "</td>" +
                "<td><button type='button' data-remove-moderator-id='" +
                escapeClientHtml(item.userId) +
                "'>Remove</button></td>" +
                "</tr>"
              );
            })
            .join("");
        }

        async function loadModerators() {
          if (!authToken) {
            moderatorStatus.textContent = "Sign in to manage moderators.";
            return;
          }

          moderatorStatus.textContent = "Loading moderators...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/social/moderators", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              moderatorStatus.textContent = json.message || "Unable to load moderators.";
              return;
            }

            renderModerators(json.items || []);
            moderatorStatus.textContent = "Moderator list refreshed.";
          } catch {
            moderatorStatus.textContent = "Unable to reach API for moderators.";
          }
        }

        const MEMBERSHIP_PAYMENT_STATUSES = ["paid", "outstanding", "partial", "waived", "pending_review"];
        const MEMBERSHIP_STANDING_STATUSES = [
          "good_standing",
          "outstanding",
          "partial",
          "waived",
          "pending_review",
          "blocked",
          "deactivated"
        ];
        const MEMBERSHIP_ACCESS_STATUSES = ["enabled", "blocked", "deactivated"];
        const MEMBERSHIP_QUICK_ACTIONS = [
          { value: "mark_paid", label: "Mark paid + good standing" },
          { value: "mark_partial", label: "Mark partial" },
          { value: "mark_waived", label: "Mark waived" },
          { value: "mark_outstanding", label: "Mark outstanding" },
          { value: "block", label: "Block member" },
          { value: "deactivate", label: "Deactivate member" },
          { value: "restore", label: "Restore access" }
        ];

        function sanitizeEmail(value) {
          return String(value || "").trim();
        }

        function selectedMembershipFeeYear() {
          const raw = String(feeCycleYearInput?.value || "").trim();
          const parsed = Number(raw);
          if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
            return null;
          }
          return parsed;
        }

        function normalizeMembershipStatusLabel(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (!normalized) return "Unknown";
          if (normalized === "good_standing") return "Good standing";
          if (normalized === "pending_review") return "Pending review";
          if (normalized === "not_invited") return "Not invited";
          return normalized
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
        }

        function membershipStatusTone(value, type = "generic") {
          const normalized = String(value || "").trim().toLowerCase();
          if (!normalized) return "status-neutral";
          if (type === "account") {
            if (normalized === "active") return "status-active";
            if (normalized === "invited") return "status-invited";
            if (normalized === "not_invited") return "status-not_invited";
            if (normalized === "blocked" || normalized === "deactivated") return "status-suspended";
            return "status-neutral";
          }
          if (type === "access") {
            if (normalized === "enabled") return "status-active";
            if (normalized === "blocked" || normalized === "deactivated") return "status-suspended";
            return "status-neutral";
          }
          if (normalized === "paid" || normalized === "waived" || normalized === "good_standing") {
            return "status-active";
          }
          if (normalized === "outstanding" || normalized === "partial" || normalized === "pending_review") {
            return "status-pending";
          }
          if (normalized === "blocked" || normalized === "deactivated") {
            return "status-suspended";
          }
          return "status-neutral";
        }

        function formatMembershipCurrency(value) {
          const amount = Number(value || 0);
          if (!Number.isFinite(amount)) {
            return "R 0.00";
          }
          return "R " + amount.toFixed(2);
        }

        function formatMembershipDate(value) {
          const raw = String(value || "").trim();
          if (!raw) return "n/a";
          const parsed = new Date(raw);
          if (Number.isNaN(parsed.getTime())) {
            return raw;
          }
          return parsed.toLocaleDateString();
        }

        function formatMembershipDateTime(value) {
          const raw = String(value || "").trim();
          if (!raw) return "n/a";
          const parsed = new Date(raw);
          if (Number.isNaN(parsed.getTime())) {
            return raw;
          }
          return parsed.toLocaleString();
        }

        function toDateInputValue(value, fallbackYear) {
          const raw = String(value || "").trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return raw;
          }
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().slice(0, 10);
          }
          const year = Number.isInteger(Number(fallbackYear)) ? Number(fallbackYear) : new Date().getFullYear();
          return String(year) + "-03-31";
        }

        function selectedMembershipFeeFilters() {
          return {
            search: String(feeSearchInput?.value || "").trim(),
            standingStatus: String(feeStandingFilterInput?.value || "all").trim() || "all",
            accountStatus: String(feeAccountFilterInput?.value || "all").trim() || "all",
            category: String(feeCategoryFilterInput?.value || "").trim(),
            profileCompletion: String(feeProfileFilterInput?.value || "all").trim() || "all"
          };
        }

        function membershipFeeMembersQueryString() {
          const params = new URLSearchParams();
          const membershipYear = selectedMembershipFeeYear();
          if (membershipYear) {
            params.set("membershipYear", String(membershipYear));
          }
          const filters = selectedMembershipFeeFilters();
          if (filters.search) {
            params.set("search", filters.search);
          }
          if (filters.standingStatus && filters.standingStatus !== "all") {
            params.set("standingStatus", filters.standingStatus);
          }
          if (filters.accountStatus && filters.accountStatus !== "all") {
            params.set("accountStatus", filters.accountStatus);
          }
          if (filters.category) {
            params.set("category", filters.category);
          }
          if (filters.profileCompletion && filters.profileCompletion !== "all") {
            params.set("profileCompletion", filters.profileCompletion);
          }
          params.set("limit", "1000");
          return params.toString();
        }

        function feeRowStatusNode(userId) {
          return document.getElementById("fee-row-status-" + String(userId || ""));
        }

        function setFeeRowStatus(userId, message) {
          const node = feeRowStatusNode(userId);
          if (!node) return;
          node.textContent = message || "";
        }

        function resetMembershipFeeKpis() {
          feeKpiTotalMembers.textContent = "0";
          feeKpiActiveMembers.textContent = "0";
          feeKpiGoodStanding.textContent = "0";
          feeKpiOutstandingMembers.textContent = "0";
          feeKpiBlockedMembers.textContent = "0";
          feeKpiDeactivatedMembers.textContent = "0";
          feeKpiOnboardingMembers.textContent = "0";
          feeKpiFeesCollected.textContent = "R 0.00";
          feeKpiOutstandingBalance.textContent = "R 0.00";
        }

        function renderMembershipFeeKpis(summary) {
          const values = summary || {};
          feeKpiTotalMembers.textContent = String(Number(values.totalMembers || 0));
          feeKpiActiveMembers.textContent = String(Number(values.activeMembers || 0));
          feeKpiGoodStanding.textContent = String(Number(values.goodStandingMembers || 0));
          feeKpiOutstandingMembers.textContent = String(Number(values.outstandingMembers || 0));
          feeKpiBlockedMembers.textContent = String(Number(values.blockedMembers || 0));
          feeKpiDeactivatedMembers.textContent = String(Number(values.deactivatedMembers || 0));
          feeKpiOnboardingMembers.textContent = String(Number(values.onboardingMembers || 0));
          feeKpiFeesCollected.textContent = formatMembershipCurrency(values.feesCollected || 0);
          feeKpiOutstandingBalance.textContent = formatMembershipCurrency(values.outstandingBalance || 0);
        }

        function updateMembershipFeeMemberCount(total) {
          const count = Number(total || 0);
          const cycleYear = selectedMembershipFeeYear();
          feeMemberCount.textContent = cycleYear ? String(count) + " records for " + String(cycleYear) : String(count) + " records";
        }

        function renderMembershipFeeCategoryFilter() {
          const current = String(feeCategoryFilterInput?.value || "").trim();
          const options = ["<option value=''>All categories</option>"]
            .concat(
              membershipFeeCategories.map((category) => {
                const selected = current && current.toLowerCase() === category.toLowerCase() ? " selected" : "";
                return (
                  "<option value='" +
                  escapeClientHtml(category) +
                  "'" +
                  selected +
                  ">" +
                  escapeClientHtml(category) +
                  "</option>"
                );
              })
            )
            .join("");
          feeCategoryFilterInput.innerHTML = options;
        }

        function selectedMembershipCycleItem() {
          const year = selectedMembershipFeeYear();
          if (!year) return null;
          return membershipFeeCycles.find((item) => Number(item.membershipYear) === year) || null;
        }

        function selectedMembershipFeeUserIdList() {
          return Array.from(selectedMembershipFeeUserIds.values()).filter((id) => Number.isInteger(id) && id > 0);
        }

        function normalizeClientIdList(value) {
          if (!Array.isArray(value)) {
            return [];
          }
          return Array.from(
            new Set(
              value
                .map((item) => Number(item))
                .filter((item) => Number.isInteger(item) && item > 0)
            )
          );
        }

        function reconcileSelectedMembershipFeeRows(rows) {
          const availableIds = new Set(
            (Array.isArray(rows) ? rows : [])
              .map((item) => Number(item.userId || 0))
              .filter((id) => Number.isInteger(id) && id > 0)
          );
          selectedMembershipFeeUserIds = new Set(
            selectedMembershipFeeUserIdList().filter((id) => availableIds.has(id))
          );
        }

        function updateMembershipFeeBulkBar() {
          if (!feeBulkBar || !feeBulkCount) {
            return;
          }
          const count = selectedMembershipFeeUserIds.size;
          const canBulk = Boolean(authToken) && canUseAdminActions();
          feeBulkCount.textContent = String(count) + " selected";
          feeBulkBar.hidden = count === 0 || !canBulk;
          if (feeBulkApplyButton) {
            feeBulkApplyButton.disabled = !canBulk || count === 0;
          }
          if (feeBulkReminderButton) {
            feeBulkReminderButton.disabled = !canBulk || count === 0;
          }
          if (feeSelectAllMembersInput) {
            const visibleIds = (membershipFeeMembers || [])
              .map((item) => Number(item.userId || 0))
              .filter((id) => Number.isInteger(id) && id > 0);
            const selectedVisibleCount = visibleIds.filter((id) => selectedMembershipFeeUserIds.has(id)).length;
            feeSelectAllMembersInput.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
            feeSelectAllMembersInput.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
            feeSelectAllMembersInput.disabled = !canBulk || visibleIds.length === 0;
          }
        }

        function renderMembershipFeeCycleOptions({ preserveSelection = true } = {}) {
          const existingSelection = preserveSelection ? String(feeCycleYearInput?.value || "").trim() : "";
          const activeYear = Number(membershipFeeOverview?.cycle?.membershipYear || 0) || Number(membershipFeeCycles[0]?.membershipYear || 0) || null;
          const fallbackYear = activeYear || new Date().getFullYear();
          const cycleRows = membershipFeeCycles
            .map((cycle) => {
              const yearValue = String(cycle.membershipYear || "");
              const selected =
                (existingSelection && existingSelection === yearValue) ||
                (!existingSelection && activeYear && Number(yearValue) === Number(activeYear))
                  ? " selected"
                  : "";
              const label = yearValue + " (" + normalizeMembershipStatusLabel(cycle.status || "draft").toLowerCase() + ")";
              return (
                "<option value='" +
                escapeClientHtml(yearValue) +
                "'" +
                selected +
                ">" +
                escapeClientHtml(label) +
                "</option>"
              );
            })
            .join("");

          if (!cycleRows) {
            feeCycleYearInput.innerHTML = "<option value=''>No cycle yet</option>";
            feeCycleYearInput.value = "";
          } else {
            feeCycleYearInput.innerHTML = cycleRows;
          }

          const selectedCycle = selectedMembershipCycleItem();
          const defaultYear = selectedCycle?.membershipYear || fallbackYear;
          feeCycleCreateYearInput.value = String(defaultYear);
          feeCycleDueDateInput.value = toDateInputValue(selectedCycle?.dueDate, defaultYear);
          feeCycleStatusInput.value = String(selectedCycle?.status || "open");
        }

        function membershipRoleBadges(item) {
          const labels = Array.isArray(item?.committeeLabels) ? item.committeeLabels : [];
          if (!labels.length) {
            return "<span class='muted'>No committee labels</span>";
          }
          return (
            "<div class='badge-row'>" +
            labels.map((value) => "<span class='badge'>" + escapeClientHtml(String(value || "")) + "</span>").join("") +
            "</div>"
          );
        }

        function membershipActionOptions(values, selectedValue) {
          const selected = String(selectedValue || "").trim().toLowerCase();
          return values
            .map((value) => {
              const normalized = String(value || "").trim().toLowerCase();
              return (
                "<option value='" +
                escapeClientHtml(normalized) +
                "'" +
                (normalized === selected ? " selected" : "") +
                ">" +
                escapeClientHtml(normalizeMembershipStatusLabel(normalized)) +
                "</option>"
              );
            })
            .join("");
        }

        function quickActionOptions() {
          return MEMBERSHIP_QUICK_ACTIONS.map(
            (item) =>
              "<option value='" +
              escapeClientHtml(item.value) +
              "'>" +
              escapeClientHtml(item.label) +
              "</option>"
          ).join("");
        }

        function renderMembershipFeeMembers(items) {
          const rows = Array.isArray(items) ? items : [];
          const canEdit = Boolean(authToken) && canUseAdminActions();
          if (!rows.length) {
            feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>No records match your current filters.</td></tr>";
            selectedMembershipFeeUserIds = new Set();
            updateMembershipFeeBulkBar();
            return;
          }

          reconcileSelectedMembershipFeeRows(rows);
          feeMembersTableBody.innerHTML = rows
            .map((item) => {
              const userId = Number(item.userId || 0);
              const name = String(item.fullName || item.username || "Member").trim();
              const email = String(item.email || "").trim();
              const phone = String(item.phone || "").trim();
              const company = String(item.company || "").trim();
              const membershipYear = item.membershipYear ? String(item.membershipYear) : "n/a";
              const category = String(item.membershipCategory || "Active Member").trim();
              const profileLabel = item.profileComplete ? "Complete" : "Incomplete";
              const profileTone = item.profileComplete ? "status-active" : "status-pending";
              const disabledAttr = canEdit ? "" : " disabled";
              const amountDue = Number(item.amountDue || 0);
              const amountPaid = Number(item.amountPaid || 0);
              const balance = Number(item.balance || 0);
              return (
                "<tr>" +
                "<td><input type='checkbox' data-fee-select-id='" +
                userId +
                "' aria-label='Select " +
                escapeClientHtml(name) +
                "' " +
                (selectedMembershipFeeUserIds.has(userId) ? "checked " : "") +
                disabledAttr +
                " /></td>" +
                "<td>" +
                "<strong>" +
                escapeClientHtml(name) +
                "</strong>" +
                "<div class='muted'>" +
                (email ? escapeClientHtml(email) : "n/a") +
                "</div>" +
                "<div class='muted'>" +
                (phone ? escapeClientHtml(phone) : "n/a") +
                "</div>" +
                "<div class='muted'>" +
                (company ? escapeClientHtml(company) : "n/a") +
                "</div>" +
                "</td>" +
                "<td>" +
                "<div><strong>" +
                escapeClientHtml(membershipYear) +
                "</strong> | " +
                escapeClientHtml(category) +
                "</div>" +
                membershipRoleBadges(item) +
                "</td>" +
                "<td>" +
                "<div class='fee-status-stack'><span class='muted'>Account</span><span class='status-pill " +
                membershipStatusTone(item.accountStatus, "account") +
                "'>" +
                escapeClientHtml(normalizeMembershipStatusLabel(item.accountStatus)) +
                "</span></div>" +
                "<div class='fee-status-stack'><span class='muted'>Payment</span><span class='status-pill " +
                membershipStatusTone(item.paymentStatus) +
                "'>" +
                escapeClientHtml(normalizeMembershipStatusLabel(item.paymentStatus)) +
                "</span></div>" +
                "<div class='fee-status-stack'><span class='muted'>Standing</span><span class='status-pill " +
                membershipStatusTone(item.standingStatus) +
                "'>" +
                escapeClientHtml(normalizeMembershipStatusLabel(item.standingStatus)) +
                "</span></div>" +
                "<div class='fee-status-stack'><span class='muted'>Access</span><span class='status-pill " +
                membershipStatusTone(item.accessStatus, "access") +
                "'>" +
                escapeClientHtml(normalizeMembershipStatusLabel(item.accessStatus)) +
                "</span></div>" +
                "</td>" +
                "<td>" +
                "<div>Due: <strong>" + escapeClientHtml(formatMembershipCurrency(amountDue)) + "</strong></div>" +
                "<div>Paid: <strong>" + escapeClientHtml(formatMembershipCurrency(amountPaid)) + "</strong></div>" +
                "<div>Balance: <strong>" + escapeClientHtml(formatMembershipCurrency(balance)) + "</strong></div>" +
                "<div class='muted'>Last payment: " + escapeClientHtml(formatMembershipDate(item.lastPaymentAt)) + "</div>" +
                "<div class='muted'>Last reminder: " +
                escapeClientHtml(formatMembershipDateTime(item.lastDuesReminderAt)) +
                (item.lastDuesReminderStatus ? " (" + escapeClientHtml(normalizeMembershipStatusLabel(item.lastDuesReminderStatus)) + ")" : "") +
                "</div>" +
                "<div class='muted'>Reviewed: " + escapeClientHtml(formatMembershipDateTime(item.reviewedAt)) + "</div>" +
                "</td>" +
                "<td>" +
                "<span class='status-pill " +
                profileTone +
                "'>" +
                escapeClientHtml(profileLabel) +
                "</span>" +
                "<div class='muted'>Confirmed: " +
                escapeClientHtml(formatMembershipDate(item.profileConfirmedAt)) +
                "</div>" +
                "</td>" +
                "<td>" +
                "<div class='fee-action-grid'>" +
                "<select data-fee-payment='" +
                userId +
                "'" +
                disabledAttr +
                ">" +
                membershipActionOptions(MEMBERSHIP_PAYMENT_STATUSES, item.paymentStatus) +
                "</select>" +
                "<select data-fee-standing='" +
                userId +
                "'" +
                disabledAttr +
                ">" +
                membershipActionOptions(MEMBERSHIP_STANDING_STATUSES, item.standingStatus) +
                "</select>" +
                "<select data-fee-access='" +
                userId +
                "'" +
                disabledAttr +
                ">" +
                membershipActionOptions(MEMBERSHIP_ACCESS_STATUSES, item.accessStatus) +
                "</select>" +
                "<input data-fee-due='" +
                userId +
                "' type='number' min='0' step='0.01' value='" +
                escapeClientHtml(amountDue.toFixed(2)) +
                "'" +
                disabledAttr +
                " />" +
                "<input data-fee-paid='" +
                userId +
                "' type='number' min='0' step='0.01' value='" +
                escapeClientHtml(amountPaid.toFixed(2)) +
                "'" +
                disabledAttr +
                " />" +
                "<input data-fee-note='" +
                userId +
                "' type='text' placeholder='Admin note' value='" +
                escapeClientHtml(item.adminNote || "") +
                "'" +
                disabledAttr +
                " />" +
                "<input data-fee-reason='" +
                userId +
                "' type='text' placeholder='Reason for audit log'" +
                disabledAttr +
                " />" +
                "<select data-fee-quick-action='" +
                userId +
                "'" +
                disabledAttr +
                ">" +
                "<option value=''>Quick action</option>" +
                quickActionOptions() +
                "</select>" +
                "<button type='button' data-fee-save-id='" +
                userId +
                "'" +
                disabledAttr +
                ">Save</button>" +
                "<button type='button' data-fee-quick-apply-id='" +
                userId +
                "'" +
                disabledAttr +
                ">Apply quick action</button>" +
                "<button type='button' data-fee-reminder-id='" +
                userId +
                "'" +
                disabledAttr +
                ">Send dues reminder</button>" +
                "<button type='button' data-fee-audit-id='" +
                userId +
                "'" +
                disabledAttr +
                ">View audit</button>" +
                "</div>" +
                "<p id='fee-row-status-" +
                userId +
                "' class='muted fee-row-status'></p>" +
                "</td>" +
                "</tr>"
              );
            })
            .join("");
          updateMembershipFeeBulkBar();
        }

        function readMembershipFeeRowPayload(userId) {
          const paymentInput = feeMembersTableBody.querySelector("[data-fee-payment='" + userId + "']");
          const standingInput = feeMembersTableBody.querySelector("[data-fee-standing='" + userId + "']");
          const accessInput = feeMembersTableBody.querySelector("[data-fee-access='" + userId + "']");
          const dueInput = feeMembersTableBody.querySelector("[data-fee-due='" + userId + "']");
          const paidInput = feeMembersTableBody.querySelector("[data-fee-paid='" + userId + "']");
          const noteInput = feeMembersTableBody.querySelector("[data-fee-note='" + userId + "']");
          const reasonInput = feeMembersTableBody.querySelector("[data-fee-reason='" + userId + "']");
          if (!paymentInput || !standingInput || !accessInput || !dueInput || !paidInput || !noteInput || !reasonInput) {
            return { error: "Unable to read editable fields for this member." };
          }

          const amountDue = Number(String(dueInput.value || "").trim());
          const amountPaid = Number(String(paidInput.value || "").trim());
          if (!Number.isFinite(amountDue) || amountDue < 0) {
            return { error: "Amount due must be a number greater than or equal to 0." };
          }
          if (!Number.isFinite(amountPaid) || amountPaid < 0) {
            return { error: "Amount paid must be a number greater than or equal to 0." };
          }

          const payload = {
            paymentStatus: String(paymentInput.value || "pending_review").trim().toLowerCase(),
            standingStatus: String(standingInput.value || "pending_review").trim().toLowerCase(),
            accessStatus: String(accessInput.value || "enabled").trim().toLowerCase(),
            amountDue,
            amountPaid,
            adminNote: String(noteInput.value || "").trim(),
            reason: String(reasonInput.value || "").trim() || "admin_update"
          };
          const membershipYear = selectedMembershipFeeYear();
          if (membershipYear) {
            payload.membershipYear = membershipYear;
          }
          return { payload, reasonInput };
        }

        function applyMembershipQuickAction(actionValue, payload) {
          const action = String(actionValue || "").trim();
          if (!action) {
            return null;
          }
          if (action === "mark_paid") {
            payload.paymentStatus = "paid";
            payload.standingStatus = "good_standing";
            payload.accessStatus = "enabled";
            payload.amountPaid = Math.max(Number(payload.amountPaid || 0), Number(payload.amountDue || 0));
            return "marked_paid";
          }
          if (action === "mark_partial") {
            payload.paymentStatus = "partial";
            payload.standingStatus = "partial";
            payload.accessStatus = "enabled";
            return "marked_partial";
          }
          if (action === "mark_waived") {
            payload.paymentStatus = "waived";
            payload.standingStatus = "waived";
            payload.accessStatus = "enabled";
            payload.amountPaid = Math.max(Number(payload.amountPaid || 0), Number(payload.amountDue || 0));
            return "marked_waived";
          }
          if (action === "mark_outstanding") {
            payload.paymentStatus = "outstanding";
            payload.standingStatus = "outstanding";
            return "marked_outstanding";
          }
          if (action === "block") {
            payload.accessStatus = "blocked";
            payload.standingStatus = "blocked";
            return "blocked";
          }
          if (action === "deactivate") {
            payload.accessStatus = "deactivated";
            payload.standingStatus = "deactivated";
            return "deactivated";
          }
          if (action === "restore") {
            payload.accessStatus = "enabled";
            if (payload.standingStatus === "blocked" || payload.standingStatus === "deactivated") {
              payload.standingStatus = "pending_review";
            }
            return "restored";
          }
          return null;
        }

        function canManageMembershipFees() {
          return Boolean(authToken) && canUseAdminActions();
        }

        function resetMembershipFeesView(message) {
          membershipFeeOverview = null;
          membershipFeeMembers = [];
          membershipFeeCycles = [];
          membershipFeeCategories = [];
          selectedMembershipFeeUserIds = new Set();
          feeCycleYearInput.innerHTML = "<option value=''>Current cycle</option>";
          feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>" + escapeClientHtml(message) + "</td></tr>";
          feeMembersStatus.textContent = message;
          feeMemberCount.textContent = "";
          feeCycleStatusText.textContent = message;
          resetMembershipFeeKpis();
          renderMembershipFeeCategoryFilter();
          updateMembershipFeeBulkBar();
        }

        async function loadMembershipFeeCycles({ preserveSelection = true } = {}) {
          if (!authToken) {
            resetMembershipFeesView("Sign in to manage membership cycles.");
            return;
          }
          if (!canUseAdminActions()) {
            resetMembershipFeesView("Only admin and chief admin roles can manage membership fees.");
            return;
          }
          feeCycleStatusText.textContent = "Loading membership cycles...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/cycles?limit=60", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeCycleStatusText.textContent = json.message || "Unable to load membership cycles.";
              return;
            }
            const items = Array.isArray(json.items) ? json.items : [];
            membershipFeeCycles = items
              .map((item) => ({
                id: Number(item.id || 0),
                membershipYear: Number(item.membershipYear || 0),
                dueDate: item.dueDate || "",
                status: String(item.status || "draft")
              }))
              .filter((item) => Number.isInteger(item.membershipYear) && item.membershipYear > 0)
              .sort((left, right) => Number(right.membershipYear) - Number(left.membershipYear));
            if (json.activeCycle) {
              membershipFeeOverview = {
                cycle: {
                  membershipYear: Number(json.activeCycle.membershipYear || 0) || null,
                  dueDate: json.activeCycle.dueDate || null,
                  status: json.activeCycle.status || "open"
                }
              };
            }
            renderMembershipFeeCycleOptions({ preserveSelection });
            const selectedCycle = selectedMembershipCycleItem();
            if (selectedCycle) {
              feeCycleStatusText.textContent =
                "Cycle " +
                String(selectedCycle.membershipYear) +
                " is " +
                normalizeMembershipStatusLabel(selectedCycle.status).toLowerCase() +
                " (due " +
                String(selectedCycle.dueDate || "n/a") +
                ").";
            } else {
              feeCycleStatusText.textContent = "No membership cycle found yet. Create one to begin annual fee tracking.";
            }
          } catch {
            feeCycleStatusText.textContent = "Unable to reach API for membership cycles.";
          }
        }

        async function loadMembershipFeesOverview() {
          if (!authToken || !canUseAdminActions()) {
            resetMembershipFeeKpis();
            return;
          }
          try {
            const membershipYear = selectedMembershipFeeYear();
            const suffix = membershipYear ? "?membershipYear=" + encodeURIComponent(String(membershipYear)) : "";
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/overview" + suffix, {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeMembersStatus.textContent = json.message || "Unable to load membership summary.";
              resetMembershipFeeKpis();
              return;
            }
            membershipFeeOverview = json || null;
            renderMembershipFeeKpis(json.summary || {});
          } catch {
            feeMembersStatus.textContent = "Unable to reach API for membership summary.";
            resetMembershipFeeKpis();
          }
        }

        async function loadMembershipFeeMembers() {
          if (!authToken || !canUseAdminActions()) {
            membershipFeeMembers = [];
            feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Sign in to load membership fee records.</td></tr>";
            updateMembershipFeeMemberCount(0);
            return;
          }
          feeMembersStatus.textContent = "Loading membership fee records...";
          feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Loading membership fee records...</td></tr>";
          try {
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/membership-fees/members?" + membershipFeeMembersQueryString(),
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeMembersStatus.textContent = json.message || "Unable to load membership fee records.";
              feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to load membership fee records.</td></tr>";
              updateMembershipFeeMemberCount(0);
              return;
            }
            membershipFeeMembers = Array.isArray(json.items) ? json.items : [];
            const categorySet = new Set(membershipFeeCategories.map((value) => String(value || "").trim()));
            for (const item of membershipFeeMembers) {
              const category = String(item.membershipCategory || "").trim();
              if (category) {
                categorySet.add(category);
              }
            }
            membershipFeeCategories = Array.from(categorySet.values())
              .filter(Boolean)
              .sort((left, right) => left.localeCompare(right));
            renderMembershipFeeCategoryFilter();
            renderMembershipFeeMembers(membershipFeeMembers);
            updateMembershipFeeMemberCount(Number(json.total || membershipFeeMembers.length));
            const membershipYear = selectedMembershipFeeYear();
            feeMembersStatus.textContent = membershipYear
              ? "Loaded " + String(membershipFeeMembers.length) + " records for " + String(membershipYear) + "."
              : "Loaded " + String(membershipFeeMembers.length) + " membership fee records.";
          } catch {
            feeMembersStatus.textContent = "Unable to reach API for membership fee records.";
            feeMembersTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to reach API.</td></tr>";
            updateMembershipFeeMemberCount(0);
          }
        }

        async function loadMembershipFeesWorkspace({ reloadCycles = true } = {}) {
          if (!authToken || !canUseAdminActions()) {
            return;
          }
          if (reloadCycles) {
            await loadMembershipFeeCycles({ preserveSelection: true });
            if (!authToken) return;
          }
          await loadMembershipFeesOverview();
          if (!authToken) return;
          await loadMembershipFeeMembers();
        }

        async function saveMembershipCycle() {
          if (!authToken || !canUseAdminActions()) {
            feeCycleStatusText.textContent = "Only admin and chief admin roles can update membership cycles.";
            return;
          }
          const membershipYear = Number(String(feeCycleCreateYearInput.value || "").trim());
          const dueDate = String(feeCycleDueDateInput.value || "").trim();
          const statusValue = String(feeCycleStatusInput.value || "open").trim();
          if (!Number.isInteger(membershipYear) || membershipYear < 2000 || membershipYear > 2100) {
            feeCycleStatusText.textContent = "Cycle year must be between 2000 and 2100.";
            return;
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            feeCycleStatusText.textContent = "Due date must be a valid YYYY-MM-DD date.";
            return;
          }

          feeCycleStatusText.textContent = "Saving cycle...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/cycles", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({
                membershipYear,
                dueDate,
                status: statusValue
              })
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeCycleStatusText.textContent = json.message || "Unable to save membership cycle.";
              return;
            }
            if (feeCycleYearInput) {
              feeCycleYearInput.value = String(membershipYear);
            }
            const closedCycles = Number(json.closedOpenCycles || 0);
            feeCycleStatusText.textContent =
              closedCycles > 0
                ? "Cycle saved. Closed " + String(closedCycles) + " previously open cycle(s)."
                : "Cycle saved successfully.";
            await loadMembershipFeesWorkspace({ reloadCycles: true });
          } catch {
            feeCycleStatusText.textContent = "Unable to reach API to save membership cycle.";
          }
        }

        async function updateMembershipFeeAccount(userId, { quickAction = "" } = {}) {
          if (!authToken || !canUseAdminActions()) {
            setFeeRowStatus(userId, "Only admin and chief admin roles can update fee accounts.");
            return;
          }
          const parsedUserId = Number(userId);
          if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
            return;
          }
          const { payload, reasonInput, error } = readMembershipFeeRowPayload(parsedUserId);
          if (error) {
            setFeeRowStatus(parsedUserId, error);
            return;
          }
          const quickOutcome = applyMembershipQuickAction(quickAction, payload);
          if (quickAction && !quickOutcome) {
            setFeeRowStatus(parsedUserId, "Select a valid quick action first.");
            return;
          }
          if (quickAction && reasonInput && !String(reasonInput.value || "").trim()) {
            reasonInput.value = String(quickOutcome || "quick_action");
            payload.reason = String(reasonInput.value || "").trim() || payload.reason;
          }

          setFeeRowStatus(parsedUserId, "Saving...");
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/accounts/" + String(parsedUserId), {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              setFeeRowStatus(parsedUserId, json.message || "Unable to update member fee account.");
              return;
            }
            setFeeRowStatus(parsedUserId, "Saved.");
            await loadMembershipFeesOverview();
            if (!authToken) return;
            await loadMembershipFeeMembers();
          } catch {
            setFeeRowStatus(parsedUserId, "Unable to reach API for fee updates.");
          }
        }

        async function applyBulkMembershipFeeUpdate() {
          if (!authToken || !canUseAdminActions()) {
            feeMembersStatus.textContent = "Only admin and chief admin roles can update fee accounts.";
            return;
          }
          const userIds = selectedMembershipFeeUserIdList();
          if (!userIds.length) {
            feeMembersStatus.textContent = "Select at least one member fee record.";
            return;
          }
          const standingStatus = String(feeBulkStandingInput?.value || "").trim();
          const accessStatus = String(feeBulkAccessInput?.value || "").trim();
          if (!standingStatus && !accessStatus) {
            feeMembersStatus.textContent = "Choose a standing or access change before applying bulk update.";
            return;
          }
          const payload = {
            userIds,
            reason: String(feeBulkReasonInput?.value || "").trim() || "bulk_membership_fee_update"
          };
          const membershipYear = selectedMembershipFeeYear();
          if (membershipYear) {
            payload.membershipYear = membershipYear;
          }
          if (standingStatus) {
            payload.standingStatus = standingStatus;
            if (standingStatus === "good_standing") {
              payload.paymentStatus = "paid";
            } else if (standingStatus === "waived") {
              payload.paymentStatus = "waived";
            } else if (standingStatus === "partial") {
              payload.paymentStatus = "partial";
            } else if (standingStatus === "outstanding") {
              payload.paymentStatus = "outstanding";
            }
          }
          if (accessStatus) {
            payload.accessStatus = accessStatus;
          }

          feeMembersStatus.textContent = "Applying bulk membership fee update...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/accounts/bulk", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeMembersStatus.textContent = json.message || "Unable to apply bulk membership fee update.";
              return;
            }
            feeMembersStatus.textContent =
              "Bulk update saved for " +
              String(Number(json.updated || 0)) +
              " member(s)" +
              (Number(json.failed || 0) > 0 ? "; " + String(Number(json.failed || 0)) + " failed." : ".");
            selectedMembershipFeeUserIds = new Set();
            if (feeBulkStandingInput) feeBulkStandingInput.value = "";
            if (feeBulkAccessInput) feeBulkAccessInput.value = "";
            await loadMembershipFeesOverview();
            if (!authToken) return;
            await loadMembershipFeeMembers();
          } catch {
            feeMembersStatus.textContent = "Unable to reach API for bulk membership fee updates.";
          }
        }

        async function sendMembershipDuesReminder(userIds = selectedMembershipFeeUserIdList()) {
          if (!authToken || !canUseAdminActions()) {
            feeMembersStatus.textContent = "Only admin and chief admin roles can send dues reminders.";
            return;
          }
          const selectedIds = normalizeClientIdList(userIds);
          if (!selectedIds.length) {
            feeMembersStatus.textContent = "Select at least one member fee record.";
            return;
          }
          const payload = {
            userIds: selectedIds,
            reason: String(feeBulkReasonInput?.value || "").trim() || "dues_reminder"
          };
          const membershipYear = selectedMembershipFeeYear();
          if (membershipYear) {
            payload.membershipYear = membershipYear;
          }

          feeMembersStatus.textContent = "Queueing dues reminder...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/membership-fees/dues-reminders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              feeMembersStatus.textContent = json.message || "Unable to queue dues reminder.";
              return;
            }
            feeMembersStatus.textContent =
              "Dues reminder queued for " + String(Number(json.queued || 0)) + " member(s).";
          } catch {
            feeMembersStatus.textContent = "Unable to reach API for dues reminders.";
          }
        }

        async function loadMembershipFeeAudit(userId) {
          if (!authToken || !canUseAdminActions()) {
            setFeeRowStatus(userId, "Only admin and chief admin roles can view fee audit history.");
            return;
          }
          const parsedUserId = Number(userId);
          if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
            return;
          }
          const membershipYear = selectedMembershipFeeYear();
          const suffix = membershipYear ? "?membershipYear=" + encodeURIComponent(String(membershipYear)) : "";
          setFeeRowStatus(parsedUserId, "Loading audit history...");
          try {
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/membership-fees/accounts/" + String(parsedUserId) + "/audit" + suffix,
              { headers: { Authorization: "Bearer " + authToken } }
            );
            const json = await response.json();
            if (!response.ok) {
              if (clearAdminAuthOnUnauthorized(response)) return;
              setFeeRowStatus(parsedUserId, json.message || "Unable to load audit history.");
              return;
            }
            const items = Array.isArray(json.items) ? json.items : [];
            if (!items.length) {
              setFeeRowStatus(parsedUserId, "No standing or access audit entries yet.");
              return;
            }
            const summary = items
              .slice(0, 3)
              .map((item) => {
                const actor = item.actorUsername ? " by " + item.actorUsername : "";
                return (
                  formatMembershipDateTime(item.createdAt) +
                  ": standing " +
                  normalizeMembershipStatusLabel(item.previousStandingStatus || "none") +
                  " -> " +
                  normalizeMembershipStatusLabel(item.nextStandingStatus) +
                  ", access " +
                  normalizeMembershipStatusLabel(item.previousAccessStatus || "none") +
                  " -> " +
                  normalizeMembershipStatusLabel(item.nextAccessStatus) +
                  actor +
                  (item.reason ? " (" + item.reason + ")" : "")
                );
              })
              .join(" | ");
            setFeeRowStatus(parsedUserId, summary);
          } catch {
            setFeeRowStatus(parsedUserId, "Unable to reach API for audit history.");
          }
        }

          function sanitizeName(value) {
            return String(value || "").trim();
          }

        function memberMatchesSearch(member, term) {
          const normalizedTerm = String(term || "").trim().toLowerCase();
          if (!normalizedTerm) {
            return true;
          }
          const name = String(member.fullName || member.username || "").toLowerCase();
          const email = String(member.email || "").toLowerCase();
          const groupsText = normalizeGroupList(member.groups || []).join(" ").toLowerCase();
          const rolesText = (Array.isArray(member.roles) ? member.roles : []).join(" ").toLowerCase();
          const organisation = normalizeDisplayText(member.organisation || member.company || "").toLowerCase();
          return (
            name.includes(normalizedTerm) ||
            email.includes(normalizedTerm) ||
            groupsText.includes(normalizedTerm) ||
            rolesText.includes(normalizedTerm) ||
            organisation.includes(normalizedTerm)
          );
        }

        function updateMemberSearchSuggestions(members, term) {
          if (!memberSearchDropdown) {
            return;
          }
          memberSearchDropdown.innerHTML = "";
          const normalizedTerm = String(term || "").trim().toLowerCase();
          if (!normalizedTerm) {
            memberSearchDropdown.hidden = true;
            return;
          }
          const seen = new Set();
          const matches = members
            .filter((member) => memberMatchesSearch(member, normalizedTerm))
            .sort((left, right) => String(left.fullName || left.username || "").localeCompare(String(right.fullName || right.username || "")))
            .slice(0, 10);

          if (!matches.length) {
            memberSearchDropdown.hidden = true;
            return;
          }

          matches.forEach((member) => {
            const name = sanitizeName(member.fullName || member.username || member.email || "");
            if (!name) return;
            const key = (name + "|" + String(member.email || "")).toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);

            const email = String(member.email || "").trim();
            const org = normalizeDisplayText(member.organisation || member.company || "").trim();
            const groups = normalizeGroupList(member.groups || []);
            const status = String(member.status || "active").trim().toLowerCase();

            const groupBadges = groups.length
              ? groups.map((g) => "<span class='badge member-group-badge-sm'>" + escapeClientHtml(g) + "</span>").join("")
              : "<span class='msr-unassigned'>No group</span>";

            const statusDot = status === "active" ? "msr-dot msr-dot-active" : status === "invited" ? "msr-dot msr-dot-invited" : "msr-dot msr-dot-other";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "member-search-result";
            btn.setAttribute("role", "option");
            btn.innerHTML =
              "<span class='msr-header'>" +
              "<strong class='msr-name'>" + escapeClientHtml(name) + "</strong>" +
              "<span class='" + statusDot + "'></span>" +
              "</span>" +
              (email ? "<span class='msr-email'>" + escapeClientHtml(email) + "</span>" : "") +
              (org ? "<span class='msr-org'>" + escapeClientHtml(org) + "</span>" : "") +
              "<span class='msr-groups'>" + groupBadges + "</span>";

            btn.addEventListener("mousedown", (event) => {
              event.preventDefault();
              addToBasket(member);
              memberSearch.value = "";
              memberSearchDropdown.hidden = true;
              applyMemberFilter();
            });
            memberSearchDropdown.appendChild(btn);
          });

          memberSearchDropdown.hidden = false;
        }

        function renderMemberBasket() {
          if (!memberSelectionBasket || !memberSelectionChips) return;
          if (basketMembers.size === 0) {
            memberSelectionBasket.hidden = true;
            memberSelectionChips.innerHTML = "";
            return;
          }
          memberSelectionBasket.hidden = false;
          memberSelectionChips.innerHTML = Array.from(basketMembers.values())
            .map((m) => {
              const id = Number(m.id || m.userId || 0);
              const name = escapeClientHtml(m.fullName || m.username || "Member");
              const org = escapeClientHtml(m.organisation || m.company || "");
              return (
                "<span class='msb-chip' data-basket-id='" + id + "'>" +
                "<span class='msb-chip-name'>" + name + "</span>" +
                (org ? "<span class='msb-chip-org'>" + org + "</span>" : "") +
                "<button type='button' class='msb-chip-remove' aria-label='Remove " + name + "' data-remove-id='" + id + "'>\u00d7</button>" +
                "</span>"
              );
            })
            .join("");

          memberSelectionChips.querySelectorAll(".msb-chip-remove").forEach((btn) => {
            btn.addEventListener("click", () => {
              const id = Number(btn.getAttribute("data-remove-id") || 0);
              basketMembers.delete(id);
              renderMemberBasket();
              syncBasketToCheckboxes();
              updateQueueButton();
            });
          });
        }

        function syncBasketToCheckboxes() {
          document.querySelectorAll(".member-checkbox").forEach((cb) => {
            cb.checked = basketMembers.has(Number(cb.value));
          });
        }

        function addToBasket(member) {
          const id = Number(member.id || member.userId || 0);
          if (!id) return;
          basketMembers.set(id, member);
          renderMemberBasket();
          syncBasketToCheckboxes();
          updateQueueButton();
        }

        function applyMemberFilter() {
          const term = String(memberSearch.value || "").trim().toLowerCase();
          const statusFilter = String(memberStatusFilter?.value || "").trim().toLowerCase();
          const roleFilter = String(memberRoleFilter?.value || "").trim().toLowerCase();
          const groupFilter = String(memberGroupFilter?.value || "").trim().toLowerCase();
          const sortMode = String(memberSortInput?.value || "name").trim().toLowerCase();
          const filtered = memberDirectorySource.filter((member) => {
            const groups = normalizeGroupList(member.groups || []);
            const roles = Array.isArray(member.roles) ? member.roles : [];
            const status = String(member.status || "active").trim().toLowerCase() || "active";
            const matchesStatus = !statusFilter || status === statusFilter;
            const matchesRole = !roleFilter || roles.some((role) => String(role || "").toLowerCase() === roleFilter);
            const matchesGroup = !groupFilter || groups.some((group) => String(group || "").toLowerCase() === groupFilter);
            return matchesStatus && matchesRole && matchesGroup;
          });
          updateMemberSearchSuggestions(filtered, term);
          const sorted = filtered
            .filter((member) => memberMatchesSearch(member, term))
            .slice()
            .sort((left, right) => {
              if (sortMode === "organisation") {
                return normalizeDisplayText(left.organisation || left.company || "").localeCompare(
                  normalizeDisplayText(right.organisation || right.company || "")
                );
              }
              if (sortMode === "status") {
                return String(left.status || "active").localeCompare(String(right.status || "active"));
              }
              if (sortMode === "recent") {
                return Number(right.id || right.userId || 0) - Number(left.id || left.userId || 0);
              }
              return String(left.fullName || left.username || "").localeCompare(String(right.fullName || right.username || ""));
            });
          renderMembers(sorted);
        }

        function selectedImportBatchId() {
          const typed = String(importBatchIdInput.value || "").trim();
          if (typed) {
            return typed;
          }
          return activeImportBatchId;
        }

        function updateImportButtons() {
          const batchId = selectedImportBatchId();
          const hasBatch = Boolean(batchId);
          const hasLoadedBatch = Boolean(
            activeImportBatch && activeImportBatch.batch_id && activeImportBatch.batch_id === batchId
          );
          refreshImportBatchButton.disabled = !authToken || !hasBatch;
          reportImportButton.disabled = !authToken || !hasBatch;
          applyImportButton.disabled =
            !authToken ||
            !hasLoadedBatch ||
            activeImportBatch.status === "applied" ||
            Boolean(activeImportBatch.has_blocking_issues);
        }

        function formatImportActionLabel(value) {
          const normalized = String(value || "").trim().toLowerCase();
          const labels = {
            create: "Create",
            update: "Update",
            skip: "Skip",
            error: "Error",
            existing: "Existing"
          };
          return labels[normalized] || formatImportLabel(normalized || "existing");
        }

        function importActionTone(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (normalized === "create") return "status-active";
          if (normalized === "update") return "status-neutral";
          if (normalized === "skip") return "status-neutral";
          if (normalized === "error") return "status-suspended";
          return "status-neutral";
        }

        function buildImportMembershipPreviewRows(importRows) {
          const previewRows = [];
          const memberIndexByEmail = new Map();

          const members = Array.isArray(memberDirectorySource) ? memberDirectorySource : [];
          for (const member of members) {
            const email = String(member.email || "").trim();
            const emailKey = email.toLowerCase();
            previewRows.push({
              importRowId: 0,
              rowNumber: 0,
              email,
              fullName: String(member.fullName || member.username || "").trim(),
              status: String(member.status || "").trim().toLowerCase(),
              organisation: displayInputValue(member.organisation || member.company || ""),
              phone: String(member.phone || member.cellPhone || member.mobile || "").trim(),
              groups: normalizeGroupList(member.groups || []),
              action: "existing",
              reasonCode: "",
              errorMessage: ""
            });
            if (emailKey && !memberIndexByEmail.has(emailKey)) {
              memberIndexByEmail.set(emailKey, previewRows.length - 1);
            }
          }

          const importSource = Array.isArray(importRows) ? importRows : [];
          for (const row of importSource) {
            const email = String(row.email || "").trim();
            const emailKey = email.toLowerCase();
            const importEntry = {
              importRowId: Number(row.id || 0),
              rowNumber: Number(row.rowNumber || 0),
              email,
              fullName: String(row.fullName || "").trim(),
              status: String(row.status || "").trim().toLowerCase(),
              organisation: displayInputValue(row.organisation || ""),
              phone: String(row.phone || "").trim(),
              groups: normalizeGroupList(row.groups || []),
              action: String(row.action || "").trim().toLowerCase(),
              reasonCode: String(row.reasonCode || "").trim(),
              errorMessage: String(row.errorMessage || "").trim()
            };

            if (emailKey && memberIndexByEmail.has(emailKey)) {
              const targetIndex = memberIndexByEmail.get(emailKey);
              const base = previewRows[targetIndex];
              if (Number(base.importRowId || 0) > 0) {
                previewRows.push(importEntry);
                continue;
              }
              const shouldOverlay =
                importEntry.action === "create" || importEntry.action === "update" || importEntry.action === "error";
              previewRows[targetIndex] = {
                ...base,
                importRowId: importEntry.importRowId,
                rowNumber: importEntry.rowNumber,
                action: importEntry.action || base.action,
                reasonCode: importEntry.reasonCode,
                errorMessage: importEntry.errorMessage,
                email: importEntry.email || base.email,
                fullName: shouldOverlay ? importEntry.fullName || base.fullName : base.fullName,
                status: shouldOverlay ? importEntry.status || base.status : base.status,
                organisation: shouldOverlay ? importEntry.organisation || base.organisation : base.organisation,
                phone: shouldOverlay ? importEntry.phone || base.phone : base.phone,
                groups: shouldOverlay ? (importEntry.groups.length > 0 ? importEntry.groups : base.groups) : base.groups
              };
            } else {
              previewRows.push(importEntry);
            }
          }

          return previewRows.sort((left, right) => {
            const leftName = String(left.fullName || left.email || "").toLowerCase();
            const rightName = String(right.fullName || right.email || "").toLowerCase();
            return leftName.localeCompare(rightName);
          });
        }

        function renderImportRows(rows) {
          const normalizedRows = Array.isArray(rows)
            ? rows.map((row) => ({
                id: Number(row.id || 0),
                rowNumber: Number(row.rowNumber || 0),
                email: String(row.email || "").trim(),
                fullName: String(row.fullName || "").trim(),
                status: String(row.status || "").trim().toLowerCase(),
                organisation: displayInputValue(row.organisation || ""),
                phone: String(row.phone || "").trim(),
                groups: normalizeGroupList(row.groups || ""),
                action: String(row.action || "").trim(),
                reasonCode: String(row.reasonCode || "").trim(),
                errorMessage: String(row.errorMessage || "").trim()
              }))
            : [];
          importRowsCache = normalizedRows;
          const previewRows = buildImportMembershipPreviewRows(normalizedRows);
          if (previewRows.length === 0) {
            activeImportRowId = 0;
            renderImportEmptyState("No membership records loaded yet.");
            closeImportEditPanel();
            return;
          }

          const canEditRows = Boolean(activeImportBatch && activeImportBatch.status !== "applied");
          importRowsBody.innerHTML = previewRows
            .map((row) => {
              const label = row.status ? formatImportLabel(row.status) : "n/a";
              const tone =
                row.status === "suspended"
                  ? "status-suspended"
                  : row.status === "active"
                    ? "status-active"
                    : "status-neutral";
              const email = String(row.email || "").trim();
              const emailCell = email
                ? "<a href='mailto:" + encodeURIComponent(email) + "'>" + escapeClientHtml(email) + "</a>"
                : "<span class='muted'>n/a</span>";
              const safeName = escapeClientHtml(row.fullName || "(Unnamed)");
              const rowAction = row.action || "existing";
              const actionLabel = formatImportActionLabel(rowAction);
              const actionTone = importActionTone(rowAction);
              const reasonText = String(row.reasonCode || "").trim();
              const reasonHint = reasonText
                ? "<div class='muted'>" + escapeClientHtml(formatImportLabel(reasonText)) + "</div>"
                : "";
              const displayName = canEditRows && Number(row.importRowId || 0) > 0
                ? "<button type='button' class='import-row-link' data-import-row-id='" +
                  Number(row.importRowId || 0) +
                  "'>" +
                  safeName +
                  "</button>"
                : safeName;
              return (
                "<tr>" +
                "<td>" +
                emailCell +
                "</td>" +
                "<td>" +
                displayName +
                "</td>" +
                "<td><span class='status-pill " +
                tone +
                "'>" +
                escapeClientHtml(label) +
                "</span></td>" +
                "<td><span class='status-pill " +
                actionTone +
                "'>" +
                escapeClientHtml(actionLabel) +
                "</span>" +
                reasonHint +
                "</td>" +
                "</tr>"
              );
            })
            .join("");

          if (canEditRows) {
            document.querySelectorAll(".import-row-link").forEach((trigger) => {
              trigger.addEventListener("click", () => {
                const rowId = Number(trigger.getAttribute("data-import-row-id") || 0);
                openImportEditPanel(rowId);
              });
            });
          }
        }

        function findImportRow(rowId) {
          return importRowsCache.find((item) => Number(item.id) === Number(rowId)) || null;
        }

        function closeImportEditPanel() {
          activeImportRowId = 0;
          if (importEditPanel) {
            importEditPanel.hidden = true;
          }
          if (importEditStatusText) {
            importEditStatusText.textContent = "";
          }
        }

        function openImportEditPanel(rowId) {
          const row = findImportRow(rowId);
          if (!row || !importEditPanel) {
            return;
          }
          if (activeImportBatch && activeImportBatch.status === "applied") {
            importStatus.textContent = "Applied batches are read-only. Start a new dry-run to edit imported records.";
            return;
          }

          activeImportRowId = row.id;
          importEditPanel.hidden = false;
          if (importEditContext) {
            const rowLabel = row.rowNumber > 0 ? "Row " + row.rowNumber : "Record " + row.id;
            importEditContext.textContent = rowLabel + " | Batch " + (activeImportBatchId || "");
          }
          if (importEditEmailInput) {
            importEditEmailInput.value = row.email || "";
          }
          if (importEditFullNameInput) {
            importEditFullNameInput.value = row.fullName || "";
          }
          if (importEditStatusInput) {
            importEditStatusInput.value = row.status === "suspended" ? "suspended" : "active";
          }
          if (importEditPhoneInput) {
            importEditPhoneInput.value = row.phone || "";
          }
          if (importEditOrganisationInput) {
            importEditOrganisationInput.value = displayInputValue(row.organisation || "");
          }
          renderImportEditGroupOptions(row.groups || []);
          if (importEditStatusText) {
            importEditStatusText.textContent = "";
          }
        }

        function toImportCount(value) {
          const parsed = Number(value || 0);
          if (!Number.isFinite(parsed) || parsed < 0) {
            return 0;
          }
          return Math.floor(parsed);
        }

        function formatImportLabel(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (!normalized) {
            return "n/a";
          }
          const labels = {
            create_or_update: "Create + update",
            create_only: "Create only",
            active: "Active",
            suspended: "Suspended",
            generate_random: "Generate random",
            from_column_or_generate: "Use column or generate",
            password_change_required: "Password change required",
            password_and_username_personalization_required: "Password + username personalization required",
            queue_on_apply: "Queue on apply",
            none: "Do not queue"
          };
          if (labels[normalized]) {
            return labels[normalized];
          }
          return normalized
            .replace(/_/g, " ")
            .replace(/\b[a-z]/g, (char) => char.toUpperCase());
        }

        function formatImportStatus(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (!normalized) {
            return "Not loaded";
          }
          const labels = {
            completed: "Completed",
            applied: "Applied",
            processing: "Processing",
            pending: "Pending",
            failed: "Failed"
          };
          if (labels[normalized]) {
            return labels[normalized];
          }
          return normalized
            .replace(/_/g, " ")
            .replace(/\b[a-z]/g, (char) => char.toUpperCase());
        }

        function importStatusBadgeTone(value) {
          const normalized = String(value || "").trim().toLowerCase();
          if (normalized === "completed") return "import-status-badge-completed";
          if (normalized === "applied") return "import-status-badge-applied";
          if (normalized === "processing" || normalized === "pending") return "import-status-badge-pending";
          if (normalized === "failed" || normalized === "error") return "import-status-badge-failed";
          return "import-status-badge-neutral";
        }

        function renderImportEmptyState(message) {
          closeImportEditPanel();
          const bodyMessage = message || "No data to display. Please load a batch to begin.";
          importRowsBody.innerHTML =
            "<tr><td colspan='4'>" +
            "<div class='import-empty-state'>" +
            "<div class='import-empty-illustration' aria-hidden='true'>Data</div>" +
            "<div class='import-empty-text'>" +
            "<h4>No data to display</h4>" +
            "<p class='muted'>" +
            escapeClientHtml(bodyMessage) +
            "</p>" +
            "</div>" +
            "</div>" +
            "</td></tr>";
        }

        function clearImportSummary() {
          importRowsCache = [];
          closeImportEditPanel();
          importBatchMeta.textContent = "No batch loaded yet.";
          importStatusBadge.className = "import-status-badge import-status-badge-neutral";
          importStatusBadge.textContent = "Not loaded";
          importTotalRows.textContent = "0";
          importCreatedRows.textContent = "0";
          importUpdatedRows.textContent = "0";
          importProgressFill.style.width = "0%";
          importProgressTrack.setAttribute("aria-valuenow", "0");
          importProgressText.textContent = "0%";
          importDetailMode.textContent = "n/a";
          importDetailDefaultStatus.textContent = "n/a";
          importDetailUsernamePolicy.textContent = "n/a";
          importDetailActivationPolicy.textContent = "n/a";
          importDetailInvitePolicy.textContent = "n/a";
          importDetailMembershipYear.textContent = "n/a";
          importDetailMembershipCategory.textContent = "n/a";
          importDetailStandingDefault.textContent = "n/a";
          importDetailBlockingIssues.textContent = "0";
          importDetailInvites.textContent = "Queued: 0 | Failed: 0";
        }

        function resetImportView(message) {
          importStatus.textContent = message || "";
          clearImportSummary();
          renderImportEmptyState();
          activeImportBatch = null;
          activeImportBatchId = "";
          updateImportButtons();
        }

        function renderImportBatch(batch) {
          activeImportBatch = batch;
          activeImportBatchId = batch.batch_id || "";
          importBatchIdInput.value = activeImportBatchId;
          persistLastImportBatchId(activeImportBatchId);

          const createdAt = batch.created_at ? new Date(batch.created_at).toLocaleString() : "n/a";
          const appliedAt = batch.applied_at ? new Date(batch.applied_at).toLocaleString() : "Not applied";
          importBatchMeta.textContent =
            "Batch " +
            batch.batch_id +
            " | status: " +
            formatImportStatus(batch.status) +
            " | created: " +
            createdAt +
            " | applied: " +
            appliedAt;

          const summary = batch.summary || {};
          const totalRows = toImportCount(summary.total_rows);
          const createdCount = toImportCount(summary.create);
          const updatedCount = toImportCount(summary.update);
          const skippedCount = toImportCount(summary.skip);
          const errorCount = toImportCount(summary.error);
          const blockingIssueCount = toImportCount(batch.blocking_issue_count);
          const invites = batch.invites || {};
          const invitesQueued = toImportCount(invites.queued);
          const invitesFailed = toImportCount(invites.failed);
          const processedRows = createdCount + updatedCount + skippedCount + errorCount;
          const processedBase = totalRows > 0 ? totalRows : processedRows;
          const processedPercent = processedBase > 0 ? Math.round((processedRows / processedBase) * 100) : 0;
          const safePercent = Math.max(0, Math.min(100, processedPercent));

          importStatusBadge.className = "import-status-badge " + importStatusBadgeTone(batch.status);
          importStatusBadge.textContent = formatImportStatus(batch.status);
          importTotalRows.textContent = String(totalRows);
          importCreatedRows.textContent = String(createdCount);
          importUpdatedRows.textContent = String(updatedCount);
          importProgressFill.style.width = safePercent + "%";
          importProgressTrack.setAttribute("aria-valuenow", String(safePercent));
          importProgressText.textContent =
            safePercent + "% (" + processedRows + "/" + (processedBase || 0) + " rows)";
          importDetailMode.textContent = formatImportLabel(batch.mode);
          importDetailDefaultStatus.textContent = formatImportLabel(batch.default_status);
          importDetailUsernamePolicy.textContent = formatImportLabel(batch.username_policy);
          importDetailActivationPolicy.textContent = formatImportLabel(batch.activation_policy);
          importDetailInvitePolicy.textContent = formatImportLabel(batch.invite_policy);
          importDetailMembershipYear.textContent = batch.membership_cycle_year ? String(batch.membership_cycle_year) : "n/a";
          importDetailMembershipCategory.textContent = batch.membership_category_default || "Active Member";
          importDetailStandingDefault.textContent = formatImportLabel(batch.standing_default || "pending_review");
          importDetailBlockingIssues.textContent = String(blockingIssueCount);
          importDetailInvites.textContent = "Queued: " + invitesQueued + " | Failed: " + invitesFailed;

          updateImportButtons();
        }

        async function loadImportRows(batchId) {
          let cursor = 0;
          const collected = [];
          for (let page = 0; page < 20; page += 1) {
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/member-imports/" +
                encodeURIComponent(batchId) +
                "/rows?cursor=" +
                cursor +
                "&limit=100",
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );

            const json = await response.json();
            if (!response.ok) {
              throw new Error(json.message || "Unable to load import rows.");
            }

            const items = Array.isArray(json.items) ? json.items : [];
            collected.push(...items);
            if (!json.next_cursor || items.length === 0) {
              break;
            }
            cursor = Number(json.next_cursor);
            if (!Number.isInteger(cursor) || cursor < 0) {
              break;
            }
          }

          renderImportRows(collected);
        }

        async function loadImportBatch(requestedBatchId) {
          const batchId = String(requestedBatchId || selectedImportBatchId() || "").trim();
          if (!authToken) {
            resetImportView("Sign in to run imports.");
            return;
          }
          if (!batchId) {
            importStatus.textContent = "Enter a batch id or run dry-run first.";
            clearImportSummary();
            renderImportEmptyState();
            activeImportBatch = null;
            activeImportBatchId = "";
            updateImportButtons();
            return;
          }

          importStatus.textContent = "Loading batch " + batchId + "...";
          closeImportEditPanel();
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/member-imports/" + encodeURIComponent(batchId), {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              if (response.status === 404) {
                clearPersistedImportBatchId(batchId);
              }
              importStatus.textContent = json.message || "Unable to load batch.";
              activeImportBatch = null;
              activeImportBatchId = batchId;
              clearImportSummary();
              importRowsBody.innerHTML = "<tr><td colspan='4' class='muted'>Unable to load membership preview.</td></tr>";
              updateImportButtons();
              return;
            }

            renderImportBatch(json);
            await loadImportRows(batchId);
            if (json.status === "applied") {
              importStatus.textContent = "Batch already applied. You can still download the report.";
            } else {
              importStatus.textContent = json.has_blocking_issues
                ? "Blocking issues found. Fix source data before applying."
                : "Batch loaded. Ready to apply.";
            }
          } catch {
            importStatus.textContent = "Unable to reach API to load batch.";
            activeImportBatch = null;
            clearImportSummary();
            importRowsBody.innerHTML = "<tr><td colspan='4' class='muted'>Unable to load membership preview.</td></tr>";
            updateImportButtons();
          }
        }

        async function fetchLatestImportBatchId() {
          if (!authToken) {
            return "";
          }
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/member-imports/latest", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (clearAdminAuthOnUnauthorized(response)) {
              return "";
            }
            if (!response.ok || !json.item || !json.item.batch_id) {
              return "";
            }
            return String(json.item.batch_id || "").trim();
          } catch {
            return "";
          }
        }

        async function restoreImportBatchContext() {
          if (!authToken || importRestoreRequested || activeImportBatch) {
            return;
          }
          const typedBatchId = String(importBatchIdInput.value || "").trim();
          if (typedBatchId) {
            return;
          }
          importRestoreRequested = true;
          let targetBatchId = readPersistedImportBatchId();
          if (!targetBatchId) {
            targetBatchId = await fetchLatestImportBatchId();
          }
          if (!targetBatchId) {
            importRestoreRequested = false;
            return;
          }
          try {
            await loadImportBatch(targetBatchId);
          } finally {
            importRestoreRequested = false;
          }
        }

        function formatEventStatus(value) {
          if (value === "draft") return "Draft";
          if (value === "pending_approval") return "Pending approval";
          if (value === "published") return "Published";
          if (value === "postponed") return "Postponed";
          if (value === "cancelled") return "Cancelled";
          return value || "Unknown";
        }

        function escapeClientHtml(value) {
          return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }

        function normalizeDisplayText(value) {
          const text = String(value || "").trim();
          if (!text) {
            return "";
          }
          const longDashPrefix = String.fromCharCode(195, 162, 226, 8218, 172, 226, 8364);
          const shortPrefix = String.fromCharCode(226, 8364);
          return text
            .replaceAll(longDashPrefix + String.fromCharCode(156), "-")
            .replaceAll(longDashPrefix + String.fromCharCode(157), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8220), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8221), "-")
            .replaceAll(shortPrefix + String.fromCharCode(8482), "'")
            .replaceAll(shortPrefix + String.fromCharCode(732), "'")
            .replaceAll(shortPrefix + String.fromCharCode(339), '"')
            .replaceAll(shortPrefix + String.fromCharCode(157), '"')
            .replaceAll(shortPrefix + String.fromCharCode(166), "...")
            .replace(/\\s+/g, " ")
            .trim();
        }

        function isMissingDisplayText(value) {
          const normalized = normalizeDisplayText(value);
          return !normalized || ["-", "--", "n/a", "na", "null", "undefined"].includes(normalized.toLowerCase());
        }

        function displayTextHtml(value, missingHtml = "<span class='muted'>&mdash;</span>") {
          const normalized = normalizeDisplayText(value);
          return isMissingDisplayText(normalized) ? missingHtml : escapeClientHtml(normalized);
        }

        function displayInputValue(value) {
          return isMissingDisplayText(value) ? "" : normalizeDisplayText(value);
        }

        function canUseAdminActions() {
          return authRole === "admin" || authRole === "chief_admin";
        }

        function canEditEventInUi(eventItem) {
          if (eventItem && eventItem.canEdit !== undefined) {
            return Boolean(eventItem.canEdit);
          }
          if (authRole === "admin" || authRole === "chief_admin") {
            return true;
          }
          if (authRole === "event_editor" || authRole === "member") {
            return true;
          }
          return false;
        }

        function canDeleteEventInUi(eventItem) {
          if (eventItem && eventItem.canDelete !== undefined) {
            return Boolean(eventItem.canDelete);
          }
          if (authRole === "admin" || authRole === "chief_admin") {
            return true;
          }
          if (authRole === "event_editor" || authRole === "member") {
            return true;
          }
          return false;
        }

        function canPlanEventInUi(eventItem) {
          if (eventItem && eventItem.canManagePlanning !== undefined) {
            return Boolean(eventItem.canManagePlanning);
          }
          return canEditEventInUi(eventItem);
        }

        function canAssignEditorsInUi(eventItem) {
          if (eventItem && eventItem.canAssignEditors !== undefined) {
            return Boolean(eventItem.canAssignEditors);
          }
          return canUseAdminActions();
        }

        function classifyEventView(eventItem) {
          if (eventItem.status === "draft") {
            return "drafts";
          }
          const now = new Date();
          const start = new Date(eventItem.startAt);
          if (Number.isNaN(start.getTime())) {
            return "all";
          }
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          if (start >= todayStart && start < tomorrowStart) {
            return "today";
          }
          if (start < todayStart) {
            return "past";
          }
          return "upcoming";
        }

        function eventMatchesView(eventItem, view) {
          const normalizedView = String(view || "all").trim();
          if (!normalizedView || normalizedView === "all") {
            return true;
          }
          return classifyEventView(eventItem) === normalizedView;
        }

        function computeViewCounts(items) {
          const counts = { all: 0, upcoming: 0, today: 0, past: 0, drafts: 0 };
          for (const eventItem of items) {
            counts.all += 1;
            const bucket = classifyEventView(eventItem);
            if (counts[bucket] !== undefined) {
              counts[bucket] += 1;
            }
          }
          return counts;
        }

        function updateViewLabels(counts) {
          const labelByValue = {
            all: "All",
            upcoming: "Upcoming",
            today: "Today",
            past: "Past",
            drafts: "Drafts"
          };
          Array.from(eventViewInput.options || []).forEach((option) => {
            const key = String(option.value || "all");
            const label = labelByValue[key] || option.textContent || key;
            const count = counts[key] ?? 0;
            option.textContent = label + " (" + count + ")";
          });
        }

        function updateReminderBadge(items) {
          const pending = items.filter(
            (eventItem) => eventItem.status === "published" && eventItem.registrationClosingSoon
          ).length;
          remindersBadge.textContent = String(pending);
          remindersBadge.hidden = pending === 0;
        }

        function updateEventBulkBar() {
          if (!eventBulkBar || !eventBulkCount) {
            return;
          }
          const count = selectedEventIds.size;
          eventBulkCount.textContent = String(count) + " selected";
          eventBulkBar.hidden = count === 0 || !canUseAdminActions();
          if (bulkDeleteEventsButton) {
            bulkDeleteEventsButton.disabled = count === 0;
          }
          if (bulkExtendEventsButton) {
            bulkExtendEventsButton.disabled = count === 0;
          }
        }

        function buildDeadlineSummary(eventItem) {
          if (!eventItem.effectiveRegistrationClosesAt) {
            return { label: "No deadline", fill: 12, stateClass: "deadline-open" };
          }
          if (eventItem.registrationState === "closed") {
            return { label: "Closed", fill: 100, stateClass: "deadline-closed" };
          }
          if (eventItem.registrationState === "closing_soon") {
            return {
              label: "Closing in " + Number(eventItem.minutesToClose || 0) + " min",
              fill: 84,
              stateClass: "deadline-soon"
            };
          }
          return {
            label: "Closes in " + Number(eventItem.minutesToClose || 0) + " min",
            fill: 36,
            stateClass: "deadline-open"
          };
        }

        async function applyEventAction(action, eventId) {
          const currentEvent = currentEvents.find((item) => String(item.id) === String(eventId));
          if (!currentEvent || !action) {
            return;
          }

          if (action === "edit") {
            beginEventEdit(currentEvent);
            return;
          }

          if (action === "revisions") {
            if (!authToken) {
              eventStatus.textContent = "Sign in to view revisions.";
              return;
            }
            eventStatus.textContent = "Loading revisions...";
            try {
              const response = await fetch(
                "${config.apiBaseUrl}/api/admin/events/" + eventId + "/revisions",
                { headers: { Authorization: "Bearer " + authToken } }
              );
              const json = await response.json();
              if (!response.ok) {
                eventStatus.textContent = json.message || "Unable to load revisions.";
                return;
              }
              const items = Array.isArray(json.items) ? json.items : [];
              if (items.length === 0) {
                eventStatus.textContent = "No revisions recorded yet.";
                return;
              }
              const summary = items
                .slice(0, 5)
                .map(
                  (item) =>
                    String(item.id) +
                    " (" +
                    String(item.revisionType) +
                    ") " +
                    new Date(item.createdAt).toLocaleString()
                )
                .join("\\n");
              const revisionIdInput = prompt("Enter revision id to rollback. Recent revisions:\\n" + summary);
              if (revisionIdInput === null) {
                eventStatus.textContent = "Rollback cancelled.";
                return;
              }
              const revisionId = Number(revisionIdInput);
              if (!Number.isInteger(revisionId)) {
                eventStatus.textContent = "Revision id must be a whole number.";
                return;
              }
              if (!confirm("Rollback event to revision " + revisionId + "?")) {
                eventStatus.textContent = "Rollback cancelled.";
                return;
              }
              eventStatus.textContent = "Rolling back event...";
              const rollbackResponse = await fetch(
                "${config.apiBaseUrl}/api/admin/events/" + eventId + "/revisions/" + revisionId + "/rollback",
                { method: "POST", headers: { Authorization: "Bearer " + authToken } }
              );
              const rollbackJson = await rollbackResponse.json();
              if (!rollbackResponse.ok) {
                eventStatus.textContent = rollbackJson.message || "Unable to rollback event.";
                return;
              }
              eventStatus.textContent = "Event rolled back to revision " + revisionId + ".";
              await loadEvents();
            } catch {
              eventStatus.textContent = "Unable to reach API to load revisions.";
            }
            return;
          }

          if (action === "delete") {
            if (!confirm("Delete this event? This cannot be undone.")) {
              return;
            }
            eventStatus.textContent = "Deleting event...";
            try {
              const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + authToken }
              });
              const json = await response.json();
              if (!response.ok) {
                eventStatus.textContent = json.message || "Unable to delete event.";
                return;
              }
              eventStatus.textContent = "Event deleted.";
              selectedEventIds.delete(String(eventId));
              await loadEvents();
            } catch {
              eventStatus.textContent = "Unable to reach API to delete event.";
            }
            return;
          }

          if (action === "extend") {
            const userIdInput = prompt("Enter user id to extend deadline for");
            if (userIdInput === null) {
              return;
            }
            const userId = Number(userIdInput);
            if (!Number.isInteger(userId)) {
              eventStatus.textContent = "User id must be a whole number.";
              return;
            }
            const suggestedClose = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const closesAtInput = prompt("Enter override close time (ISO 8601)", suggestedClose);
            if (closesAtInput === null) {
              return;
            }
            const closesAt = String(closesAtInput || "").trim();
            if (!closesAt) {
              eventStatus.textContent = "Close time is required.";
              return;
            }
            const reasonInput = prompt("Reason (optional)", "VIP exception");
            const reason = reasonInput === null ? "" : String(reasonInput).trim();

            eventStatus.textContent = "Saving registration override...";
            try {
              const response = await fetch(
                "${config.apiBaseUrl}/api/events/" + eventId + "/registration-overrides",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken
                  },
                  body: JSON.stringify({ userId, closesAt, reason })
                }
              );
              const json = await response.json();
              if (!response.ok) {
                eventStatus.textContent = json.message || "Unable to save registration override.";
                return;
              }
              eventStatus.textContent = "Registration override saved for user " + userId + ".";
              await loadEvents();
            } catch {
              eventStatus.textContent = "Unable to reach API to save registration override.";
            }
            return;
          }

          if (action === "planning") {
            eventStatus.textContent = "Loading planning summary...";
            try {
              const summaryResponse = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/planning", {
                headers: { Authorization: "Bearer " + authToken }
              });
              const summaryJson = await summaryResponse.json();
              if (!summaryResponse.ok) {
                eventStatus.textContent = summaryJson.message || "Unable to load meeting planning summary.";
                return;
              }

              const pendingPreview = (summaryJson.participants || [])
                .filter((item) => item.responseStatus === "pending")
                .slice(0, 5)
                .map((item) => item.fullName || item.username || item.email || ("Member " + item.userId));
              const summaryText =
                "Invited: " +
                Number(summaryJson.invitedCount || 0) +
                " | Confirmed: " +
                Number(summaryJson.confirmedCount || 0) +
                " | Waitlisted: " +
                Number(summaryJson.waitlistedCount || 0) +
                " | Pending: " +
                Number(summaryJson.pendingCount || 0) +
                (pendingPreview.length ? "\\nPending sample: " + pendingPreview.join(", ") : "");

              const shouldSend = confirm(
                "Meeting planning snapshot:\\n" +
                  summaryText +
                  "\\n\\nPress OK to send an update message, or Cancel to close."
              );
              if (!shouldSend) {
                eventStatus.textContent = "Planning snapshot loaded.";
                return;
              }

              const subjectInput = prompt("Planning update subject", "Meeting update");
              if (subjectInput === null) {
                eventStatus.textContent = "Planning update cancelled.";
                return;
              }
              const subject = String(subjectInput || "").trim();
              if (!subject) {
                eventStatus.textContent = "Subject is required.";
                return;
              }

              const bodyInput = prompt("Planning update message", "Please confirm your participation.");
              if (bodyInput === null) {
                eventStatus.textContent = "Planning update cancelled.";
                return;
              }
              const body = String(bodyInput || "").trim();
              if (!body) {
                eventStatus.textContent = "Message body is required.";
                return;
              }

              const scopeInput = prompt(
                "Audience scope (all_invited | confirmed_only | waitlisted_only | pending_only)",
                "pending_only"
              );
              if (scopeInput === null) {
                eventStatus.textContent = "Planning update cancelled.";
                return;
              }
              const audienceScope = String(scopeInput || "").trim().toLowerCase();
              const allowedScopes = new Set(["all_invited", "confirmed_only", "waitlisted_only", "pending_only"]);
              if (!allowedScopes.has(audienceScope)) {
                eventStatus.textContent = "Audience scope is invalid.";
                return;
              }

              eventStatus.textContent = "Sending planning update...";
              const sendResponse = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/planning-message", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ subject, body, audienceScope })
              });
              const sendJson = await sendResponse.json();
              if (!sendResponse.ok) {
                eventStatus.textContent = sendJson.message || "Unable to send planning update.";
                return;
              }
              eventStatus.textContent =
                "Planning update sent to " +
                Number(sendJson.recipientCount || 0) +
                " invitee(s). Email sent: " +
                Number(sendJson.emailSent || 0) +
                ", failed: " +
                Number(sendJson.emailFailed || 0) +
                ".";
            } catch {
              eventStatus.textContent = "Unable to reach API for meeting planning tools.";
            }
            return;
          }

          if (action === "assign-editor") {
            const preview = (memberDirectorySource || [])
              .slice(0, 15)
              .map((member) => {
                const name = member.fullName || member.username || "Member";
                return String(member.id) + ": " + name;
              })
              .join("\\n");
            const memberIdInput = prompt(
              "Enter member user id to assign as event editor." +
                (preview ? "\\n\\nRecent members:\\n" + preview : "")
            );
            if (memberIdInput === null) {
              return;
            }
            const userId = Number(memberIdInput);
            if (!Number.isInteger(userId)) {
              eventStatus.textContent = "Member user id must be a whole number.";
              return;
            }

            eventStatus.textContent = "Assigning event editor...";
            try {
              const response = await fetch("${config.apiBaseUrl}/api/event-editor-grants", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ eventId: Number(eventId), userId })
              });
              const json = await response.json();
              if (!response.ok) {
                eventStatus.textContent = json.message || "Unable to assign event editor.";
                return;
              }
              eventStatus.textContent = json.alreadyGranted ? "Event editor was already assigned." : "Event editor assigned.";
              await loadEvents();
            } catch {
              eventStatus.textContent = "Unable to reach API to assign event editor.";
            }
            return;
          }

          if (action === "revoke-editor") {
            const preview = (memberDirectorySource || [])
              .slice(0, 15)
              .map((member) => {
                const name = member.fullName || member.username || "Member";
                return String(member.id) + ": " + name;
              })
              .join("\\n");
            const memberIdInput = prompt(
              "Enter member user id to revoke event editor access." +
                (preview ? "\\n\\nRecent members:\\n" + preview : "")
            );
            if (memberIdInput === null) {
              return;
            }
            const userId = Number(memberIdInput);
            if (!Number.isInteger(userId)) {
              eventStatus.textContent = "Member user id must be a whole number.";
              return;
            }

            eventStatus.textContent = "Revoking event editor...";
            try {
              const response = await fetch("${config.apiBaseUrl}/api/event-editor-grants", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ eventId: Number(eventId), userId })
              });
              const json = await response.json();
              if (!response.ok) {
                eventStatus.textContent = json.message || "Unable to revoke event editor.";
                return;
              }
              eventStatus.textContent = json.revoked
                ? "Event editor access revoked."
                : "No matching event editor grant was found.";
              await loadEvents();
            } catch {
              eventStatus.textContent = "Unable to reach API to revoke event editor.";
            }
            return;
          }

          eventStatus.textContent = "Publishing...";
          try {
            const endpointAction = action === "publish" ? "submit" : action;
            const response = await fetch("${config.apiBaseUrl}/api/events/" + eventId + "/" + endpointAction, {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              eventStatus.textContent = json.message || "Unable to update meeting.";
              return;
            }
            eventStatus.textContent = "Meeting status is " + json.status + ".";
            await loadEvents();
          } catch {
            eventStatus.textContent = "Unable to reach API to update event.";
          }
        }

        function renderEvents(items) {
          const allItems = Array.isArray(items) ? items : [];
          const validIds = new Set(allItems.map((item) => String(item.id)));
          selectedEventIds = new Set(Array.from(selectedEventIds).filter((id) => validIds.has(String(id))));
          const counts = computeViewCounts(allItems);
          updateViewLabels(counts);
          updateReminderBadge(allItems);
          const selectedView = String(eventViewInput.value || "all").trim() || "all";
          const filtered = allItems.filter((eventItem) => eventMatchesView(eventItem, selectedView));

          if (!filtered.length) {
            const total = allItems.length;
            const hint =
              total > 0
                ? "There are " + String(total) + " event(s) in other views. Change View Events to All to see the full list."
                : "Use Create Meeting to schedule your next session.";
            eventCardList.innerHTML =
              "<div class='event-empty-state'>" +
              "<h3>No events in this view</h3>" +
              "<p class='muted'>" +
              escapeClientHtml(hint) +
              "</p>" +
              "</div>";
            selectedEventIds = new Set();
            updateEventBulkBar();
            return;
          }

          eventCardList.innerHTML = filtered
            .map((eventItem) => {
              const canEdit = canEditEventInUi(eventItem);
              const canDelete = canDeleteEventInUi(eventItem);
              const canAssignEditors = canAssignEditorsInUi(eventItem);
              const canReview = canUseAdminActions();
              const canPlan = canPlanEventInUi(eventItem);
              const selected = selectedEventIds.has(String(eventItem.id));
              const deadline = buildDeadlineSummary(eventItem);
              const audienceLabel = escapeClientHtml(eventItem.audienceLabel || "All Active IWFSA Members");

              return (
                "<article class='admin-event-card'>" +
                "<div class='admin-event-card-head'>" +
                "<label class='event-select'>" +
                "<input type='checkbox' data-select-event='" +
                eventItem.id +
                "'" +
                (selected ? " checked" : "") +
                " />" +
                "</label>" +
                "<div class='badge-row'>" +
                "<span class='status-pill status-" +
                escapeClientHtml(String(eventItem.status || "unknown")) +
                "'>" +
                escapeClientHtml(formatEventStatus(eventItem.status)) +
                "</span>" +
                "<span class='badge'>" +
                audienceLabel +
                "</span>" +
                "</div>" +
                "</div>" +
                "<h3>" +
                escapeClientHtml(eventItem.title || "Untitled event") +
                "</h3>" +
                "<p class='muted'>" +
                escapeClientHtml(formatEventDateTime(eventItem.startAt)) +
                "</p>" +
                "<div class='deadline-mini'>" +
                "<span class='muted'>" +
                escapeClientHtml(deadline.label) +
                "</span>" +
                "<span class='deadline-track'><span class='deadline-fill " +
                deadline.stateClass +
                "' style='width:" +
                deadline.fill +
                "%'></span></span>" +
                "</div>" +
                "<div class='event-action-row'>" +
                (canEdit && eventItem.status === "draft"
                  ? "<button data-action='publish' data-id='" + eventItem.id + "'>Publish</button>"
                  : "") +
                (canEdit
                  ? "<button data-action='edit' data-id='" + eventItem.id + "'>Edit</button>"
                  : "") +
                (canAssignEditors
                  ? "<button data-action='assign-editor' data-id='" + eventItem.id + "'>Assign Editor</button>"
                  : "") +
                (canAssignEditors
                  ? "<button data-action='revoke-editor' data-id='" + eventItem.id + "'>Revoke Editor</button>"
                  : "") +
                (canPlan
                  ? "<button data-action='planning' data-id='" + eventItem.id + "'>Planning</button>"
                  : "") +
                (canReview
                  ? "<button data-action='revisions' data-id='" + eventItem.id + "'>Revisions</button>"
                  : "") +
                (canReview
                  ? "<button class='critical-action' data-action='extend' data-id='" +
                    eventItem.id +
                    "'>Extend Deadline</button>"
                  : "") +
                (canDelete
                  ? "<button class='danger-link ghost-link' data-action='delete' data-id='" +
                    eventItem.id +
                    "'>Delete</button>"
                  : "") +
                "</div>" +
                "</article>"
              );
            })
            .join("");

          eventCardList.querySelectorAll("input[data-select-event]").forEach((input) => {
            input.addEventListener("change", () => {
              const eventId = String(input.getAttribute("data-select-event") || "");
              if (!eventId) {
                return;
              }
              if (input.checked) {
                selectedEventIds.add(eventId);
              } else {
                selectedEventIds.delete(eventId);
              }
              updateEventBulkBar();
            });
          });

          eventCardList.querySelectorAll("button[data-action]").forEach((button) => {
            button.addEventListener("click", async () => {
              const action = button.getAttribute("data-action");
              const eventId = button.getAttribute("data-id");
              if (!action || !eventId) {
                return;
              }
              await applyEventAction(action, eventId);
            });
          });

          updateEventBulkBar();
        }

        async function loadEvents() {
          if (!authToken) {
            eventCardList.innerHTML = "<p class='muted'>Sign in required.</p>";
            selectedEventIds = new Set();
            updateReminderBadge([]);
            updateEventBulkBar();
            return;
          }
          eventStatus.textContent = "Loading events...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/events", {
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              eventStatus.textContent = json.message || "Unable to load events.";
              return;
            }
            eventStatus.textContent = "";
            currentEvents = Array.isArray(json.items) ? json.items : [];
            renderEvents(currentEvents);
          } catch {
            eventStatus.textContent = "Unable to reach the Event Hub service. Refresh the page and try again.";
          }
        }

        refreshButton.addEventListener("click", () => {
          loadMembers();
        });

        memberSearch.addEventListener("input", () => {
          applyMemberFilter();
        });

        memberSearch.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && memberSearchDropdown) {
            memberSearchDropdown.hidden = true;
          }
        });

        document.addEventListener("click", (event) => {
          if (!memberSearchDropdown || memberSearchDropdown.hidden) return;
          const wrap = document.getElementById("member-search-wrap");
          if (wrap && !wrap.contains(event.target)) {
            memberSearchDropdown.hidden = true;
          }
        });

        function waitForGroupAssignAnswer() {
          return new Promise((resolve) => {
            function cleanup() {
              groupAssignYesButton.onclick = null;
              groupAssignSkipButton.onclick = null;
              groupAssignCancelButton.onclick = null;
            }
            groupAssignYesButton.onclick = () => { cleanup(); resolve("yes"); };
            groupAssignSkipButton.onclick = () => { cleanup(); resolve("skip"); };
            groupAssignCancelButton.onclick = () => { cleanup(); resolve("cancel"); };
          });
        }

        function closeGroupAssignDialog() {
          groupAssignSingleMemberId = null;
          if (groupAssignDialog) groupAssignDialog.hidden = true;
          if (groupAssignPickerPanel) groupAssignPickerPanel.hidden = false;
          if (groupAssignConfirmPanel) groupAssignConfirmPanel.hidden = true;
          if (groupAssignStatus) groupAssignStatus.textContent = "";
        }

        if (groupAssignAbortButton) {
          groupAssignAbortButton.addEventListener("click", closeGroupAssignDialog);
        }

        if (groupAssignDialog) {
          const backdrop = groupAssignDialog.querySelector(".group-assign-backdrop");
          if (backdrop) {
            backdrop.addEventListener("click", closeGroupAssignDialog);
          }
        }

        if (groupAssignContinueButton) {
          groupAssignContinueButton.addEventListener("click", async () => {
            const selectedGroup = String(groupAssignSelect?.value || "").trim();
            if (!selectedGroup) {
              if (groupAssignStatus) groupAssignStatus.textContent = "Choose a group before continuing.";
              return;
            }
            const ids = groupAssignSingleMemberId ? [groupAssignSingleMemberId] : selectedIds();
            if (ids.length === 0) {
              closeGroupAssignDialog();
              return;
            }
            if (groupAssignPickerPanel) groupAssignPickerPanel.hidden = true;
            if (groupAssignConfirmPanel) groupAssignConfirmPanel.hidden = false;
            if (groupAssignStatus) groupAssignStatus.textContent = "";

            let assigned = 0;
            let skipped = 0;
            let errorCount = 0;

            for (const memberId of ids) {
              const member = memberDirectorySource.find((m) => Number(m.id || m.userId || 0) === memberId);
              if (!member) continue;
              const name = String(member.fullName || member.username || "Member");
              const currentGroups = normalizeGroupList(member.groups || []);
              const alreadyInGroup = currentGroups.some((g) => g.toLowerCase() === selectedGroup.toLowerCase());

              if (alreadyInGroup) {
                skipped++;
                continue;
              }

              if (groupAssignQuestion) {
                groupAssignQuestion.textContent = "Assign " + name + " to " + selectedGroup + "?";
              }
              if (groupAssignDetail) {
                groupAssignDetail.textContent = currentGroups.length
                  ? "Current groups: " + currentGroups.join(", ")
                  : "This member has no group assignments yet.";
              }

              const answer = await waitForGroupAssignAnswer();
              if (answer === "cancel") break;
              if (answer === "skip") { skipped++; continue; }

              try {
                const updatedGroups = Array.from(new Set([...currentGroups, selectedGroup]));
                const response = await fetch("${config.apiBaseUrl}/api/members/" + String(memberId), {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", Authorization: "Bearer " + authToken },
                  body: JSON.stringify({ groups: updatedGroups })
                });
                const json = await response.json();
                if (response.ok) {
                  upsertMemberDirectoryItem(json.item || {});
                  assigned++;
                } else {
                  errorCount++;
                }
              } catch {
                errorCount++;
              }
            }

            closeGroupAssignDialog();
            applyMemberFilter();
            const parts = [];
            if (assigned > 0) parts.push(assigned + " member(s) assigned to " + selectedGroup + ".");
            if (skipped > 0) parts.push(skipped + " skipped (already assigned or user chose Skip).");
            if (errorCount > 0) parts.push(errorCount + " failed — check the API.");
            if (parts.length && groupAssignStatus) {
              groupAssignStatus.textContent = parts.join(" ");
              groupAssignDialog.hidden = false;
              if (groupAssignPickerPanel) groupAssignPickerPanel.hidden = true;
              if (groupAssignConfirmPanel) groupAssignConfirmPanel.hidden = true;
            }
          });
        }

        if (memberDetailAddGroupButton) {
          memberDetailAddGroupButton.addEventListener("click", () => {
            if (!activeMemberDetailId || !authToken) return;
            groupAssignSingleMemberId = activeMemberDetailId;
            const availableGroups = listConfiguredAudienceGroups();
            if (!availableGroups.length) return;
            if (groupAssignSelect) {
              groupAssignSelect.innerHTML =
                "<option value='' disabled selected>— Select a group —</option>" +
                availableGroups
                  .map((g) => "<option value='" + escapeClientHtml(g) + "'>" + escapeClientHtml(g) + "</option>")
                  .join("");
            }
            if (groupAssignPreview) groupAssignPreview.hidden = true;
            const member = memberDirectorySource.find(
              (m) => Number(m.id || m.userId || 0) === Number(activeMemberDetailId)
            );
            const memberName = member ? String(member.fullName || member.username || "this member") : "this member";
            if (groupAssignSubtitle) {
              groupAssignSubtitle.textContent = "Assigning a group to: " + memberName;
            }
            if (groupAssignStatus) groupAssignStatus.textContent = "";
            if (groupAssignPickerPanel) groupAssignPickerPanel.hidden = false;
            if (groupAssignConfirmPanel) groupAssignConfirmPanel.hidden = true;
            if (groupAssignDialog) groupAssignDialog.hidden = false;
          });
        }

        if (groupAssignSelect) {
          groupAssignSelect.addEventListener("change", () => {
            const val = String(groupAssignSelect.value || "").trim();
            if (groupAssignPreview) {
              if (val) {
                groupAssignPreview.textContent = "Will assign to: " + val;
                groupAssignPreview.hidden = false;
              } else {
                groupAssignPreview.hidden = true;
              }
            }
          });
        }

        [memberStatusFilter, memberRoleFilter, memberGroupFilter, memberSortInput].forEach((control) => {
          if (!control) return;
          control.addEventListener("change", () => {
            applyMemberFilter();
          });
        });

        if (memberFilterResetButton) {
          memberFilterResetButton.addEventListener("click", () => {
            memberSearch.value = "";
            if (memberStatusFilter) memberStatusFilter.value = "";
            if (memberRoleFilter) memberRoleFilter.value = "";
            if (memberGroupFilter) memberGroupFilter.value = "";
            if (memberSortInput) memberSortInput.value = "name";
            applyMemberFilter();
          });
        }

        if (memberBasketClear) {
          memberBasketClear.addEventListener("click", () => {
            basketMembers.clear();
            renderMemberBasket();
            syncBasketToCheckboxes();
            updateQueueButton();
          });
        }

        memberAddForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!authToken) {
            memberAddStatus.textContent = "Sign in to add members.";
            return;
          }

          const fullName = sanitizeName(memberAddNameInput.value);
          const email = sanitizeEmail(memberAddEmailInput.value);
          const company = String(memberAddOrgInput ? memberAddOrgInput.value || "" : "").trim();
          const groups = selectedMemberGroups();
          if (groups.length === 0) {
            groups.push("Common Member");
          }

          if (!fullName || !email) {
            memberAddStatus.textContent = "Full name and email are required.";
            return;
          }

          memberAddStatus.textContent = "Adding member...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/members", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ fullName, email, company, groups })
            });
            const json = await response.json();
            if (!response.ok) {
              memberAddStatus.textContent = json.message || "Unable to add member.";
              return;
            }
            if (json.inviteEmailSent === true) {
              memberAddStatus.textContent = "Member added and establishment email sent.";
            } else if (Number(json.inviteQueued || 0) > 0) {
              memberAddStatus.textContent = "Member added and invite queued.";
            } else {
              memberAddStatus.textContent = "Member added.";
            }
            memberAddForm.reset();
            await loadMembers();
          } catch {
            memberAddStatus.textContent = "Unable to reach API to add member.";
          }
        });

        importBatchIdInput.addEventListener("input", () => {
          updateImportButtons();
        });

        refreshImportBatchButton.addEventListener("click", async () => {
          await loadImportBatch();
        });

        if (importEditCloseButton) {
          importEditCloseButton.addEventListener("click", () => {
            closeImportEditPanel();
          });
        }

        if (importEditCancelButton) {
          importEditCancelButton.addEventListener("click", () => {
            closeImportEditPanel();
          });
        }

        if (importEditForm) {
          importEditForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!authToken) {
              if (importEditStatusText) {
                importEditStatusText.textContent = "Sign in to edit imported records.";
              }
              return;
            }
            if (!activeImportBatchId || !activeImportRowId) {
              if (importEditStatusText) {
                importEditStatusText.textContent = "Select an imported record before saving.";
              }
              return;
            }
            if (activeImportBatch && activeImportBatch.status === "applied") {
              if (importEditStatusText) {
                importEditStatusText.textContent = "Applied batches are read-only.";
              }
              return;
            }

            const payload = {
              email: String(importEditEmailInput.value || "").trim(),
              fullName: String(importEditFullNameInput.value || "").trim(),
              status: String(importEditStatusInput.value || "active").trim(),
              phone: String(importEditPhoneInput.value || "").trim(),
              organisation: String(importEditOrganisationInput.value || "").trim(),
              groups: selectedImportEditGroups()
            };

            if (!payload.email || !payload.fullName) {
              if (importEditStatusText) {
                importEditStatusText.textContent = "Email and full name are required.";
              }
              return;
            }

            if (importEditSaveButton) {
              importEditSaveButton.disabled = true;
            }
            if (importEditStatusText) {
              importEditStatusText.textContent = "Saving imported record...";
            }

            try {
              const batchId = String(activeImportBatchId || selectedImportBatchId() || "").trim();
              if (!batchId || !activeImportRowId) {
                if (importEditStatusText) {
                  importEditStatusText.textContent = "Load a batch before editing imported records.";
                }
                return;
              }
              const response = await fetch(
                "${config.apiBaseUrl}/api/admin/member-imports/" +
                  encodeURIComponent(batchId) +
                  "/rows/" +
                  encodeURIComponent(activeImportRowId),
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken
                  },
                  body: JSON.stringify(payload)
                }
              );
              const json = await response.json();
              if (!response.ok) {
                if (importEditStatusText) {
                  importEditStatusText.textContent = json.message || "Unable to save row changes.";
                }
                return;
              }

              await loadImportBatch(activeImportBatchId);
              const nextRowId = Number(json.item?.id || activeImportRowId);
              openImportEditPanel(nextRowId);
              if (importEditStatusText) {
                importEditStatusText.textContent = "Record updated.";
              }
            } catch {
              if (importEditStatusText) {
                importEditStatusText.textContent = "Unable to reach API to save row changes.";
              }
            } finally {
              if (importEditSaveButton) {
                importEditSaveButton.disabled = false;
              }
            }
          });
        }

        importForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!authToken) {
            importStatus.textContent = "Sign in to run imports.";
            return;
          }

          const file = importFileInput.files && importFileInput.files[0];
          const fallbackBatchId = selectedImportBatchId() || readPersistedImportBatchId();
          const reuseSavedUpload = !file;

          if (importSubmitButton) {
            importSubmitButton.disabled = true;
            importSubmitButton.classList.add("button-loading");
            if (!importSubmitButton.dataset.label) {
              importSubmitButton.dataset.label = importSubmitButton.textContent || "Run dry-run";
            }
            importSubmitButton.setAttribute("aria-busy", "true");
          }

          importStatus.textContent = reuseSavedUpload
            ? "Running dry-run using saved upload..."
            : "Running dry-run validation...";
          clearImportSummary();
          importRowsBody.innerHTML = "<tr><td colspan='4' class='muted'>Dry-run in progress...</td></tr>";
          activeImportBatch = null;
          activeImportBatchId = "";
          updateImportButtons();

          const formData = new FormData();
          if (file) {
            formData.set("file", file, file.name || "members.xlsx");
          } else if (fallbackBatchId) {
            formData.set("reuse_batch_id", fallbackBatchId);
          }
          formData.set("mode", String(importModeInput.value || "create_or_update"));
          formData.set("default_status", String(importDefaultStatusInput.value || "active"));
          formData.set("username_policy", String(importUsernamePolicyInput.value || "generate_random"));
          formData.set(
            "activation_policy",
            String(importActivationPolicyInput.value || DEFAULT_IMPORT_ACTIVATION_POLICY)
          );
          formData.set("invite_policy", String(importInvitePolicyInput.value || "queue_on_apply"));
          formData.set("membership_cycle_year", String(importMembershipCycleYearInput.value || "").trim());
          formData.set(
            "membership_category_default",
            String(importMembershipCategoryDefaultInput.value || "Active Member").trim()
          );
          formData.set("standing_default", String(importStandingDefaultInput.value || "pending_review"));

          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/member-imports/dry-run", {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken },
              body: formData
            });
            const json = await response.json();
            if (!response.ok) {
              const missingHeaders = Array.isArray(json.missingHeaders) ? json.missingHeaders.join(", ") : "";
              importStatus.textContent =
                (json.message || "Unable to process dry-run.") +
                (missingHeaders ? " Missing headers: " + missingHeaders + "." : "");
              renderImportEmptyState("No membership records yet.");
              return;
            }

            const reusedSource = String(json.reused_source_batch_id || "").trim();
            importStatus.textContent =
              "Dry-run completed. Batch " +
              json.batch_id +
              " created with " +
              (json.blocking_issue_count || 0) +
              " blocking issue(s)." +
              (reusedSource ? " Reused upload from " + reusedSource + "." : "");
            await loadImportBatch(json.batch_id);
          } catch {
            importStatus.textContent = "Unable to reach API for dry-run.";
            renderImportEmptyState("No membership records yet.");
          } finally {
            if (importSubmitButton) {
              importSubmitButton.disabled = false;
              importSubmitButton.classList.remove("button-loading");
              importSubmitButton.removeAttribute("aria-busy");
              if (importSubmitButton.dataset.label) {
                importSubmitButton.textContent = importSubmitButton.dataset.label;
              }
            }
          }
        });

        applyImportButton.addEventListener("click", async () => {
          const batchId = selectedImportBatchId();
          if (!batchId) {
            importStatus.textContent = "Load a batch before applying.";
            return;
          }
          if (!authToken) {
            importStatus.textContent = "Sign in to apply imports.";
            return;
          }
          if (!activeImportBatch || activeImportBatch.batch_id !== batchId) {
            importStatus.textContent = "Load the batch first so apply checks can run.";
            return;
          }

          importStatus.textContent = "Applying import batch...";
          applyImportButton.disabled = true;

          try {
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/member-imports/" + encodeURIComponent(batchId) + "/apply",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify({ send_invites: importSendInvitesInput.checked })
              }
            );
            const json = await response.json();
            if (!response.ok) {
              importStatus.textContent = json.message || "Unable to apply import batch.";
              updateImportButtons();
              return;
            }

            const summary = json.summary || {};
            const invites = json.invites || {};
            importStatus.textContent =
              "Import applied. Create: " +
              (summary.create || 0) +
              ", update: " +
              (summary.update || 0) +
              ", skip: " +
              (summary.skip || 0) +
              ", error: " +
              (summary.error || 0) +
              ". Invites queued: " +
              (invites.queued || 0) +
              ". Fee accounts created: " +
              (json.fee_accounts_created || 0) +
              ".";

            await loadImportBatch(batchId);
            await loadMembers();
            await loadMembershipFeesWorkspace({ reloadCycles: true });
          } catch {
            importStatus.textContent = "Unable to reach API to apply batch.";
            updateImportButtons();
          }
        });

        reportImportButton.addEventListener("click", async () => {
          const batchId = selectedImportBatchId();
          if (!batchId) {
            importStatus.textContent = "Load a batch before downloading a report.";
            return;
          }
          if (!authToken) {
            importStatus.textContent = "Sign in to download reports.";
            return;
          }

          importStatus.textContent = "Downloading report...";
          try {
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/member-imports/" + encodeURIComponent(batchId) + "/report.csv",
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );
            if (!response.ok) {
              let message = "Unable to download report.";
              try {
                const json = await response.json();
                message = json.message || message;
              } catch {
                // no-op
              }
              importStatus.textContent = message;
              return;
            }

            const csv = await response.text();
            const disposition = response.headers.get("content-disposition") || "";
            const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
            const filename = match ? match[1] : batchId + "-report.csv";
            const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            importStatus.textContent = "Report downloaded: " + filename;
          } catch {
            importStatus.textContent = "Unable to reach API to download report.";
          }
        });

        selectAll.addEventListener("change", () => {
          const checked = selectAll.checked;
          document.querySelectorAll(".member-checkbox").forEach((checkbox) => {
            checkbox.checked = checked;
          });
          updateQueueButton();
        });

        queueButton.addEventListener("click", async () => {
          const ids = selectedIds();
          if (ids.length === 0) {
            return;
          }
          memberStatus.textContent = "Queuing onboarding emails...";
          memberOutput.textContent = "";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/members/invitations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ userIds: ids })
            });
            const json = await response.json();
            if (!response.ok) {
              memberStatus.textContent = json.message || "Unable to queue invitations.";
              return;
            }

            const queuedCount = json.queued ? json.queued.length : 0;
            const skippedCount = json.skipped ? json.skipped.length : 0;
            memberStatus.textContent =
              "Queued " +
              queuedCount +
              " invitation(s). Skipped " +
              skippedCount +
              " already active.";

            if (json.queued && json.queued.length > 0) {
              memberOutput.textContent = json.queued
                .map((item) =>
                  "Invite queued for " +
                  item.username +
                  " (" +
                  item.email +
                  "), expires " +
                  item.expiresAt
                )
                .join("\\n");
            }
            await loadMembers();
          } catch {
            memberStatus.textContent = "Unable to reach API to queue invitations.";
          }
        });

        if (eventInviteeSearchInput) {
          eventInviteeSearchInput.addEventListener("input", () => {
            renderEventInviteeResults(eventInviteeSearchInput.value);
          });
        }

        if (eventInviteeResults) {
          eventInviteeResults.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-add-event-invitee]");
            if (!button) return;
            const id = Number(button.getAttribute("data-add-event-invitee"));
            const member = memberDirectorySource.find((item) => eventInviteeId(item) === id);
            if (!member) return;
            selectedEventInvitees.set(id, member);
            if (eventInviteeSearchInput) {
              eventInviteeSearchInput.value = "";
              eventInviteeSearchInput.focus();
            }
            renderEventInviteeSelections();
            renderEventInviteeResults();
          });
        }

        if (eventSelectedInvitees) {
          eventSelectedInvitees.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-remove-event-invitee]");
            if (!button) return;
            const id = Number(button.getAttribute("data-remove-event-invitee"));
            selectedEventInvitees.delete(id);
            renderEventInviteeSelections();
            renderEventInviteeResults(eventInviteeSearchInput?.value || "");
          });
        }

        if (eventInviteeClearButton) {
          eventInviteeClearButton.addEventListener("click", () => {
            setEventInviteeSelections([]);
          });
        }

        eventForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!authToken) {
            eventStatus.textContent = "Sign in to create meetings.";
            return;
          }
          const formData = new FormData(eventForm);
          const isEditing = Boolean(activeEventId);
          const validation = isEditing
            ? buildEventUpdatePayload(formData, activeEventSnapshot)
            : buildEventPayload(formData);
          if (!validation.payload) {
            eventStatus.textContent = validation.error || "Complete all required fields.";
            return;
          }
          const attachmentFile = eventAttachmentInput?.files?.[0] || null;
          const publishNow = Boolean(eventPublishNowInput && eventPublishNowInput.checked);
          eventStatus.textContent = isEditing
            ? publishNow ? "Updating meeting and preparing email invitations..." : "Updating meeting..."
            : publishNow ? "Creating meeting and preparing email invitations..." : "Creating meeting...";
          const payload = validation.payload;

          try {
            const response = await fetch(
              isEditing
                ? "${config.apiBaseUrl}/api/events/" + activeEventId
                : "${config.apiBaseUrl}/api/events",
              {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + authToken
                },
                body: JSON.stringify(payload)
              }
            );
            const json = await response.json();
            if (!response.ok) {
              eventStatus.textContent =
                json.message || (isEditing ? "Unable to update meeting." : "Unable to create meeting.");
              return;
            }

            const targetEventId = Number(json.id || activeEventId || 0);
            let attachmentMessage = "";
            let publishMessage = "";
            if (attachmentFile && targetEventId) {
              await uploadAdminEventAttachment(targetEventId, attachmentFile, authToken);
              attachmentMessage = " File attached.";
            }
            if (publishNow && targetEventId) {
              const publishResponse = await fetch("${config.apiBaseUrl}/api/events/" + String(targetEventId) + "/submit", {
                method: "POST",
                headers: { Authorization: "Bearer " + authToken }
              });
              const publishJson = await publishResponse.json();
              if (!publishResponse.ok) {
                eventStatus.textContent =
                  (isEditing ? "Meeting updated" : "Meeting created") +
                  attachmentMessage +
                  ", but invitation emails could not be queued: " +
                  (publishJson.message || "publish failed") +
                  ".";
                await loadEvents();
                return;
              }
              publishMessage = publishJson.alreadyPublished
                ? " Meeting was already published; existing invite notifications were not duplicated."
                : " Invitation emails queued for the selected audience.";
            }

            if (isEditing) {
              resetEventFormState("Meeting updated." + attachmentMessage + publishMessage);
            } else {
              const clashWarning =
                json && json.clashWarning && json.clashWarning.hasClash ? json.clashWarning : null;
              let createdMessage = "Meeting created (id " + json.id + ")." + attachmentMessage + publishMessage;
              if (clashWarning) {
                const conflictCount = Number(clashWarning.conflictCount || 0);
                const conflicts = Array.isArray(clashWarning.conflicts) ? clashWarning.conflicts : [];
                const conflictTitles = conflicts
                  .map((item) => String(item && item.title ? item.title : "").trim())
                  .filter(Boolean)
                  .slice(0, 3);
                const remaining = Math.max(conflictCount - conflictTitles.length, 0);
                const conflictSummary = conflictTitles.length
                  ? " Overlap with: " + conflictTitles.join(", ") + (remaining > 0 ? " +" + remaining + " more." : ".")
                  : "";
                createdMessage +=
                  " Time overlap detected with " +
                  conflictCount +
                  " existing meeting(s)." +
                  conflictSummary +
                  " Proceed is allowed, but shared members may need to choose one meeting.";
              }
              resetEventFormState(createdMessage);
            }
            if (eventViewInput) {
              eventViewInput.value = "all";
            }
            await loadEvents();
          } catch (error) {
            eventStatus.textContent = error?.message || (isEditing
              ? "Unable to reach API to update meeting."
              : "Unable to reach API to create meeting.");
          }
        });


        if (eventCancelButton) {
          eventCancelButton.addEventListener("click", () => {
            resetEventFormState("Edit cancelled.");
          });
        }

        refreshEventsButton.addEventListener("click", () => {
          loadEvents();
        });

        dispatchRemindersButton.addEventListener("click", async () => {
          if (!authToken) {
            eventStatus.textContent = "Sign in to dispatch reminders.";
            return;
          }
          eventStatus.textContent = "Dispatching registration reminders...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/registration-reminders/dispatch", {
              method: "POST",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              eventStatus.textContent = json.message || "Unable to dispatch reminders.";
              return;
            }
            const dispatched = json.dispatched || {};
            eventStatus.textContent =
              "Reminder dispatch complete. Sent " +
              Number(dispatched.reminderSent || 0) +
              " reminder(s) and " +
              Number(dispatched.waitlistClosedSent || 0) +
              " waitlist closure update(s).";
            await loadEvents();
          } catch {
            eventStatus.textContent = "Unable to reach API to dispatch reminders.";
          }
        });

        eventViewInput.addEventListener("change", () => {
          renderEvents(currentEvents);
        });

        resetButton.addEventListener("click", async () => {
          const ids = selectedIds();
          if (ids.length === 0) {
            return;
          }
          memberStatus.textContent = "Queuing credential resets...";
          memberOutput.textContent = "";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/members/credential-resets", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ userIds: ids })
            });
            const json = await response.json();
            if (!response.ok) {
              memberStatus.textContent = json.message || "Unable to queue credential resets.";
              return;
            }

            const queuedCount = json.queued ? json.queued.length : 0;
            const skippedCount = json.skipped ? json.skipped.length : 0;
            memberStatus.textContent =
              "Queued " +
              queuedCount +
              " reset(s). Skipped " +
              skippedCount +
              " ineligible.";

            if (json.queued && json.queued.length > 0) {
              memberOutput.textContent = json.queued
                .map((item) =>
                  "Reset queued for " +
                  item.username +
                  " (" +
                  item.email +
                  "), expires " +
                  item.expiresAt
                )
                .join("\\n");
            }
            await loadMembers();
          } catch {
            memberStatus.textContent = "Unable to reach API to queue credential resets.";
          }
        });

        refreshDeliveriesButton.addEventListener("click", () => {
          loadDeliveries();
        });

        refreshQueueButton.addEventListener("click", () => {
          loadQueueStatus();
        });

        if (feeRefreshButton) {
          feeRefreshButton.addEventListener("click", () => {
            loadMembershipFeesWorkspace({ reloadCycles: true });
          });
        }

        if (feeCycleSaveButton) {
          feeCycleSaveButton.addEventListener("click", () => {
            saveMembershipCycle();
          });
        }

        if (feeCycleYearInput) {
          feeCycleYearInput.addEventListener("change", () => {
            loadMembershipFeesWorkspace({ reloadCycles: false });
          });
        }

        if (feeFiltersApplyButton) {
          feeFiltersApplyButton.addEventListener("click", () => {
            loadMembershipFeeMembers();
          });
        }

        if (feeFiltersResetButton) {
          feeFiltersResetButton.addEventListener("click", () => {
            if (feeSearchInput) feeSearchInput.value = "";
            if (feeStandingFilterInput) feeStandingFilterInput.value = "all";
            if (feeAccountFilterInput) feeAccountFilterInput.value = "all";
            if (feeCategoryFilterInput) feeCategoryFilterInput.value = "";
            if (feeProfileFilterInput) feeProfileFilterInput.value = "all";
            loadMembershipFeeMembers();
          });
        }

        if (feeSearchInput) {
          feeSearchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              loadMembershipFeeMembers();
            }
          });
        }

        if (feeMembersTableBody) {
          feeMembersTableBody.addEventListener("click", (event) => {
            const auditButton = event.target.closest("[data-fee-audit-id]");
            if (auditButton) {
              const userId = Number(auditButton.getAttribute("data-fee-audit-id"));
              if (Number.isInteger(userId) && userId > 0) {
                loadMembershipFeeAudit(userId);
              }
              return;
            }

            const reminderButton = event.target.closest("[data-fee-reminder-id]");
            if (reminderButton) {
              const userId = Number(reminderButton.getAttribute("data-fee-reminder-id"));
              if (Number.isInteger(userId) && userId > 0) {
                sendMembershipDuesReminder([userId]);
              }
              return;
            }

            const saveButton = event.target.closest("[data-fee-save-id]");
            if (saveButton) {
              const userId = Number(saveButton.getAttribute("data-fee-save-id"));
              if (Number.isInteger(userId) && userId > 0) {
                updateMembershipFeeAccount(userId);
              }
              return;
            }

            const quickButton = event.target.closest("[data-fee-quick-apply-id]");
            if (quickButton) {
              const userId = Number(quickButton.getAttribute("data-fee-quick-apply-id"));
              if (!Number.isInteger(userId) || userId <= 0) {
                return;
              }
              const quickInput = feeMembersTableBody.querySelector("[data-fee-quick-action='" + userId + "']");
              const quickAction = String(quickInput?.value || "").trim();
              if (!quickAction) {
                setFeeRowStatus(userId, "Select a quick action first.");
                return;
              }
              updateMembershipFeeAccount(userId, { quickAction });
            }
          });

          feeMembersTableBody.addEventListener("change", (event) => {
            const checkbox = event.target.closest("input[data-fee-select-id]");
            if (!checkbox) {
              return;
            }
            const userId = Number(checkbox.getAttribute("data-fee-select-id"));
            if (!Number.isInteger(userId) || userId <= 0) {
              return;
            }
            if (checkbox.checked) {
              selectedMembershipFeeUserIds.add(userId);
            } else {
              selectedMembershipFeeUserIds.delete(userId);
            }
            updateMembershipFeeBulkBar();
          });
        }

        if (feeSelectAllMembersInput) {
          feeSelectAllMembersInput.addEventListener("change", () => {
            const visibleIds = (membershipFeeMembers || [])
              .map((item) => Number(item.userId || 0))
              .filter((id) => Number.isInteger(id) && id > 0);
            if (feeSelectAllMembersInput.checked) {
              selectedMembershipFeeUserIds = new Set(visibleIds);
            } else {
              selectedMembershipFeeUserIds = new Set();
            }
            renderMembershipFeeMembers(membershipFeeMembers);
          });
        }

        if (feeBulkApplyButton) {
          feeBulkApplyButton.addEventListener("click", () => {
            applyBulkMembershipFeeUpdate();
          });
        }

        if (feeBulkReminderButton) {
          feeBulkReminderButton.addEventListener("click", () => {
            sendMembershipDuesReminder();
          });
        }

        if (newsForm) {
          newsForm.addEventListener("submit", saveAdminNews);
        }

        if (newsCancelButton) {
          newsCancelButton.addEventListener("click", () => {
            resetNewsComposer("News edit cancelled.");
          });
        }

        if (refreshNewsButton) {
          refreshNewsButton.addEventListener("click", () => {
            loadAdminNews();
          });
        }

        if (refreshProfileReviewsButton) {
          refreshProfileReviewsButton.addEventListener("click", () => {
            loadPublicProfileReviews();
          });
        }

        if (publicHeroRefreshButton) {
          publicHeroRefreshButton.addEventListener("click", () => {
            loadPublicHeroSettings();
          });
        }

        if (publicHeroSaveLinkButton) {
          publicHeroSaveLinkButton.addEventListener("click", () => {
            saveLinkedPublicHero();
          });
        }

        if (publicHeroUploadButton) {
          publicHeroUploadButton.addEventListener("click", () => {
            uploadPublicHeroImage();
          });
        }

        if (publicHeroResetButton) {
          publicHeroResetButton.addEventListener("click", () => {
            resetPublicHeroToDefault();
          });
        }

        if (publicHeroFocalPointInput) {
          publicHeroFocalPointInput.addEventListener("change", () => {
            const current = publicHeroSettings || getDefaultPublicHeroSettings();
            applyPublicHeroPreview({
              ...current,
              focalPoint: String(publicHeroFocalPointInput.value || "top"),
              focalPointCss:
                String(publicHeroFocalPointInput.value || "top") === "center"
                  ? "center center"
                  : String(publicHeroFocalPointInput.value || "top") === "bottom"
                    ? "center bottom"
                    : String(publicHeroFocalPointInput.value || "top") === "left"
                      ? "left center"
                      : String(publicHeroFocalPointInput.value || "top") === "right"
                        ? "right center"
                        : "center top"
            });
          });
        }

        if (profileReviewTableBody) {
          profileReviewTableBody.addEventListener("click", (event) => {
            const button = event.target.closest("[data-profile-review-user-id]");
            if (!button) {
              return;
            }
            const userId = Number(button.getAttribute("data-profile-review-user-id"));
            const decision = String(button.getAttribute("data-profile-review-decision") || "").trim();
            if (Number.isInteger(userId) && userId > 0 && (decision === "approved" || decision === "rejected")) {
              reviewPublicProfile(userId, decision);
            }
          });
        }

        if (honoraryMemberForm) {
          honoraryMemberForm.addEventListener("submit", saveHonoraryMember);
        }

        if (honoraryMemberTableBody) {
          honoraryMemberTableBody.addEventListener("click", (event) => {
            const button = event.target.closest("[data-remove-honorary-id]");
            if (!button) {
              return;
            }
            const entryId = Number(button.getAttribute("data-remove-honorary-id"));
            if (Number.isInteger(entryId) && entryId > 0) {
              removeHonoraryMember(entryId);
            }
          });
        }

        if (memorialEntryForm) {
          memorialEntryForm.addEventListener("submit", saveMemorialEntry);
        }

        if (memorialEntryTableBody) {
          memorialEntryTableBody.addEventListener("click", (event) => {
            const button = event.target.closest("[data-remove-memorial-id]");
            if (!button) {
              return;
            }
            const entryId = Number(button.getAttribute("data-remove-memorial-id"));
            if (Number.isInteger(entryId) && entryId > 0) {
              removeMemorialEntry(entryId);
            }
          });
        }

        if (newsFilterStatusInput) {
          newsFilterStatusInput.addEventListener("change", () => {
            loadAdminNews();
          });
        }

        if (newsTableBody) {
          newsTableBody.addEventListener("click", (event) => {
            const editButton = event.target.closest("[data-news-edit-id]");
            if (editButton) {
              const newsId = Number(editButton.getAttribute("data-news-edit-id"));
              const match = newsItemsCache.find((item) => Number(item.id) === newsId);
              if (match) {
                beginNewsEdit(match);
              }
              return;
            }

            const publishButton = event.target.closest("[data-news-publish-id]");
            if (publishButton) {
              const newsId = Number(publishButton.getAttribute("data-news-publish-id"));
              if (Number.isInteger(newsId) && newsId > 0) {
                publishAdminNews(newsId);
              }
              return;
            }

            const pinButton = event.target.closest("[data-news-pin-id]");
            if (pinButton) {
              const newsId = Number(pinButton.getAttribute("data-news-pin-id"));
              const shouldPin = pinButton.getAttribute("data-news-pin-value") === "1";
              if (Number.isInteger(newsId) && newsId > 0) {
                updateNewsPinnedState(newsId, shouldPin);
              }
              return;
            }

            const archiveButton = event.target.closest("[data-news-archive-id]");
            if (archiveButton) {
              const newsId = Number(archiveButton.getAttribute("data-news-archive-id"));
              if (Number.isInteger(newsId) && newsId > 0) {
                archiveAdminNews(newsId);
              }
            }
          });
        }


        refreshReportsButton.addEventListener("click", () => {
          loadReports();
        });

        reportWindowDaysInput.addEventListener("change", () => {
          loadReports();
        });

        exportReportsButton.addEventListener("click", async () => {
          if (!authToken) {
            reportStatus.textContent = "Sign in to export dashboard data.";
            return;
          }

          reportStatus.textContent = "Exporting CSV...";
          try {
            const windowDays = Number(reportWindowDaysInput.value || 30);
            const response = await fetch(
              "${config.apiBaseUrl}/api/admin/reports/dashboard.csv?days=" + encodeURIComponent(String(windowDays)),
              {
                headers: { Authorization: "Bearer " + authToken }
              }
            );
            if (!response.ok) {
              let message = "Unable to export dashboard report.";
              try {
                const json = await response.json();
                message = json.message || message;
              } catch {
                // no-op
              }
              reportStatus.textContent = message;
              return;
            }

            const csv = await response.text();
            const disposition = response.headers.get("content-disposition") || "";
            const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
            const filename = match ? match[1] : "admin-dashboard.csv";
            const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
            reportStatus.textContent = "Dashboard export downloaded: " + filename;
          } catch {
            reportStatus.textContent = "Unable to reach API for dashboard export.";
          }
        });

        addModeratorButton.addEventListener("click", async () => {
          if (!authToken) {
            moderatorStatus.textContent = "Sign in to manage moderators.";
            return;
          }

          const userId = Number(moderatorUserIdInput.value || 0);
          if (!Number.isInteger(userId) || userId <= 0) {
            moderatorStatus.textContent = "Select a member before adding a moderator.";
            return;
          }

          moderatorStatus.textContent = "Assigning moderator...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/social/moderators", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken
              },
              body: JSON.stringify({ userId })
            });
            const json = await response.json();
            if (!response.ok) {
              moderatorStatus.textContent = json.message || "Unable to assign moderator.";
              return;
            }

            moderatorStatus.textContent = "Moderator assigned.";
            await loadModerators();
          } catch {
            moderatorStatus.textContent = "Unable to reach API for moderators.";
          }
        });

        moderatorTableBody.addEventListener("click", async (event) => {
          const button = event.target.closest("[data-remove-moderator-id]");
          if (!button) {
            return;
          }
          if (!authToken) {
            moderatorStatus.textContent = "Sign in to manage moderators.";
            return;
          }

          const userId = String(button.getAttribute("data-remove-moderator-id") || "").trim();
          if (!userId) {
            return;
          }

          moderatorStatus.textContent = "Removing moderator...";
          try {
            const response = await fetch("${config.apiBaseUrl}/api/admin/social/moderators/" + userId, {
              method: "DELETE",
              headers: { Authorization: "Bearer " + authToken }
            });
            const json = await response.json();
            if (!response.ok) {
              moderatorStatus.textContent = json.message || "Unable to remove moderator.";
              return;
            }

            moderatorStatus.textContent = "Moderator removed.";
            await loadModerators();
          } catch {
            moderatorStatus.textContent = "Unable to reach API for moderators.";
          }
        });

        renderMemberGroupOptions();
        renderEventGroupOptions();
        persistHelpAndTooltips();
        setAuthToken(authToken, authRole, authUsername);
        if (authToken && !window.location.hash) {
          window.location.hash = "#overview";
        }
        if (authToken) {
          void loadAdminWorkspace();
        } else {
          window.location.replace(ADMIN_SIGN_IN_URL);
        }
      </script>
    `
  });
}

export function renderActivationPage(config) {
  return htmlLayout({
    title: "IWFSA | Activate Account",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/sign-in",
    body: `
      <section class="panel">
        <h2>Activate your account</h2>
        <p>Set a new password to activate your member account.</p>
        <form id="activate-form" class="login-form">
          <label for="activate-token">Activation token</label>
          <input id="activate-token" name="token" autocomplete="off" />
          <label for="activate-username">Personal username (only if requested)</label>
          <input id="activate-username" name="username" autocomplete="username" />
          <label for="activate-password">New password</label>
          <input id="activate-password" type="password" name="newPassword" autocomplete="new-password" minlength="8" />
          <button type="submit">Activate account</button>
        </form>
        <p id="activate-status" class="muted">Provide your token and new password.</p>
      </section>
      <script>
        const apiBaseUrl = ${JSON.stringify(config.apiBaseUrl || "")};
        const appBaseUrl = ${JSON.stringify(config.appBaseUrl || "")};
        const activateForm = document.getElementById("activate-form");
        const activateTokenInput = document.getElementById("activate-token");
        const activateUsernameInput = document.getElementById("activate-username");
        const activatePasswordInput = document.getElementById("activate-password");
        const activateStatus = document.getElementById("activate-status");

        const activateParams = new URLSearchParams(window.location.search || "");
        const tokenFromQuery = String(activateParams.get("token") || "").trim();
        if (tokenFromQuery) {
          activateTokenInput.value = tokenFromQuery;
        }

        activateForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const token = String(activateTokenInput.value || "").trim();
          const username = String(activateUsernameInput.value || "").trim();
          const newPassword = String(activatePasswordInput.value || "");
          if (!token || !newPassword) {
            activateStatus.textContent = "Token and new password are required.";
            return;
          }

          activateStatus.textContent = "Activating account...";
          try {
            const response = await fetch(apiBaseUrl + "/api/auth/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, username, newPassword })
            });
            const payload = await response.json();
            if (!response.ok) {
              activateStatus.textContent = payload.message || "Unable to activate account.";
              return;
            }

            activateStatus.textContent = "Account activated. Continue to sign in.";
            if (appBaseUrl) {
              window.setTimeout(() => {
                window.location.assign(appBaseUrl + "/sign-in");
              }, 900);
            }
          } catch {
            activateStatus.textContent = "Unable to reach API.";
          }
        });
      </script>
    `
  });
}

export function renderResetPage(config) {
  return htmlLayout({
    title: "IWFSA | Reset Password",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/sign-in",
    body: `
      <section class="panel">
        <h2>Reset your password</h2>
        <p>Submit your reset token and choose a new password.</p>
        <form id="reset-form" class="login-form">
          <label for="reset-token">Reset token</label>
          <input id="reset-token" name="token" autocomplete="off" />
          <label for="reset-password">New password</label>
          <input id="reset-password" type="password" name="newPassword" autocomplete="new-password" minlength="8" />
          <button type="submit">Reset password</button>
        </form>
        <p id="reset-status" class="muted">Provide your token and new password.</p>
      </section>
      <script>
        const apiBaseUrl = ${JSON.stringify(config.apiBaseUrl || "")};
        const appBaseUrl = ${JSON.stringify(config.appBaseUrl || "")};
        const resetForm = document.getElementById("reset-form");
        const resetTokenInput = document.getElementById("reset-token");
        const resetPasswordInput = document.getElementById("reset-password");
        const resetStatus = document.getElementById("reset-status");

        const resetParams = new URLSearchParams(window.location.search || "");
        const tokenFromQuery = String(resetParams.get("token") || "").trim();
        if (tokenFromQuery) {
          resetTokenInput.value = tokenFromQuery;
        }

        resetForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const token = String(resetTokenInput.value || "").trim();
          const newPassword = String(resetPasswordInput.value || "");
          if (!token || !newPassword) {
            resetStatus.textContent = "Token and new password are required.";
            return;
          }

          resetStatus.textContent = "Resetting password...";
          try {
            const response = await fetch(apiBaseUrl + "/api/auth/reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, newPassword })
            });
            const payload = await response.json();
            if (!response.ok) {
              resetStatus.textContent = payload.message || "Unable to reset password.";
              return;
            }

            resetStatus.textContent = "Password reset complete. Continue to sign in.";
            if (appBaseUrl) {
              window.setTimeout(() => {
                window.location.assign(appBaseUrl + "/sign-in");
              }, 900);
            }
          } catch {
            resetStatus.textContent = "Unable to reach API.";
          }
        });
      </script>
    `
  });
}

export function renderMeetingRsvpPage(config) {
  return htmlLayout({
    title: "IWFSA | Confirm RSVP",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/sign-in",
    body: `
      <section class="panel">
        <h2>Confirm meeting participation</h2>
        <p>Select your response for this invitation.</p>
        <div class="member-actions">
          <button id="rsvp-confirm-button" type="button">Confirm participation</button>
          <button id="rsvp-decline-button" type="button" class="ghost">Cannot attend</button>
        </div>
        <p id="rsvp-status" class="muted">Ready to record your RSVP.</p>
      </section>
      <script>
        const apiBaseUrl = ${JSON.stringify(config.apiBaseUrl || "")};
        const rsvpStatus = document.getElementById("rsvp-status");
        const rsvpConfirmButton = document.getElementById("rsvp-confirm-button");
        const rsvpDeclineButton = document.getElementById("rsvp-decline-button");
        const rsvpParams = new URLSearchParams(window.location.search || "");
        const rsvpToken = String(rsvpParams.get("token") || "").trim();
        const defaultAction = String(rsvpParams.get("action") || "").trim().toLowerCase();

        async function submitRsvp(action) {
          if (!rsvpToken) {
            return;
          }

          rsvpConfirmButton.disabled = true;
          rsvpDeclineButton.disabled = true;
          rsvpStatus.textContent = action === "decline" ? "Recording decline..." : "Confirming RSVP...";
          try {
            const response = await fetch(apiBaseUrl + "/api/meetings/rsvp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: rsvpToken, action })
            });
            const payload = await response.json();
            if (!response.ok) {
              rsvpStatus.textContent = payload.message || "Unable to record RSVP.";
              rsvpConfirmButton.disabled = false;
              rsvpDeclineButton.disabled = false;
              return;
            }

            if (payload.status === "declined") {
              rsvpStatus.textContent =
                "You indicated you cannot attend " + String(payload.eventTitle || "this meeting") + ".";
              return;
            }

            const statusLabel = payload.status === "waitlisted" ? "waitlisted" : "confirmed";
            rsvpStatus.textContent =
              "RSVP " + statusLabel + " for " + String(payload.eventTitle || "the meeting") + ".";
          } catch {
            rsvpStatus.textContent = "Unable to reach API.";
            rsvpConfirmButton.disabled = false;
            rsvpDeclineButton.disabled = false;
          }
        }

        if (!rsvpToken) {
          rsvpStatus.textContent = "RSVP token is missing.";
          rsvpConfirmButton.disabled = true;
          rsvpDeclineButton.disabled = true;
        }

        rsvpConfirmButton.addEventListener("click", async () => {
          await submitRsvp("confirm");
        });

        rsvpDeclineButton.addEventListener("click", async () => {
          await submitRsvp("decline");
        });

        if (defaultAction === "decline" && rsvpToken) {
          rsvpStatus.textContent = "Ready to record that you cannot attend.";
        }
      </script>
    `
  });
}
