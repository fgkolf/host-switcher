document.addEventListener('DOMContentLoaded', function() {
  const hostsList = document.querySelector('.host-list');
  const hostInput = document.querySelector('.host-input');
  const addHostBtn = document.querySelector('.add-button');
  const errorMessage = document.querySelector('.error-message');

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }

  function getPathFromUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return '';
    }
  }

  function openNewTabWithHost(tabUrl, newHostWithProtocol) {
    const path = getPathFromUrl(tabUrl);
    // Remove trailing slash from host if present
    let host = newHostWithProtocol.replace(/\/$/, '');
    const newUrl = host + path;
    chrome.tabs.create({ url: newUrl });
  }

  function loadHosts() {
    chrome.storage.sync.get(['savedHosts'], function(result) {
      const hosts = result.savedHosts || [];
      renderHosts(hosts);
    });
  }

  function saveHosts(hosts) {
    chrome.storage.sync.set({ savedHosts: hosts });
  }

  function renderHosts(hosts) {
    hostsList.innerHTML = '';

    if (hosts.length === 0) {
      hostsList.innerHTML = '<div class="no-hosts">No hosts saved. Add one below!</div>';
      return;
    }

    hosts.forEach(function(host, index) {
      const hostElement = document.createElement('div');
      hostElement.className = 'host-button';
      hostElement.innerHTML = `
        <span class="host-text">${host}</span>
        <button class="remove-button" data-index="${index}"></button>
      `;

      // Make the whole host button clickable except the remove button
      hostElement.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-button')) return;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const tab = tabs[0];
          openNewTabWithHost(tab.url, host);
        });
      });

      // Add click handler for remove button
      hostElement.querySelector('.remove-button').addEventListener('click', function(e) {
        e.stopPropagation();
        removeHost(index);
      });

      hostsList.appendChild(hostElement);
    });
  }

  function addHost() {
    const newHost = hostInput.value.trim();

    if (!newHost) {
      showError('Please enter a host');
      return;
    }

    if (!newHost.match(/^https?:\/\//)) {
      showError('Please enter a valid host with protocol (e.g. http://localhost:3000)');
      return;
    }

    chrome.storage.sync.get(['savedHosts'], function(result) {
      const hosts = result.savedHosts || [];

      if (hosts.includes(newHost)) {
        showError('Host already exists!');
        return;
      }

      hosts.push(newHost);
      saveHosts(hosts);
      renderHosts(hosts);
      hostInput.value = '';
      hideError();
    });
  }

  function removeHost(index) {
    chrome.storage.sync.get(['savedHosts'], function(result) {
      const hosts = result.savedHosts || [];
      hosts.splice(index, 1);
      saveHosts(hosts);
      renderHosts(hosts);
    });
  }

  // Event listeners
  addHostBtn.addEventListener('click', addHost);

  hostInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addHost();
    }
  });

  hostInput.addEventListener('input', hideError);

  // Initialize
  loadHosts();
});
