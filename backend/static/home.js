// Home Page Functionality
// this file handles everything on the home/browse page â€” room listings, search, favorites, and navigation

(function() {
  'use strict'; // strict mode catches common JS mistakes like using undeclared variables

  const API_BASE_URL = '/api'; // base path for all API requests â€” relative so it works on any domain

  // checks whether the current visitor is logged in by asking the Django API
  async function checkAuthentication() {
    console.log('Checking authentication...');
    try {
      const response = await fetch(`${API_BASE_URL}/check-session/`, {
        credentials: 'include' // send the session cookie so Django can identify the user
      });
      const data = await response.json();
      console.log('Auth response:', data);
      
      if (data.authenticated && data.student) {
        console.log('User authenticated:', data.student);
        // update the nav buttons to show the student's name instead of "Login"
        const navActions = document.querySelector('.home-nav-actions');
        const loginBtn = navActions.querySelector('a[href="index.html"]');
        const signupBtn = navActions.querySelector('a[href="signup.html"]');
        
        if (loginBtn && signupBtn) {
          loginBtn.textContent = `Hi, ${data.student.name.split(' ')[0]}`;
          // show first name only â€” "Hi, Arvin" looks friendlier than the full name
          loginBtn.href = 'portal.html'; // clicking their name takes them to their dashboard
          signupBtn.textContent = 'Logout'; // change "Sign Up" to "Logout" for logged-in users
          signupBtn.onclick = (e) => {
            e.preventDefault();
            logout(); // trigger the logout function when clicked
          };
        }
        
        return data.student; // return the student object so the caller can use it
      }
      console.log('User not authenticated');
      return null; // not logged in
    } catch (error) {
      console.log('Authentication check failed:', error);
      return null; // treat any error as not authenticated
    }
  }

  // logs the user out by calling the Django API, then redirects to the home page
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        credentials: 'include' // send the session cookie so Django knows which session to end
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('student'); // clear any locally stored student data
    window.location.href = 'home.html'; // redirect back to the listings page
  }

  // these hold the complete room list and the currently filtered subset
  let roomsData = [];
  let filteredRooms = [];
  let savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
  // savedRooms is a legacy localStorage fallback â€” real favorites are loaded from the API
  let userFavorites = []; // array of room IDs the logged-in user has favorited
  let currentUser = null; // the currently logged-in student object (or null if not logged in)

  // fetches the logged-in user's favorites from the Django API
  // builds an array of favorited room IDs so we can highlight the heart buttons
  async function loadUserFavorites() {
    console.log('Loading user favorites...');
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/`, {
        credentials: 'include' // send session cookie to prove who we are
      });
      
      console.log('Favorites response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Favorites response data:', data);
        // the API returns { rooms: [...] } â€” extract just the IDs for quick lookup
        userFavorites = data.rooms ? data.rooms.map(room => room.id) : [];
        console.log('Loaded user favorites:', userFavorites);
      } else {
        console.log('Failed to load favorites, status:', response.status);
      }
    } catch (error) {
      console.log('Could not load favorites:', error);
      // not a fatal error â€” favorites just won't be highlighted
    }
  }

  // fetches all available rooms from the Django API and transforms them into the format the UI expects
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

      // the API might return an array directly, or wrap it in rooms/results
      const rooms = Array.isArray(data) ? data : (data.rooms || data.results || []);
      console.log(`Processing ${rooms.length} rooms`);

      // transform each room from the API shape into what the UI needs
      roomsData = rooms.map(room => {
        // build a human-readable features list from the boolean amenity fields
        const features = [];
        if (room.furnished === 'fully') features.push('Fully Furnished');
        else if (room.furnished === 'part') features.push('Part Furnished');
        
        if (room.bills === 'included') features.push('Bills Included');
        if (room.wifi) features.push('WiFi');
        if (room.parking) features.push('Parking');
        if (room.washing_machine) features.push('Washing Machine');
        if (room.gym) features.push('Gym');
        if (room.garden) features.push('Garden');

        // decide what badge to show on the card corner
        let badge = null;
        let badgeType = null;
        if (room.is_featured) {
          badge = 'Featured'; // admin-marked featured listings get the gold badge
          badgeType = 'featured';
        } else if (room.is_verified) {
          badge = 'Verified'; // verified listings get a blue badge
          badgeType = 'verified';
        }

        // if the room was posted in the last 7 days and has no other badge, mark it as "New"
        const createdDate = new Date(room.created_at);
        const daysSinceCreated = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
        // divide milliseconds by ms-per-day to get days
        if (daysSinceCreated <= 7 && !badge) {
          badge = 'New';
          badgeType = 'new';
        }

        return {
          id: room.id,
          title: room.title,
          price: parseFloat(room.price), // ensure it's a number for comparisons
          location: room.location,
          distance: room.distance_to_transport || 'Near university', // fallback text
          image: room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
          // use the first image from the API, or fall back to a stock photo
          badge: badge,
          badgeType: badgeType,
          features: features,
          description: room.description || '',
          available: new Date(room.available_from), // convert string to Date for comparisons
          type: room.room_type,
          owner: room.owner
        };
      });

      filteredRooms = [...roomsData]; // start with all rooms visible
      console.log(`Loaded ${roomsData.length} rooms`);
      
      // update the section heading to show how many rooms are available
      const sectionTitle = document.querySelector('.home-section-title');
      if (sectionTitle) {
        sectionTitle.textContent = `${roomsData.length} Available Room${roomsData.length !== 1 ? 's' : ''}`;
        // add an "s" for plural â€” "1 Room" vs "5 Rooms"
      }

      renderRooms(); // draw the room cards to the page
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showNotification('Unable to load rooms. Please try again later.', 'error');
    }
  }

  // mobile menu â€” hamburger button opens a slide-in nav, close button hides it
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');

  if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active'); // show the menu
      document.body.style.overflow = 'hidden'; // prevent scrolling while the menu is open
    });

    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active'); // hide the menu
      document.body.style.overflow = ''; // restore normal scrolling
    });

    // also close the menu when the user taps any navigation link inside it
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // search tab toggle â€” switches between "Rooms" and "Flatmates" search tabs
  const searchTabs = document.querySelectorAll('.home-search-tab');
  searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      searchTabs.forEach(t => t.classList.remove('active')); // deactivate all tabs
      tab.classList.add('active'); // activate the clicked one
      
      // update the search button text to match the active tab
      const tabType = tab.getAttribute('data-tab');
      const searchBtn = document.querySelector('.home-search-btn span');
      if (searchBtn) {
        searchBtn.textContent = tabType === 'room' ? 'Search Rooms' : 'Search Flatmates';
      }
    });
  });

  // search form â€” intercept the submit event and run client-side filtering instead
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault(); // don't do a page reload
      performSearch(); // filter the loaded rooms instead
    });
  }

  // filters roomsData based on the current search form values
  function performSearch() {
    const location = document.getElementById('location').value.toLowerCase();
    // lowercase for case-insensitive matching
    const maxPrice = parseInt(document.getElementById('maxPrice').value) || Infinity;
    // if no price entered, treat as no upper limit
    const moveDate = document.getElementById('moveDate').value;

    filteredRooms = roomsData.filter(room => {
      const matchesLocation = !location || 
        room.location.toLowerCase().includes(location) ||
        room.distance.toLowerCase().includes(location);
      // empty location means "match all" â€” otherwise check if either field contains the search text
      
      const matchesPrice = room.price <= maxPrice;
      // only include rooms within the specified price limit
      
      const matchesDate = !moveDate || new Date(moveDate) >= room.available;
      // if no date is set, include all rooms â€” otherwise only rooms available before the target date

      return matchesLocation && matchesPrice && matchesDate;
      // all three conditions must pass
    });

    renderRooms(); // redraw the grid with the filtered results
    
    // scroll the results section into view so the user can see them immediately
    document.getElementById('find-room').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });

    // update the heading to show how many results matched
    const sectionTitle = document.querySelector('.home-section-title');
    if (sectionTitle) {
      sectionTitle.textContent = `Found ${filteredRooms.length} Room${filteredRooms.length !== 1 ? 's' : ''}`;
    }
  }

  // renders the room cards grid â€” called after fetch and after every filter/search
  function renderRooms() {
    const roomsGrid = document.querySelector('.home-rooms-grid');
    if (!roomsGrid) return; // no grid on this page â€” do nothing

    // if the filter returns zero results, show an empty state message
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

    // build the HTML for all room cards using a template literal and .map()
    roomsGrid.innerHTML = filteredRooms.map(room => `
      <div class="home-room-card" data-room-id="${room.id}">
        <div class="home-room-image">
          <img src="${room.image}" alt="${room.title}" />
          <span class="home-room-badge ${room.badgeType}">${room.badge}</span>
          <!-- the heart/save button â€” filled if the room is already in the user's favorites -->
          <button class="home-room-save ${userFavorites.includes(room.id) ? 'saved' : ''}" data-room-id="${room.id}" title="${userFavorites.includes(room.id) ? 'Remove from favorites' : 'Add to favorites'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${userFavorites.includes(room.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
            </svg>
          </button>
        </div>
        <div class="home-room-content">
          <div class="home-room-price">Â£${room.price}<span>/month</span></div>
          <h3 class="home-room-title">${room.title}</h3>
          <p class="home-room-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${room.distance}
          </p>
          <div class="home-room-features">
            <!-- only show the first 2 features to keep cards compact -->
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
    `).join(''); // join all the card strings into one big HTML string

    addRoomClickHandlers(); // attach event listeners to the newly rendered buttons
  }

  // attaches click handlers to all interactive elements inside room cards
  // called after every render because the HTML is replaced each time
  function addRoomClickHandlers() {
    // save/unsave heart buttons
    const saveButtons = document.querySelectorAll('.home-room-save');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // stop the click from bubbling up to the card (which would open details)
        const roomId = parseInt(btn.getAttribute('data-room-id'));
        toggleSaveRoom(roomId, btn); // add or remove from favorites
      });
    });

    // "View Details" buttons navigate to the room details page
    const viewButtons = document.querySelectorAll('.home-room-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // same reason as above
        const roomId = parseInt(btn.getAttribute('data-room-id'));
        showRoomDetails(roomId);
      });
    });

    // clicking anywhere else on the card also opens the details page
    const roomCards = document.querySelectorAll('.home-room-card');
    roomCards.forEach(card => {
      card.addEventListener('click', () => {
        const roomId = parseInt(card.getAttribute('data-room-id'));
        showRoomDetails(roomId);
      });
    });
  }

  // handles adding and removing a room from the user's favorites
  async function toggleSaveRoom(roomId, button) {
    console.log('toggleSaveRoom called with roomId:', roomId);
    
    // redirect to login if the user is not authenticated
    if (!currentUser) {
      console.log('User not logged in');
      showNotification('Please login to save rooms to your favorites', 'info');
      setTimeout(() => {
        window.location.href = 'index.html'; // send to login page
      }, 1500);
      return;
    }

    const isFavorited = userFavorites.includes(roomId);
    // check if this room is already in the user's favorites list
    
    try {
      if (isFavorited) {
        // --- remove from favorites ---
        const response = await fetch(`${API_BASE_URL}/favorites/${roomId}/remove/`, {
          method: 'DELETE',
          credentials: 'include' // send session cookie to identify the user
        });
        
        const data = await response.json();
        
        if (response.ok) {
          userFavorites = userFavorites.filter(id => id !== roomId);
          // remove this room ID from the local array
          button.classList.remove('saved'); // update the button appearance
          button.querySelector('path').setAttribute('fill', 'none'); // empty heart
          button.setAttribute('title', 'Add to favorites');
          showNotification('Room removed from favorites', 'info');
        } else {
          showNotification(data.message || 'Failed to remove from favorites', 'error');
        }
      } else {
        // --- add to favorites ---
        const response = await fetch(`${API_BASE_URL}/favorites/add/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ room_id: roomId }) // tell the API which room to favorite
        });
        
        const data = await response.json();
        
        if (response.ok) {
          userFavorites.push(roomId); // add to the local array
          button.classList.add('saved'); // update button to filled heart
          button.querySelector('path').setAttribute('fill', 'currentColor'); // filled heart
          button.setAttribute('title', 'Remove from favorites');
          showNotification('Room added to favorites!', 'success');
        } else {
          showNotification(data.message || 'Failed to add to favorites', 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('An error occurred. Please try again.', 'error');
    }
  }

  // navigates to the room details page, passing the room ID as a URL parameter
  function showRoomDetails(roomId) {
    window.location.href = `room-details.html?id=${roomId}`;
    // the room-details.js script reads ?id= from the URL to know which room to load
  }

  // shows a slide-in notification toast in the top-right corner
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    // type controls the colour: 'success' = green, 'error' = red, 'info' = blue
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : 
          type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' :
          '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(notification); // inject into the DOM
    
    setTimeout(() => notification.classList.add('show'), 10);
    // tiny delay before adding 'show' so the CSS transition triggers properly
    setTimeout(() => {
      notification.classList.remove('show'); // slide back out
      setTimeout(() => notification.remove(), 300); // then remove from DOM after the transition
    }, 3000); // notification visible for 3 seconds
  }

  // smooth scroll for any anchor links on the page (e.g. "Find a room" scroll arrow)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault(); // don't jump â€” scroll smoothly instead
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // navbar scroll effect â€” adds a 'scrolled' class when the user scrolls down 100px
  // the CSS uses this class to add a background blur to the navbar
  let lastScroll = 0;
  const nav = document.querySelector('.home-nav');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset; // how many pixels from the top
    
    if (currentScroll > 100) {
      nav.classList.add('scrolled'); // make the nav opaque/frosted
    } else {
      nav.classList.remove('scrolled'); // transparent at the top
    }
    
    lastScroll = currentScroll;
  });

  // IntersectionObserver watches for elements entering the viewport and animates them in
  const observerOptions = {
    threshold: 0.3, // trigger when 30% of the element is visible
    rootMargin: '0px 0px -100px 0px' // only trigger when element is 100px inside the viewport
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in'); // CSS applies a fadeInUp animation
      }
    });
  }, observerOptions);

  // observe all the cards and steps so they animate in as you scroll down
  document.querySelectorAll('.home-stat-card, .home-step-card, .home-room-card').forEach(el => {
    observer.observe(el);
  });

  // set the minimum selectable date on the move-in date picker to today
  const moveDateInput = document.getElementById('moveDate');
  if (moveDateInput) {
    const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
    moveDateInput.setAttribute('min', today); // prevent selecting past dates
  }

  // main page initializer â€” runs authentication check then loads favorites and rooms in order
  async function initializePage() {
    console.log('Initializing page...');
    currentUser = await checkAuthentication(); // check if user is logged in
    console.log('currentUser after auth:', currentUser);
    if (currentUser) {
      await loadUserFavorites(); // only load favorites if the user is logged in
      console.log('userFavorites after load:', userFavorites);
    }
    await fetchRooms(); // load and render the room listings
    console.log('Page initialization complete');
  }

  // run initializePage once the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
    // DOM not ready yet â€” wait for it
  } else {
    initializePage(); // DOM already loaded â€” run straight away
  }

  // inject all the CSS needed for notifications and card animations
  // done here in JS because these styles are only needed when this script is loaded
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
      opacity: 1; /* fade in when 'active' class is added */
    }
    
    .room-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px); /* blurs the content behind the modal */
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
      color: #dc3545; /* red heart */
      z-index: 2; /* sit above the room image */
    }
    
    .home-room-save:hover {
      background: white;
      transform: scale(1.1); /* slightly enlarge on hover */
    }
    
    .home-room-save.saved {
      background: #dc3545; /* filled red when saved */
      color: white;
    }
    
    /* notification toast â€” slides in from the right */
    .notification {
      position: fixed;
      top: 90px;
      right: -400px; /* starts off-screen to the right */
      background: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 10000; /* above everything else */
      transition: right 0.3s ease; /* sliding animation */
      min-width: 280px;
    }
    
    .notification.show {
      right: 20px; /* slides in to 20px from the right edge */
    }
    
    .notification-success {
      border-left: 4px solid #28a745; /* green left border */
      color: #28a745;
    }
    
    .notification-error {
      border-left: 4px solid #dc3545; /* red left border */
      color: #dc3545;
    }
    
    .notification-info {
      border-left: 4px solid #007bff; /* blue left border */
      color: #007bff;
    }
    
    .notification span {
      color: #212529; /* dark text for the message */
      font-weight: 600;
    }
    
    /* scroll-triggered animation for cards */
    .animate-in {
      animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px); /* starts 30px below its final position */
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style); // inject the styles into the page head

})(); // close the IIFE â€” all variables above are scoped inside it
