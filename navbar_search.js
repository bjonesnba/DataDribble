// Navbar Search Functionality
// This should be placed in a file called navbar_search.js in your project root

// Global search data storage
const searchData = {
  players: [],
  teams: [],
  loaded: false
};

// Function to load search data from JSON file
async function loadSearchData() {
  if (searchData.loaded) {
    return searchData;
  }
  
  try {
    const response = await fetch('search_data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    searchData.players = data.players || [];
    searchData.teams = data.teams || [];
    searchData.loaded = true;
    
    console.log(`Search data loaded: ${searchData.players.length} players, ${searchData.teams.length} teams`);
    return searchData;
  } catch (error) {
    console.error('Error loading search data:', error);
    console.log('Make sure search_data.json exists and is accessible');
    return searchData;
  }
}

// Function to get all player IDs
function getAllPlayerIDs() {
  return searchData.players.map(player => player.id);
}

// Function to get all player names
function getAllPlayerNames() {
  return searchData.players.map(player => player.name);
}

// Function to get all team names
function getAllTeamNames() {
  return searchData.teams.map(team => team.name);
}

// Function to search for a specific player by name or ID
function findPlayer(query) {
  query = query.toLowerCase();
  return searchData.players.find(player => 
    player.name.toLowerCase() === query || 
    player.id.toLowerCase() === query
  );
}

// Function to search for a specific team
function findTeam(query) {
  query = query.toLowerCase();
  return searchData.teams.find(team => 
    team.name.toLowerCase() === query
  );
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', async function() {
  // Load search data first
  await loadSearchData();
  
  const searchInput = document.getElementById('navbarSearchInput');
  const suggestionsContainer = document.getElementById('searchSuggestions');
  
  if (!searchInput || !suggestionsContainer) {
    console.warn('Search input or suggestions container not found');
    return;
  }
  
  let debounceTimer;
  let selectedIndex = -1;
  
  // Handle input changes
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim().toLowerCase();
    selectedIndex = -1;
    
    if (query.length < 2) {
      suggestionsContainer.classList.remove('active');
      return;
    }
    
    debounceTimer = setTimeout(() => {
      showSuggestions(query);
    }, 200);
  });
  
  // Handle form submission
  document.getElementById('navbarSearchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });
  
  // Close suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.navbar-search-form')) {
      suggestionsContainer.classList.remove('active');
    }
  });
  
  // Handle keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    const items = Array.from(suggestionsContainer.querySelectorAll('.search-suggestion-item'));
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelectedItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelectedItem(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      items[selectedIndex].click();
    } else if (e.key === 'Escape') {
      suggestionsContainer.classList.remove('active');
      selectedIndex = -1;
    }
  });
  
  function updateSelectedItem(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }
});

function showSuggestions(query) {
  const suggestionsContainer = document.getElementById('searchSuggestions');
  
  // Filter players - search both name and full ID
  const playerMatches = searchData.players.filter(player => 
    player.name.toLowerCase().includes(query) || 
    player.id.toLowerCase().includes(query)
  ).slice(0, 8);
  
  // Filter teams
  const teamMatches = searchData.teams.filter(team => 
    team.name.toLowerCase().includes(query)
  ).slice(0, 5);
  
  // Build suggestions HTML
  let html = '';
  
  if (playerMatches.length === 0 && teamMatches.length === 0) {
    html = '<div class="search-no-results">No results found</div>';
  } else {
    // Add player matches
    playerMatches.forEach(player => {
      html += `
        <div class="search-suggestion-item" data-type="player" data-id="${escapeHtml(player.id)}">
          ${escapeHtml(player.name)}
          <span class="search-suggestion-type">Player</span>
        </div>
      `;
    });
    
    // Add team matches
    teamMatches.forEach(team => {
      html += `
        <div class="search-suggestion-item" data-type="team" data-name="${escapeHtml(team.name)}">
          ${escapeHtml(team.name)}
          <span class="search-suggestion-type">Team</span>
        </div>
      `;
    });
  }
  
  suggestionsContainer.innerHTML = html;
  suggestionsContainer.classList.add('active');
  
  // Add click handlers to suggestions
  suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach(item => {
    item.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      if (type === 'player') {
        const playerId = this.getAttribute('data-id');
        navigateToPlayer(playerId);
      } else if (type === 'team') {
        const teamName = this.getAttribute('data-name');
        navigateToTeam(teamName);
      }
    });
  });
}

function performSearch(query) {
  query = query.toLowerCase();
  
  // Try to find exact player match
  const playerMatch = findPlayer(query);
  
  if (playerMatch) {
    navigateToPlayer(playerMatch.id);
    return;
  }
  
  // Try to find exact team match
  const teamMatch = findTeam(query);
  
  if (teamMatch) {
    navigateToTeam(teamMatch.name);
    return;
  }
  
  // If no exact match, show suggestions
  showSuggestions(query);
}

function navigateToPlayer(playerId) {
  window.location.href = `player_dashboard.html?season=2026&player=${encodeURIComponent(playerId)}`;
}

function navigateToTeam(teamName) {
  window.location.href = `team_dashboard.html?season=2026&team=${encodeURIComponent(teamName)}`;
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Debug function - can be called from console
function debugSearchData() {
  console.log('Search Data Status:', searchData.loaded ? 'Loaded' : 'Not Loaded');
  console.log('Total Players:', searchData.players.length);
  console.log('Total Teams:', searchData.teams.length);
  console.log('Sample Players:', searchData.players.slice(0, 5));
  console.log('Sample Teams:', searchData.teams.slice(0, 5));
  console.log('All Player IDs:', getAllPlayerIDs());
}