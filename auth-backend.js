
// Backend API Configuration
(function () {
  const API_BASE_URL = "https://studentnest-housing-platform.onrender.com/api";

  function byId(id){ return document.getElementById(id); }

  // Get CSRF token from cookies
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Get CSRF token
  function getCSRFToken() {
    return getCookie('csrftoken');
  }

  // Prevent multiple initializations
  if (window.authBackendInitialized) {
    console.log("Auth backend already initialized, skipping...");
    return;
  }
  window.authBackendInitialized = true;

  // Wait for DOM to be ready
  function initAuth() {
    console.log("DEBUG: initAuth called");

    //  Signup stepper (TeleportHQ tabs) 
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

    // Password strength checker
    const passwordInput = byId("pass-key");
    if (passwordInput) {
      // Create password requirements popup
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
      `;
      
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
      passwordInput.parentElement.appendChild(popup);

      function updateRequirement(id, met) {
        const elem = document.getElementById(id);
        if (elem) {
          const icon = elem.querySelector('span');
          if (met) {
            elem.style.color = '#4ade80';
            elem.style.fontWeight = '600';
            icon.textContent = '✓';
            icon.style.color = '#4ade80';
          } else {
            elem.style.color = 'rgba(255,255,255,0.7)';
            elem.style.fontWeight = '400';
            icon.textContent = '○';
            icon.style.color = 'rgba(255,255,255,0.5)';
          }
        }
      }

      passwordInput.addEventListener('focus', () => {
        popup.style.display = 'block';
        popup.style.animation = 'fadeIn 0.3s ease-out';
      });

      passwordInput.addEventListener('blur', () => {
        setTimeout(() => {
          popup.style.display = 'none';
        }, 200);
      });

      passwordInput.addEventListener('input', (e) => {
        const value = e.target.value;
        updateRequirement('req-length', value.length >= 12);
        updateRequirement('req-capital', /[A-Z]/.test(value));
        updateRequirement('req-special', /[.\$#@!%^&*()_+=\[\]{}|;:'",<>?/~`-]/.test(value));
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

  function showSuccessPopup() {
    // Create 3D success popup
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
    `;

    const checkmark = document.createElement('div');
    checkmark.innerHTML = `
      <svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: 20px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));">
        <circle cx="60" cy="60" r="54" fill="rgba(255,255,255,0.2)" stroke="#fff" stroke-width="4" 
          style="animation: checkCircle 0.6s ease-out 0.3s forwards; stroke-dasharray: 340; stroke-dashoffset: 340;"/>
        <path d="M35 60 L52 77 L85 44" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"
          style="animation: checkMark 0.4s ease-out 0.7s forwards; stroke-dasharray: 70; stroke-dashoffset: 70;"/>
      </svg>
    `;

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

    const message = document.createElement('p');
    message.textContent = 'Your account has been created successfully';
    message.style.cssText = `
      color: rgba(255, 255, 255, 0.95);
      font-size: 18px;
      margin: 0 0 10px 0;
      animation: slideUp 0.5s ease-out 0.5s both;
    `;

    const redirect = document.createElement('p');
    redirect.textContent = 'Redirecting to dashboard...';
    redirect.style.cssText = `
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      margin: 0;
      animation: slideUp 0.5s ease-out 0.6s both, pulse 1s ease-in-out 1s infinite;
    `;

    // Add animations
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

    document.head.appendChild(style);
    card.appendChild(checkmark);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(redirect);
    popup.appendChild(card);
    document.body.appendChild(popup);
  }

  // Signup 
  const signupForm = document.querySelector('form.signup-tabs-content');
  console.log("DEBUG: Signup form found:", signupForm);
  console.log("DEBUG: Form element:", signupForm ? signupForm.tagName : "NOT FOUND");
  
  if (signupForm) {
    console.log("DEBUG: Attaching submit event listener to form");
    signupForm.addEventListener("submit", async (e) => {
      console.log("DEBUG: Submit event fired!");
      e.preventDefault();
      console.log("DEBUG: preventDefault() called");
      console.log("Form submit event triggered");

      const firstName = (byId("first-name")?.value || "").trim();
      const surname = (byId("surname")?.value || "").trim();
      const name = firstName + " " + surname;
      const email = (byId("email-addr")?.value || "").trim().toLowerCase();
      const phone = (byId("thq_phone_lIfW")?.value || "").trim();
      const city = (byId("thq_city_G_Aw")?.value || "").trim();
      const password = byId("pass-key")?.value || "";
      const password2 = byId("pass-key-confirm")?.value || "";

      console.log("DEBUG - firstName element:", byId("first-name"));
      console.log("DEBUG - surname element:", byId("surname"));
      console.log("DEBUG - firstName value:", firstName);
      console.log("DEBUG - surname value:", surname);
      console.log("DEBUG - email value:", email);
      console.log("DEBUG - password length:", password.length);
      console.log("DEBUG - password2 length:", password2.length);
      console.log("Form values:", { firstName, surname, email, password: password ? "***" : "", password2: password2 ? "***" : "" });

      // Check if all fields are filled - only check required fields
      if (!firstName || !surname || !email || !password || !password2) {
        console.log("VALIDATION FAILED - Missing fields:", {
          firstName: !firstName ? "MISSING" : "OK",
          surname: !surname ? "MISSING" : "OK", 
          email: !email ? "MISSING" : "OK",
          password: !password ? "MISSING" : "OK",
          password2: !password2 ? "MISSING" : "OK"
        });
        return showInlineMessage("authMsg", "All fields must be filled out.", false);
      }

      if (firstName.length < 2) return showInlineMessage("authMsg", "First name must be at least 2 characters.", false);
      if (surname.length < 2) return showInlineMessage("authMsg", "Surname must be at least 2 characters.", false);
      if (!email || !email.includes("@")) return showInlineMessage("authMsg", "Please enter a valid email.", false);
      if (password.length < 12) return showInlineMessage("authMsg", "Password must be at least 12 characters.", false);
      if (!/[A-Z]/.test(password)) return showInlineMessage("authMsg", "Password must contain at least one uppercase letter.", false);
      if (!/[.\$#@!%^&*()_+=\[\]{}|;:'",<>?/~`-]/.test(password)) return showInlineMessage("authMsg", "Password must contain at least one special character (. - $ # @ ! etc.).", false);
      if (password2 && password !== password2) return showInlineMessage("authMsg", "Passwords do not match.", false);

      // Send to Django backend
      try {
        console.log("Sending signup request to:", `${API_BASE_URL}/signup/`);
        console.log("Request body:", { name, email, password: "***", password_confirm: "***" });
        
        const csrfToken = getCSRFToken();
        console.log("CSRF Token:", csrfToken ? "Found" : "Not found");
        
        const response = await fetch(`${API_BASE_URL}/signup/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken || '',
          },
          credentials: 'include', // Important for session cookies
          body: JSON.stringify({
            name: name,
            email: email,
            student_id: "00000000",
            course: "Not Specified",
            phone: phone,
            city: city,
            password: password,
            password_confirm: password2
          })
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        
        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok) {
          // Show cool 3D success popup
          showSuccessPopup();
          setTimeout(() => { window.location.href = "portal.html"; }, 3000);
        } else {
          // Handle validation errors
          if (data.errors) {
            console.log("Validation errors:", data.errors);
            const firstError = Object.values(data.errors)[0];
            const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
            showInlineMessage("authMsg", errorMsg, false);
          } else {
            showInlineMessage("authMsg", data.message || "Signup failed. Please try again.", false);
          }
        }
      } catch (error) {
        console.error("Signup error:", error);
        console.error("Error type:", error.name);
        console.error("Error message:", error.message);
        showInlineMessage("authMsg", "Connection error. Is the Django server running at http://127.0.0.1:8000?", false);
      }
    });
  }

  //  Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Login form submitted");

      const email = (byId("email")?.value || "").trim().toLowerCase();
      const password = byId("password")?.value || "";

      if (!email || !password) {
        return showInlineMessage("loginMsg", "Please enter both email and password.", false);
      }

      // Send to Django backend
      try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for session cookies
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        const data = await response.json();

        if (response.ok) {
          showInlineMessage("loginMsg", data.message || "Login successful! Redirecting…", true);
          setTimeout(() => { window.location.href = "portal.html"; }, 800);
        } else {
          showInlineMessage("loginMsg", data.message || "Login failed. Please try again.", false);
        }
      } catch (error) {
        console.error("Login error:", error);
        showInlineMessage("loginMsg", "Connection error. Make sure the backend server is running.", false);
      }
    });
  }

  //  Top Signup button wiring 
  const topSignupBtn = document.getElementById("topSignupButton");
  console.log("Top signup button found:", topSignupBtn);
  
  if (topSignupBtn) {
    topSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Top signup button clicked!");

      // Trigger the real signup form submission (so data is saved + login works)
      if (signupForm && typeof signupForm.requestSubmit === "function") {
        console.log("Using requestSubmit");
        signupForm.requestSubmit();
      } else if (signupForm) {
        console.log("Using dispatchEvent fallback");
        // Fallback for older browsers
        signupForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      } else {
        console.error("Signup form not found!");
      }
    });
  }

  //  Check if user is logged in (for portal page) 
  async function checkAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authenticated && data.student) {
        console.log("User authenticated:", data.student);
        return data.student;
      }
      return null;
    } catch (error) {
      console.error("Auth check error:", error);
      return null;
    }
  }

  // Make checkAuth available globally
  window.checkAuth = checkAuth;

  } // End initAuth

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
