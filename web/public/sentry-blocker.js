// Block Sentry requests
if (typeof window !== 'undefined') {
  // Override fetch to block Sentry
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('sentry.io')) {
      console.log('[Sentry Blocked] Request to Sentry intercepted and blocked');
      return Promise.resolve(new Response('{}', { status: 200 }));
    }
    return originalFetch.apply(this, args);
  };
  
  // Disable Sentry if it exists
  window.SENTRY_DSN = null;
  window.Sentry = null;
}
