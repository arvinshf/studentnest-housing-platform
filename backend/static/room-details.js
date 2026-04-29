// Room Details Page Logic
// this file handles everything on the individual room page — gallery, map, messaging, favorites, reports

const API_BASE_URL = '/api'; // relative base URL — works on any host without hardcoding a domain

// tracks which gallery image is currently displayed (0-based index)
let currentImageIndex = 0;
let currentRoom = null; // the room object loaded from the API, used throughout this file

// hard-coded lat/lon for major London universities
// the selector overlay lets students quickly pan the map to any of these locations
const UNIVERSITY_LOCATIONS = [
  { name: 'University College London', lat: 51.5246, lon: -0.1340 },
  { name: 'King\'s College London (Strand)', lat: 51.5115, lon: -0.1160 },
  { name: 'Queen Mary University of London', lat: 51.5246, lon: -0.0407 },
  { name: 'London School of Economics', lat: 51.5145, lon: -0.1166 },
  { name: 'University of Westminster', lat: 51.5202, lon: -0.1749 },
  { name: 'City, University of London', lat: 51.5278, lon: -0.1022 },
  { name: 'Imperial College London', lat: 51.4988, lon: -0.1749 }
];

// reads the ?id= query parameter from the URL to know which room to load
function getRoomIdFromURL() {
  const params = new URLSearchParams(window.location.search); // parse the query string
  return parseInt(params.get('id')) || 1; // default to 1 if no ID is provided
}

// main entry point — runs once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('PAGE LOADED - Room Details');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Current URL:', window.location.href);
  console.log('Cookies:', document.cookie);
  
  const roomId = getRoomIdFromURL(); // get the room ID from the URL
  loadRoomDetails(roomId); // fetch and render the room data
  setupGalleryNavigation(); // attach prev/next button handlers for the image gallery
  setupSaveButton(); // attach the save/unsave click handler
  setupMessageModal(); // attach open/close/submit handlers for the contact landlord modal
  setupReportModal(); // attach open/close/submit handlers for the report modal
  checkAuthentication(); // check if the user is logged in and update the nav bar
  setupUniversitySelector(); // populate the university dropdown overlay on the map
  
  console.log('All setup functions called');
});

