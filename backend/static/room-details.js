// Room Details Page JavaScript

const API_BASE_URL = '/api';  // Relative path for same-domain

// Current image index for gallery
let currentImageIndex = 0;
let currentRoom = null;

// Get room ID from URL parameter
function getRoomIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id')) || 1;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  const roomId = getRoomIdFromURL();
  loadRoomDetails(roomId);
  setupGalleryNavigation();
  setupSaveButton();
  setupMessageModal();
  setupReportModal();
  checkAuthentication();
});

// Load room details
async function loadRoomDetails(roomId) {
  console.log('Loading room details for ID:', roomId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch room:', response.status);
      showError();
      return;
    }
    
    const roomData = await response.json();
    console.log('Room data received:', roomData);
    
    // Build features array from boolean fields
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
    
    // Map furnished choices to display text
    const furnishedMap = {
      'fully': 'Fully Furnished',
      'part': 'Part Furnished',
      'unfurnished': 'Unfurnished'
    };
    
    // Map bills choices to display text
    const billsMap = {
      'included': 'Included',
      'not_included': 'Not Included',
      'partial': 'Partially Included'
    };
    
    // Map room type choices to display text
    const roomTypeMap = {
      'single': 'Single Room',
      'double': 'Double Room',
      'ensuite': 'Ensuite Room',
      'studio': 'Studio',
      'shared': 'Shared Room'
    };
    
    // Transform API data to match expected format
    currentRoom = {
      id: roomData.id,
      title: roomData.title,
      location: roomData.location,
      distance: roomData.distance_to_transport || 'N/A',
      price: roomData.price,
      available: roomData.available_from,
      type: roomTypeMap[roomData.room_type] || roomData.room_type,
      furnished: furnishedMap[roomData.furnished] || roomData.furnished,
      bills: billsMap[roomData.bills] || roomData.bills,
      deposit: `£${roomData.deposit}`,
      minStay: roomData.min_stay_months ? `${roomData.min_stay_months} months` : 'Flexible',
      maxStay: roomData.max_stay_months ? `${roomData.max_stay_months} months` : 'Flexible',
      images: roomData.images || [],
      description: roomData.description,
      features: features,
      landlord: {
        name: roomData.owner_name || 'Unknown',
        type: 'Private Landlord',
        initials: (roomData.owner_name || 'UK').split(' ').map(n => n[0]).join(''),
        verified: true,
        responseRate: 95,
        responseTime: '2 hours'
      },
      badge: roomData.is_featured ? 'featured' : (roomData.is_verified ? 'verified' : null)
    };
    
    console.log('Transformed room data:', currentRoom);
    
    if (!currentRoom) {
      showError();
      return;
    }

    // Update page title
    document.title = `${currentRoom.title} - StudentNest`;
    
    // Breadcrumb
    document.getElementById('breadcrumbTitle').textContent = currentRoom.title;
    
    // Header
    document.getElementById('roomTitle').textContent = currentRoom.title;
    document.getElementById('roomLocation').textContent = currentRoom.location;
    document.getElementById('roomAvailable').textContent = `Available ${formatDate(currentRoom.available)}`;
    
    // Badge
    const badgeEl = document.getElementById('roomBadge');
    if (currentRoom.badge) {
      badgeEl.textContent = currentRoom.badge.charAt(0).toUpperCase() + currentRoom.badge.slice(1);
      badgeEl.style.display = 'inline-flex';
      if (currentRoom.badge === 'featured') badgeEl.style.background = '#007bff';
      if (currentRoom.badge === 'verified') badgeEl.style.background = '#28a745';
      if (currentRoom.badge === 'new') badgeEl.style.background = '#ffc107';
    } else {
      badgeEl.style.display = 'none';
    }
    
    // Gallery
    loadGallery(currentRoom.images);
    
    // Description
    document.getElementById('roomDescription').textContent = currentRoom.description;
    
    // Features (empty for now, can be populated later)
    const featuresHTML = currentRoom.features.length > 0 ? currentRoom.features.map(feature => `
      <div class="room-feature-item">
        <div class="room-feature-icon">${feature.icon}</div>
        <span>${feature.name}</span>
      </div>
    `).join('') : '<p>No features listed</p>';
    document.getElementById('roomFeatures').innerHTML = featuresHTML;
    
    // Room Details
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
    
    // Location
    document.getElementById('locationText').textContent = `${currentRoom.location}${currentRoom.distance ? ' - ' + currentRoom.distance : ''}`;
    
    // Initialize map with postcode
    if (roomData.postcode) {
      document.getElementById('postcodeDisplay').style.display = 'block';
      document.getElementById('postcodeText').textContent = roomData.postcode;
      initializeMap(roomData.postcode, currentRoom.location);
    } else if (currentRoom.location) {
      // Fallback to location if no postcode
      initializeMap(currentRoom.location, currentRoom.location);
    }
    
    // Sidebar Price
    document.getElementById('sidebarPrice').innerHTML = `£${currentRoom.price}<span>/month</span>`;
    
    // Landlord
    const landlord = currentRoom.landlord;
    document.getElementById('landlordAvatar').textContent = landlord.initials;
    document.getElementById('landlordName').textContent = landlord.name;
    document.getElementById('landlordType').textContent = landlord.type;
    
    // Update save button state
    updateSaveButtonState();
    
  } catch (error) {
    console.error('Error loading room:', error);
    showError();
  }
}

