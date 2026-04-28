// Post Room Page Logic
// this file handles the "Post a Room" form — authentication guard, image uploads, and form submission

(function() {
  console.log('POST-ROOM.JS LOADED - v2'); // version marker helps confirm the latest JS is being served
  const API_BASE_URL = "/api"; // relative base URL — works on any host without hardcoding a domain

  // wait for the DOM to fully load before running anything
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired');
    await checkAuthentication(); // check login FIRST — redirect if not logged in
    setupFormSubmit(); // only set up the form after the auth check completes
  });

  // checks if the current user has an active session via the Django API
  // if they are not logged in, they get redirected to the login page
  async function checkAuthentication() {
    console.log('=== POST ROOM AUTHENTICATION CHECK START ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Current page URL:', window.location.href);
    console.log('Document cookies:', document.cookie); // logs cookies for debugging auth issues
    
    try {
      console.log('Fetching check-session endpoint...');
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        method: 'GET',
        credentials: 'include', // send the Django session cookie with this request
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Check session response status:', response.status);
      console.log('Check session response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json(); // parse the JSON body from the session check
        console.log('Session data received:', JSON.stringify(data, null, 2));
        
        if (data.authenticated) {
          // user is logged in — update the nav and show a welcome message
          console.log('USER IS AUTHENTICATED');
          console.log('Student info:', data.student);
          updateNavForLoggedInUser(data.student); // swap Login/Signup buttons for name + Logout
          showError('Successfully authenticated! Welcome ' + data.student.name, true);
          // passing 'true' as second arg tells showError to show a success banner instead
        } else {
          // session exists but user is not authenticated — redirect to login
          console.error('USER NOT AUTHENTICATED');
          console.error('Session check returned authenticated: false');
          showError('You must be logged in to post a room. Redirecting to login...');
          setTimeout(() => {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html'; // send to login page after a short delay
          }, 2000);
        }
      } else {
        // HTTP error from the API (e.g. 500, 403) — redirect to login
        console.error('CHECK SESSION REQUEST FAILED');
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        const responseText = await response.text(); // read raw response for debugging
        console.error('Response body:', responseText);
        showError('Authentication check failed (Status ' + response.status + '). Redirecting...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    } catch (error) {
      // network error or exception — still redirect to login so the user is not stuck
      console.error(' AUTH CHECK EXCEPTION');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      showError('Authentication check error: ' + error.message + '. Redirecting...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
    console.log('=== POST ROOM AUTHENTICATION CHECK END ===');
  }

  // swaps the nav bar Login/Sign Up buttons for a personalised greeting and Logout button
  function updateNavForLoggedInUser(student) {
    const navActions = document.getElementById('navActions'); // the nav bar button area
    const loginBtn = navActions.querySelector('.home-nav-btn-outline'); // the Login button
    const signupBtn = navActions.querySelector('.home-nav-btn-primary'); // the Sign Up button

    if (loginBtn && signupBtn) {
      loginBtn.remove(); // remove the Login button entirely
      signupBtn.textContent = 'Logout'; // repurpose the Sign Up button as a Logout button
      signupBtn.onclick = async (e) => {
        e.preventDefault();
        await logout(); // call the logout function when the button is clicked
      };

      // insert a personalised greeting to the left of the Logout button
      const welcomeSpan = document.createElement('span');
      welcomeSpan.textContent = `Hi, ${student.name.split(' ')[0]}`; // first name only
      welcomeSpan.style.cssText = 'color: white; font-weight: 600; font-size: 15px;';
      navActions.insertBefore(welcomeSpan, signupBtn); // place the greeting before the Logout button
    }
  }

  // calls the Django logout API endpoint then redirects to the home page
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        credentials: 'include' // send session cookie so Django knows which session to invalidate
      });
      localStorage.removeItem('student'); // clear any locally stored student data
      window.location.href = 'home.html'; // send to the listings page after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // attaches the submit event listener to the post room form
  function setupFormSubmit() {
    console.log('=== SETTING UP FORM SUBMIT HANDLER ===');
    const form = document.getElementById('postRoomForm'); // find the form by its ID
    console.log('Form element:', form);
    
    if (!form) {
      // defensive check — if the form isn't in the DOM, log clearly instead of crashing
      console.error('FORM NOT FOUND! Looking for #postRoomForm');
      return;
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // stop the browser from doing a full page reload on submit
      console.log('=== FORM SUBMITTED ===');
      await submitRoom(); // hand off to the actual submission function
    });
    
    console.log('Form submit handler attached');
  }

  // collects all form values, validates them, and sends the room to the Django API
  async function submitRoom() {
    console.log('=== SUBMITTING ROOM ===');
    
    // FormData is used instead of JSON because the request includes file uploads (images)
    // a JSON body cannot carry binary file data — FormData handles the multipart encoding
    const formData = new FormData();
    
    // append each text field to the FormData object
    formData.append('title', document.getElementById('title').value.trim());
    formData.append('description', document.getElementById('description').value.trim());
    formData.append('location', document.getElementById('location').value.trim());
    formData.append('postcode', document.getElementById('postcode').value.trim());
    formData.append('distance_to_transport', document.getElementById('distance_to_transport').value.trim());
    formData.append('price', document.getElementById('price').value);
    formData.append('deposit', document.getElementById('deposit').value);
    formData.append('bills', document.getElementById('bills').value);
    formData.append('room_type', document.getElementById('room_type').value);
    formData.append('furnished', document.getElementById('furnished').value);
    formData.append('available_from', document.getElementById('available_from').value);
    formData.append('min_stay_months', document.getElementById('min_stay_months').value);
    formData.append('max_stay_months', document.getElementById('max_stay_months').value);
    
    console.log('Text fields added to FormData');
    
    // handle image_1 first — it's required, so we need to know if it's present
    const image1Input = document.getElementById('image_1');
    console.log('Checking image_1:', {
      exists: !!image1Input,
      hasFiles: image1Input?.files?.length > 0,
      fileName: image1Input?.files[0]?.name
    });
    
    if (image1Input?.files[0]) {
      formData.append('image_1', image1Input.files[0]); // append the actual File object
      console.log(`Added image_1: ${image1Input.files[0].name}`);
    }
    
    let imageCount = image1Input?.files[0] ? 1 : 0; // track total images for logging
    
    // images 2-5 are optional — only append them if the user selected a file
    ['image_2', 'image_3', 'image_4', 'image_5'].forEach(imageId => {
      const input = document.getElementById(imageId);
      if (input?.files[0]) {
        formData.append(imageId, input.files[0]); // append the file to the multipart form
        imageCount++;
        console.log(`Added ${imageId}: ${input.files[0].name}`);
      } else {
        console.log(`No file for ${imageId}`); // skipped — no file chosen
      }
    });
    
    console.log(`Total images to upload: ${imageCount}`);
    
    // append each amenity checkbox — send 'true'/'false' strings (Django coerces them)
    formData.append('wifi', document.getElementById('wifi').checked);
    formData.append('washing_machine', document.getElementById('washing_machine').checked);
    formData.append('dishwasher', document.getElementById('dishwasher').checked);
    formData.append('parking', document.getElementById('parking').checked);
    formData.append('garden', document.getElementById('garden').checked);
    formData.append('gym', document.getElementById('gym').checked);
    formData.append('central_heating', document.getElementById('central_heating').checked);
    formData.append('double_glazing', document.getElementById('double_glazing').checked);
    formData.append('security_system', document.getElementById('security_system').checked);
    formData.append('bike_storage', document.getElementById('bike_storage').checked);

    // validate the most important fields before sending — saves a server round-trip for obvious errors
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = parseFloat(document.getElementById('price').value);

    if (!title || title.length < 10) {
      // title too short — a vague title like "Room" isn't useful to students searching
      showError('Title must be at least 10 characters.');
      return; // stop here — don't send the request
    }

    if (!description || description.length < 50) {
      // description too short — students need details to decide whether to enquire
      console.error(`Validation failed: Description too short (${description?.length} chars)`);
      showError('Description must be at least 50 characters.');
      return;
    }

    if (!price || price <= 0) {
      // price must be a positive number
      console.error(`Validation failed: Invalid price (${price}`);
      showError('Please enter a valid price.');
      return;
    }

    if (!image1Input?.files[0]) {
      // at least one photo is required — a listing without an image is unlikely to get enquiries
      console.error('Validation failed: No image uploaded');
      showError('At least one image is required.');
      return;
    }

    console.log('All validations passed');
    console.log('Sending request to:', `${API_BASE_URL}/rooms/`);

    // send the FormData to the Django rooms API endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'POST',
        credentials: 'include', // send session cookie so Django knows who is posting
        body: formData
        // IMPORTANT: do NOT set a Content-Type header here
        // when the body is FormData, the browser automatically sets Content-Type
        // to 'multipart/form-data' with the correct boundary string
        // if you manually set it, the boundary will be missing and the server will reject the upload
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json(); // parse the JSON response from Django
      console.log('Response data:', data);

      if (response.ok) {
        // room was created successfully — show a message then navigate to the new room's details page
        console.log('Room posted successfully!');
        showSuccess(data.message || 'Room posted successfully!');
        setTimeout(() => {
          window.location.href = `room-details.html?id=${data.room.id}`;
          // redirect to the newly created room's details page using the ID Django returned
        }, 1500);
      } else {
        // server returned a validation error or other failure
        console.error('Server returned error:', data);
        if (data.errors) {
          // DRF serializer errors are { field: ["message"] } — show the first one
          const firstError = Object.values(data.errors)[0];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          console.error('Error message:', errorMsg);
          showError(errorMsg);
        } else {
          showError(data.message || 'Failed to post room. Please try again.');
        }
      }
    } catch (error) {
      // network failure or unexpected exception
      console.error('Submit error:', error);
      console.error('Error stack:', error.stack);
      showError('An error occurred. Please try again.');
    }
  }

  // shows a green success banner at the top of the page
  function showSuccess(message) {
    const successAlert = document.getElementById('successAlert'); // the green banner element
    const successMessage = document.getElementById('successMessage'); // the text inside it
    successMessage.textContent = message; // set the message text
    successAlert.classList.add('show'); // CSS transition makes it slide/fade in
    
    // make sure the error banner is hidden if it was previously shown
    document.getElementById('errorAlert').classList.remove('show');

    // scroll to the top so the user can see the banner
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // auto-hide the banner after 5 seconds
    setTimeout(() => {
      successAlert.classList.remove('show');
    }, 5000);
  }

  // shows an alert banner — either red (error) or green (success) depending on the isSuccess flag
  // having this dual behaviour lets auth code call showError with isSuccess=true for welcome messages
  function showError(message, isSuccess = false) {
    console.log('Showing message:', message, 'isSuccess:', isSuccess);
    
    const errorAlert = document.getElementById('errorAlert'); // the red banner
    const successAlert = document.getElementById('successAlert'); // the green banner
    const errorMessage = document.getElementById('errorMessage'); // text inside the red banner
    const successMessage = document.getElementById('successMessage'); // text inside the green banner
    
    if (isSuccess) {
      // treat this as a success — show the green banner and hide the red one
      if (successMessage) successMessage.textContent = message;
      if (successAlert) successAlert.classList.add('show');
      if (errorAlert) errorAlert.classList.remove('show');
    } else {
      // normal error path — show the red banner and hide the green one
      if (errorMessage) errorMessage.textContent = message;
      if (errorAlert) errorAlert.classList.add('show');
      if (successAlert) successAlert.classList.remove('show');
    }

    // scroll to the top so the user sees the banner immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // auto-hide both banners after 5 seconds
    setTimeout(() => {
      if (errorAlert) errorAlert.classList.remove('show');
      if (successAlert) successAlert.classList.remove('show');
    }, 5000);
  }

  // set the minimum date on the availability date picker to today — prevents backdating
  const availableFromInput = document.getElementById('available_from');
  if (availableFromInput) {
    const today = new Date().toISOString().split('T')[0]; // format as YYYY-MM-DD
    availableFromInput.min = today; // browser will grey out any date before today
  }

  // sets up all image upload areas — styled buttons trigger hidden file inputs,
  // FileReader generates previews, and remove buttons clear selections
  function setupImageUploads() {
    console.log('=== SETTING UP IMAGE UPLOAD HANDLERS ===');
    console.log('Current URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // find all the styled upload buttons (the ones with the camera icon)
    const uploadButtons = document.querySelectorAll('.image-upload-btn');
    console.log(`Searching for .image-upload-btn elements...`);
    console.log(`Found ${uploadButtons.length} upload buttons`);
    
    if (uploadButtons.length === 0) {
      // if no buttons found, something is wrong with the HTML structure
      console.error('NO UPLOAD BUTTONS FOUND! Check HTML structure.');
      console.log('Available buttons on page:', document.querySelectorAll('button').length);
      return;
    }
    
    // each styled button has data-target pointing to the real hidden <input type="file">
    // clicking the styled button programmatically clicks the real input
    uploadButtons.forEach((btn, index) => {
      const targetId = btn.getAttribute('data-target'); // e.g. 'image_1'
      console.log(`  Button ${index + 1}: data-target="${targetId}", text="${btn.textContent.trim()}"`);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault(); // don't submit the form
        console.log(`========== UPLOAD BUTTON CLICKED ==========`);
        console.log(`Target: ${targetId}`);
        const fileInput = document.getElementById(targetId); // find the hidden file input
        if (fileInput) {
          console.log(`File input found, triggering click`);
          fileInput.click(); // open the OS file picker dialog
        } else {
          console.error(`File input NOT found for ID: ${targetId}`);
        }
      });
    });

    // listen for file selections on all the hidden file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    console.log(`Found ${fileInputs.length} file inputs`);
    
    fileInputs.forEach((input, index) => {
      console.log(`  File input ${index + 1}: id="${input.id}"`);
      
      input.addEventListener('change', (e) => {
        const file = e.target.files[0]; // get the first (and only) selected file
        console.log(`File input changed for: ${input.id}`);
        
        if (file) {
          console.log(`File selected:`, {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type
          });
          
          // reject files larger than 5MB to avoid slow uploads and server-side rejection
          if (file.size > 5 * 1024 * 1024) {
            console.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB (max 5MB)`);
            showError('Image size must be less than 5MB');
            input.value = ''; // clear the selection
            return;
          } else {
            console.log(`File size OK: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
          }

          // reject non-image files (e.g. PDFs or videos accidentally selected)
          if (!file.type.startsWith('image/')) {
            console.error(`Invalid file type: ${file.type}`);
            showError('Please select a valid image file');
            input.value = ''; // clear the selection
            return;
          } else {
            console.log(`File type OK: ${file.type}`);
          }

          // build the preview element ID from the input ID: 'image_1' → 'preview_1'
          const inputId = input.id;
          const previewId = 'preview_' + inputId.split('_')[1]; // extract the number part
          const preview = document.getElementById(previewId); // the container div
          const uploadBtn = document.querySelector(`[data-target="${inputId}"]`); // the styled button
          
          console.log(`Generating preview for ${inputId}:`, {
            previewId,
            previewExists: !!preview,
            uploadBtnExists: !!uploadBtn
          });

          if (!preview) {
            console.error(`Preview element not found: ${previewId}`);
            return;
          }

          // use FileReader to generate a base64 data URL for the image preview
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log(`File loaded successfully, displaying preview`);
            const img = preview.querySelector('img'); // the <img> inside the preview container
            if (img) {
              img.src = e.target.result; // set the data URL as the image source
              preview.style.display = 'block'; // show the preview area
              if (uploadBtn) uploadBtn.style.display = 'none'; // hide the upload button
              console.log(`Preview displayed for ${inputId}`);
            } else {
              console.error(`Image element not found in preview`);
            }
          };
          
          reader.onerror = (e) => {
            console.error(`FileReader error:`, e);
          };
          
          reader.readAsDataURL(file); // start reading the file — triggers onload when done
        } else {
          console.log(`No file selected`);
        }
      });
    });

    // handle the X (remove) button on each image preview
    const removeButtons = document.querySelectorAll('.remove-image-btn');
    console.log(`Found ${removeButtons.length} remove buttons`);
    
    removeButtons.forEach((btn, index) => {
      const targetId = btn.getAttribute('data-target'); // e.g. 'image_1'
      console.log(`  Remove button ${index + 1}: data-target="${targetId}"`);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault(); // don't submit the form when remove is clicked
        console.log(`Remove button clicked for: ${targetId}`);
        
        const input = document.getElementById(targetId); // the hidden file input
        const previewId = 'preview_' + targetId.split('_')[1]; // e.g. 'preview_1'
        const preview = document.getElementById(previewId); // the preview container
        const uploadBtn = document.querySelector(`.image-upload-btn[data-target="${targetId}"]`);

        if (input) {
          input.value = ''; // clear the file selection so nothing gets uploaded
          console.log(`Cleared file input: ${targetId}`);
        }
        
        if (preview) {
          preview.style.display = 'none'; // hide the preview area
          const img = preview.querySelector('img');
          if (img) img.src = ''; // clear the image src to release memory
          console.log(`Hidden preview: ${previewId}`);
        }
        
        if (uploadBtn) {
          uploadBtn.style.display = 'flex'; // show the upload button again
          console.log(`Showed upload button`);
        }
      });
    });
    
    console.log('Image upload handlers setup complete');
  }

  // call setupImageUploads immediately since the DOM is already ready at this point
  // (this runs after DOMContentLoaded because it's declared at module level)
  console.log('About to call setupImageUploads()...');
  setupImageUploads(); // sets up all three types of image interaction: pick, preview, remove
  console.log('setupImageUploads() called');
})(); // close the IIFE — all functions and variables are scoped inside here
