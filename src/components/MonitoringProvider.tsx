import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { monitoring, analytics } from '../lib/monitoring';

export default function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize monitoring with user data
    if (user) {
      monitoring.setUserId(user.id);
      analytics.track('user_session_start', {
        userId: user.id,
        email: user.email,
      });
    } else {
      monitoring.clearUserId();
    }

    // Track page views
    analytics.track('page_view', {
      path: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });

    // Track user interactions
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        analytics.user('click', target.tagName.toLowerCase(), {
          text: target.textContent?.slice(0, 100),
          className: target.className,
        });
      }
    };

    // Track form submissions
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      analytics.user('form_submit', 'form', {
        action: form.action,
        method: form.method,
        formId: form.id,
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        analytics.track('user_session_end', {
          sessionDuration: performance.now(),
        });
      }
      monitoring.flush();
    };
  }, []);

  return <>{children}</>;
}