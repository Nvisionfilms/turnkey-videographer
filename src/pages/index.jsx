import Layout from "./Layout.jsx";

import Admin from "./Admin";

import Calculator from "./Calculator";

import Welcome from "./Welcome";

import LandingPage from "./LandingPage";

import Unlock from "./Unlock";

import AffiliateSignup from "./AffiliateSignup";

import AffiliateDashboard from "./AffiliateDashboard";

import AffiliateLogin from "./AffiliateLogin";

import Affiliate from "./Affiliate";

import AdminAffiliates from "./AdminAffiliates";

import AdminAnalytics from "./AdminAnalytics";

import AdminLogin from "./AdminLogin";

import AdminLoginDirect from "./AdminLoginDirect";

import DeliverableCalculator from "./DeliverableCalculator";

import ContentPlaybook from "./ContentPlaybook";

import QuoteHistory from "./QuoteHistory";

import Terms from "./Terms";

import Privacy from "./Privacy";

import AmIReady from "./AmIReady";

import { BrowserRouter as Router, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { setReferralCookie, getReferralCookie } from '../utils/affiliateUtils';

// Global ref code persistence - captures ?ref= and stores it for the entire session
function RefCodePersistence() {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    
    useEffect(() => {
        const refCode = searchParams.get('ref');
        
        if (refCode) {
            // Store ref code in cookie (30 days) and localStorage
            setReferralCookie(refCode);
            localStorage.setItem('persistent_ref_code', refCode);
            console.log('[Affiliate] Ref code captured:', refCode);
        } else {
            // Check if we have a stored ref code and add it to URL if missing
            const storedRef = localStorage.getItem('persistent_ref_code');
            const cookieRef = getReferralCookie();
            const persistedRef = storedRef || cookieRef?.code;
            
            if (persistedRef && !searchParams.get('ref')) {
                // Add ref back to URL without triggering navigation
                const newParams = new URLSearchParams(searchParams);
                newParams.set('ref', persistedRef);
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [location.pathname, searchParams, setSearchParams]);
    
    return null;
}

const PAGES = {
    
    LandingPage: LandingPage,
    
    Admin: Admin,
    
    Calculator: Calculator,
    
    DeliverableCalculator: DeliverableCalculator,
    
    Welcome: Welcome,
    
    Unlock: Unlock,
    
    ContentPlaybook: ContentPlaybook,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    
    return (
        <Layout currentPageName={currentPage}>
            <RefCodePersistence />
            <Routes>            
                
                    <Route path="/" element={<Calculator />} />
                
                
                <Route path="/LandingPage" element={<LandingPage />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Calculator" element={<Calculator />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/Unlock" element={<Unlock />} />
                
                <Route path="/affiliate" element={<Affiliate />} />
                
                <Route path="/affiliate/signup" element={<AffiliateSignup />} />
                
                <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                
                <Route path="/affiliate/login" element={<AffiliateLogin />} />
                
                <Route path="/admin/affiliates" element={<AdminAffiliates />} />
                
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                
                <Route path="/admin/dashboard" element={<AdminAnalytics />} />
                
                <Route path="/admin/login" element={<AdminLogin />} />
                
                <Route path="/admin/test-login" element={<AdminLoginDirect />} />
                
                <Route path="/DeliverableCalculator" element={<DeliverableCalculator />} />
                
                <Route path="/ContentPlaybook" element={<ContentPlaybook />} />
                
                <Route path="/QuoteHistory" element={<QuoteHistory />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/AmIReady" element={<AmIReady />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}