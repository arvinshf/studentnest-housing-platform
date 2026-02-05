// Post Room JavaScript
(function() {
  console.log('POST-ROOM.JS LOADED - v2');
  const API_BASE_URL = "/api";  // Relative path for same-domain

  // Check authentication on page load
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired');
    await checkAuthentication();
    setupFormSubmit();
  });

  // Check if user is logged in
  async function checkAuthentication() {
    console.log('=== POST ROOM AUTHENTICATION CHECK START ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Current page URL:', window.location.href);
    console.log('Document cookies:', document.cookie);
    
    try {
      console.log('Fetching check-session endpoint...');
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Check session response status:', response.status);
      console.log('Check session response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session data received:', JSON.stringify(data, null, 2));
        
        if (data.authenticated) {
          console.log('USER IS AUTHENTICATED');
          console.log('Student info:', data.student);
          updateNavForLoggedInUser(data.student);
          showError('Successfully authenticated! Welcome ' + data.student.name, true);
        } else {
          // Redirect to login if not authenticated
          console.error('USER NOT AUTHENTICATED');
          console.error('Session check returned authenticated: false');
          showError('You must be logged in to post a room. Redirecting to login...');
          setTimeout(() => {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
          }, 2000);
        }
      } else {
        console.error('CHECK SESSION REQUEST FAILED');
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        const responseText = await response.text();
        console.error('Response body:', responseText);
        showError('Authentication check failed (Status ' + response.status + '). Redirecting...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ AUTH CHECK EXCEPTION');
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

  // Update navigation for logged-in user
  function updateNavForLoggedInUser(student) {
    const navActions = document.getElementById('navActions');
    const loginBtn = navActions.querySelector('.home-nav-btn-outline');
    const signupBtn = navActions.querySelector('.home-nav-btn-primary');

    if (loginBtn && signupBtn) {
      loginBtn.remove();
      signupBtn.textContent = 'Logout';
      signupBtn.onclick = async (e) => {
        e.preventDefault();
        await logout();
      };

      const welcomeSpan = document.createElement('span');
      welcomeSpan.textContent = `Hi, ${student.name.split(' ')[0]}`;
      welcomeSpan.style.cssText = 'color: white; font-weight: 600; font-size: 15px;';
      navActions.insertBefore(welcomeSpan, signupBtn);
    }
  }

  // Logout
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('student');
      window.location.href = 'home.html';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Setup form submit
  function setupFormSubmit() {
    console.log('=== SETTING UP FORM SUBMIT HANDLER ===');
    const form = document.getElementById('postRoomForm');
    console.log('Form element:', form);
    
    if (!form) {
      console.error('FORM NOT FOUND! Looking for #postRoomForm');
      return;
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('=== FORM SUBMITTED ===');
      await submitRoom();
    });
    
    console.log('Form submit handler attached');
  }

  // Submit room
  async function submitRoom() {
    console.log('=== SUBMITTING ROOM ===');
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add text fields
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
    
    // Add image files
    const image1Input = document.getElementById('image_1');
    console.log('Checking image_1:', {
      exists: !!image1Input,
      hasFiles: image1Input?.files?.length > 0,
      fileName: image1Input?.files[0]?.name
    });
    
    if (image1Input?.files[0]) {
      formData.append('image_1', image1Input.files[0]);
      console.log(`Added image_1: ${image1Input.files[0].name}`);
    }
    
    let imageCount = image1Input?.files[0] ? 1 : 0;
    
    ['image_2', 'image_3', 'image_4', 'image_5'].forEach(imageId => {
      const input = document.getElementById(imageId);
      if (input?.files[0]) {
        formData.append(imageId, input.files[0]);
        imageCount++;
        console.log(`Added ${imageId}: ${input.files[0].name}`);
      } else {
        console.log(`No file for ${imageId}`);
      }
    });
    
    console.log(`Total images to upload: ${imageCount}`);
    
    // Add amenities
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

    // Basic validation
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = parseFloat(document.getElementById('price').value);

    if (!title || title.length < 10) {
      showError('Title must be at least 10 characters.');
      return;
    }

    if (!description || description.length < 50) {
      console.error(`Validation failed: Description too short (${description?.length} chars)`);
      showError('Description must be at least 50 characters.');
      return;
    }

    if (!price || price <= 0) {
      console.error(`Validation failed: Invalid price (${price}`);
      showError('Please enter a valid price.');
      return;
    }

    if (!image1Input?.files[0]) {
      console.error('Validation failed: No image uploaded');
      showError('At least one image is required.');
      return;
    }

    console.log('All validations passed');
    console.log('Sending request to:', `${API_BASE_URL}/rooms/`);

    // Submit to backend
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'POST',
        credentials: 'include',
        body: formData  // Don't set Content-Type header - browser will set it with boundary
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Room posted successfully!');
        showSuccess(data.message || 'Room posted successfully!');
        setTimeout(() => {
          window.location.href = `room-details.html?id=${data.room.id}`;
        }, 1500);
      } else {
        console.error('Server returned error:', data);
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
          console.error('Error message:', errorMsg);
          showError(errorMsg);
        } else {
          showError(data.message || 'Failed to post room. Please try again.');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error stack:', error.stack);
      showError('An error occurred. Please try again.');
    }
  }

  // Show success message
  function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successAlert.classList.add('show');
    
    // Hide error if visible
    document.getElementById('errorAlert').classList.remove('show');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide after 5 seconds
    setTimeout(() => {
      successAlert.classList.remove('show');
    }, 5000);
  }

  // Show error message
  function showError(message, isSuccess = false) {
    console.log('Showing message:', message, 'isSuccess:', isSuccess);
    
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (isSuccess) {
      if (successMessage) successMessage.textContent = message;
      if (successAlert) successAlert.classList.add('show');
      if (errorAlert) errorAlert.classList.remove('show');
    } else {
      if (errorMessage) errorMessage.textContent = message;
      if (errorAlert) errorAlert.classList.add('show');
      if (successAlert) successAlert.classList.remove('show');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide after 5 seconds
    setTimeout(() => {
      if (errorAlert) errorAlert.classList.remove('show');
      if (successAlert) successAlert.classList.remove('show');
    }, 5000);
  }

  // Set minimum date to today
  const availableFromInput = document.getElementById('available_from');
  if (availableFromInput) {
    const today = new Date().toISOString().split('T')[0];
    availableFromInput.min = today;
  }

  // Setup image upload handlers
  function setupImageUploads() {
    console.log('=== SETTING UP IMAGE UPLOAD HANDLERS ===');
    console.log('Current URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Handle upload button clicks
    const uploadButtons = document.querySelectorAll('.image-upload-btn');
    console.log(`Searching for .image-upload-btn elements...`);
    console.log(`Found ${uploadButtons.length} upload buttons`);
    
    if (uploadButtons.length === 0) {
      console.error('NO UPLOAD BUTTONS FOUND! Check HTML structure.');
      console.log('Available buttons on page:', document.querySelectorAll('button').length);
      return;
    }
    
    uploadButtons.forEach((btn, index) => {
      const targetId = btn.getAttribute('data-target');
      console.log(`  Button ${index + 1}: data-target="${targetId}", text="${btn.textContent.trim()}"`);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`========== UPLOAD BUTTON CLICKED ==========`);
        console.log(`Target: ${targetId}`);
        const fileInput = document.getElementById(targetId);
        if (fileInput) {
          console.log(`File input found, triggering click`);
          fileInput.click();
        } else {
          console.error(`File input NOT found for ID: ${targetId}`);
        }
      });
    });

    // Handle file input changes
    const fileInputs = document.querySelectorAll('input[type="file"]');
    console.log(`Found ${fileInputs.length} file inputs`);
    
    fileInputs.forEach((input, index) => {
      console.log(`  File input ${index + 1}: id="${input.id}"`);
      
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        console.log(`File input changed for: ${input.id}`);
        
        if (file) {
          console.log(`File selected:`, {
            name: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type
          });
          
          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
            console.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB (max 5MB)`);
            showError('Image size must be less than 5MB');
            input.value = '';
            return;
          } else {
            console.log(`File size OK: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
            console.error(`Invalid file type: ${file.type}`);
            showError('Please select a valid image file');
            input.value = '';
            return;
          } else {
            console.log(`File type OK: ${file.type}`);
          }

          // Show preview
          const inputId = input.id;
          const previewId = 'preview_' + inputId.split('_')[1];
          const preview = document.getElementById(previewId);
          const uploadBtn = document.querySelector(`[data-target="${inputId}"]`);
          
          console.log(`Generating preview for ${inputId}:`, {
            previewId,
            previewExists: !!preview,
            uploadBtnExists: !!uploadBtn
          });

          if (!preview) {
            console.error(`Preview element not found: ${previewId}`);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            console.log(`File loaded successfully, displaying preview`);
            const img = preview.querySelector('img');
            if (img) {
              img.src = e.target.result;
              preview.style.display = 'block';
              if (uploadBtn) uploadBtn.style.display = 'none';
              console.log(`Preview displayed for ${inputId}`);
            } else {
              console.error(`Image element not found in preview`);
            }
          };
          
          reader.onerror = (e) => {
            console.error(`FileReader error:`, e);
          };
          
          reader.readAsDataURL(file);
        } else {
          console.log(`No file selected`);
        }
      });
    });

    // Handle remove button clicks
    const removeButtons = document.querySelectorAll('.remove-image-btn');
    console.log(`Found ${removeButtons.length} remove buttons`);
    
    removeButtons.forEach((btn, index) => {
      const targetId = btn.getAttribute('data-target');
      console.log(`  Remove button ${index + 1}: data-target="${targetId}"`);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Remove button clicked for: ${targetId}`);
        
        const input = document.getElementById(targetId);
        const previewId = 'preview_' + targetId.split('_')[1];
        const preview = document.getElementById(previewId);
        const uploadBtn = document.querySelector(`.image-upload-btn[data-target="${targetId}"]`);

        if (input) {
          input.value = '';
          console.log(`Cleared file input: ${targetId}`);
        }
        
        if (preview) {
          preview.style.display = 'none';
          const img = preview.querySelector('img');
          if (img) img.src = '';
          console.log(`Hidden preview: ${previewId}`);
        }
        
        if (uploadBtn) {
          uploadBtn.style.display = 'flex';
          console.log(`Showed upload button`);
        }
      });
    });
    
    console.log('Image upload handlers setup complete');
  }

  console.log('About to call setupImageUploads()...');
  setupImageUploads();
  console.log('setupImageUploads() called');
})();
