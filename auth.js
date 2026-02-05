
(function () {
  const STORAGE_KEY = "studianest_users_v1";
  const SESSION_KEY = "studianest_session_v1";

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  function setSession(email) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, ts: Date.now() }));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }
  function byId(id){ return document.getElementById(id); }

  // ===== Signup stepper (TeleportHQ tabs) =====
  (function initSignupStepper(){
    const triggers = document.querySelectorAll(".signup-tab-trigger[data-step]");
    const panels = document.querySelectorAll(".signup-step-panel[id^='step-']");
    if (!triggers.length || !panels.length) return;

    function showStep(step) {
      panels.forEach(p => p.classList.toggle("active", p.id === "step-" + step));
      triggers.forEach(t => t.classList.toggle("active", t.getAttribute("data-step") === String(step)));
    }

    triggers.forEach(t => {
      t.addEventListener("click", (e) => {
        e.preventDefault();
        showStep(t.getAttribute("data-step"));
      });
    });

    const startBtn = document.getElementById("startRegistration");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep("1");
        const form = document.querySelector("section.signup-form-section");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  })();


  function showInlineMessage(containerId, msg, ok) {
    const el = byId(containerId);
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.style.display = "block";
    el.style.borderColor = ok ? "rgba(0,200,120,0.55)" : "rgba(255,52,96,0.55)";
    el.style.background = ok ? "rgba(0,200,120,0.12)" : "rgba(255,52,96,0.16)";
  }

  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function randomSalt(len=16) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
  }

  // ===== Signup =====
  const signupForm = document.querySelector('form.signup-tabs-content');
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (byId("full-name")?.value || "").trim();
      const email = (byId("email-addr")?.value || "").trim().toLowerCase();
      const studentId = (byId("uni-id")?.value || "").trim();
      const course = (byId("course")?.value || "").trim();
      const password = byId("pass-key")?.value || "";
      const password2 = byId("pass-key-confirm")?.value || "";

      if (name.length < 3) return showInlineMessage("authMsg", "Name must be at least 3 characters.", false);
      if (!email || !email.includes("@")) return showInlineMessage("authMsg", "Please enter a valid email.", false);
      // optional: enforce uni email
      // if (!email.endsWith("@westminster.ac.uk")) return showInlineMessage("authMsg", "Use your university email (@westminster.ac.uk).", false);

      if (!/^\d{8}$/.test(studentId)) return showInlineMessage("authMsg", "Student ID must be exactly 8 digits.", false);
      if (course.length < 2) return showInlineMessage("authMsg", "Please enter your course.", false);
      if (password.length < 12) return showInlineMessage("authMsg", "Password must be at least 12 characters.", false);
      if (password2 && password !== password2) return showInlineMessage("authMsg", "Passwords do not match.", false);

      const users = loadUsers();
      if (users.some(u => u.email === email)) {
        return showInlineMessage("authMsg", "An account with this email already exists. Please log in.", false);
      }

      const salt = randomSalt();
      const passHash = await sha256Hex(salt + password);

      users.push({ name, email, studentId, course, salt, passHash, createdAt: Date.now() });
      saveUsers(users);
      setSession(email);

      showInlineMessage("authMsg", "Account created successfully! Redirecting…", true);
      setTimeout(() => { window.location.href = "portal.html"; }, 800);
    });
  }

  // ===== Terms "Sign Up" button wiring =====
  const signupBtn = document.getElementById("signupButton");
  if (signupBtn) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const consent = document.getElementById("legalConsent");
      if (consent && !consent.checked) {
        return showInlineMessage("authMsg", "Please tick the consent checkbox to continue.", false);
      }

      // If the form has required fields, make the browser show which one is missing
      if (signupForm && typeof signupForm.reportValidity === "function") {
        const ok = signupForm.reportValidity();
        if (!ok) {
          // Scroll to the first invalid field so it doesn't feel like "nothing happened"
          const firstInvalid = signupForm.querySelector(":invalid");
          if (firstInvalid && typeof firstInvalid.scrollIntoView === "function") {
            firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      }

      // Trigger the real signup form submission (so data is saved + login works)
      if (signupForm && typeof signupForm.requestSubmit === "function") {
        signupForm.requestSubmit();
      } else if (signupForm) {
        // Fallback for older browsers
        signupForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  }
})();

