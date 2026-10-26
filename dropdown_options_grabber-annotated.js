/*
Dropdown Options Grabber, annotated readable version

Same logic as dropdown_options_grabber-bookmarklet.txt, spread out and
commented for reading. Do NOT paste this multi-line version into a
bookmark URL field. Use the one-line bookmarklet for the bookmark.

WHAT IT DOES
  1. Shows an alert telling you to open the dropdown you care about.
  2. Five seconds after you click OK, it captures every option from
       a) every native <select> element on the page, and
       b) any custom dropdown currently open, meaning elements marked
          role="option" (used by most JavaScript dropdown widgets,
          which only render their options while open).
  3. Shows the results in a floating panel in the top right corner,
     grouped under a heading per dropdown, with a "Copy all" button.

WHY THE 5 SECOND DELAY
  Custom dropdowns usually build their option list only while open and
  remove it when closed. Clicking the bookmarklet would close an open
  dropdown, so the script waits, giving you time to open it first.

WHAT IT TOUCHES
  Read-only on the page's content. It makes no network requests. The
  only thing it adds to the page is its own panel.
*/

(() => {
  // ---------------------------------------------------------------
  // grab: runs once, 5 seconds after the alert is dismissed.
  // ---------------------------------------------------------------
  const grab = () => {
    // Each entry is either a heading { h: 'text' } or an option
    // { o: 'text' }. Kept as one flat list so headings and their
    // options stay in page order.
    const lines = [];

    // -------------------------------------------------------------
    // SOURCE 1: native <select> dropdowns.
    // These keep all their <option> elements in the page at all
    // times, so they can be read whether open or closed.
    // Heading uses the select's name, else its id, else its position
    // on the page (#1, #2, ...).
    // -------------------------------------------------------------
    document.querySelectorAll('select').forEach((s, i) => {
      lines.push({ h: 'Dropdown: ' + (s.name || s.id || ('#' + (i + 1))) });
      [...s.options].forEach((o) => lines.push({ o: o.text.trim() }));
    });

    // -------------------------------------------------------------
    // SOURCE 2: custom (JavaScript) dropdowns that are open right now.
    // Accessible widgets mark each choice with role="option". Only
    // the one you opened is normally present, so these are grouped
    // under a single "Open dropdown" heading.
    // -------------------------------------------------------------
    const opts = [...document.querySelectorAll('[role="option"]')];
    if (opts.length) {
      lines.push({ h: 'Open dropdown' });
      opts.forEach((o) => lines.push({ o: o.textContent.trim() }));
    }

    // -------------------------------------------------------------
    // Plain-text version for the clipboard. Headings flush left,
    // options indented two spaces, one per line.
    // -------------------------------------------------------------
    const text = lines.map((l) => (l.h ? l.h : '  ' + l.o)).join('\n') || 'No options found.';

    // -------------------------------------------------------------
    // BUILD THE PANEL.
    // host = the one element added to the page, pinned top right.
    // The panel lives inside a shadow root attached to host, so the
    // page's CSS can't restyle it and its CSS can't leak into the page.
    // NOTE: mode 'open' means the page's own scripts CAN reach inside
    // via host.shadowRoot. 'closed' would hide the contents.
    // -------------------------------------------------------------
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647';
    const sh = host.attachShadow({ mode: 'open' });

    // Panel styles and skeleton. Class names are short on purpose:
    //   .p panel   .t title bar   .x close button   .b scrolling body
    //   .h heading .o option row  .e empty message  .f footer
    //   .c copy button            .s copy status text
    sh.innerHTML =
      '<style>' +
        '.p{width:380px;max-height:70vh;display:flex;flex-direction:column;background:#fff;color:#1a1a1a;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:14px/1.4 system-ui,sans-serif;overflow:hidden}' +
        '.t{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#1f2937;color:#fff;font-weight:600}' +
        '.x{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}' +
        '.b{overflow:auto;padding:8px 14px}' +
        '.h{margin:10px 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280}' +
        '.o{padding:6px 8px;border-radius:6px;background:#f3f4f6;margin:3px 0}' +
        '.e{color:#b91c1c;padding:8px 0}' +
        '.f{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #e5e7eb}' +
        '.c{flex:1;padding:9px;border:0;border-radius:6px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer}' +
        '.s{font-size:12px;color:#059669;align-self:center}' +
      '</style>' +
      '<div class="p">' +
        '<div class="t">Dropdown options<button class="x" title="Close">&times;</button></div>' +
        '<div class="b"></div>' +
        '<div class="f"><button class="c">Copy all</button><span class="s"></span></div>' +
      '</div>';

    // -------------------------------------------------------------
    // FILL THE BODY.
    // Nothing found: show a hint. Otherwise one row per heading or
    // option. textContent (not innerHTML) is used for the page's
    // option text, so any HTML in it is shown as text, never run.
    // -------------------------------------------------------------
    const body = sh.querySelector('.b');
    if (!lines.length) {
      body.innerHTML =
        '<div class="e">No options found. Run it again and open the dropdown within 5 seconds of clicking OK.</div>';
    }
    lines.forEach((l) => {
      const d = document.createElement('div');
      d.className = l.h ? 'h' : 'o';
      d.textContent = l.h || l.o;
      body.appendChild(d);
    });

    // -------------------------------------------------------------
    // BUTTONS.
    // x    removes the whole panel.
    // Copy tries the modern clipboard API first. If it's missing or
    // refused (some sites block it), falls back to the older method,
    // a hidden temporary textarea plus execCommand('copy'), which is
    // removed right after.
    // -------------------------------------------------------------
    const st = sh.querySelector('.s');
    sh.querySelector('.x').onclick = () => host.remove();
    sh.querySelector('.c').onclick = () => {
      const done = () => {
        st.textContent = 'Copied';
      };
      const fb = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch (e) {
          st.textContent = 'Copy failed';
        }
        ta.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fb);
      } else {
        fb();
      }
    };

    // Show the panel.
    document.body.appendChild(host);
  };

  // ---------------------------------------------------------------
  // START: prompt, then capture 5 seconds after OK is clicked.
  // alert() blocks until dismissed, so the timer starts at OK.
  // ---------------------------------------------------------------
  alert('Click OK, then open the dropdown. Options are captured 5 seconds later.');
  setTimeout(grab, 5000);
})();
