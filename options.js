// Saves options to chrome.storage
const saveOptions = async () => {
  const userId = document.getElementById('userId').value.trim();
  const websiteUrl = document.getElementById('websiteUrl').value.trim();
  
  // Add loading animation to button
  const saveButton = document.getElementById('save');
  saveButton.innerHTML = '<span class="loading-text">Saving</span>';
  saveButton.disabled = true;
  
  // Get status element
  const status = document.getElementById('status');
  
  try {
    // Validate the user ID
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error("Invalid User ID format. Please enter a valid UUID from your profile page.");
    }
    
    // Validate website URL if provided
    if (websiteUrl && !websiteUrl.match(/^https?:\/\/.+/)) {
      throw new Error("Invalid Website URL format. Please enter a valid URL starting with http:// or https://");
    }
    
    // Save the settings
    await new Promise(resolve => {
      chrome.storage.local.set({ userId, websiteUrl }, resolve);
    });
    
    // Update status to let user know options were saved
    status.textContent = 'Settings saved successfully!';
    status.className = 'success';
    
    setTimeout(() => {
      status.textContent = '';
      status.className = '';
    }, 3000);
  } catch (error) {
    console.error("Error saving options:", error);
    
    // Show error message
    status.textContent = error.message || "An error occurred while saving settings";
    status.className = 'error';
    
    setTimeout(() => {
      status.textContent = '';
      status.className = '';
    }, 5000);
  } finally {
    // Reset button
    saveButton.innerHTML = 'Save Settings';
    saveButton.disabled = false;
  }
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.local.get(
    {
      userId: '',
      websiteUrl: 'https://techfest2025-five.vercel.app/' // Default website URL
    },
    (items) => {
      document.getElementById('userId').value = items.userId;
      document.getElementById('websiteUrl').value = items.websiteUrl;
    }
  );
};

// Add animation to the save button
const addButtonAnimation = () => {
  const saveButton = document.getElementById('save');
  
  saveButton.addEventListener('mousedown', () => {
    saveButton.style.transform = 'translateY(0)';
  });
  
  saveButton.addEventListener('mouseup', () => {
    saveButton.style.transform = 'translateY(-2px)';
  });
  
  saveButton.addEventListener('mouseleave', () => {
    saveButton.style.transform = 'translateY(-2px)';
  });
};

// Add glow effect to the logo
const addLogoEffect = () => {
  const logo = document.querySelector('.logo');
  
  // Add pulsing glow effect
  const addGlowEffect = () => {
    logo.style.textShadow = '0 0 10px rgba(179, 136, 255, 0.7)';
    
    setTimeout(() => {
      logo.style.textShadow = '0 0 5px rgba(179, 136, 255, 0.3)';
      
      setTimeout(() => {
        logo.style.textShadow = 'none';
      }, 1000);
    }, 1000);
  };
  
  // Initial glow effect
  setTimeout(addGlowEffect, 1000);
  
  // Repeat the effect every 5 seconds
  setInterval(addGlowEffect, 5000);
};

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  addButtonAnimation();
  addLogoEffect();
  
  // Add input animation
  const input = document.getElementById('userId');
  input.addEventListener('focus', () => {
    input.parentElement.classList.add('focused');
  });
  
  input.addEventListener('blur', () => {
    input.parentElement.classList.remove('focused');
  });
});

document.getElementById('save').addEventListener('click', saveOptions);