// fetches a single room from the Django API and renders the entire page
async function loadRoomDetails(roomId) {
  console.log('Loading room details for ID:', roomId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/`, {
      method: 'GET',
      credentials: 'include', // send session cookie so owner-specific actions work
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      // room not found or server error — show the error state
      console.error('Failed to fetch room:', response.status);
      showError();
      return;
    }
    
    const roomData = await response.json(); // parse the room JSON from Django
    console.log('Room data received:', roomData);
    
    // build a human-readable features list from the boolean amenity fields
    const features = [];
    if (roomData.wifi) features.push({ icon: 'WiFi', name: 'WiFi' });
    if (roomData.washing_machine) features.push({ icon: 'Wash', name: 'Washing Machine' });
    if (roomData.dishwasher) features.push({ icon: 'Dish', name: 'Dishwasher' });
    if (roomData.parking) features.push({ icon: 'Park', name: 'Parking' });
    if (roomData.garden) features.push({ icon: 'Garden', name: 'Garden' });
    if (roomData.gym) features.push({ icon: 'Gym', name: 'Gym' });
    if (roomData.central_heating) features.push({ icon: 'Heat', name: 'Central Heating' });
    if (roomData.double_glazing) features.push({ icon: 'Window', name: 'Double Glazing' });
    if (roomData.security_system) features.push({ icon: 'Security', name: 'Security System' });
    if (roomData.bike_storage) features.push({ icon: 'Bike', name: 'Bike Storage' });
    
    // maps the API choice keys to the display labels shown on the page
    const furnishedMap = {
      'fully': 'Fully Furnished',
      'part': 'Part Furnished',
      'unfurnished': 'Unfurnished'
    };
    
    // maps the bills choice keys to display text
    const billsMap = {
      'included': 'Included',
      'not_included': 'Not Included',
      'partial': 'Partially Included'
    };
    
    // maps the room type keys to display text
    const roomTypeMap = {
      'single': 'Single Room',
      'double': 'Double Room',
      'ensuite': 'Ensuite Room',
      'studio': 'Studio',
      'shared': 'Shared Room'
    };
    
    // transform the raw API data into the shape the UI functions expect
    currentRoom = {
      id: roomData.id,
      title: roomData.title,
      location: roomData.location,
      distance: roomData.distance_to_transport || 'N/A', // fallback if no transport distance set
      price: roomData.price,
      available: roomData.available_from,
      type: roomTypeMap[roomData.room_type] || roomData.room_type, // use the readable label if found
      furnished: furnishedMap[roomData.furnished] || roomData.furnished,
      bills: billsMap[roomData.bills] || roomData.bills,
      deposit: `£${roomData.deposit}`,
      minStay: roomData.min_stay_months ? `${roomData.min_stay_months} months` : 'Flexible',
      maxStay: roomData.max_stay_months ? `${roomData.max_stay_months} months` : 'Flexible',
      images: roomData.images || [], // array of image URLs
      description: roomData.description,
      features: features,
      landlord: {
        name: roomData.owner_name || 'Unknown',
        type: 'Private Landlord',
        initials: (roomData.owner_name || 'UK').split(' ').map(n => n[0]).join(''),
        // initials built from first letter of each word: 'John Smith' → 'JS'
        verified: true,
        responseRate: 95,
        responseTime: '2 hours'
      },
      badge: roomData.is_featured ? 'featured' : (roomData.is_verified ? 'verified' : null)
    };
    
    console.log('Transformed room data:', currentRoom);
    
    if (!currentRoom) {
      showError(); // should never happen since we just assigned it, but safe guard
      return;
    }

    // update the browser tab title
    document.title = `${currentRoom.title} - StudentNest`;
    
    // update the breadcrumb navigation link text
    document.getElementById('breadcrumbTitle').textContent = currentRoom.title;
    
    // update the main header section
    document.getElementById('roomTitle').textContent = currentRoom.title;
    document.getElementById('roomLocation').textContent = currentRoom.location;
    document.getElementById('roomAvailable').textContent = `Available ${formatDate(currentRoom.available)}`;
    
    // show or hide the badge depending on room status
    const badgeEl = document.getElementById('roomBadge');
    if (currentRoom.badge) {
      badgeEl.textContent = currentRoom.badge.charAt(0).toUpperCase() + currentRoom.badge.slice(1);
      // capitalise the first letter: 'featured' → 'Featured'
      badgeEl.style.display = 'inline-flex';
      if (currentRoom.badge === 'featured') badgeEl.style.background = '#007bff'; // blue for featured
      if (currentRoom.badge === 'verified') badgeEl.style.background = '#28a745'; // green for verified
      if (currentRoom.badge === 'new') badgeEl.style.background = '#ffc107'; // yellow for new
    } else {
      badgeEl.style.display = 'none'; // no badge — hide the element
    }
    
    // render the image gallery
    loadGallery(currentRoom.images);
    
    // set the room description text
    document.getElementById('roomDescription').textContent = currentRoom.description;
    
    // render the features grid — or show a fallback message if no features were listed
    const featuresHTML = currentRoom.features.length > 0 ? currentRoom.features.map(feature => `
      <div class="room-feature-item">
        <div class="room-feature-icon">${feature.icon}</div>
        <span>${feature.name}</span>
      </div>
    `).join('') : '<p>No features listed</p>';
    document.getElementById('roomFeatures').innerHTML = featuresHTML;
    
    // render the key info grid (type, furnished, bills, deposit, stay lengths)
    const detailsHTML = `
      <div class="room-info-item">
        <div class="room-info-label">Room Type</div>
        <div class="room-info-value">${currentRoom.type}</div>
      </div>
      <div class="room-info-item">
        <div class="room-info-label">Furnished</div>
        <div class="room-info-value">${currentRoom.furnished}</div>
      </div>
      <div class="room-info-item">
        <div class="room-info-label">Bills</div>
        <div class="room-info-value">${currentRoom.bills}</div>
      </div>
      <div class="room-info-item">
        <div class="room-info-label">Deposit</div>
        <div class="room-info-value">${currentRoom.deposit}</div>
      </div>
      <div class="room-info-item">
        <div class="room-info-label">Minimum Stay</div>
        <div class="room-info-value">${currentRoom.minStay}</div>
      </div>
      <div class="room-info-item">
        <div class="room-info-label">Maximum Stay</div>
        <div class="room-info-value">${currentRoom.maxStay}</div>
      </div>
    `;
    document.getElementById('roomDetails').innerHTML = detailsHTML;
    
    // show the full location string including transport distance
    document.getElementById('locationText').textContent = `${currentRoom.location}${currentRoom.distance ? ' - ' + currentRoom.distance : ''}`;
    
    // initialise the Leaflet map — prefer postcode for accuracy, fall back to location name
    if (roomData.postcode) {
      document.getElementById('postcodeDisplay').style.display = 'block'; // show the postcode label
      document.getElementById('postcodeText').textContent = roomData.postcode;
      initializeMap(roomData.postcode, currentRoom.location);
    } else if (currentRoom.location) {
      initializeMap(currentRoom.location, currentRoom.location); // use the location name as fallback
    }
    
    // update the sidebar price display
    document.getElementById('sidebarPrice').innerHTML = `£${currentRoom.price}<span>/month</span>`;
    
    // populate the landlord card
    const landlord = currentRoom.landlord;
    document.getElementById('landlordAvatar').textContent = landlord.initials; // initials in the circle
    document.getElementById('landlordName').textContent = landlord.name;
    document.getElementById('landlordType').textContent = landlord.type;
    
    // highlight the save button if this room is already in the user's favorites
    updateSaveButtonState();
    
  } catch (error) {
    console.error('Error loading room:', error);
    showError(); // replace the main content area with the error state
  }
}

// renders the image gallery — sets the main image and builds the thumbnail strip
function loadGallery(images) {
  currentImageIndex = 0; // always start on the first image
  document.getElementById('mainImage').src = images[0]; // show the first image in the large view
  document.getElementById('imageCounter').textContent = `1 / ${images.length}`; // e.g. '1 / 4'
  
  // build the thumbnail strip — show at most 4 thumbnails
  const thumbsHTML = images.slice(0, 4).map((img, index) => `
    <div class="room-gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${img}" alt="Room ${index + 1}" />
    </div>
  `).join('');
  document.getElementById('galleryThumbs').innerHTML = thumbsHTML;
  
  // clicking a thumbnail switches the main image to that photo
  document.querySelectorAll('.room-gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.index);
      showImage(index); // switch to the clicked thumbnail's image
    });
  });
}

// attaches click handlers to the prev/next arrow buttons
function setupGalleryNavigation() {
  document.getElementById('prevImage').addEventListener('click', () => {
    if (currentRoom && currentRoom.images.length > 0) {
      // wrap around: going left from index 0 jumps to the last image
      currentImageIndex = (currentImageIndex - 1 + currentRoom.images.length) % currentRoom.images.length;
      showImage(currentImageIndex);
    }
  });
  
  document.getElementById('nextImage').addEventListener('click', () => {
    if (currentRoom && currentRoom.images.length > 0) {
      // wrap around: going right from the last image jumps back to index 0
      currentImageIndex = (currentImageIndex + 1) % currentRoom.images.length;
      showImage(currentImageIndex);
    }
  });
}

// switches the gallery to a specific image by index
function showImage(index) {
  if (!currentRoom) return;
  
  currentImageIndex = index; // update the global tracker
  document.getElementById('mainImage').src = currentRoom.images[index]; // update the main image
  document.getElementById('imageCounter').textContent = `${index + 1} / ${currentRoom.images.length}`;
  
  // update the active state on the thumbnails
  document.querySelectorAll('.room-gallery-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index); // active class adds the blue border
  });
}

// attaches the save/unsave click handler to the Save Room button in the sidebar
function setupSaveButton() {
  document.getElementById('saveRoomBtn').addEventListener('click', () => {
    toggleSaveRoom(currentRoom.id); // pass the current room's ID to the toggle function
  });
}

// adds or removes the current room from the logged-in user's favorites
// also syncs the change to localStorage as a local fallback cache
async function toggleSaveRoom(roomId) {
  console.log('TROUBLESHOOT - toggleSaveRoom called with roomId:', roomId);
  
  let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
  // load the local cache of saved room IDs
  const index = savedRooms.indexOf(roomId); // -1 means not yet saved
  
  console.log('TROUBLESHOOT - Current saved rooms:', savedRooms);
  console.log('TROUBLESHOOT - Room index in saved:', index);
  
  if (index === -1) {
    // --- add to favorites ---
    savedRooms.push(roomId); // add to local cache optimistically
    
    console.log('TROUBLESHOOT - Adding to favorites');
    console.log(`TROUBLESHOOT - API URL: ${API_BASE_URL}/favorites/add/`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/add/`, {
        method: 'POST',
        credentials: 'include', // send session cookie to identify the user
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room_id: roomId }) // tell the API which room to favorite
      });
      
      console.log('TROUBLESHOOT - Response status:', response.status);
      console.log('TROUBLESHOOT - Response ok:', response.ok);
      
      const responseText = await response.text(); // read as text first for debugging
      console.log('TROUBLESHOOT - Response body:', responseText);
      
      if (response.ok) {
        showNotification('Room saved to your favorites!', 'success');
      } else {
        // API returned an error — show it and fall back to local-only save
        try {
          const data = JSON.parse(responseText);
          console.error('Failed to add favorite - JSON response:', data);
        } catch (e) {
          console.error('Failed to add favorite - Raw response:', responseText);
        }
        alert(`ERROR ADDING FAVORITE:\nStatus: ${response.status}\nResponse: ${responseText}`);
        showNotification('Room saved locally', 'info');
      }
    } catch (error) {
      // network error — fall back to localStorage-only
      console.error('EXCEPTION adding favorite:', error);
      alert(`EXCEPTION ADDING FAVORITE:\n${error.name}: ${error.message}`);
      showNotification('Room saved locally', 'info');
    }
  } else {
    // --- remove from favorites ---
    savedRooms.splice(index, 1); // remove from local cache
    
    const deleteUrl = `${API_BASE_URL}/favorites/${roomId}/remove/`;
    console.log('TROUBLESHOOT - Removing from favorites');
    console.log('TROUBLESHOOT - API URL:', deleteUrl);
    
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include' // send session cookie to identify the user
      });
      
      const responseText = await response.text();
      console.log('TROUBLESHOOT - Response body:', responseText);
      
      if (response.ok) {
        showNotification('Room removed from favorites', 'info');
      } else {
        // API returned an error — still reflect the change locally
        console.error('Failed to remove favorite');
        alert(`ERROR REMOVING FAVORITE:\nStatus: ${response.status}\nResponse: ${responseText}`);
        showNotification('Room removed locally', 'info');
      }
    } catch (error) {
      // network error — still reflect the change locally
      console.error('EXCEPTION removing favorite:', error);
      alert(`EXCEPTION REMOVING FAVORITE:\n${error.name}: ${error.message}`);
      showNotification('Room removed locally', 'info');
    }
  }
  
  localStorage.setItem('savedRooms', JSON.stringify(savedRooms)); // persist the local cache
  updateSaveButtonState(); // update the button to reflect the new state
}