// Load gallery
function loadGallery(images) {
  currentImageIndex = 0;
  document.getElementById('mainImage').src = images[0];
  document.getElementById('imageCounter').textContent = `1 / ${images.length}`;
  
  // Create thumbnails
  const thumbsHTML = images.slice(0, 4).map((img, index) => `
    <div class="room-gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${img}" alt="Room ${index + 1}" />
    </div>
  `).join('');
  document.getElementById('galleryThumbs').innerHTML = thumbsHTML;
  
  // Add click handlers to thumbnails
  document.querySelectorAll('.room-gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.index);
      showImage(index);
    });
  });
}

// Setup gallery navigation
function setupGalleryNavigation() {
  document.getElementById('prevImage').addEventListener('click', () => {
    if (currentRoom && currentRoom.images.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentRoom.images.length) % currentRoom.images.length;
      showImage(currentImageIndex);
    }
  });
  
  document.getElementById('nextImage').addEventListener('click', () => {
    if (currentRoom && currentRoom.images.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % currentRoom.images.length;
      showImage(currentImageIndex);
    }
  });
}

// Show specific image
function showImage(index) {
  if (!currentRoom) return;
  
  currentImageIndex = index;
  document.getElementById('mainImage').src = currentRoom.images[index];
  document.getElementById('imageCounter').textContent = `${index + 1} / ${currentRoom.images.length}`;
  
  // Update active thumbnail
  document.querySelectorAll('.room-gallery-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
}

// Setup save button
function setupSaveButton() {
  document.getElementById('saveRoomBtn').addEventListener('click', () => {
    toggleSaveRoom(currentRoom.id);
  });
}

// Toggle save room
async function toggleSaveRoom(roomId) {
  console.log('TROUBLESHOOT - toggleSaveRoom called with roomId:', roomId);
  
  let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
  const index = savedRooms.indexOf(roomId);
  
  console.log('TROUBLESHOOT - Current saved rooms:', savedRooms);
  console.log('TROUBLESHOOT - Room index in saved:', index);
  
  if (index === -1) {
    // Add to favorites
    savedRooms.push(roomId);
    
    console.log('TROUBLESHOOT - Adding to favorites');
    console.log(`TROUBLESHOOT - API URL: ${API_BASE_URL}/favorites/add/`);
    console.log('TROUBLESHOOT - Method: POST');
    console.log('TROUBLESHOOT - Credentials: include');
    console.log('TROUBLESHOOT - Body:', { room_id: roomId });
    
    // Call backend API to add to favorites
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/add/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room_id: roomId })
      });
      
      console.log('TROUBLESHOOT - Response status:', response.status);
      console.log('TROUBLESHOOT - Response statusText:', response.statusText);
      console.log('TROUBLESHOOT - Response ok:', response.ok);
      console.log('TROUBLESHOOT - Response headers:', [...response.headers.entries()]);
      
      const responseText = await response.text();
      console.log('TROUBLESHOOT - Response body:', responseText);
      
      if (response.ok) {
        showNotification('Room saved to your favorites!', 'success');
      } else {
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
      console.error('EXCEPTION adding favorite:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`EXCEPTION ADDING FAVORITE:\n${error.name}: ${error.message}`);
      showNotification('Room saved locally', 'info');
    }
  } else {
    // Remove from favorites
    savedRooms.splice(index, 1);
    
    const deleteUrl = `${API_BASE_URL}/favorites/${roomId}/remove/`;
    console.log('TROUBLESHOOT - Removing from favorites');
    console.log('TROUBLESHOOT - API URL:', deleteUrl);
    console.log('TROUBLESHOOT - Method: DELETE');
    console.log('TROUBLESHOOT - Credentials: include');
    
    // Call backend API to remove from favorites
    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      console.log('TROUBLESHOOT - Response status:', response.status);
      console.log('TROUBLESHOOT - Response statusText:', response.statusText);
      console.log('TROUBLESHOOT - Response ok:', response.ok);
      console.log('TROUBLESHOOT - Response headers:', [...response.headers.entries()]);
      
      const responseText = await response.text();
      console.log('TROUBLESHOOT - Response body:', responseText);
      
      if (response.ok) {
        showNotification('Room removed from favorites', 'info');
      } else {
        console.error('Failed to remove favorite');
        alert(`ERROR REMOVING FAVORITE:\nStatus: ${response.status}\nResponse: ${responseText}`);
        showNotification('Room removed locally', 'info');
      }
    } catch (error) {
      console.error('EXCEPTION removing favorite:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`EXCEPTION REMOVING FAVORITE:\n${error.name}: ${error.message}`);
      showNotification('Room removed locally', 'info');
    }
  }
  
  localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
  updateSaveButtonState();
}

