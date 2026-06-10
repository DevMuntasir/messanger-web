import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './pages/LoginPage';
import SetupProfilePage from './pages/SetupProfilePage';
import InboxPage from './pages/InboxPage';
import ChatPage from './pages/ChatPage';
import './styles/App.css';

function AppContent() {
  const { firebaseUser, user, loading } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState(null);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <LoginPage />;
  }

  // Check if user needs to complete profile setup
  if (!user || !user.handle) {
    return <SetupProfilePage />;
  }

  return (
    <div className="app-layout">
      <div className={`inbox-panel ${selectedConvId ? 'hidden-mobile' : ''}`}>
        <InboxPage onSelectConversation={setSelectedConvId} />
      </div>
      <div className={`chat-panel ${selectedConvId ? 'visible-mobile' : 'hidden'}`}>
        {selectedConvId ? (
          <ChatPage
            convId={selectedConvId}
            onBack={() => setSelectedConvId(null)}
          />
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