// updates the Save Room button appearance based on whether the room is in the user's favorites
// checks the API first, then falls back to localStorage
async function updateSaveButtonState() {
  if (!currentRoom) return;
  
  const btn = document.getElementById('saveRoomBtn');
  let isSaved = false;
  
  // ask the API whether this room is in the user's favorites
  try {
    const response = await fetch(`${API_BASE_URL}/favorites/${currentRoom.id}/check/`, {
      credentials: 'include' // send session cookie
    });
    
    if (response.ok) {
      const data = await response.json();
      isSaved = data.is_favorited; // true/false from the API
      
      // keep localStorage in sync with the backend
      let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      if (isSaved && !savedRooms.includes(currentRoom.id)) {
        savedRooms.push(currentRoom.id); // add to local cache if not already there
        localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
      } else if (!isSaved && savedRooms.includes(currentRoom.id)) {
        savedRooms = savedRooms.filter(id => id !== currentRoom.id); // remove from local cache
        localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
      }
    } else {
      // API failed — fall back to localStorage
      const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      isSaved = savedRooms.includes(currentRoom.id);
    }
  } catch (error) {
    console.error('Error checking favorite status:', error);
    // network error — fall back to localStorage
    const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
    isSaved = savedRooms.includes(currentRoom.id);
  }
  
  if (isSaved) {
    // filled heart + blue background = saved
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
      </svg>
      Saved
    `;
    btn.style.background = '#007bff'; // blue filled button
    btn.style.color = 'white';
  } else {
    // empty heart + white background = not saved
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
      </svg>
      Save Room
    `;
    btn.style.background = 'white'; // white outlined button
    btn.style.color = '#007bff';
  }
}