// Update save button state
async function updateSaveButtonState() {
  if (!currentRoom) return;
  
  const btn = document.getElementById('saveRoomBtn');
  let isSaved = false;
  
  // Check backend for favorite status
  try {
    const response = await fetch(`${API_BASE_URL}/favorites/${currentRoom.id}/check/`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      isSaved = data.is_favorited;
      
      // Sync localStorage with backend
      let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      if (isSaved && !savedRooms.includes(currentRoom.id)) {
        savedRooms.push(currentRoom.id);
        localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
      } else if (!isSaved && savedRooms.includes(currentRoom.id)) {
        savedRooms = savedRooms.filter(id => id !== currentRoom.id);
        localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
      }
    } else {
      // Fallback to localStorage if API fails
      const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
      isSaved = savedRooms.includes(currentRoom.id);
    }
  } catch (error) {
    console.error('Error checking favorite status:', error);
    // Fallback to localStorage if API fails
    const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
    isSaved = savedRooms.includes(currentRoom.id);
  }
  
  if (isSaved) {
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
      </svg>
      Saved
    `;
    btn.style.background = '#007bff';
    btn.style.color = 'white';
  } else {
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
      </svg>
      Save Room
    `;
    btn.style.background = 'white';
    btn.style.color = '#007bff';
  }
}

// Check authentication
let currentUser = null;

async function checkAuthentication() {
  try {
    console.log('🔍 DEBUG: Starting authentication check...');
    console.log('🔍 DEBUG: API_BASE_URL =', API_BASE_URL);
    console.log('🔍 DEBUG: Full URL =', `${API_BASE_URL}/check-session/`);
    
    const response = await fetch(`${API_BASE_URL}/check-session/`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('🔍 DEBUG: Response status:', response.status);
    console.log('🔍 DEBUG: Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 DEBUG: Response data:', JSON.stringify(data, null, 2));
      
      // Handle both authenticated and isAuthenticated properties
      if (data.authenticated || data.isAuthenticated) {
        console.log('🔍 DEBUG: User IS authenticated');
        console.log('🔍 DEBUG: Student data:', data.student);
        currentUser = data.student;
        updateNavForLoggedInUser(data.student);
      } else {
        console.log('❌ DEBUG: User NOT authenticated (data.authenticated and data.isAuthenticated are both false)');
      }
    } else {
      console.log('❌ DEBUG: Response not OK, status:', response.status);
    }
  } catch (error) {
    console.log('❌ DEBUG: Auth check error:', error);
  }
}

