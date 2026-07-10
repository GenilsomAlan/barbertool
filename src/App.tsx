import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import BookingPage from "./pages/BookingPage.tsx";
import Landing from "./pages/Landing.tsx";
import Blog from "./pages/Blog.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfUse from "./pages/TermsOfUse.tsx";
import Contact from "./pages/Contact.tsx";
import { api } from "./services/api.ts";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const handleLogin = (token: string) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Public Website Routes (AdSense & SEO Optimized) */}
          <Route path="/" element={<Landing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Consumer Booking Route */}
          <Route path="/book/:bookingToken" element={<BookingPage />} />
          

          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register onRegister={handleLogin} />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard onLogout={logout} /> : <Navigate to="/login" replace />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