// global variable to hold the currently logged-in student — used to gate actions like messaging
let currentUser = null;

// checks whether the visitor has an active Django session and updates the UI accordingly
async function checkAuthentication() {
  try {
    console.log('DEBUG: Starting authentication check...');
    console.log('DEBUG: API_BASE_URL =', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/check-session/`, {
      method: 'GET',
      credentials: 'include' // send the session cookie
    });
    
    console.log('DEBUG: Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('DEBUG: Response data:', JSON.stringify(data, null, 2));
      
      // handle both 'authenticated' and 'isAuthenticated' property names for compatibility
      if (data.authenticated || data.isAuthenticated) {
        console.log('DEBUG: User IS authenticated');
        currentUser = data.student; // store the student data globally
        updateNavForLoggedInUser(data.student); // update the nav bar
      } else {
        console.log('DEBUG: User NOT authenticated');
        // user is not logged in — that's fine, just don't show personalised UI
      }
    } else {
      console.log('DEBUG: Response not OK, status:', response.status);
    }
  } catch (error) {
    console.log('DEBUG: Auth check error:', error);
    // not logged in or network error — just leave the default nav
  }
}

// swaps the nav bar Login/Signup buttons for a greeting + Logout button
function updateNavForLoggedInUser(student) {
  console.log('DEBUG: updateNavForLoggedInUser called with:', student);
  
  const navActions = document.querySelector('.home-nav-actions');
  if (!navActions) {
    console.error('Nav actions not found'); // shouldn't happen, but safe guard
    return;
  }
  
  const loginBtn = navActions.querySelector('.home-nav-btn-outline'); // the Login button
  const signupBtn = navActions.querySelector('.home-nav-btn-primary'); // the Sign Up button
  
  if (loginBtn && signupBtn) {
    loginBtn.remove(); // remove the Login button
    signupBtn.textContent = 'Logout'; // repurpose the Sign Up button as Logout
    signupBtn.onclick = async (e) => {
      e.preventDefault();
      await logout();
    };
    
    // handle both fullName and name properties depending on API response shape
    const userName = student.fullName || student.name || 'User';
    const firstName = userName.split(' ')[0]; // first name only for a friendly greeting
    
    // insert a personalised greeting to the left of the Logout button
    const welcomeSpan = document.createElement('span');
    welcomeSpan.textContent = `Hi, ${firstName}`;
    welcomeSpan.style.cssText = 'color: #212529; font-weight: 600; font-size: 15px;';
    navActions.insertBefore(welcomeSpan, signupBtn);
    
    console.log('Nav updated successfully');
  }
}

// calls the Django logout API then redirects to the home page
async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout/`, {
      method: 'POST',
      credentials: 'include' // send session cookie so Django can invalidate the session
    });
    localStorage.removeItem('student'); // clear any locally stored student data
    window.location.href = 'home.html'; // redirect to the listings page
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// replaces the main content area with a friendly error message when a room can't be loaded
function showError() {
  document.querySelector('.room-detail-main').innerHTML = `
    <div class="room-detail-panel" style="text-align: center; padding: 60px 32px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 20px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h2 style="font-size: 24px; margin-bottom: 12px; color: #212529;">Room Not Found</h2>
      <p style="color: #6c757d; margin-bottom: 24px;">The room you're looking for doesn't exist or has been removed.</p>
      <a href="home.html#find-room" class="room-action-btn room-action-btn-primary" style="display: inline-flex; width: auto;">
        Back to Search
      </a>
    </div>
  `;
}

// formats an ISO date string (e.g. '2025-06-01') into a readable date like '1 June 2025'
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-GB', options); // en-GB gives day-first format
}

// shows a temporary slide-in notification in the top-right corner
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // apply inline styles directly since this element is created dynamically
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    font-weight: 600;
    max-width: 350px;
  `;
  
  document.body.appendChild(notification); // inject into the page
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease'; // slide back out
    setTimeout(() => notification.remove(), 300); // remove from DOM after animation
  }, 3000); // visible for 3 seconds
}

// checks whether the logged-in user is the room owner and shows the delete button if so
async function setupDeleteButton(roomId, ownerEmail) {
  console.log('Setting up delete button for room:', roomId, 'owner:', ownerEmail);
  
  try {
    const response = await fetch(`${API_BASE_URL}/check-session/`, {
      credentials: 'include' // send session cookie to identify the logged-in user
    });
    
    const data = await response.json();
    console.log('Session check:', data);
    
    if (data.authenticated && data.student) {
      const currentUserEmail = data.student.email; // the logged-in user's email
      console.log('Current user:', currentUserEmail, 'Room owner:', ownerEmail);
      
      // only show the delete button if the logged-in user created this room
      if (currentUserEmail === ownerEmail) {
        console.log('User is owner - showing delete button');
        const deleteBtn = document.getElementById('deleteRoomBtn');
        if (deleteBtn) {
          deleteBtn.style.display = 'flex'; // make the hidden button visible
          deleteBtn.onclick = () => deleteRoom(roomId);
        }
      } else {
        console.log('User is not owner - hiding delete button');
        // delete button stays hidden — only the owner can delete their own listing
      }
    }
  } catch (error) {
    console.error('Error checking ownership:', error);
  }
}

// sends a DELETE request to the API to remove the room, then redirects to the home page
async function deleteRoom(roomId) {
  // ask for confirmation before doing something irreversible
  const confirmed = confirm('Are you sure you want to delete this room? This action cannot be undone.');
  
  if (!confirmed) {
    return; // user changed their mind — do nothing
  }
  
  console.log('Deleting room:', roomId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/`, {
      method: 'DELETE',
      credentials: 'include', // send session cookie to prove ownership
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Delete response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Room deleted successfully:', data);
      showNotification('Room deleted successfully!', 'success');
      
      // redirect to the listings page after a short delay so the user sees the message
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);
    } else {
      const errorData = await response.json();
      console.error('Delete failed:', errorData);
      showNotification(errorData.message || 'Failed to delete room', 'error');
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    showNotification('An error occurred. Please try again.', 'error');
  }
}