// Update nav for logged in user
function updateNavForLoggedInUser(student) {
  console.log('🔧 DEBUG: updateNavForLoggedInUser called with:', student);
  
  const navActions = document.querySelector('.home-nav-actions');
  if (!navActions) {
    console.error('Nav actions not found');
    return;
  }
  
  const loginBtn = navActions.querySelector('.home-nav-btn-outline');
  const signupBtn = navActions.querySelector('.home-nav-btn-primary');
  
  if (loginBtn && signupBtn) {
    loginBtn.remove();
    signupBtn.textContent = 'Logout';
    signupBtn.onclick = async (e) => {
      e.preventDefault();
      await logout();
    };
    
    // Handle both fullName and name properties
    const userName = student.fullName || student.name || 'User';
    const firstName = userName.split(' ')[0];
    
    const welcomeSpan = document.createElement('span');
    welcomeSpan.textContent = `Hi, ${firstName}`;
    welcomeSpan.style.cssText = 'color: #212529; font-weight: 600; font-size: 15px;';
    navActions.insertBefore(welcomeSpan, signupBtn);
    
    console.log('Nav updated successfully');
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

// Show error
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

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
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
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Setup delete button
async function setupDeleteButton(roomId, ownerEmail) {
  console.log('Setting up delete button for room:', roomId, 'owner:', ownerEmail);
  
  // Check if user is logged in
  try {
    const response = await fetch(`${API_BASE_URL}/check-session/`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Session check:', data);
    
    if (data.authenticated && data.student) {
      const currentUserEmail = data.student.email;
      console.log('Current user:', currentUserEmail, 'Room owner:', ownerEmail);
      
      // Show delete button if current user is the owner
      if (currentUserEmail === ownerEmail) {
        console.log('User is owner - showing delete button');
        const deleteBtn = document.getElementById('deleteRoomBtn');
        if (deleteBtn) {
          deleteBtn.style.display = 'flex';
          deleteBtn.onclick = () => deleteRoom(roomId);
        }
      } else {
        console.log('User is not owner - hiding delete button');
      }
    }
  } catch (error) {
    console.error('Error checking ownership:', error);
  }
}

// Delete room
async function deleteRoom(roomId) {
  const confirmed = confirm('Are you sure you want to delete this room? This action cannot be undone.');
  
  if (!confirmed) {
    return;
  }
  
  console.log('Deleting room:', roomId);
  
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Delete response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Room deleted successfully:', data);
      showNotification('Room deleted successfully!', 'success');
      
      // Redirect to home page after 1.5 seconds
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
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
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Setup message modal
function setupMessageModal() {
  const modal = document.getElementById('messageModal');
  const contactBtn = document.getElementById('contactLandlordBtn');
  const closeBtn = document.getElementById('closeMessageModal');
  const cancelBtn = document.getElementById('cancelMessage');
  const messageForm = document.getElementById('messageForm');
  
  // Open modal
  if (contactBtn) {
    contactBtn.addEventListener('click', async () => {
      console.log('Contact landlord clicked. Current user:', currentUser);
      
      // Check if user is logged in using currentUser variable
      if (currentUser) {
        openMessageModal();
      } else {
        // Double-check with API before redirecting
        try {
          const response = await fetch(`${API_BASE_URL}/check-session/`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Re-check auth data:', data);
            
            if (data.authenticated || data.isAuthenticated) {
              currentUser = data.student;
              openMessageModal();
              return;
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
        }
        
        // User not logged in, show notification and redirect
        showNotification('Please login to contact the landlord', 'info');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    });
  }
  
  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMessageModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeMessageModal);
  }
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeMessageModal();
    }
  });
  
  // Handle form submission
  if (messageForm) {
    messageForm.addEventListener('submit', handleMessageSubmit);
  }
}

// Open message modal
function openMessageModal() {
  const modal = document.getElementById('messageModal');
  const modalLandlordAvatar = document.getElementById('modalLandlordAvatar');
  const modalLandlordName = document.getElementById('modalLandlordName');
  const modalRoomTitle = document.getElementById('modalRoomTitle');
  
  if (currentRoom) {
    modalLandlordAvatar.textContent = currentRoom.landlord.initials;
    modalLandlordName.textContent = currentRoom.landlord.name;
    modalRoomTitle.textContent = currentRoom.title;
  }
  
  // Reset form
  document.getElementById('messageForm').reset();
  document.getElementById('messageFormError').classList.remove('show');
  document.getElementById('messageFormError').textContent = '';
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close message modal
function closeMessageModal() {
  const modal = document.getElementById('messageModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Handle message submission
async function handleMessageSubmit(e) {
  e.preventDefault();
  
  const subject = document.getElementById('messageSubject').value.trim();
  const content = document.getElementById('messageContent').value.trim();
  const errorDiv = document.getElementById('messageFormError');
  const sendBtn = document.getElementById('sendMessageBtn');
  
  // Validation
  if (!subject || !content) {
    errorDiv.textContent = 'Please fill in all fields';
    errorDiv.classList.add('show');
    return;
  }
  
  // Hide error
  errorDiv.classList.remove('show');
  
  // Disable submit button
  sendBtn.disabled = true;
  sendBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 6v6l4 2"></path>
    </svg>
    Sending...
  `;
  
  try {
    // Send message to backend API
    const response = await fetch(`${API_BASE_URL}/messages/send/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: currentRoom.id,
        subject: subject,
        content: content
      })
    });
    
    console.log('Message send response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Message sent:', data);
      
      // Success
      showNotification('Message sent successfully! The landlord will respond soon.', 'success');
      closeMessageModal();
    } else {
      const errorData = await response.json();
      console.error('Message send failed:', errorData);
      errorDiv.textContent = errorData.message || 'Failed to send message. Please try again.';
      errorDiv.classList.add('show');
    }
    
    // Reset button
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Send Message
    `;
    
  } catch (error) {
    console.error('Error sending message:', error);
    errorDiv.textContent = 'Failed to send message. Please try again.';
    errorDiv.classList.add('show');
    
    // Reset button
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

// Add spinning animation for loading state
const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = spinKeyframes;
document.head.appendChild(styleSheet);

// Map initialization with geocoding
let map = null;
let marker = null;

async function initializeMap(searchQuery, locationName) {
  console.log('Initializing map for:', searchQuery);
  
  try {
    // Use Nominatim API for geocoding (free, no API key needed)
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=1`;
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'StudentNest/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    console.log('Geocoding result:', data);
    
    if (data.length === 0) {
      throw new Error('Location not found');
    }
    
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    
    // Initialize map
    if (map) {
      map.remove(); // Remove existing map if any
    }
    
    map = L.map('map').setView([lat, lon], 15);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Custom icon for marker
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
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    // Add marker with popup
    marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong style="font-size: 14px; color: #212529;">${locationName}</strong>
        <br>
        <span style="font-size: 12px; color: #6c757d;">${data[0].display_name}</span>
      </div>
    `).openPopup();
    
    // Add circle to show approximate area
    L.circle([lat, lon], {
      color: '#007bff',
      fillColor: '#007bff',
      fillOpacity: 0.1,
      radius: 500 // 500 meters radius
    }).addTo(map);
    
    // Hide error message if any
    document.getElementById('mapError').style.display = 'none';
    
    console.log('Map initialized successfully');
    
  } catch (error) {
    console.error('Error initializing map:', error);
    
    // Show error message
    document.getElementById('map').style.display = 'none';
    document.getElementById('mapError').style.display = 'block';
  }
}
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
// ============================================

function setupReportModal() {
  const reportBtn = document.getElementById('reportRoomBtn');
  const reportModal = document.getElementById('reportModalOverlay');
  const closeReportBtn = document.getElementById('closeReportModal');
  const cancelReportBtn = document.getElementById('cancelReportBtn');
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
  
  if (reportModal) {
    reportModal.addEventListener('click', (e) => {
      if (e.target === reportModal) {
        closeReportModal();
      }
    });
  }
  
  if (reportForm) {
    reportForm.addEventListener('submit', submitReport);
  }
}

function openReportModal() {
  const reportModal = document.getElementById('reportModalOverlay');
  if (reportModal) {
    reportModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeReportModal() {
  const reportModal = document.getElementById('reportModalOverlay');
  if (reportModal) {
    reportModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset form
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
      reportForm.reset();
    }
  }
}

async function submitReport(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitReportBtn');
  const reportType = document.getElementById('reportType').value;
  const description = document.getElementById('reportDescription').value.trim();
  
  if (!reportType || !description) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (!currentRoom) {
    showNotification('Room information not available', 'error');
    return;
  }
  
  // Disable submit button
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Submitting...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/reports/create/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: currentRoom.id,
        report_type: reportType,
        description: description
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification(data.message || 'Report submitted successfully!', 'success');
      closeReportModal();
    } else {
      showNotification(data.message || 'Failed to submit report. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    showNotification('An error occurred. Please try again later.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

