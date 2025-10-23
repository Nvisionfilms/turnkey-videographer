import Layout from "./Layout.jsx";

import Admin from "./Admin";

import Calculator from "./Calculator";

import Welcome from "./Welcome";

import Unlock from "./Unlock";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Admin: Admin,
    
    Calculator: Calculator,
    
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
                
                    <Route path="/" element={<Admin />} />
                
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Calculator" element={<Calculator />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/Unlock" element={<Unlock />} />
                
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