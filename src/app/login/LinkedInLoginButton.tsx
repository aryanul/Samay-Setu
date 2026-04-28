"use client";

export default function LinkedInLoginButton() {
  function handleLinkedInAuth() {
    if (typeof window === "undefined") return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      window.location.href = "/api/auth/linkedin";
      return;
    }

    // Detect specific mobile OS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // Try to open LinkedIn app on iOS
      const linkedInAppURL = "linkedin://";
      window.location.href = linkedInAppURL;

      // Fallback to web after 1 second if app is not installed
      const timeout = setTimeout(() => {
        window.location.href = "/api/auth/linkedin";
      }, 1000);

      // Clean up timeout if user is redirected to app
      window.addEventListener("blur", () => clearTimeout(timeout), { once: true });
    } else if (isAndroid) {
      // On Android, use intent URL with browser_fallback_url
      const intentURL = `intent://www.linkedin.com/feed#Intent;scheme=https;package=com.linkedin.android;action=android.intent.action.VIEW;browser_fallback_url=/api/auth/linkedin;end`;
      window.location.href = intentURL;
    } else {
      // Fallback: just use web OAuth
      window.location.href = "/api/auth/linkedin";
    }
  }

  return (
    <button 
      className="btn-linkedin" 
      onClick={() => handleLinkedInAuth()}
      style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        />
      </svg>
      Continue with LinkedIn
    </button>
  );
}
