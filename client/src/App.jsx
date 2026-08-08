import React, { useState, useEffect } from 'react';
import CreateMessagePage from './components/CreateMessagePage';
import ViewMessagePage from './components/ViewMessagePage';
import P2PHandshakePage from '../../experiments/P2PHandshakePage';

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
        <p>Encrypted Text Sharing Platform (AES-256, Triple-DES, Vigenère)</p>
      </header>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`nav-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          1. Create Message
        </button>
        <button
          className={`nav-button ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          2. Search & View Message
        </button>
        <button
          className={`nav-button ${activeTab === 'p2p' ? 'active' : ''}`}
          onClick={() => setActiveTab('p2p')}
          style={{ backgroundColor: activeTab === 'p2p' ? '#6f42c1' : '#f3e8ff', color: activeTab === 'p2p' ? '#fff' : '#6f42c1', borderColor: '#6f42c1' }}
        >
          🧪 P2P Mode (Experiment)
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