// inject the slide-in/slide-out animations used by showNotification
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0; /* starts off-screen to the right */
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0; /* slides off-screen to the right */
    }
  }
`;
document.head.appendChild(style); // inject the keyframes into the document

// sets up the 'Contact Landlord' modal — open/close triggers and form submission
function setupMessageModal() {
  const modal = document.getElementById('messageModal');
  const contactBtn = document.getElementById('contactLandlordBtn'); // button that opens the modal
  const closeBtn = document.getElementById('closeMessageModal'); // X button in the modal
  const cancelBtn = document.getElementById('cancelMessage'); // Cancel button in the form
  const messageForm = document.getElementById('messageForm');
  
  if (contactBtn) {
    contactBtn.addEventListener('click', async () => {
      console.log('Contact landlord clicked. Current user:', currentUser);
      
      if (currentUser) {
        // user is already confirmed as logged in — open the modal immediately
        openMessageModal();
      } else {
        // currentUser might be null because auth check hasn't finished yet
        // do a fresh check before redirecting to avoid false redirects
        try {
          const response = await fetch(`${API_BASE_URL}/check-session/`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Re-check auth data:', data);
            
            if (data.authenticated || data.isAuthenticated) {
              currentUser = data.student; // update the global now that we have it
              openMessageModal();
              return;
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
        }
        
        // genuinely not logged in — notify and redirect to login
        showNotification('Please login to contact the landlord', 'info');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMessageModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeMessageModal);
  }
  
  // clicking the backdrop (outside the modal box) also closes it
  modal.addEventListener('click', (e) => {
    if (e.target === modal) { // only if the click hit the overlay, not the modal box itself
      closeMessageModal();
    }
  });
  
  if (messageForm) {
    messageForm.addEventListener('submit', handleMessageSubmit);
  }
}

// opens the message modal and pre-fills the landlord name and room title
function openMessageModal() {
  const modal = document.getElementById('messageModal');
  const modalLandlordAvatar = document.getElementById('modalLandlordAvatar');
  const modalLandlordName = document.getElementById('modalLandlordName');
  const modalRoomTitle = document.getElementById('modalRoomTitle');
  
  if (currentRoom) {
    modalLandlordAvatar.textContent = currentRoom.landlord.initials; // initials in the avatar circle
    modalLandlordName.textContent = currentRoom.landlord.name;
    modalRoomTitle.textContent = currentRoom.title; // show which room the message is about
  }
  
  // reset the form and clear any previous error messages
  document.getElementById('messageForm').reset();
  document.getElementById('messageFormError').classList.remove('show');
  document.getElementById('messageFormError').textContent = '';
  
  modal.classList.add('active'); // CSS transition fades the modal in
  document.body.style.overflow = 'hidden'; // prevent scrolling while modal is open
}

// closes the message modal and restores normal scrolling
function closeMessageModal() {
  const modal = document.getElementById('messageModal');
  modal.classList.remove('active'); // CSS transition fades the modal out
  document.body.style.overflow = ''; // re-enable page scrolling
}

// handles the message form submission — validates input, calls the API, shows feedback
async function handleMessageSubmit(e) {
  e.preventDefault(); // stop the form from doing a full page reload
  
  const subject = document.getElementById('messageSubject').value.trim();
  const content = document.getElementById('messageContent').value.trim();
  const errorDiv = document.getElementById('messageFormError'); // the inline error message area
  const sendBtn = document.getElementById('sendMessageBtn');
  
  // both subject and message body are required
  if (!subject || !content) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.classList.add('show'); // CSS shows the error div
    return;
  }
  
  errorDiv.classList.remove('show'); // clear any previous error
  
  // disable the send button and show a loading spinner while the request is in flight
  sendBtn.disabled = true;
  sendBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2"></path>
    </svg>
    Sending...
  `;
  
  try {
    // send the message to the Django API
    const response = await fetch(`${API_BASE_URL}/messages/send/`, {
      method: 'POST',
      credentials: 'include', // send session cookie to identify the sender
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: currentRoom.id, // which room the message is about
        subject: subject,
        content: content
      })
    });
    
    console.log('Message send response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Message sent:', data);
      
      showNotification('Message sent successfully! The landlord will respond soon.', 'success');
      closeMessageModal(); // close the modal after a successful send
    } else {
      const errorData = await response.json();
      console.error('Message send failed:', errorData);
      errorDiv.textContent = errorData.message || 'Failed to send message. Please try again.';
      errorDiv.classList.add('show'); // show the error inside the modal
    }
    
    // restore the send button to its original state
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Send Message
    `;
    
  } catch (error) {
    // network error — show error inside the modal and re-enable the send button
    console.error('Error sending message:', error);
    errorDiv.textContent = 'Failed to send message. Please try again.';
    errorDiv.classList.add('show');
    
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Send Message
    `;
  }
}

