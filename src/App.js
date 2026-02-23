import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MapComponent from './components/MapComponent';
import CreatePackage from './components/CreatePackage';
import Register from './components/Register';
import Login from './components/Login';
import HomeComponent from './components/HomeComponent';
import Navbar from './components/Navbar';
import MyPackages from './components/MyPackages';
import EditPackage from './components/EditPackage';
import NearbyPackages from './components/NearbyPackages';
import CourierDashboard from './components/CourierDashboard';
import PackageDetail from './components/PackageDetail';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';
import { useUser } from './contexts/UserContext';

function App() {
  const { user } = useUser();
  const isLoggedIn = !!user;

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1C1C27',
            color: '#D4D4E8',
            border: '1px solid #2A2A3D',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#1C1C27' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#1C1C27' } },
        }}
      />
      <Navbar isLoggedIn={isLoggedIn} user={user} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeComponent />} />
        <Route path="/show-all" element={<MapComponent />} />
        <Route path="/packages/:id" element={<PackageDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-package" element={<ProtectedRoute><CreatePackage /></ProtectedRoute>} />
        <Route path="/my-packages" element={<ProtectedRoute><MyPackages /></ProtectedRoute>} />
        <Route path="/edit-package/:id" element={<ProtectedRoute><EditPackage /></ProtectedRoute>} />
        <Route path="/nearby-packages" element={<ProtectedRoute><NearbyPackages userId={user?.userId} /></ProtectedRoute>} />
        <Route path="/courier-dashboard" element={<ProtectedRoute><CourierDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
