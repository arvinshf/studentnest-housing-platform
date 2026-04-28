
// auth.js — client-side fallback auth using localStorage
// NOTE: this is a legacy file from before the Django backend was built.
// The real authentication now happens in auth-backend.js via the API.
// This file still runs on the signup page as a fallback layer.

(function () {
  // the key we use to store the users list in localStorage
  const STORAGE_KEY = "studianest_users_v1";

  // a separate key for tracking who is currently logged in
  const SESSION_KEY = "studianest_session_v1";

  // read all stored users from localStorage, or return an empty array if nothing is saved
  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; } // if parsing fails (corrupted data), just start fresh
  }

  // write the updated users array back into localStorage
  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  // save a simple session object so we know who is logged in
  function setSession(email) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, ts: Date.now() }));
    // ts is the timestamp — useful if we ever want to expire sessions
  }

  // remove the session — called on logout
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // retrieve the current session, or return null if no one is logged in
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; } // if the stored value is corrupted, treat it as no session
  }

  // shorthand helper — saves typing document.getElementById every time
  function byId(id){ return document.getElementById(id); }

  // ===== Signup stepper (TeleportHQ tabs) =====
  // this sets up the multi-step form navigation (step 1, step 2, step 3 tabs)
  (function initSignupStepper(){
    // find all the tab trigger buttons that have a data-step attribute
    const triggers = document.querySelectorAll(".signup-tab-trigger[data-step]");
    // find all the step panels (the content sections for each step)
    const panels = document.querySelectorAll(".signup-step-panel[id^='step-']");
    if (!triggers.length || !panels.length) return; // if the stepper isn't on this page, do nothing

    // show a specific step by toggling the 'active' class
    function showStep(step) {
      panels.forEach(p => p.classList.toggle("active", p.id === "step-" + step));
      // add 'active' to the matching panel, remove it from all others
      triggers.forEach(t => t.classList.toggle("active", t.getAttribute("data-step") === String(step)));
      // highlight the matching tab trigger too
    }

    // wire up each tab trigger so clicking it switches to that step
    triggers.forEach(t => {
      t.addEventListener("click", (e) => {
        e.preventDefault(); // stop the browser from trying to follow a link
        showStep(t.getAttribute("data-step")); // jump to whichever step this button represents
      });
    });

    // the "Get Started" button on the landing section — takes you to step 1 and scrolls there
    const startBtn = document.getElementById("startRegistration");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep("1"); // jump to the first step of the form
        const form = document.querySelector("section.signup-form-section");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
        // smooth scroll so it feels polished rather than jarring
      });
    }
  })(); // immediately invoke this function so the stepper is ready as soon as the script loads


  // show a styled message box inside the page instead of using a browser alert popup
  function showInlineMessage(containerId, msg, ok) {
    const el = byId(containerId);
    if (!el) { alert(msg); return; } // fallback to alert if the container doesn't exist
    el.textContent = msg; // write the message text
    el.style.display = "block"; // make sure the container is visible
    el.style.borderColor = ok ? "rgba(0,200,120,0.55)" : "rgba(255,52,96,0.55)";
    // green border for success, red border for errors
    el.style.background = ok ? "rgba(0,200,120,0.12)" : "rgba(255,52,96,0.16)";
    // matching soft green or red background tint
  }

  // hash a string using SHA-256 via the browser's built-in Web Crypto API
  // returns a lowercase hex string like "a3f2c9..."
  async function sha256Hex(text) {
    const enc = new TextEncoder(); // converts the string to bytes
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(text)); // produce the hash
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    // convert each byte to a 2-digit hex string and join them all together
  }

  // generate a random salt — a random hex string used to make each password hash unique
  // even if two users have the same password, their hashes will differ because of different salts
  function randomSalt(len=16) {
    const arr = new Uint8Array(len); // allocate 16 bytes of space
    crypto.getRandomValues(arr); // fill with cryptographically random values
    return Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
    // turn the random bytes into a hex string
  }

  // ===== Signup form submission =====
  const signupForm = document.querySelector('form.signup-tabs-content');
  if (signupForm) { // only wire this up if the signup form exists on the current page
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // stop the default browser form POST — we handle everything ourselves

      // read and clean up each field value
      const name = (byId("full-name")?.value || "").trim();
      const email = (byId("email-addr")?.value || "").trim().toLowerCase();
      // always lowercase emails so "John@gmail.com" and "john@gmail.com" are treated as the same
      const studentId = (byId("uni-id")?.value || "").trim();
      const course = (byId("course")?.value || "").trim();
      const password = byId("pass-key")?.value || "";
      const password2 = byId("pass-key-confirm")?.value || "";

      // validate each field before doing anything else
      if (name.length < 3) return showInlineMessage("authMsg", "Name must be at least 3 characters.", false);
      if (!email || !email.includes("@")) return showInlineMessage("authMsg", "Please enter a valid email.", false);
      // optional: enforce uni email
      // if (!email.endsWith("@westminster.ac.uk")) return showInlineMessage("authMsg", "Use your university email (@westminster.ac.uk).", false);

      if (!/^\d{8}$/.test(studentId)) return showInlineMessage("authMsg", "Student ID must be exactly 8 digits.", false);
      // ^\d{8}$ means: start, exactly 8 digits, end — no letters or symbols allowed
      if (course.length < 2) return showInlineMessage("authMsg", "Please enter your course.", false);
      if (password.length < 12) return showInlineMessage("authMsg", "Password must be at least 12 characters.", false);
      if (password2 && password !== password2) return showInlineMessage("authMsg", "Passwords do not match.", false);

      // check if an account with this email already exists in localStorage
      const users = loadUsers();
      if (users.some(u => u.email === email)) {
        return showInlineMessage("authMsg", "An account with this email already exists. Please log in.", false);
      }

      // create a salt and hash the password — never store the raw password
      const salt = randomSalt();
      const passHash = await sha256Hex(salt + password);
      // prepend the salt before hashing so the same password produces different hashes for different users

      // save the new user record into localStorage
      users.push({ name, email, studentId, course, salt, passHash, createdAt: Date.now() });
      saveUsers(users); // persist the updated list
      setSession(email); // log the user in immediately after registration

      showInlineMessage("authMsg", "Account created successfully! Redirecting…", true);
      setTimeout(() => { window.location.href = "portal.html"; }, 800);
      // wait 800ms so the user can see the success message before being redirected
    });
  }

  // ===== Terms "Sign Up" button wiring =====
  // this is the final submit button on the terms/consent step — not the form's own submit button
  const signupBtn = document.getElementById("signupButton");
  if (signupBtn) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault(); // stop any default button behaviour

      // make sure the user has ticked the consent checkbox before proceeding
      const consent = document.getElementById("legalConsent");
      if (consent && !consent.checked) {
        return showInlineMessage("authMsg", "Please tick the consent checkbox to continue.", false);
      }

      // ask the browser to validate all required fields and show its native validation messages
      if (signupForm && typeof signupForm.reportValidity === "function") {
        const ok = signupForm.reportValidity();
        if (!ok) {
          // scroll to the first invalid field so it doesn't feel like "nothing happened"
          const firstInvalid = signupForm.querySelector(":invalid");
          if (firstInvalid && typeof firstInvalid.scrollIntoView === "function") {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return; // stop here — the browser will show which field failed
        }
      }

      // everything is valid — trigger the actual form submit event to run our signup handler above
      if (signupForm && typeof signupForm.requestSubmit === "function") {
        signupForm.requestSubmit(); // preferred method — respects validation
      } else if (signupForm) {
        // fallback for older browsers that don't support requestSubmit
        signupForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  }
})(); // the outer IIFE closes here — everything above is scoped inside it, so no global variable pollution

