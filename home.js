// Home Page Functionality
(function() {
  'use strict';

  const API_BASE_URL = 'https://studentnest-housing-platform.onrender.com/api';

  // Check if user is authenticated
  async function checkAuthentication() {
    console.log('Checking authentication...');
    try {
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Auth response:', data);
      
      if (data.authenticated && data.student) {
        console.log('User authenticated:', data.student);
        // Update navigation for authenticated users
        const navActions = document.querySelector('.home-nav-actions');
        const loginBtn = navActions.querySelector('a[href="index.html"]');
        const signupBtn = navActions.querySelector('a[href="signup.html"]');
        
        if (loginBtn && signupBtn) {
          loginBtn.textContent = `Hi, ${data.student.name.split(' ')[0]}`;
          loginBtn.href = 'portal.html';
          signupBtn.textContent = 'Logout';
          signupBtn.onclick = (e) => {
            e.preventDefault();
            logout();
          };
        }
        
        return data.student;
      }
      console.log('User not authenticated');
      return null;
    } catch (error) {
      console.log('Authentication check failed:', error);
      return null;
    }
  }

  // Logout functionality
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('student');
    window.location.href = 'home.html';
  }

  // Room data - will be fetched from backend
  let roomsData = [];
  let filteredRooms = [];
  let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
  let userFavorites = []; // Favorites from backend
  let currentUser = null;

  // Load user's favorites from backend
  async function loadUserFavorites() {
    console.log('Loading user favorites...');
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/`, {
        credentials: 'include'
      });
      
      console.log('Favorites response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Favorites response data:', data);
        // Backend returns 'rooms' array, not 'favorites'
        userFavorites = data.rooms ? data.rooms.map(room => room.id) : [];
        console.log('Loaded user favorites:', userFavorites);
      } else {
        console.log('Failed to load favorites, status:', response.status);
      }
    } catch (error) {
      console.log('Could not load favorites:', error);
    }
  }

  // Fetch rooms from backend
  async function fetchRooms() {
    console.log('Fetching rooms from API...');
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        console.error('Failed to fetch rooms:', response.status);
        return;
      }

      const data = await response.json();
      console.log('API response received:', data);

      // Handle both array and object response formats
      const rooms = Array.isArray(data) ? data : (data.rooms || data.results || []);
      console.log(`Processing ${rooms.length} rooms`);

      // Transform API data to match expected format
      roomsData = rooms.map(room => {
        // Build features array
        const features = [];
        if (room.furnished === 'fully') features.push('Fully Furnished');
        else if (room.furnished === 'part') features.push('Part Furnished');
        
        if (room.bills === 'included') features.push('Bills Included');
        if (room.wifi) features.push('WiFi');
        if (room.parking) features.push('Parking');
        if (room.washing_machine) features.push('Washing Machine');
        if (room.gym) features.push('Gym');
        if (room.garden) features.push('Garden');

        // Get badge type
        let badge = null;
        let badgeType = null;
        if (room.is_featured) {
          badge = 'Featured';
          badgeType = 'featured';
        } else if (room.is_verified) {
          badge = 'Verified';
          badgeType = 'verified';
        }

        // Check if room is new (created within last 7 days)
        const createdDate = new Date(room.created_at);
        const daysSinceCreated = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 7 && !badge) {
          badge = 'New';
          badgeType = 'new';
        }

        return {
          id: room.id,
          title: room.title,
          price: parseFloat(room.price),
          location: room.location,
          distance: room.distance_to_transport || 'Near university',
          image: room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
          badge: badge,
          badgeType: badgeType,
          features: features,
          description: room.description || '',
          available: new Date(room.available_from),
          type: room.room_type,
          owner: room.owner
        };
      });

      filteredRooms = [...roomsData];
      console.log(`Loaded ${roomsData.length} rooms`);
      
      // Update section title
      const sectionTitle = document.querySelector('.home-section-title');
      if (sectionTitle) {
        sectionTitle.textContent = `${roomsData.length} Available Room${roomsData.length !== 1 ? 's' : ''}`;
      }

      renderRooms();
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showNotification('Unable to load rooms. Please try again later.', 'error');
    }
  }

  // Mobile menu functionality
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Close menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Search tab functionality
  const searchTabs = document.querySelectorAll('.home-search-tab');
  searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      searchTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabType = tab.getAttribute('data-tab');
      const searchBtn = document.querySelector('.home-search-btn span');
      if (searchBtn) {
        searchBtn.textContent = tabType === 'room' ? 'Search Rooms' : 'Search Flatmates';
      }
    });
  });

  // Search form functionality
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch();
    });
  }

  function performSearch() {
    const location = document.getElementById('location').value.toLowerCase();
    const maxPrice = parseInt(document.getElementById('maxPrice').value) || Infinity;
    const moveDate = document.getElementById('moveDate').value;

    filteredRooms = roomsData.filter(room => {
      const matchesLocation = !location || 
        room.location.toLowerCase().includes(location) ||
        room.distance.toLowerCase().includes(location);
      
      const matchesPrice = room.price <= maxPrice;
      
      const matchesDate = !moveDate || new Date(moveDate) >= room.available;

      return matchesLocation && matchesPrice && matchesDate;
    });

    renderRooms();
    
    // Scroll to results
    document.getElementById('find-room').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });

    // Update section title with results count
    const sectionTitle = document.querySelector('.home-section-title');
    if (sectionTitle) {
      sectionTitle.textContent = `Found ${filteredRooms.length} Room${filteredRooms.length !== 1 ? 's' : ''}`;
    }
  }

  // Render rooms
  function renderRooms() {
    const roomsGrid = document.querySelector('.home-rooms-grid');
    if (!roomsGrid) return;

    if (filteredRooms.length === 0) {
      roomsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 20px;">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <h3 style="font-size: 24px; margin-bottom: 12px;">No rooms found</h3>
          <p style="color: #6c757d; margin-bottom: 20px;">Try adjusting your search filters</p>
          <button onclick="window.location.reload()" style="padding: 12px 32px; background: #007bff; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Clear Filters</button>
        </div>
      `;
      return;
    }

    roomsGrid.innerHTML = filteredRooms.map(room => `
      <div class="home-room-card" data-room-id="${room.id}">
        <div class="home-room-image">
          <img src="${room.image}" alt="${room.title}" />
          <span class="home-room-badge ${room.badgeType}">${room.badge}</span>
          <button class="home-room-save ${userFavorites.includes(room.id) ? 'saved' : ''}" data-room-id="${room.id}" title="${userFavorites.includes(room.id) ? 'Remove from favorites' : 'Add to favorites'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${userFavorites.includes(room.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
            </svg>
          </button>
        </div>
        <div class="home-room-content">
          <div class="home-room-price">£${room.price}<span>/month</span></div>
          <h3 class="home-room-title">${room.title}</h3>
          <p class="home-room-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${room.distance}
          </p>
          <div class="home-room-features">
            ${room.features.slice(0, 2).map(feature => `
              <span class="home-room-feature">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${feature}
              </span>
            `).join('')}
          </div>
          <button class="home-room-btn" data-room-id="${room.id}">View Details</button>
        </div>
      </div>
    `).join('');

    // Add click handlers
    addRoomClickHandlers();
  }

  // Add click handlers to room cards
  function addRoomClickHandlers() {
    // Save room buttons
    const saveButtons = document.querySelectorAll('.home-room-save');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomId = parseInt(btn.getAttribute('data-room-id'));
        toggleSaveRoom(roomId, btn);
      });
    });

    // View details buttons
    const viewButtons = document.querySelectorAll('.home-room-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomId = parseInt(btn.getAttribute('data-room-id'));
        showRoomDetails(roomId);
      });
    });

    // Room card click
    const roomCards = document.querySelectorAll('.home-room-card');
    roomCards.forEach(card => {
      card.addEventListener('click', () => {
        const roomId = parseInt(card.getAttribute('data-room-id'));
        showRoomDetails(roomId);
      });
    });
  }

  // Toggle save room
  async function toggleSaveRoom(roomId, button) {
    console.log('toggleSaveRoom called with roomId:', roomId);
    console.log('currentUser:', currentUser);
    console.log('userFavorites:', userFavorites);
    
    // Check if user is logged in
    if (!currentUser) {
      console.log('User not logged in');
      showNotification('Please login to save rooms to your favorites', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      return;
    }

    const isFavorited = userFavorites.includes(roomId);
    console.log('isFavorited:', isFavorited);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        console.log('Attempting to remove favorite...');
        const response = await fetch(`${API_BASE_URL}/favorites/${roomId}/remove/`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        console.log('Remove response status:', response.status);
        const data = await response.json();
        console.log('Remove response data:', data);
        
        if (response.ok) {
          userFavorites = userFavorites.filter(id => id !== roomId);
          button.classList.remove('saved');
          button.querySelector('path').setAttribute('fill', 'none');
          button.setAttribute('title', 'Add to favorites');
          showNotification('Room removed from favorites', 'info');
          console.log('Favorite removed successfully');
        } else {
          showNotification(data.message || 'Failed to remove from favorites', 'error');
          console.log('Failed to remove favorite:', data);
        }
      } else {
        // Add to favorites
        console.log('Attempting to add favorite...');
        const response = await fetch(`${API_BASE_URL}/favorites/add/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ room_id: roomId })
        });
        
        console.log('Add response status:', response.status);
        const data = await response.json();
        console.log('Add response data:', data);
        
        if (response.ok) {
          userFavorites.push(roomId);
          button.classList.add('saved');
          button.querySelector('path').setAttribute('fill', 'currentColor');
          button.setAttribute('title', 'Remove from favorites');
          showNotification('Room added to favorites!', 'success');
          console.log('Favorite added successfully');
        } else {
          showNotification(data.message || 'Failed to add to favorites', 'error');
          console.log('Failed to add favorite:', data);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('An error occurred. Please try again.', 'error');
    }
  }

  // Show room details - navigate to details page
  function showRoomDetails(roomId) {
    window.location.href = `room-details.html?id=${roomId}`;
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : 
          type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' :
          '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Navbar scroll effect
  let lastScroll = 0;
  const nav = document.querySelector('.home-nav');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });

  // Animate stats on scroll
  const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.home-stat-card, .home-step-card, .home-room-card').forEach(el => {
    observer.observe(el);
  });

  // Set min date for move-in date picker
  const moveDateInput = document.getElementById('moveDate');
  if (moveDateInput) {
    const today = new Date().toISOString().split('T')[0];
    moveDateInput.setAttribute('min', today);
  }

  // Initialize on page load
  async function initializePage() {
    console.log('Initializing page...');
    currentUser = await checkAuthentication();
    console.log('currentUser after auth:', currentUser);
    if (currentUser) {
      await loadUserFavorites();
      console.log('🔵 userFavorites after load:', userFavorites);
    }
    await fetchRooms();
    console.log('Page initialization complete');
  }

  // Wait for DOM to be ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
  } else {
    initializePage();
  }

  // Add CSS for modal and notifications
  const style = document.createElement('style');
  style.textContent = `
    .room-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .room-modal.active {
      opacity: 1;
    }
    
    .room-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    }
    
    .home-room-save {
      position: absolute;
      top: 16px;
      left: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: #dc3545;
      z-index: 2;
    }
    
    .home-room-save:hover {
      background: white;
      transform: scale(1.1);
    }
    
    .home-room-save.saved {
      background: #dc3545;
      color: white;
    }
    
    .notification {
      position: fixed;
      top: 90px;
      right: -400px;
      background: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 10000;
      transition: right 0.3s ease;
      min-width: 280px;
    }
    
    .notification.show {
      right: 20px;
    }
    
    .notification-success {
      border-left: 4px solid #28a745;
      color: #28a745;
    }
    
    .notification-error {
      border-left: 4px solid #dc3545;
      color: #dc3545;
    }
    
    .notification-info {
      border-left: 4px solid #007bff;
      color: #007bff;
    }
    
    .notification span {
      color: #212529;
      font-weight: 600;
    }
    
    .animate-in {
      animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

})();
