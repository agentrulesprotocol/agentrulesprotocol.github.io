// DOM elements
const emailForm = document.getElementById('emailForm');
const emailFormLarge = document.getElementById('emailFormLarge');
const nav = document.querySelector('.nav');

// Get configuration (will be available after config.js loads)
const getBrevoConfig = () => window.CONFIG?.brevo || {
    apiKey: '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',
    listId: 2,
    apiUrl: 'https://api.brevo.com/v3/contacts'
};

// Email submission handler with Brevo integration
async function handleEmailSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.id;
    
    // Get form inputs based on form type
    let nameInput, emailInput;
    if (formId === 'emailForm') {
        nameInput = document.getElementById('name');
        emailInput = document.getElementById('email');
    } else {
        nameInput = document.getElementById('nameLarge');
        emailInput = document.getElementById('emailLarge');
    }
    
    const button = form.querySelector('button');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    if (!name || !email) {
        showNotification('Please enter both name and email address', 'error');
        return;
    }
    
    if (!Utils.isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Disable button and show loading state
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = formId === 'emailForm' ? 'Joining...' : 'Reserving...';
    button.style.opacity = '0.7';
    
    try {
        // Get Brevo configuration
        const brevoConfig = getBrevoConfig();
        const appConfig = window.CONFIG?.app || { baseSubscriberCount: 500 };
        
        // Send to Brevo API
        const response = await fetch(brevoConfig.apiUrl, {
            method: 'POST',
            headers: {
                'api-key': brevoConfig.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                attributes: { 
                    FIRSTNAME: name,
                    SOURCE: window.CONFIG?.brevo?.defaultAttributes?.SOURCE || 'AgentRulesProtocol_ComingSoon',
                    CAMPAIGN: window.CONFIG?.brevo?.defaultAttributes?.CAMPAIGN || 'Launch_Waitlist',
                    SIGNUP_DATE: new Date().toISOString().split('T')[0]
                },
                listIds: [brevoConfig.listId],
                updateEnabled: true
            })
        });
        
        const result = await response.json();
        
        if (response.ok || response.status === 204) {
            // Success - contact added or updated
            nameInput.value = '';
            emailInput.value = '';
            
            showNotification(
                `🎉 Welcome aboard, ${name}! You'll be the first to know when we launch.`, 
                'success'
            );
            
            // Store email locally as backup
            const emails = JSON.parse(localStorage.getItem('arp-emails') || '[]');
            const contact = { email, name, date: new Date().toISOString() };
            if (!emails.find(c => c.email === email)) {
                emails.push(contact);
                localStorage.setItem('arp-emails', JSON.stringify(emails));
            }
            
            // Update counter
            updateSubscriberCount();
            
        } else {
            // Handle specific Brevo errors
            let errorMessage = 'Failed to subscribe. Please try again.';
            
            if (result.message) {
                if (result.message.includes('already exists')) {
                    errorMessage = `${name}, you're already on our list! We'll notify you when we launch.`;
                    showNotification(errorMessage, 'info');
                } else {
                    errorMessage = result.message;
                    showNotification(errorMessage, 'error');
                }
            } else {
                showNotification(errorMessage, 'error');
            }
        }
        
    } catch (error) {
        console.error('Brevo API Error:', error);
        
        // Fallback to local storage if API fails
        const emails = JSON.parse(localStorage.getItem('arp-emails') || '[]');
        const contact = { email, name, date: new Date().toISOString() };
        if (!emails.find(c => c.email === email)) {
            emails.push(contact);
            localStorage.setItem('arp-emails', JSON.stringify(emails));
            
            nameInput.value = '';
            emailInput.value = '';
            
            showNotification(
                `${name}, we've saved your details! You'll be notified when we launch.`, 
                'success'
            );
            updateSubscriberCount();
        } else {
            showNotification(`${name}, you're already on our list!`, 'info');
        }
    } finally {
        // Reset button state
        button.disabled = false;
        button.innerHTML = originalText;
        button.style.opacity = '1';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        maxWidth: '400px',
        fontSize: '0.875rem',
        fontWeight: '500'
    });
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;
    
    const closeButton = notification.querySelector('.notification-close');
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.8;
        transition: opacity 0.2s;
    `;
    
    closeButton.addEventListener('mouseenter', () => closeButton.style.opacity = '1');
    closeButton.addEventListener('mouseleave', () => closeButton.style.opacity = '0.8');
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Close button functionality
    closeButton.addEventListener('click', () => {
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Update subscriber count
function updateSubscriberCount() {
    const contacts = JSON.parse(localStorage.getItem('arp-emails') || '[]');
    const baseCount = window.CONFIG?.app?.baseSubscriberCount || 500;
    const count = contacts.length + baseCount;
    
    const disclaimers = document.querySelectorAll('.form-disclaimer');
    disclaimers.forEach(disclaimer => {
        disclaimer.textContent = `Join ${count}+ developers waiting for launch`;
    });
}

// Navbar scroll effect
function handleNavbarScroll() {
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(15, 15, 35, 0.95)';
        nav.style.backdropFilter = 'blur(20px)';
    } else {
        nav.style.background = 'rgba(15, 15, 35, 0.9)';
        nav.style.backdropFilter = 'blur(20px)';
    }
}

// Smooth scrolling for navigation links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Intersection Observer for animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.problem-card, .feature-card, .agent-card');
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(el);
    });
}

// Parallax effect for hero section
function setupParallax() {
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}

// Copy to clipboard functionality for future use
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape key to close notifications
        if (e.key === 'Escape') {
            const notifications = document.querySelectorAll('.notification');
            notifications.forEach(notification => removeNotification(notification));
        }
        
        // Ctrl/Cmd + K to focus on email input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const emailInput = document.querySelector('.email-input');
            if (emailInput) {
                emailInput.focus();
            }
        }
    });
}

// Add some easter eggs
function setupEasterEggs() {
    let konami = [];
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konami.push(e.code);
        konami = konami.slice(-konamiCode.length);
        
        if (konami.join('') === konamiCode.join('')) {
            showNotification('🎮 Konami Code activated! You\'re a true developer!', 'success');
            document.body.style.animation = 'rainbow 2s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 2000);
        }
    });
}

// Add rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Performance optimization - throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmission);
    }
    
    if (emailFormLarge) {
        emailFormLarge.addEventListener('submit', handleEmailSubmission);
    }
    
    // Set up scroll effects
    const throttledNavScroll = throttle(handleNavbarScroll, 10);
    window.addEventListener('scroll', throttledNavScroll);
    
    // Initialize features
    setupSmoothScrolling();
    setupScrollAnimations();
    setupParallax();
    setupKeyboardShortcuts();
    setupEasterEggs();
    
    // Update initial subscriber count
    updateSubscriberCount();
    
    // Add loading animation completion
    document.body.classList.add('loaded');
});

// Add some utility functions for future features
const Utils = {
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Get user's preferred theme (for future dark/light mode)
    getPreferredTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    
    // Detect mobile device
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    // Generate random ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, showNotification, copyToClipboard };
}