// inject the 'spin' animation used by the loading spinner in the send button
const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); } /* full rotation in 1 second */
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = spinKeyframes;
document.head.appendChild(styleSheet);

// Leaflet map instance and its marker — stored globally so they can be updated later
let map = null;
let marker = null;

// populates the university dropdown on the map overlay
// uses dataset flags to prevent duplicate population or listener binding on re-runs
function setupUniversitySelector() {
  const select = document.getElementById('universitySelect');
  if (!select) return; // element might not exist on this page

  if (!select.dataset.populated) {
    // add an <option> for each university in the UNIVERSITY_LOCATIONS array
    UNIVERSITY_LOCATIONS.forEach((uni, index) => {
      const option = document.createElement('option');
      option.value = String(index); // use the array index as the value
      option.textContent = uni.name;
      select.appendChild(option);
    });
    select.dataset.populated = '1'; // mark as populated so we don't add duplicates
  }

  if (!select.dataset.bound) {
    select.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === '' || !map) return; // ignore the blank/placeholder option or if map not ready

      const uni = UNIVERSITY_LOCATIONS[Number(value)]; // look up the selected university
      if (!uni) return;

      // fly the map view to the selected university
      map.flyTo([uni.lat, uni.lon], 14, { duration: 1.1 }); // smooth animated pan + zoom
      L.popup({ closeButton: true })
        .setLatLng([uni.lat, uni.lon])
        .setContent(`<strong>${uni.name}</strong>`) // show a popup with the university name
        .openOn(map);
    });
    select.dataset.bound = '1'; // mark as bound so we don't attach a second listener
  }
}

