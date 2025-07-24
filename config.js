// Configuration file for AgentRulesProtocol Coming Soon Page

const CONFIG = {
    // Brevo API Configuration
    brevo: {
        apiKey: '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',
        apiUrl: 'https://api.brevo.com/v3/contacts',
        listId: 2, // Update this with your actual Brevo list ID
        defaultAttributes: {
            SOURCE: 'AgentRulesProtocol_ComingSoon',
            CAMPAIGN: 'Launch_Waitlist'
        }
    },
    
    // Application Settings
    app: {
        baseSubscriberCount: 500, // Starting subscriber count for display
        maxRetries: 3, // Max API retry attempts
        retryDelay: 1000, // Delay between retries (ms)
        notificationDuration: 5000 // How long notifications stay visible (ms)
    },
    
    // Analytics (for future use)
    analytics: {
        googleAnalyticsId: null, // Add your GA4 ID here
        facebookPixelId: null, // Add your Facebook Pixel ID here
        linkedInInsightTag: null // Add your LinkedIn Insight Tag here
    },
    
    // Social Media Links (for future use)
    social: {
        twitter: null,
        github: null,
        discord: null,
        linkedin: null
    },
    
    // Features flags
    features: {
        enableLocalStorageBackup: true,
        enableRetryMechanism: true,
        enableAnalytics: false,
        enableSocialSharing: false
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally
window.CONFIG = CONFIG;
