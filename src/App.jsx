import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { StoryProvider } from './context/StoryContext';
import LoginPage from './pages/LoginPage';
import SetupProfilePage from './pages/SetupProfilePage';
import InboxPage from './pages/InboxPage';
import ChatPage from './pages/ChatPage';
import CallsPage from './pages/CallsPage';
import PeoplePage from './pages/PeoplePage';
import LockerPage from './pages/LockerPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';
import PushNotificationHandler from './components/PushNotificationHandler';
import { useConversations } from './hooks/useConversations';
import './styles/App.css';

function AppContent() {
  const { firebaseUser, user, loading } = useAuth();
  const { unreadTotal } = useConversations();
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [tab, setTab] = useState('chats'); // chats | calls | people | locker | you

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

  const openConversation = (id) => {
    setTab('chats');
    setSelectedConvId(id);
  };

  const renderTab = () => {
    switch (tab) {
      case 'calls': return <CallsPage />;
      case 'people': return <PeoplePage onSelectConversation={openConversation} />;
      case 'locker': return <LockerPage />;
      case 'you': return <ProfilePage />;
      default: return <InboxPage onSelectConversation={openConversation} />;
    }
  };

  return (
    <div className="app-layout">
      <PushNotificationHandler onOpenChat={openConversation} />
      <div className={`inbox-panel ${selectedConvId ? 'hidden-mobile' : ''}`}>
        <div className="tab-content">{renderTab()}</div>
        <BottomNav active={tab} onChange={setTab} unreadTotal={unreadTotal} />
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
    <ThemeProvider>
      <AuthProvider>
        <StoryProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </StoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