// normalises a UK postcode string to the standard format with a space before the last 3 chars
// e.g. 'NW12DA' → 'NW1 2DA', 'EC1A1BB' → 'EC1A 1BB'
function normalizeUKPostcode(value) {
  if (!value) return '';
  const compact = String(value).trim().toUpperCase().replace(/\s+/g, ''); // strip all spaces first
  // standard UK postcode always has 3 chars in the inward part (the second half)
  if (compact.length > 3) {
    return `${compact.slice(0, -3)} ${compact.slice(-3)}`; // insert space before last 3 chars
  }
  return compact; // short string — return as-is
}

// builds an ordered list of geocoding query strings to try
// tries the most specific (postcode + location) first, then falls back to less specific queries
function createGeocodeQueries(searchQuery, locationName) {
  const postcode = normalizeUKPostcode(searchQuery); // normalise the postcode
  const location = (locationName || '').trim();
  const queries = [];

  // most accurate: combine the area name with the normalised postcode
  if (postcode && location) queries.push(`${location}, ${postcode}, United Kingdom`);
  if (postcode) queries.push(`${postcode}, United Kingdom`); // postcode alone
  if (location) queries.push(`${location}, United Kingdom`); // location name alone
  if (searchQuery) queries.push(String(searchQuery).trim()); // raw search query as last resort

  return [...new Set(queries.filter(Boolean))]; // remove empty strings and duplicates
}

// iterates through the geocoding queries until one returns a result
// uses Nominatim (OpenStreetMap's free geocoder) with UK country filter
async function geocodeWithFallback(searchQuery, locationName) {
  const queries = createGeocodeQueries(searchQuery, locationName);
  let lastError = null;

  for (const query of queries) {
    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&limit=5&addressdetails=1`;
      // countrycodes=gb restricts results to the UK
      const response = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'StudentNest/1.0' // Nominatim requires a User-Agent header
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed for query: ${query}`);
      }

      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        return {
          query, // which query string produced this result
          result: results[0], // use the top result
          results
        };
      }
      // no results for this query — fall through to the next one
    } catch (error) {
      lastError = error;
      console.warn('Geocode attempt failed:', query, error.message);
    }
  }

  // all queries exhausted — throw the last error (or a generic one)
  if (lastError) throw lastError;
  throw new Error('Location not found');
}

