import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/shared/Sidebar';
import { Header } from './components/shared/Header';
import ChatbotWidget from "./components/chatbot/ChatbotWidget";
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { RecruiterDashboard } from './components/dashboards/RecruiterDashboard';
import { ManagerDashboard } from './components/dashboards/ManagerDashboard';
import { EmployeeDashboard } from './components/dashboards/EmployeeDashboard';
import ProfilePage from './components/employee/ProfilePage';
import AttendancePage from './components/employee/AttendancePage';
import LeaveRequestsPage from './components/employee/LeaveRequestsPage';

const MainApp: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  console.log('MainApp render:', { user: !!user, profile, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing login');
    return <Login />;
  }

  if (!profile) {
    console.log('User exists but no profile found');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Profile Not Found</h2>
          <p className="text-slate-600 mb-4">
            Your user account exists but your profile couldn't be loaded.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong><br />
              User ID: {user.id}<br />
              Email: {user.email}
            </p>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            This usually happens if the database trigger didn't create your profile.
            Please contact support or check the browser console for errors.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard for role:', profile.role);

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard activeView={currentView} onViewChange={setCurrentView} />;
      case 'recruiter':
        return <RecruiterDashboard activeView={currentView} />;
      case 'senior_manager':
        return <ManagerDashboard activeView={currentView} />;
      default:
        // Employee - render sub-pages based on sidebar currentView
        switch (currentView) {
          case 'profile':
            return <ProfilePage />;
          case 'attendance':
            return <AttendancePage />;
          case 'leaves':
            return <LeaveRequestsPage />;
          default:
            return <EmployeeDashboard onViewChange={setCurrentView} />;
        }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-y-auto">
          {renderDashboard()}
          <ChatbotWidget />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
