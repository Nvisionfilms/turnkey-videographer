import Layout from "./Layout.jsx";

import Admin from "./Admin";

import Calculator from "./Calculator";

import Welcome from "./Welcome";

import LandingPage from "./LandingPage";

import Unlock from "./Unlock";

import AffiliateSignup from "./AffiliateSignup";

import AffiliateDashboard from "./AffiliateDashboard";

import AffiliateLogin from "./AffiliateLogin";

import AdminAffiliates from "./AdminAffiliates";

import AdminAnalytics from "./AdminAnalytics";

import AdminLogin from "./AdminLogin";

import AdminLoginDirect from "./AdminLoginDirect";

import DeliverableCalculator from "./DeliverableCalculator";

import CrewCalculator from "./CrewCalculator";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    LandingPage: LandingPage,
    
    Admin: Admin,
    
    Calculator: Calculator,
    
    DeliverableCalculator: DeliverableCalculator,
    
    CrewCalculator: CrewCalculator,
    
    Welcome: Welcome,
    
    Unlock: Unlock,
    
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
            <Routes>            
                
                    <Route path="/" element={<Calculator />} />
                
                
                <Route path="/LandingPage" element={<LandingPage />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Calculator" element={<Calculator />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/Unlock" element={<Unlock />} />
                
                <Route path="/affiliate" element={<AffiliateLogin />} />
                
                <Route path="/affiliate/signup" element={<AffiliateSignup />} />
                
                <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                
                <Route path="/affiliate/login" element={<AffiliateLogin />} />
                
                <Route path="/admin/affiliates" element={<AdminAffiliates />} />
                
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                
                <Route path="/admin/dashboard" element={<AdminAnalytics />} />
                
                <Route path="/admin/login" element={<AdminLogin />} />
                
                <Route path="/admin/test-login" element={<AdminLoginDirect />} />
                
                <Route path="/DeliverableCalculator" element={<DeliverableCalculator />} />
                
                <Route path="/CrewCalculator" element={<CrewCalculator />} />
                
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