// geocodes the room's postcode/location and renders a Leaflet map centred on it
// uses CARTO tiles as the primary tile layer to avoid referrer-blocking issues with OSM
async function initializeMap(searchQuery, locationName) {
  console.log('Initializing map for:', searchQuery);
  
  try {
    // try to geocode the postcode (or location name) using Nominatim with fallback queries
    const geocode = await geocodeWithFallback(searchQuery, locationName);
    console.log('Geocoding result:', geocode);

    const bestResult = geocode.result; // use the top Nominatim result
    const lat = parseFloat(bestResult.lat);
    const lon = parseFloat(bestResult.lon);
    
    // if a map already exists from a previous call, remove it before creating a new one
    if (map) {
      map.remove();
    }
    
    map = L.map('map').setView([lat, lon], 15); // zoom level 15 gives a street-level view
    setupUniversitySelector(); // re-initialise the selector now that the map exists
    
    // CARTO light_all tiles are used as the primary layer
    // they don't require a referrer header, avoiding the 'Access blocked: Referer is required' error
    const primaryTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd' // CARTO uses subdomains a/b/c/d for load balancing
    });

    primaryTiles.on('tileerror', () => {
      // if any CARTO tile fails to load, switch to the OSM HOT humanitarian tiles as a fallback
      // the _studentnestTilesFallbackApplied flag prevents adding multiple fallback layers
      if (!map || map._studentnestTilesFallbackApplied) return;
      map._studentnestTilesFallbackApplied = true;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
        maxZoom: 19
      }).addTo(map);
    });

    primaryTiles.addTo(map); // add the CARTO tiles to the map
    
    // custom house-shaped icon for the map marker
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: #007bff;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" style="transform: rotate(45deg);">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40], // anchor point at the bottom of the diamond so it points at the exact location
      popupAnchor: [0, -40] // popup appears above the marker
    });
    
    // place the marker and show a popup with the room's address
    marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="font-size: 14px; color: #212529;">${locationName}</strong>
        <br>
        <span style="font-size: 12px; color: #6c757d;">${bestResult.display_name}</span>
      </div>
    `).openPopup();
    
    // add a semi-transparent circle to indicate the approximate area
    L.circle([lat, lon], {
      color: '#007bff',
      fillColor: '#007bff',
      fillOpacity: 0.1,
      radius: 500 // 500 metre radius
    }).addTo(map);
    
    document.getElementById('mapError').style.display = 'none'; // hide any previous error message
    
    console.log('Map initialized successfully');
    
  } catch (error) {
    console.error('Error initializing map:', error);
    
    // if geocoding fails, hide the map container and show an error message instead
    document.getElementById('map').style.display = 'none';
    document.getElementById('mapError').style.display = 'block';
  }
}

// inject a second spin keyframe block for the submit report button loading spinner
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);


// ============================================
// REPORT ROOM FUNCTIONALITY
// students can flag a listing if it appears fraudulent, offensive, or inaccurate
// ============================================

// attaches all event listeners for the report modal (open, close, submit)
function setupReportModal() {
  const reportBtn = document.getElementById('reportRoomBtn'); // the 'Report' link
  const reportModal = document.getElementById('reportModalOverlay'); // the full-screen overlay
  const closeReportBtn = document.getElementById('closeReportModal'); // X button in the modal
  const cancelReportBtn = document.getElementById('cancelReportBtn'); // Cancel button
  const reportForm = document.getElementById('reportForm');
  
  if (reportBtn) {
    reportBtn.addEventListener('click', openReportModal);
  }
  
  if (closeReportBtn) {
    closeReportBtn.addEventListener('click', closeReportModal);
  }
  
  if (cancelReportBtn) {
    cancelReportBtn.addEventListener('click', closeReportModal);
  }
  
  // clicking the backdrop outside the modal box also closes it
  if (reportModal) {
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) { // only if the backdrop itself was clicked
        closeReportModal();
      }
    });
  }
  
  if (reportForm) {
    reportForm.addEventListener('submit', submitReport); // hand off to the submit function
  }
}

// shows the report modal overlay
function openReportModal() {
  const reportModal = document.getElementById('reportModalOverlay');
  if (reportModal) {
    reportModal.style.display = 'flex'; // flex centres the modal box inside the overlay
    document.body.style.overflow = 'hidden'; // prevent scrolling while the modal is open
  }
}

// hides the report modal overlay and resets the form
function closeReportModal() {
  const reportModal = document.getElementById('reportModalOverlay');
  if (reportModal) {
    reportModal.style.display = 'none'; // hide the overlay
    document.body.style.overflow = 'auto'; // restore normal scrolling
    
    // reset the form so the user starts fresh if they open the modal again
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
      reportForm.reset();
    }
  }
}

// sends the report to the Django API and handles the response
async function submitReport(e) {
  e.preventDefault(); // stop the form from doing a full page reload
  
  const submitBtn = document.getElementById('submitReportBtn');
  const reportType = document.getElementById('reportType').value; // e.g. 'fraud', 'offensive'
  const description = document.getElementById('reportDescription').value.trim(); // the written reason
  
  // both the category and a description are required
  if (!reportType || !description) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (!currentRoom) {
    // shouldn't happen, but safe guard if the room data never loaded
    showNotification('Room information not available', 'error');
    return;
  }
  
  // disable the submit button and show a loading indicator while the request is in flight
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Submitting...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/reports/create/`, {
      method: 'POST',
      credentials: 'include', // send session cookie to identify the reporter
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: currentRoom.id, // which room is being reported
        report_type: reportType, // the category selected in the dropdown
        description: description // the student's written explanation
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification(data.message || 'Report submitted successfully!', 'success');
      closeReportModal(); // close after a successful report
    } else {
      showNotification(data.message || 'Failed to submit report. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    showNotification('An error occurred. Please try again later.', 'error');
  } finally {
    // always re-enable the button, whether the request succeeded or failed
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

