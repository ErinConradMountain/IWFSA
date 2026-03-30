const UI_BUILD = "2026-03-30.1";

function htmlLayout({ title, body, appBaseUrl, currentPath, pageClass = "" }) {
  const normalizedPath = currentPath || "/";
  let navItems = [];
  if (currentPath === "/member") {
    navItems = [
      { href: `${appBaseUrl}/`, label: "Public", path: "/" },
      { href: `${appBaseUrl}/member`, label: "Member Portal", path: "/member" }
    ];
  } else if (currentPath === "/admin") {
    navItems = [
      { href: `${appBaseUrl}/`, label: "Public", path: "/" },
      { href: `${appBaseUrl}/admin`, label: "Admin Console", path: "/admin" }
    ];
  } else {
    // On the public site, we just show a generic login pathway to the portal 
    // without exposing operations consoles directly in the top nav
    navItems = [
      { href: `${appBaseUrl}/`, label: "Public", path: "/" },
      { href: `${appBaseUrl}/member`, label: "Sign In", path: "/member" }
    ];
  }
  const navLinks = navItems
    .map((item) => {
      const isActive = normalizedPath === item.path;
      return `<a class="nav-link${isActive ? " nav-link-active" : ""}" href="${item.href}"${
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
          <p class="eyebrow">IWFSA Web Platform</p>
          <a class="brand-link" href="${appBaseUrl}/">
            <span class="brand-title">International Women's Forum South Africa</span>
            <span class="brand-subtitle">Public website, member workspace, and governance console</span>
          </a>
        </div>
        <nav class="site-nav" aria-label="Primary">
          ${navLinks}
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
          <p class="eyebrow eyebrow-contrast">International Women's Forum of South Africa</p>
          <h1 class="page-title" style="text-align: center; width: 100%; max-width: none;">Leading with Purpose.</h1>
          <h2 style="text-align: center; margin-top: 0; font-weight: normal; font-size: 1.75rem;">ignite. inspire. impact.</h2>
          <p class="lead" style="margin-top: 1.5rem; text-align: center;">
            IWFSA is the SA chapter of the International Women’s Forum (“IWF”), our core objective is to nurture and develop a pipeline of the next generation of women leaders through targeted Leadership Development programmes, mentoring and coaching.
          </p>
          <div style="text-align: center; margin-top: 1.5rem;">
            <a class="button-link" href="https://www.iwfsa.co.za/our-impact/" target="_blank" rel="noopener noreferrer">View Our Impact</a>
          </div>
        </div>
        <figure class="featured-signal-figure" style="margin-top: 3rem;">
          <div class="featured-photo-frame">
            <img
              class="featured-hero-image"
              src="${config.appBaseUrl}/assets/iwfsa-home.jpg?v=${UI_BUILD}-public-refresh"
              alt="IWFSA leaders meeting around a conference table in Sandton while a presentation screen reads Ignite. Inspire. Impact."
              loading="eager"
              decoding="async"
            />
          </div>
        </figure>
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
                 One responsive workspace for events, birthdays, notifications, celebration threads, and personal
                 communication preferences.
               </p>
             </div>
             <div class="auth-controls">
                 <p id="member-login-status" class="muted">Not signed in.</p>
                 <form id="member-login-form" class="inline-login-form member-login-form">
                    <div id="member-login-credentials" class="member-login-credentials">
                      <input id="member-username" name="username" placeholder="Username" autocomplete="username" />
                      <input id="member-password" type="password" name="password" placeholder="Password" autocomplete="current-password" />
                    </div>
                    <div class="member-login-actions">
                      <button id="member-login-submit" type="submit">Sign in</button>
                      <button id="member-logout" type="button" class="ghost member-logout-button" hidden>Sign out</button>
                    </div>
                 </form>
             </div>
          </div>
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
           
          <nav class="module-nav" id="member-nav" aria-label="Member modules">
            <a href="#dashboard" class="module-nav-link" data-module="dashboard" data-member-module-link="dashboard">Dashboard</a>
            <a href="#events" class="module-nav-link" data-module="events" data-member-module-link="events">Events</a>
            <a href="#birthdays" class="module-nav-link" data-module="birthdays" data-member-module-link="birthdays">Birthdays</a>
            <a href="#notifications" class="module-nav-link" data-module="notifications" data-member-module-link="notifications">Notifications</a>
            <a href="#sms" class="module-nav-link" data-module="sms" data-member-module-link="sms">SMS Settings</a>
            <a href="#celebrations" class="module-nav-link" data-module="celebrations" data-member-module-link="celebrations">Celebration Thread</a>
          </nav>
        </section>

        <section id="module-dashboard" class="panel module-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Overview</p>
              <h2>Start where you need to act next</h2>
            </div>
            <p class="muted">Deep links make each part of the portal easy to revisit on any device.</p>
          </div>
          <div class="dashboard-cards">
            <button type="button" class="dashboard-card" onclick="window.location.hash='#events'">
              <h4>Upcoming Events</h4>
              <p>Browse the event directory, confirm attendance, and download calendar files.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#birthdays'">
              <h4>Birthday Circle</h4>
              <p>See upcoming member birthdays based on your selected window and visibility rules.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#notifications'">
              <h4>Notification Center</h4>
              <p>Review updates, mark items as read, and keep important changes in view.</p>
            </button>
            <button type="button" class="dashboard-card" onclick="window.location.hash='#sms'">
              <h4>SMS Settings</h4>
              <p>Choose how urgent text reminders should behave for your account.</p>
            </button>
          </div>
        </section>

        <section id="module-events" class="panel module-section">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Events</p>
                <h2>Member Event Directory</h2>
              </div>
              <p class="muted">Browse published meetings, join online sessions, and keep your calendar aligned.</p>
            </div>
            <div class="member-actions">
              <label for="member-event-view" class="muted">Event window</label>
              <select id="member-event-view" disabled>
                <option value="">All</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <button id="member-refresh-events" type="button" disabled>Refresh events</button>
              <button id="member-create-event-btn" type="button" class="event-fab" disabled>+ Create Meeting</button>
            </div>
            <div id="member-event-form-shell" class="event-form-shell event-form-hidden" style="margin-bottom: 1rem;">
              <form id="member-event-form" class="login-form">
                <label for="member-event-title">Title</label>
                <input id="member-event-title" name="title" required />
                <label for="member-event-description">Description</label>
                <textarea id="member-event-description" name="description" rows="3"></textarea>
                <label for="member-event-start">Start date &amp; time</label>
                <input id="member-event-start" name="startAt" type="datetime-local" required />
                <label for="member-event-end">End date &amp; time</label>
                <input id="member-event-end" name="endAt" type="datetime-local" required />
                <label for="member-event-venue">Venue Type</label>
                <select id="member-event-venue" name="venueType" required>
                  <option value="physical">Physical</option>
                  <option value="online">Online</option>
                </select>
                <label for="member-event-capacity">Capacity</label>
                <input id="member-event-capacity" name="capacity" type="number" min="0" value="0" required />
                <button type="submit" id="member-event-submit">Create meeting</button>
                <button type="button" id="member-event-cancel">Cancel</button>
              </form>
              <p id="member-event-form-status" class="muted"></p>
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
                <label class="inline-checkbox" for="celebration-acknowledge">
                  <input id="celebration-acknowledge" type="checkbox" />
                  I acknowledge the community posting rules
                </label>
                <label class="inline-checkbox" for="celebration-relevant">
                  <input id="celebration-relevant" type="checkbox" />
                  This post is directly relevant to IWFSA activity
                </label>
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
        const loginForm = document.getElementById("member-login-form");
        const loginCredentials = document.getElementById("member-login-credentials");
        const loginSubmitButton = document.getElementById("member-login-submit");
        const memberUsernameInput = document.getElementById("member-username");
        const memberPasswordInput = document.getElementById("member-password");
        /* Removed demo fill button ref */
        const loginStatus = document.getElementById("member-login-status");
        const logoutButton = document.getElementById("member-logout");
        const birthdayPanel = document.getElementById("member-birthday-panel");
        const viewSelect = document.getElementById("member-event-view");
        const refreshEventsButton = document.getElementById("member-refresh-events");
        const createEventBtn = document.getElementById("member-create-event-btn");
        const memberEventFormShell = document.getElementById("member-event-form-shell");
        const memberEventForm = document.getElementById("member-event-form");
        const memberEventFormStatus = document.getElementById("member-event-form-status");
        const memberEventCancelBtn = document.getElementById("member-event-cancel");
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
        const celebrationForm = document.getElementById("celebration-form");
        const celebrationBodyInput = document.getElementById("celebration-body");
        const celebrationAcknowledgeInput = document.getElementById("celebration-acknowledge");
        const celebrationRelevantInput = document.getElementById("celebration-relevant");
        const celebrationList = document.getElementById("celebration-list");
        const celebrationRules = document.getElementById("celebration-rules");
        const celebrationStatus = document.getElementById("celebration-status");
        const draftAutosaveTimers = new Map();
        const localDraftOverrides = new Map();
        let serverSkewMs = 0;
        let currentEvents = [];

        function handleHashChange() {
           const hash = window.location.hash.substring(1) || "dashboard";
           let activeModule = hash;
           if (!["dashboard", "events", "birthdays", "notifications", "sms", "celebrations"].includes(activeModule)) {
              activeModule = 'dashboard';
           }

           // Update nav
           document.querySelectorAll('.module-nav-link').forEach(link => {
              link.classList.toggle('active', link.getAttribute('data-module') === activeModule);
           });

           // Update sections
           document.querySelectorAll('.module-section').forEach(section => {
              section.classList.toggle('active', section.id === 'module-' + activeModule);
           });
        }
        
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Init

        function getToken() {
          return sessionStorage.getItem("iwfsa_token");
        }

        let memberUsername = sessionStorage.getItem("iwfsa_member_username") || "";

        function setToken(token, username = "") {
          if (token) {
            sessionStorage.setItem("iwfsa_token", token);
            memberUsername = String(username || memberUsername || "").trim();
            if (memberUsername) {
              sessionStorage.setItem("iwfsa_member_username", memberUsername);
            } else {
              sessionStorage.removeItem("iwfsa_member_username");
            }
          } else {
            sessionStorage.removeItem("iwfsa_token");
            sessionStorage.removeItem("iwfsa_member_username");
            memberUsername = "";
          }
        }

        function setSignedInState(isSignedIn) {
          document.body.classList.toggle("member-signed-in", isSignedIn);
          if (loginCredentials) {
            loginCredentials.hidden = isSignedIn;
          }
          if (loginSubmitButton) {
            loginSubmitButton.hidden = isSignedIn;
          }
          logoutButton.disabled = !isSignedIn;
          logoutButton.hidden = !isSignedIn;
          if (birthdayPanel) {
            birthdayPanel.hidden = !isSignedIn;
          }
          viewSelect.disabled = !isSignedIn;
          refreshEventsButton.disabled = !isSignedIn;
          if (createEventBtn) {
            createEventBtn.disabled = !isSignedIn;
          }
          if (!isSignedIn && memberEventFormShell) {
            memberEventFormShell.classList.add("event-form-hidden");
          }
          birthdayWindowSelect.disabled = !isSignedIn;
          refreshBirthdaysButton.disabled = !isSignedIn;
          refreshNotificationsButton.disabled = !isSignedIn;
          markNotificationsReadButton.disabled = !isSignedIn;
          smsSaveButton.disabled = !isSignedIn;
          Array.from(smsForm?.elements || []).forEach((element) => {
            if (element !== smsSaveButton && element instanceof HTMLElement) {
              element.toggleAttribute("disabled", !isSignedIn);
            }
          });
          Array.from(celebrationForm?.elements || []).forEach((element) => {
            if (element instanceof HTMLElement) {
              element.toggleAttribute("disabled", !isSignedIn);
            }
          });
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
                "<button class='btn-social' onclick=\"alert('Social automation is feature-flagged for Phase 4. Use manual post for now.')\">Auto-Post to Social</button>" +
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
          const details = detailsParts.filter(Boolean).join("\n\n");
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
          const body = bodyParts.filter(Boolean).join("\n\n");
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
              const audienceLabel = escapeClientHtml(event.audienceLabel || "All Members");
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
            container.innerHTML = "<p class='muted'>Unable to reach API. Start npm run dev:api first.</p>";
          }
        }

/* Demo button removed */

        loginForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          loginStatus.textContent = "Signing in...";

          const formData = new FormData(loginForm);
          const payload = {
            username: String(formData.get("username") || "").trim(),
            password: String(formData.get("password") || "")
          };

          try {
            const response = await fetch("${config.apiBaseUrl}/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const json = await response.json();
            if (!response.ok) {
              loginStatus.textContent = "Sign in failed: " + (json.message || "Invalid credentials.");
              return;
            }

            setToken(json.token, json.user.username);
            setSignedInState(true);
            loginStatus.textContent = "Signed in as " + json.user.username + ".";
            loginForm.reset();
            await loadEvents();
            await loadBirthdays();
            await loadNotifications();
            await loadSmsSettings();
            await loadCelebrations();
          } catch {
            loginStatus.textContent = "Sign in failed: unable to reach API.";
          }
        });

        logoutButton.addEventListener("click", async () => {
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
          loginStatus.textContent = "Signed out.";
          loginForm.reset();
          container.innerHTML = "<p class='muted'>Sign in to load events.</p>";
          birthdayList.innerHTML = "<p class='muted'>Sign in to load birthdays.</p>";
          notificationList.innerHTML = "<p class='muted'>Sign in to load notifications.</p>";
          smsStatus.textContent = "Sign in to manage SMS preferences.";
          smsLimits.textContent = "Sign in to load SMS policy guidance.";
          celebrationStatus.textContent = "Sign in to load the shared thread.";
          celebrationList.innerHTML = "<p class='muted'>Sign in to load celebration posts.</p>";
          celebrationRules.innerHTML = "<li>Sign in to load moderation rules.</li>";
        });

        refreshEventsButton.addEventListener("click", () => {
          loadEvents();
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

        if (createEventBtn) {
          createEventBtn.addEventListener("click", () => {
            if (memberEventFormShell) {
              memberEventFormShell.classList.toggle("event-form-hidden");
            }
          });
        }

        if (memberEventCancelBtn) {
          memberEventCancelBtn.addEventListener("click", () => {
            if (memberEventForm) {
              memberEventForm.reset();
            }
            if (memberEventFormStatus) {
              memberEventFormStatus.textContent = "";
            }
            if (memberEventFormShell) {
              memberEventFormShell.classList.add("event-form-hidden");
            }
          });
        }

        if (memberEventForm) {
          memberEventForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const token = getToken();
            if (!token) {
              if (memberEventFormStatus) {
                memberEventFormStatus.textContent = "Sign in to create a meeting.";
              }
              return;
            }

            const formData = new FormData(memberEventForm);
            const payload = {
              title: String(formData.get("title") || "").trim(),
              description: String(formData.get("description") || "").trim(),
              startAt: String(formData.get("startAt") || "").trim(),
              endAt: String(formData.get("endAt") || "").trim(),
              venueType: String(formData.get("venueType") || "").trim(),
              capacity: Number(formData.get("capacity") || 0)
            };

            if (memberEventFormStatus) {
              memberEventFormStatus.textContent = "Creating meeting...";
            }

            try {
              const response = await fetch("${config.apiBaseUrl}/api/events", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token
                },
                body: JSON.stringify(payload)
              });
              const json = await response.json();
              if (!response.ok) {
                if (memberEventFormStatus) {
                  memberEventFormStatus.textContent = json.message || "Unable to create meeting.";
                }
                return;
              }
              memberEventForm.reset();
              if (memberEventFormStatus) {
                memberEventFormStatus.textContent = "Meeting created.";
              }
              if (memberEventFormShell) {
                memberEventFormShell.classList.add("event-form-hidden");
              }
              await loadEvents();
            } catch {
              if (memberEventFormStatus) {
                memberEventFormStatus.textContent = "Unable to reach API. Please try again.";
              }
            }
          });
        }

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
        setSignedInState(Boolean(getToken()));
        if (getToken()) {
          loginStatus.textContent = "Signed in as " + (memberUsername || "member") + ".";
        }
        loadEvents();
        loadBirthdays();
        loadNotifications();
        loadSmsSettings();
        loadCelebrations();
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
                 Sign in through the Access tab first. The Event Hub stays separate so meeting work has its own workspace.
               </p>
             </div>
          </div>

          <nav class="module-nav" id="admin-nav" aria-label="Admin modules">
             <a href="#access" class="module-nav-link" data-module="access" data-admin-module-link="access">Access</a>
             <a href="#overview" class="module-nav-link" data-module="overview" data-admin-module-link="overview">Overview</a>
             <a href="#members" class="module-nav-link" data-module="members" data-admin-module-link="members">Members</a>
             <a href="#imports" class="module-nav-link" data-module="imports" data-admin-module-link="imports">Imports</a>
             <a href="#events" class="module-nav-link" data-module="events" data-admin-module-link="events">Event Hub</a>
             <a href="#notifications" class="module-nav-link" data-module="notifications" data-admin-module-link="notifications">Notifications</a>
             <a href="#reports" class="module-nav-link" data-module="reports" data-admin-module-link="reports">Reports</a>
          </nav>
        </section>

          <section id="module-access" class="panel module-section">
             <div class="section-heading">
                <div>
                  <p class="eyebrow">Access</p>
                  <h2>Sign in to open the admin workspace</h2>
                </div>
                <p class="muted">The Event Hub is kept separate from login so meeting work stays focused.</p>
             </div>
             <div class="admin-access-panel">
               <p id="login-status" class="muted">Not signed in.</p>
               <form id="admin-login-form" class="inline-login-form admin-login-form">
                  <input id="admin-username" name="username" placeholder="Username" autocomplete="username" />
                  <input id="admin-password" type="password" name="password" placeholder="Password" autocomplete="current-password" />
                  <button type="submit">Sign in</button>
               </form>
               <div class="member-actions">
                 <button id="admin-logout" type="button" disabled>Sign out</button>
               </div>
             </div>
          </section>

          <section id="module-overview" class="panel module-section">
             <p class="muted">Select a module to manage the platform.</p>
             <div class="dashboard-cards">
                <div class="dashboard-card" onclick="window.location.hash='#events'">
                   <h4>Event Hub</h4>
                   <p>Manage drafts, publish meetings, and track RSVPs.</p>
                </div>
                <div class="dashboard-card" onclick="window.location.hash='#members'">
                   <h4>Member Directory</h4>
                   <p>Onboard members and manage groups.</p>
                </div>
                <div class="dashboard-card" onclick="window.location.hash='#imports'">
                   <h4>Bulk Import</h4>
                   <p>Upload member spreadsheets.</p>
                </div>
                <div class="dashboard-card" onclick="window.location.hash='#notifications'">
                   <h4>Notifications</h4>
                   <p>Monitor delivery health and queues.</p>
                </div>
                <div class="dashboard-card" onclick="window.location.hash='#reports'">
                   <h4>Reporting</h4>
                   <p>Review engagement metrics, SMS activity, and moderation controls.</p>
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
                  <span id="member-count" class="muted"></span>
                </div>
                <!-- ..rest of member directory.. -->
                <div class="member-actions">
                  <input id="member-search" type="search" placeholder="Search name, email, or group" />
                </div>
                <form id="member-add-form" class="login-form">
                  <label for="member-add-name">Full name</label>
                  <input id="member-add-name" name="fullName" autocomplete="name" required />
                  <label for="member-add-email">Email</label>
                  <input id="member-add-email" name="email" type="email" autocomplete="email" required />
                  <fieldset class="group-picker-fieldset">
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
            <option value="all_members">All Members</option>
            <option value="board_of_directors">Board of Directors</option>
            <option value="member_affairs">Member Affairs</option>
            <option value="brand_and_reputation">Brand and Reputation</option>
            <option value="strategic_alliances_and_advocacy">Strategic Alliances and Advocacy</option>
            <option value="catalytic_strategy_and_voice">Catalytic Strategy and Voice</option>
            <option value="leadership_development">Leadership Development</option>
          </select>
          <fieldset class="group-picker-fieldset">
            <legend>Invite groups (optional)</legend>
            <p class="muted group-picker-help">
              Select one or more groups to invite. If any are selected, the event is visible to those groups only.
            </p>
            <div id="event-audience-groups" class="group-picker"></div>
          </fieldset>
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
        
        function handleHashChange() {
           const hash = window.location.hash || '#access';
           document.querySelectorAll('.module-nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === hash));
           document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
           const target = document.getElementById('module-' + hash.substring(1));
           if (target) {
             target.classList.add('active');
           } else {
             document.getElementById('module-access').classList.add('active');
           }
        }
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();

        const form = document.getElementById("admin-login-form");
        const adminPanelGrid = document.getElementById("admin-panel-grid");
        const status = document.getElementById("login-status");
        const logoutButton = document.getElementById("admin-logout");
        const usernameInput = document.getElementById("admin-username");
        const passwordInput = document.getElementById("admin-password");
        const memberStatus = document.getElementById("member-status");
        const memberCount = document.getElementById("member-count");
        const memberTableBody = document.getElementById("member-table-body");
        const refreshButton = document.getElementById("refresh-members");
        const queueButton = document.getElementById("queue-invites");
        const resetButton = document.getElementById("queue-resets");
        const memberSearch = document.getElementById("member-search");
        const memberAddForm = document.getElementById("member-add-form");
        const memberAddNameInput = document.getElementById("member-add-name");
        const memberAddEmailInput = document.getElementById("member-add-email");
        const memberAddGroups = document.getElementById("member-add-groups");
        const memberAddStatus = document.getElementById("member-add-status");
        const selectAll = document.getElementById("select-all-members");
        const memberOutput = document.getElementById("member-output");
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
        const importSubmitButton = document.getElementById("import-submit");
        const importForm = document.getElementById("import-form");
        const importFileInput = document.getElementById("import-file");
        const importModeInput = document.getElementById("import-mode");
        const importDefaultStatusInput = document.getElementById("import-default-status");
        const importUsernamePolicyInput = document.getElementById("import-username-policy");
        const importActivationPolicyInput = document.getElementById("import-activation-policy");
        const importInvitePolicyInput = document.getElementById("import-invite-policy");
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

        if (importActivationPolicyInput && !importActivationPolicyInput.value) {
          importActivationPolicyInput.value = DEFAULT_IMPORT_ACTIVATION_POLICY;
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

        function resolveEventAudienceSelection(formData) {
          const selectedGroups = selectedEventGroups();
          if (selectedGroups.length > 0) {
            return { audienceType: "groups", groupNames: selectedGroups, audienceCode: "groups" };
          }
          const audienceCode = String(formData.get("audienceCode") || "all_members").trim() || "all_members";
          if (audienceCode !== "all_members") {
            const label = eventAudienceInput?.selectedOptions?.[0]?.textContent || "";
            if (label && label.toLowerCase() !== "legacy audience") {
              return { audienceType: "groups", groupNames: [label], audienceCode: "groups" };
            }
          }
          return { audienceCode };
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

          if (audienceSelection.groupNames && audienceSelection.groupNames.length === 0) {
            markEventFieldError(eventAudienceInput);
            return { error: "Select at least one group for group-only events." };
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
          if (resolvedAudienceCode === "groups" && !(audienceSelection.groupNames || []).length) {
            markEventFieldError(eventAudienceInput);
            errors.push("Select at least one group for group-only events.");
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
        let activeImportBatch = null;
        let activeImportBatchId = "";
        let importRowsCache = [];
        let activeImportRowId = 0;
        let importRestoreRequested = false;
        const IMPORT_BATCH_STORAGE_KEY = "iwfsa_admin_last_import_batch_v1";

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
              const org = String(member.organisation || "").trim();
              const detail = org ? " (" + org + ")" : "";
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

        function listConfiguredAudienceGroups() {
          const fromMembers = Array.isArray(memberDirectorySource)
            ? memberDirectorySource.flatMap((member) => normalizeGroupList(member.groups || []))
            : [];
          let labels = normalizeGroupList(fromMembers);

          if (!labels.length && eventAudienceInput) {
            const fromAudienceSelect = Array.from(eventAudienceInput.options || [])
              .filter((option) => {
                const value = String(option.value || "").trim();
                return value !== "" && value !== "all_members" && value !== "groups";
              })
              .map((option) => String(option.textContent || "").trim())
              .filter((label) => Boolean(label) && label.toLowerCase() !== "legacy audience");
            labels = normalizeGroupList(fromAudienceSelect);
          }

          const lowerLabels = new Set(labels.map((label) => label.toLowerCase()));
          if (!lowerLabels.has("member")) {
            labels.push("Member");
            lowerLabels.add("member");
          }
          if (!lowerLabels.has("common member")) {
            labels.push("Common Member");
            lowerLabels.add("common member");
          }
          if (!lowerLabels.has("basic member")) {
            labels.push("Basic Member");
          }

          return labels;
        }

        function renderMemberGroupOptions() {
          if (!memberAddGroups) {
            return;
          }
          const groups = listConfiguredAudienceGroups();
          if (groups.length === 0) {
            memberAddGroups.innerHTML = "<p class='muted'>No audience groups configured yet.</p>";
            return;
          }
          memberAddGroups.innerHTML = groups
            .map(
              (groupLabel) =>
                "<label class='group-option'>" +
                "<input type='checkbox' name='member-add-group' value='" +
                escapeClientHtml(groupLabel) +
                "' />" +
                escapeClientHtml(groupLabel) +
                "</label>"
            )
            .join("");
        }

        function renderEventGroupOptions(selected = []) {
          if (!eventAudienceGroups) {
            return;
          }
          const groups = listConfiguredAudienceGroups();
          if (groups.length === 0) {
            eventAudienceGroups.innerHTML = "<p class='muted'>No audience groups configured yet.</p>";
            return;
          }
          const selectedLower = new Set(selected.map((label) => String(label || "").toLowerCase()));
          eventAudienceGroups.innerHTML = groups
            .map((groupLabel) => {
              const isChecked = selectedLower.has(String(groupLabel || "").toLowerCase()) ? " checked" : "";
              return (
                "<label class='group-option'>" +
                "<input type='checkbox' name='event-audience-group' value='" +
                escapeClientHtml(groupLabel) +
                "'" +
                isChecked +
                " />" +
                escapeClientHtml(groupLabel) +
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

        function setAuthToken(token, role, username) {
          authToken = token || null;
          authRole = role || authRole || "";
          authUsername = username || authUsername || "";
          if (authToken) {
            sessionStorage.setItem("iwfsa_admin_token", authToken);
            if (authRole) {
              sessionStorage.setItem("iwfsa_admin_role", authRole);
            }
            if (authUsername) {
              sessionStorage.setItem("iwfsa_admin_username", authUsername);
            }
          } else {
            sessionStorage.removeItem("iwfsa_admin_token");
            sessionStorage.removeItem("iwfsa_admin_role");
            sessionStorage.removeItem("iwfsa_admin_username");
            authRole = "";
            authUsername = "";
          }
          if (status) {
            status.textContent = authToken
              ? "Signed in as " +
                (authUsername || "admin") +
                (authRole ? " (" + authRole + ")" : "") +
                "."
              : "Not signed in.";
          }
          if (form) {
            form.hidden = Boolean(authToken);
          }
          if (logoutButton) {
            logoutButton.disabled = !authToken;
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
          } else {
            importStatus.textContent = "Run dry-run to create a new batch, or load an existing batch id.";
            updateImportButtons();
            void restoreImportBatchContext();
          }
        }

        const ADMIN_HELP_STORAGE_KEY = "iwfsa_admin_help_v1";
        const ADMIN_PANEL_STORAGE_KEY = "iwfsa_admin_panel_config_v1";
        const DISMISSED_HELP_STORAGE_KEY = "iwfsa_admin_dismissed_help_v1";
        const DEFAULT_HELP_TEXT = {
          "admin-username": "Admin username used for secure console sign-in.",
          "admin-password": "Admin password for this environment.",
          "refresh-members": "Reload the member directory from the API.",
          "queue-invites": "Queue onboarding invite links for selected members.",
          "queue-resets": "Queue credential reset links for selected members.",
          "member-search": "Filter members by full name, email, or group.",
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
          "refresh-deliveries": "Reload recent notification delivery outcomes.",
          "refresh-queue": "Reload notification queue status rows."
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
              const organisation = member.organisation || member.company || "â€”";
              const cellPhone = member.cellPhone || member.mobile || member.phone || "â€”";
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
                escapeClientHtml(name) +
                "</td>" +
                "<td>" +
                escapeClientHtml(organisation) +
                "</td>" +
                "<td>" +
                renderMemberRoles(roles) +
                "</td>" +
                "<td>" +
                emailCell +
                "</td>" +
                "<td>" +
                escapeClientHtml(cellPhone) +
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
            checkbox.addEventListener("change", () => {
              const checked = selectedIds().length;
              selectAll.checked = checked > 0 && checked === visibleItems.length;
              updateQueueButton();
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
              "<div class='import-empty-illustration' aria-hidden='true'>Ã¢Å“â€°Ã¯Â¸Â</div>" +
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
              const email = item.email || "Ã¢â‚¬â€";
              const phone = item.phone || "Ã¢â‚¬â€";
              const organisation = item.organisation || item.company || "Ã¢â‚¬â€";
              return (
                "<tr>" +
                "<td>" +
                escapeClientHtml(memberName) +
                "</td>" +
                "<td>" +
                escapeClientHtml(email) +
                "</td>" +
                "<td>" +
                escapeClientHtml(phone) +
                "</td>" +
                "<td>" +
                escapeClientHtml(organisation) +
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

        async function loadMembers() {
          if (!authToken) {
            memberStatus.textContent = "Sign in to load members.";
            memberDirectorySource = [];
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
              memberStatus.textContent = json.message || "Unable to load members.";
              memberDirectorySource = [];
              memberTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to load members.</td></tr>";
              memberOutput.textContent = "";
              memberCount.textContent = "";
              return;
            }
            memberDirectorySource = Array.isArray(json.items) ? json.items : [];
            applyMemberFilter();
            updateModeratorOptions();
            renderMemberGroupOptions();
            renderEventGroupOptions(selectedEventGroups());
            if (activeImportBatch) {
              renderImportRows(importRowsCache);
            }
          } catch {
            memberStatus.textContent = "Unable to reach API. Start npm run dev:api first.";
            memberDirectorySource = [];
            memberTableBody.innerHTML = "<tr><td colspan='7' class='muted'>Unable to reach API.</td></tr>";
            memberOutput.textContent = "";
            memberCount.textContent = "";
            updateModeratorOptions();
          }
        }

        if (logoutButton) {
          logoutButton.addEventListener("click", async () => {
            if (!authToken) {
              window.location.hash = "#access";
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
              window.location.hash = "#access";
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

          function sanitizeEmail(value) {
            return String(value || "").trim();
          }

          function sanitizeName(value) {
            return String(value || "").trim();
          }

        function applyMemberFilter() {
          const term = String(memberSearch.value || "").trim().toLowerCase();
          if (!term) {
            renderMembers(memberDirectorySource);
            return;
          }
          const filtered = memberDirectorySource.filter((member) => {
            const name = String(member.fullName || member.username || "").toLowerCase();
            const email = String(member.email || "").toLowerCase();
            const groups = Array.isArray(member.groups) ? member.groups.join(" ").toLowerCase() : "";
            const roles = Array.isArray(member.roles) ? member.roles.join(" ").toLowerCase() : "";
            const organisation = String(member.organisation || member.company || "").toLowerCase();
            return (
              name.includes(term) ||
              email.includes(term) ||
              groups.includes(term) ||
              roles.includes(term) ||
              organisation.includes(term)
            );
          });
          renderMembers(filtered);
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
              organisation: String(member.organisation || member.company || "").trim(),
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
              organisation: String(row.organisation || "").trim(),
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
                organisation: String(row.organisation || "").trim(),
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
            importEditOrganisationInput.value = row.organisation || "";
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
            "<div class='import-empty-illustration' aria-hidden='true'>Ã°Å¸â€œâ€ž</div>" +
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
            eventCardList.innerHTML =
              "<div class='event-empty-state'>" +
              "<h3>No events in this view</h3>" +
              "<p class='muted'>Use Create Meeting to schedule your next session.</p>" +
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
              const audienceLabel = escapeClientHtml(eventItem.audienceLabel || "All Members");

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
            eventStatus.textContent = "Unable to reach the Event Hub API. Start npm run dev:api first.";
          }
        }

        refreshButton.addEventListener("click", () => {
          loadMembers();
        });

        memberSearch.addEventListener("input", () => {
          applyMemberFilter();
        });

        memberAddForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!authToken) {
            memberAddStatus.textContent = "Sign in to add members.";
            return;
          }

          const fullName = sanitizeName(memberAddNameInput.value);
          const email = sanitizeEmail(memberAddEmailInput.value);
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
              body: JSON.stringify({ fullName, email, groups })
            });
            const json = await response.json();
            if (!response.ok) {
              memberAddStatus.textContent = json.message || "Unable to add member.";
              return;
            }
            if (Number(json.inviteQueued || 0) > 0) {
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
              ".";

            await loadImportBatch(batchId);
            await loadMembers();
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
          eventStatus.textContent = isEditing ? "Updating meeting..." : "Creating meeting...";
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
            if (isEditing) {
              resetEventFormState("Meeting updated.");
            } else {
              const clashWarning =
                json && json.clashWarning && json.clashWarning.hasClash ? json.clashWarning : null;
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
                eventStatus.textContent =
                  "Meeting created (id " +
                  json.id +
                  "). Time overlap detected with " +
                  conflictCount +
                  " existing meeting(s)." +
                  conflictSummary +
                  " Proceed is allowed, but shared members may need to choose one meeting.";
              } else {
                eventStatus.textContent = "Meeting created (id " + json.id + ").";
              }
              eventForm.reset();
              setEventGroupSelections([]);
              resetEventFormValidation();
            }
            await loadEvents();
          } catch {
            eventStatus.textContent = isEditing
              ? "Unable to reach API to update meeting."
              : "Unable to reach API to create meeting.";
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

        async function handleLogin(event) {
          if (event) {
            event.preventDefault();
          }
          status.textContent = "Signing in...";

          const formData = new FormData(form);
          const payload = {
            username: String(formData.get("username") || "").trim(),
            password: String(formData.get("password") || "")
          };

          try {
            const response = await fetch("${config.apiBaseUrl}/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            const json = await response.json();
            if (!response.ok) {
              status.textContent = "Sign in failed: " + (json.message || "Invalid credentials.");
              return;
            }

            setAuthToken(json.token, json.user.role, json.user.username);
            window.location.hash = "#overview";
            await loadMembers();
            await loadEvents();
            await loadDeliveries();
            await loadQueueStatus();
            await loadReports();
            await loadModerators();
          } catch {
            status.textContent = "Sign in failed: unable to reach API.";
          }
        }

        form.addEventListener("submit", handleLogin);

        renderMemberGroupOptions();
        renderEventGroupOptions();
        persistHelpAndTooltips();
        setAuthToken(authToken, authRole, authUsername);
        if (authToken && (!window.location.hash || window.location.hash === "#access")) {
          window.location.hash = "#overview";
        }
        loadMembers();
        loadEvents();
        loadDeliveries();
        loadQueueStatus();
        loadReports();
        loadModerators();
      </script>
    `
  });
}

export function renderActivationPage(config) {
  return htmlLayout({
    title: "IWFSA | Activate Account",
    appBaseUrl: config.appBaseUrl,
    currentPath: "/member",
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

            activateStatus.textContent = "Account activated. Continue to Member Portal sign in.";
            if (appBaseUrl) {
              window.setTimeout(() => {
                window.location.assign(appBaseUrl + "/member");
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
    currentPath: "/member",
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

            resetStatus.textContent = "Password reset complete. Continue to Member Portal sign in.";
            if (appBaseUrl) {
              window.setTimeout(() => {
                window.location.assign(appBaseUrl + "/member");
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
    currentPath: "/member",
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
