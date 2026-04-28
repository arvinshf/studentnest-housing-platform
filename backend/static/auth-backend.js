
// auth-backend.js — handles all signup and login logic by talking to the Django API
// this is the main authentication file used in production (replaces the localStorage-only auth.js)

// wrap everything in an IIFE so our variables don't leak into the global scope
(function () {
  const API_BASE_URL = "/api"; // the base path for all API calls — relative so it works on any domain

  // shorthand helper to avoid typing document.getElementById over and over
  function byId(id){ return document.getElementById(id); }

  // reads a specific cookie from the browser — used to get the CSRF token
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';'); // split the cookie string into individual cookies
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim(); // remove leading/trailing whitespace
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          // found the cookie we're looking for
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          // decode any URL-encoded characters like %3D back to =
          break; // no need to keep looping once we've found it
        }
      }
    }
    return cookieValue; // returns null if the cookie wasn't found
  }

  // specifically retrieves the CSRF token — Django sets this cookie automatically
  function getCSRFToken() {
    return getCookie('csrftoken');
    // Django requires this token on POST/PUT/DELETE requests to prevent cross-site forgery attacks
  }

  // guard against running twice if this script gets loaded more than once on the same page
  if (window.authBackendInitialized) {
    console.log("Auth backend already initialized, skipping...");
    return; // exit immediately — nothing to do
  }
  window.authBackendInitialized = true; // mark as initialized so the guard above works next time

  // the main init function — runs after the DOM is ready
  function initAuth() {
    console.log("DEBUG: initAuth called");

    // ===== Signup stepper (multi-step form tabs) =====
    // sets up the multi-step form tabs (step 1, step 2, step 3)
  (function initSignupStepper(){
    const triggers = document.querySelectorAll(".signup-tab-trigger[data-step]");
    // find all tab buttons that have a data-step attribute
    const panels = document.querySelectorAll(".signup-step-panel[id^='step-']");
    // find all the content panels for each step
    if (!triggers.length || !panels.length) return; // if no stepper on this page, stop here

    // switches to the given step number — hides all other panels and highlights the right tab
    function showStep(step) {
      panels.forEach(p => p.classList.toggle("active", p.id === "step-" + step));
      triggers.forEach(t => t.classList.toggle("active", t.getAttribute("data-step") === String(step)));
    }

    // attach click handlers to each tab trigger
    triggers.forEach(t => {
      t.addEventListener("click", (e) => {
        e.preventDefault(); // don't follow any href
        showStep(t.getAttribute("data-step")); // jump to whichever step this button represents
      });
    });

    // the hero "Get Started" button scrolls to the form and activates step 1
    const startBtn = document.getElementById("startRegistration");
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showStep("1"); // jump to step 1
        const form = document.querySelector("section.signup-form-section");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
        // smooth scroll so the transition feels natural
      });
    }

    // password strength checker — shows a live popup as the user types their password
    const passwordInput = byId("pass-key");
    if (passwordInput) {
      // build the requirements popup div programmatically
      const popup = document.createElement('div');
      popup.id = 'password-requirements';
      popup.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 16px;
        padding: 20px;
        right: calc(100% + 20px);
        top: 0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        display: none;
        z-index: 1000;
        min-width: 320px;
        backdrop-filter: blur(10px);
      `; // absolutely positioned to the left of the password input
      
      // the inner HTML shows three requirements the user needs to satisfy
      popup.innerHTML = `
        <div style="color: white; font-weight: 700; font-size: 15px; margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          Password Requirements:
        </div>
        <div id="req-length" style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0; display: flex; align-items: center; transition: all 0.3s;">
          <span style="margin-right: 10px; font-size: 18px;">○</span>
          At least 12 characters
        </div>
        <div id="req-capital" style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0; display: flex; align-items: center; transition: all 0.3s;">
          <span style="margin-right: 10px; font-size: 18px;">○</span>
          One uppercase letter
        </div>
        <div id="req-special" style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 8px 0; display: flex; align-items: center; transition: all 0.3s;">
          <span style="margin-right: 10px; font-size: 18px;">○</span>
          One special character (. - $ # @ ! etc.)
        </div>
      `;
      
      passwordInput.parentElement.style.position = 'relative';
      // the parent needs position:relative so the popup's absolute position is relative to it
      passwordInput.parentElement.appendChild(popup); // inject the popup next to the input

      // updates a single requirement row — turns it green with a tick if the condition is met
      function updateRequirement(id, met) {
        const elem = document.getElementById(id);
        if (elem) {
          const icon = elem.querySelector('span'); // the ○ or ✓ icon
          if (met) {
            elem.style.color = '#4ade80'; // green text
            elem.style.fontWeight = '600';
            icon.textContent = '✓'; // tick mark
            icon.style.color = '#4ade80';
          } else {
            elem.style.color = 'rgba(255,255,255,0.7)'; // dim white
            elem.style.fontWeight = '400';
            icon.textContent = '○'; // empty circle
            icon.style.color = 'rgba(255,255,255,0.5)';
          }
        }
      }

      // show the popup when the user clicks into the password field
      passwordInput.addEventListener('focus', () => {
        popup.style.display = 'block';
        popup.style.animation = 'fadeIn 0.3s ease-out'; // fade in smoothly
      });

      // hide the popup after a short delay when the user leaves the field
      passwordInput.addEventListener('blur', () => {
        setTimeout(() => {
          popup.style.display = 'none';
        }, 200); // small delay so clicking a requirement doesn't immediately hide it
      });

      // check the password rules on every keystroke and update the requirement indicators
      passwordInput.addEventListener('input', (e) => {
        const value = e.target.value;
        updateRequirement('req-length', value.length >= 12); // at least 12 characters
        updateRequirement('req-capital', /[A-Z]/.test(value)); // at least one uppercase letter
        updateRequirement('req-special', /[.\$#@!%^&*()_+=\[\]{}|;:'",<>?\/~`-]/.test(value)); // at least one special character
      });
    }
  })(); // end of initSignupStepper — runs immediately


  // shows a small coloured message box inside the page instead of a browser alert
  function showInlineMessage(containerId, msg, ok) {
    const el = byId(containerId);
    if (!el) { alert(msg); return; } // fallback if the container element doesn't exist
    el.textContent = msg; // write the message
    el.style.display = "block"; // make it visible
    el.style.borderColor = ok ? "rgba(0,200,120,0.55)" : "rgba(255,52,96,0.55)";
    // green border for success, red border for errors
    el.style.background = ok ? "rgba(0,200,120,0.12)" : "rgba(255,52,96,0.16)";
    // matching soft green or red background tint
  }

  // creates and displays an animated 3D success popup after a successful signup
  function showSuccessPopup() {
    // the full-screen overlay with blur background
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;

    // the card that holds the checkmark, title, and message
    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 60px 80px;
      border-radius: 30px;
      text-align: center;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 100px rgba(102, 126, 234, 0.4);
      transform: scale(0.7) rotateX(-15deg);
      animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      transform-style: preserve-3d;
      perspective: 1000px;
    `; // the cubic-bezier gives it the satisfying overshoot bounce effect

    // animated SVG checkmark circle — draws itself using stroke-dashoffset animation
    const checkmark = document.createElement('div');
    checkmark.innerHTML = `
      <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: 20px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));">
        <circle cx="60" cy="60" r="54" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="4" 
          style="animation: checkCircle 0.6s ease-out 0.3s forwards; stroke-dasharray: 340; stroke-dashoffset: 340;"/>
        <path d="M35 60 L52 77 L85 44" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"
          style="animation: checkMark 0.4s ease-out 0.7s forwards; stroke-dasharray: 70; stroke-dashoffset: 70;"/>
      </svg>
    `; // stroke-dashoffset trick: start with the dash offset equal to the total path length, then animate to 0

    // "Welcome Aboard!" heading
    const title = document.createElement('h2');
    title.textContent = 'Welcome Aboard!';
    title.style.cssText = `
      color: white;
      font-size: 42px;
      font-weight: 800;
      margin: 20px 0 15px 0;
      text-shadow: 0 4px 10px rgba(0,0,0,0.3);
      animation: slideUp 0.5s ease-out 0.4s both;
    `;

    // success message below the title
    const message = document.createElement('p');
    message.textContent = 'Your account has been created successfully';
    message.style.cssText = `
      color: rgba(255, 255, 255, 0.95);
      font-size: 18px;
      margin: 0 0 10px 0;
      animation: slideUp 0.5s ease-out 0.5s both;
    `;

    // pulsing "redirecting..." text at the bottom
    const redirect = document.createElement('p');
    redirect.textContent = 'Redirecting to dashboard...';
    redirect.style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      margin: 0;
      animation: slideUp 0.5s ease-out 0.6s both, pulse 1s ease-in-out 1s infinite;
    `;

    // inject all the CSS keyframe animations the popup uses
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes popIn {
        0% { transform: scale(0.7) rotateX(-15deg) rotateY(10deg); opacity: 0; }
        50% { transform: scale(1.05) rotateX(5deg) rotateY(-5deg); }
        100% { transform: scale(1) rotateX(0deg) rotateY(0deg); opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes checkCircle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes checkMark {
        to { stroke-dashoffset: 0; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `;

    document.head.appendChild(style); // inject the animation styles into the page
    // assemble and attach the popup to the DOM
    card.appendChild(checkmark);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(redirect);
    popup.appendChild(card);
    document.body.appendChild(popup); // add to the page — it covers everything because of z-index: 9999
  }

  // ===== Signup form submission =====
  const signupForm = document.querySelector('form.signup-tabs-content');
  console.log("DEBUG: Signup form found:", signupForm);
  console.log("DEBUG: Form element:", signupForm ? signupForm.tagName : "NOT FOUND");
  
  if (signupForm) { // only attach the handler if the form actually exists on this page
    console.log("DEBUG: Attaching submit event listener to form");
    signupForm.addEventListener("submit", async (e) => {
      console.log("DEBUG: Submit event fired!");
      e.preventDefault(); // stop the browser doing a full page POST
      console.log("DEBUG: preventDefault() called");

      // collect and clean all the form field values
      const firstName = (byId("first-name")?.value || "").trim();
      const surname = (byId("surname")?.value || "").trim();
      const name = firstName + " " + surname; // combine into full name for the API
      const email = (byId("email-addr")?.value || "").trim().toLowerCase();
      // always lowercase emails to avoid duplicate accounts from capitalisation differences
      const phone = (byId("phone-number")?.value || "").trim(); // optional phone field
      const city = (byId("city-field")?.value || "").trim(); // optional city field
      const password = byId("pass-key")?.value || "";
      const password2 = byId("pass-key-confirm")?.value || "";

      // debug logs — helpful when testing to see exactly what got read from the form
      console.log("DEBUG - firstName value:", firstName);
      console.log("DEBUG - surname value:", surname);
      console.log("DEBUG - email value:", email);
      console.log("DEBUG - password length:", password.length);

      // check all required fields are filled before sending anything to the server
      if (!firstName || !surname || !email || !password || !password2) {
        console.log("VALIDATION FAILED - Missing required fields");
        return showInlineMessage("authMsg", "All fields must be filled out.", false);
      }

      // individual field validations
      if (firstName.length < 2) return showInlineMessage("authMsg", "First name must be at least 2 characters.", false);
      if (surname.length < 2) return showInlineMessage("authMsg", "Surname must be at least 2 characters.", false);
      if (!email || !email.includes("@")) return showInlineMessage("authMsg", "Please enter a valid email.", false);
      if (password.length < 12) return showInlineMessage("authMsg", "Password must be at least 12 characters.", false);
      if (!/[A-Z]/.test(password)) return showInlineMessage("authMsg", "Password must contain at least one uppercase letter.", false);
      // check for at least one special character
      if (!/[.\$#@!%^&*()_+=\[\]{}|;:'",<>?/~`-]/.test(password)) return showInlineMessage("authMsg", "Password must contain at least one special character (. - $ # @ ! etc.).", false);
      if (password2 && password !== password2) return showInlineMessage("authMsg", "Passwords do not match.", false);

      // all validation passed — send the signup request to the Django API
      try {
        console.log("Sending signup request to:", `${API_BASE_URL}/signup/`);
        
        const csrfToken = getCSRFToken(); // grab the CSRF token from the cookie
        console.log("CSRF Token:", csrfToken ? "Found" : "Not found");
        
        const response = await fetch(`${API_BASE_URL}/signup/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // tell Django we're sending JSON
            'X-CSRFToken': csrfToken || '', // required by Django's CSRF middleware
          },
          credentials: 'include', // send the session cookie with the request
          body: JSON.stringify({
            name: name,
            email: email,
            student_id: "00000000", // default placeholder — the backend accepts this
            course: "Not Specified", // default placeholder
            phone: phone,
            city: city,
            password: password,
            password_confirm: password2 // Django checks these match on the server side too
          })
        });

        console.log("Response status:", response.status);
        const data = await response.json(); // parse the JSON response body
        console.log("Response data:", data);

        if (response.ok) {
          // signup succeeded — show the animated success popup then redirect to portal
          showSuccessPopup();
          setTimeout(() => { window.location.href = "portal.html"; }, 3000);
          // 3 second delay lets the user enjoy the success animation
        } else {
          // something went wrong — show the first validation error from the server
          if (data.errors) {
            console.log("Validation errors:", data.errors);
            const firstError = Object.values(data.errors)[0]; // get the first error message
            const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
            showInlineMessage("authMsg", errorMsg, false);
          } else {
            showInlineMessage("authMsg", data.message || "Signup failed. Please try again.", false);
          }
        }
      } catch (error) {
        // network error — server is probably not running
        console.error("Signup error:", error);
        showInlineMessage("authMsg", "Connection error. Is the Django server running at http://127.0.0.1:8000?", false);
      }
    });
  }

  // ===== Login form submission =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) { // only attach if the login form is on this page
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // stop default browser form submission
      console.log("Login form submitted");

      const email = (byId("email")?.value || "").trim().toLowerCase();
      const password = byId("password")?.value || "";

      // basic check before hitting the API
      if (!email || !password) {
        return showInlineMessage("loginMsg", "Please enter both email and password.", false);
      }

      // send login credentials to the Django API
      try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // essential — this is how the session cookie gets set
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        const data = await response.json();

        if (response.ok) {
          // login successful — Django has created a session and set the cookie
          showInlineMessage("loginMsg", data.message || "Login successful! Redirecting…", true);
          setTimeout(() => { window.location.href = "portal.html"; }, 800);
          // small delay so the user sees the success message
        } else {
          // wrong credentials or account doesn't exist
          showInlineMessage("loginMsg", data.message || "Login failed. Please try again.", false);
        }
      } catch (error) {
        console.error("Login error:", error);
        showInlineMessage("loginMsg", "Connection error. Make sure the backend server is running.", false);
      }
    });
  }

  // ===== Top Signup button wiring =====
  // this is a secondary "Sign Up" button separate from the form's own submit button
  const topSignupBtn = document.getElementById("topSignupButton");
  console.log("Top signup button found:", topSignupBtn);
  
  if (topSignupBtn) {
    topSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Top signup button clicked!");

      // programmatically submit the signup form
      if (signupForm && typeof signupForm.requestSubmit === "function") {
        console.log("Using requestSubmit");
        signupForm.requestSubmit(); // preferred — triggers validation too
      } else if (signupForm) {
        console.log("Using dispatchEvent fallback");
        // fallback for older browsers that don't support requestSubmit
        signupForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      } else {
        console.error("Signup form not found!");
      }
    });
  }

  // ===== Session check =====
  // checks with the Django API whether the current user has an active session
  // used by portal.js and other pages to decide whether to show protected content
  async function checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        credentials: 'include' // send the session cookie so Django can identify the user
      });
      const data = await response.json();
      
      if (data.authenticated && data.student) {
        console.log("User authenticated:", data.student);
        return data.student; // return the student object so the caller can use it
      }
      return null; // not logged in
    } catch (error) {
      console.error("Auth check error:", error);
      return null; // treat any error as "not authenticated"
    }
  }

  // expose checkAuth globally so other scripts (like portal.js) can call window.checkAuth()
  window.checkAuth = checkAuth;

  } // end of initAuth function

  // run initAuth as soon as the DOM is ready — or immediately if it already is
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
    // DOM not ready yet — wait for it
  } else {
    initAuth(); // DOM already loaded — run straight away
  }
})(); // close the outer IIFE