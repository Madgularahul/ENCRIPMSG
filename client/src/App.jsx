import React, { useState, useEffect } from 'react';
import CreateMessagePage from './components/CreateMessagePage';
import ViewMessagePage from './components/ViewMessagePage';
import P2PHandshakePage from './components/P2PHandshakePage';

export default function App() {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'view', 'p2p'
  const [targetMsgId, setTargetMsgId] = useState('');

  useEffect(() => {
    // Check if URL has ?msg=ID or ?p2proom=ID parameter
    const params = new URLSearchParams(window.location.search);
    const msgId = params.get('msg');
    const p2proom = params.get('p2proom');

    if (p2proom) {
      setActiveTab('p2p');
    } else if (msgId) {
      setTargetMsgId(msgId);
      setActiveTab('view');
    }
  }, []);

  const handleNavigateToView = (msgId) => {
    setTargetMsgId(msgId);
    setActiveTab('view');
  };

  return (
    <div className="container">
      <header>
        <h1>EncripMsg</h1>
        <p>Encrypted Text Sharing Platform & Live P2P Handshake</p>
      </header>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          1. Create Msg (DB Mode)
        </button>
        <button
          className={`nav-button ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          2. View Msg (DB Mode)
        </button>
        <button
          className={`nav-button ${activeTab === 'p2p' ? 'active' : ''}`}
          onClick={() => setActiveTab('p2p')}
        >
          3. Live P2P Handshake (Sender ↔ Receiver)
        </button>
      </div>

      {/* Main Content Area */}
      <main>
        {activeTab === 'create' && (
          <CreateMessagePage onNavigateToView={handleNavigateToView} />
        )}
        {activeTab === 'view' && (
          <ViewMessagePage initialMessageId={targetMsgId} />
        )}
        {activeTab === 'p2p' && (
          <P2PHandshakePage />
        )}
      </main>

      <footer>
        <p>EncripMsg &copy; {new Date().getFullYear()} - Fullstack MERN Application</p>
      </footer>
    </div>
  );
}
