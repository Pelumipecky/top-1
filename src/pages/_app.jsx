import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import ThemeProvider from '../../providers/ThemeProvider';
import '../styles/contact.css';
import '../styles/dashboard.css';
import '../styles/signup.css';
import '../styles/home.css';
import '../styles/global.css';
import '../styles/admin-components.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { config } from '../utils/config';

// ChatBot is rendered only on the user dashboard (profile page).
// Moved rendering into the profile page so admin pages don't load the widget.

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const publicPaths = ['/signin', '/signin_admin', '/signup'];
  const [sessionInterval, setSessionInterval] = useState(null);

    useEffect(() => {
        let timeoutHandle;
        
        // Update last activity and setup session expiry checks
        const updateActivity = () => {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            timeoutHandle = setTimeout(() => {
                try { localStorage.setItem('lastActivity', Date.now().toString()); } catch (e) { /* ignore */ }
            }, 1000); // Debounce activity updates
        };

        const checkSessionExpiry = () => {
            try {
                // Skip session check if on public paths
                if (publicPaths.includes(router.pathname)) {
                    return true;
                }
                
                const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
                const now = Date.now();
                
                if (lastActivity === 0) {
                    updateActivity();
                    return true;
                }
                
                if (now - lastActivity > config.sessionTimeout) {
                    localStorage.clear();
                    try { sessionStorage.clear(); } catch (e) { }
                    router.replace('/signin');
                    return false;
                }
                return true;
            } catch (e) {
                console.error('Session expiry check failed:', e);
                return true;
            }
        };    // attach listeners
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    updateActivity();

    const interval = setInterval(checkSessionExpiry, 60000);
    setSessionInterval(interval);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      if (interval) clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    // Simplified route guard - only run once on mount, not on every route change
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const path = router.pathname;
        const user = JSON.parse(localStorage.getItem('activeUser') || 'null');
        
        // Skip if already navigating with system flag
        if (router.asPath.includes('?systemRedirect=true')) return;
        
        // If on protected page without auth, go to signin
        if (!publicPaths.includes(path) && !user?.id) {
          router.replace('/signin');
          return;
        }
        
        // If authenticated user on public page, redirect to dashboard
        if (publicPaths.includes(path) && user?.id && path !== '/') {
          const dest = user.admin ? '/dashboard_admin' : '/profile';
          router.replace(dest);
        }
      } catch (e) {
        console.warn('Auth check failed:', e);
      }
    };

    // Run auth check once on mount
    checkAuth();
  }, [router]);

  return (
    <ThemeProvider>
      <Head>
        <title>TopmintInvest</title>
        <meta charSet="UTF-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="theme-color" content='#0672CD'/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="icon" href="/topmintSmall.png"/>
        <link rel="apple-touch-icon" href="/topmintSmall.png"/>
        <meta property="og:title" content="Topmintinvest"/>
        <meta property="og:description" content="Topmint Investment corporation is a trusted paying binary and Cryptocurrency trading company. Earn high returns from our proven trading strategies."/>
      </Head>
      <AnimatePresence mode='wait'>
          <div className="app-wrapper" key="app-content">
          {/* ChatBot is rendered inside the user profile page only */}
          <Component {...pageProps} />
        </div>
      </AnimatePresence>
    </ThemeProvider>
  );
}