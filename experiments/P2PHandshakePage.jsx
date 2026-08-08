import React, { useState, useEffect } from 'react';
import { encryptText, decryptText } from '../client/src/utils/crypto';
import { API_BASE_URL } from '../client/src/config';

export default function P2PHandshakePage() {
  const [role, setRole] = useState('host');

  const [algorithm, setAlgorithm] = useState('AES-256');
  const [secretKey, setSecretKey] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [hostMessage, setHostMessage] = useState('');
  const [senderName, setSenderName] = useState('Sender Device');
  const [roomId, setRoomId] = useState('');
  const [roomActive, setRoomActive] = useState(false);
  const [roomStatus, setRoomStatus] = useState('WAITING');
  const [requesterInfo, setRequesterInfo] = useState('');
  const [hostNotification, setHostNotification] = useState('');

  const [guestRoomId, setGuestRoomId] = useState('');
  const [guestName, setGuestName] = useState('Receiver Device');
  const [guestStatus, setGuestStatus] = useState('');
  const [guestError, setGuestError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p2proom = params.get('p2proom');
    if (p2proom) {
      setRole('guest');
      setGuestRoomId(p2proom);
    }
  }, []);

  const activeRoomId = role === 'host' ? roomId : guestRoomId;
  const isApproved = (role === 'host' && roomStatus === 'APPROVED') || (role === 'guest' && guestStatus === 'APPROVED');

  useEffect(() => {
    let interval = null;
    if (activeRoomId && (roomActive || guestStatus)) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/p2p/room-status/${activeRoomId}`);
          const data = await res.json();
          if (res.ok) {
            if (role === 'host') {
              setRoomStatus(data.status);
              if (data.status === 'REQUESTED') {
                setRequesterInfo(data.requesterName || 'Receiver Device');
              }
            } else {
              if (data.status === 'APPROVED') {
                setGuestStatus('APPROVED');
              } else if (data.status === 'REJECTED') {
                setGuestStatus('REJECTED');
                setGuestError('Sender rejected your handshake request.');
              }
            }

            if (data.messages) {
              setChatMessages(data.messages);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeRoomId, roomActive, guestStatus, role]);

  const handleStartHostRoom = async (e) => {
    e.preventDefault();
    if (!hostMessage.trim() || !secretKey.trim()) {
      alert('Please enter both a initial secret message and a secret key.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/p2p/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm })
      });
      const data = await res.json();
      if (res.ok) {
        setRoomId(data.roomId);
        setRoomActive(true);
        setRoomStatus('WAITING');
        setHostNotification('Room created! Share the Room ID with Receiver and keep this tab open.');
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveRequest = async (approve) => {
    try {
      let encryptedContent = null;
      if (approve) {
        encryptedContent = encryptText(hostMessage, secretKey, algorithm);
      }

      const res = await fetch(`${API_BASE_URL}/api/p2p/approve-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          encryptedContent,
          approve
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (approve) {
          setRoomStatus('APPROVED');
          setHostNotification('✅ Request approved! 2-Way Live Chat is now open.');
        } else {
          setRoomStatus('REJECTED');
          setHostNotification('❌ Request rejected.');
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setGuestError('');

    if (!guestRoomId.trim()) {
      setGuestError('Please enter a P2P Room ID.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/p2p/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: guestRoomId.trim(),
          requesterName: guestName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      setGuestStatus('WAITING_FOR_HOST_APPROVAL');
    } catch (err) {
      setGuestError(err.message);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    if (!secretKey.trim()) {
      alert('Please enter the secret key to encrypt your chat message.');
      return;
    }

    try {
      const encryptedContent = encryptText(newMessageText, secretKey, algorithm);
      const senderRoleName = role === 'host' ? (senderName || 'Sender Device') : (guestName || 'Receiver Device');

      const res = await fetch(`${API_BASE_URL}/api/p2p/send-chat-msg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          senderRole: senderRoleName,
          encryptedContent
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewMessageText('');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const renderDecryptedText = (encryptedContent) => {
    if (!secretKey.trim()) {
      return <em style={{ color: '#888' }}>🔒 Encrypted (Enter secret key below to unlock)</em>;
    }
    try {
      return decryptText(encryptedContent, secretKey, algorithm);
    } catch (err) {
      return <span style={{ color: 'red' }}>⚠️ Decryption failed (Wrong key)</span>;
    }
  };

  return (
    <div>
      <h2>🧪 Experimental Feature: 2-Way Live Handshake Chat</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        This is an experimental feature located in <code>/experiments</code>. Receiver requests access. Once Sender approves, a live 2-way encrypted chat window opens!
      </p>

      {/* Role Toggle Switch */}
      <div className="nav-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`nav-button ${role === 'host' ? 'active' : ''}`}
          onClick={() => setRole('host')}
        >
          I am Sender (Host)
        </button>
        <button
          className={`nav-button ${role === 'guest' ? 'active' : ''}`}
          onClick={() => setRole('guest')}
        >
          I am Receiver (Guest)
        </button>
      </div>

      {isApproved ? (
        <div className="result-card" style={{ border: '2px solid #28a745' }}>
          <div className="alert alert-success">
            <strong>🎉 2-Way Handshake Connection Approved!</strong>
          </div>

          <p><strong>Room ID:</strong> <span className="badge">{activeRoomId}</span></p>

          <div className="form-group" style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            <label>Shared Secret Decryption Key:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Type shared key to auto-decrypt messages..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>

          <div style={{
            height: '250px',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            margin: '15px 0'
          }}>
            {chatMessages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '100px' }}>No messages yet in chat.</p>
            ) : (
              chatMessages.map((msg) => {
                const isMe = (role === 'host' && msg.sender === (senderName || 'Sender Device')) || (role === 'guest' && msg.sender === (guestName || 'Receiver Device'));
                return (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '10px',
                      textAlign: isMe ? 'right' : 'left'
                    }}
                  >
                    <div style={{
                      display: 'inline-block',
                      maxWidth: '75%',
                      backgroundColor: isMe ? '#d1ecf1' : '#e2e3e5',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>
                        {msg.sender} • {msg.timestamp}
                      </div>
                      <div style={{ marginTop: '4px', fontWeight: '500' }}>
                        {renderDecryptedText(msg.encryptedContent)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #007bff' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Type New Message (Auto-Encrypted):
            </label>
            <form onSubmit={handleSendChatMessage} className="copy-box">
              <input
                type="text"
                className="form-control"
                placeholder="Type your message here..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          {role === 'host' && (
            <div className="result-card">
              <h3>Sender Device (Host)</h3>
              {!roomActive ? (
                <form onSubmit={handleStartHostRoom}>
                  <div className="form-group">
                    <label>Your Device / Sender Name:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Alice / Sender Device"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Secret Message:</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter message that Sender will hold locally..."
                      value={hostMessage}
                      onChange={(e) => setHostMessage(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col">
                      <div className="form-group">
                        <label>Encryption Type:</label>
                        <select
                          className="form-control"
                          value={algorithm}
                          onChange={(e) => setAlgorithm(e.target.value)}
                        >
                          <option value="AES-256">AES-256</option>
                          <option value="Triple-DES">Triple-DES</option>
                          <option value="Vigenere-Cipher">Vigenère Cipher</option>
                        </select>
                      </div>
                    </div>
                    <div className="col">
                      <div className="form-group">
                        <label>Secret Key:</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter secret key..."
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Open Live Handshake Room
                  </button>
                </form>
              ) : (
                <div>
                  <div className="alert alert-info">
                    <strong>Room Open & Waiting for Receiver!</strong>
                  </div>
                  <p><strong>P2P Room ID:</strong> <span className="badge">{roomId}</span></p>
                  <p>Share Link: <code>{window.location.origin}?p2proom={roomId}</code></p>
                  
                  {hostNotification && (
                    <div style={{ margin: '15px 0', padding: '10px', background: '#e2e3e5', borderRadius: '4px' }}>
                      {hostNotification}
                    </div>
                  )}

                  {roomStatus === 'REQUESTED' && (
                    <div className="alert alert-danger" style={{ marginTop: '20px', border: '2px solid #dc3545' }}>
                      <h4>🔔 Incoming Access Request!</h4>
                      <p><strong>{requesterInfo}</strong> is requesting to establish a 2-Way Encrypted Chat.</p>
                      <p>Do you accept and approve the connection?</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button className="btn btn-primary" onClick={() => handleApproveRequest(true)}>
                          ✅ Approve & Start 2-Way Chat
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleApproveRequest(false)}>
                          ❌ Reject Request
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '15px' }}
                    onClick={() => { setRoomActive(false); setRoomId(''); }}
                  >
                    Close Room
                  </button>
                </div>
              )}
            </div>
          )}

          {role === 'guest' && (
            <div className="result-card">
              <h3>Receiver Device (Guest)</h3>

              {guestError && <div className="alert alert-danger">{guestError}</div>}

              <form onSubmit={handleRequestAccess}>
                <div className="form-group">
                  <label>P2P Room ID (from Sender):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. p2p-a1b2c3"
                    value={guestRoomId}
                    onChange={(e) => setGuestRoomId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Your Device Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-info">
                  Request 2-Way Chat with Sender
                </button>

                {guestStatus === 'WAITING_FOR_HOST_APPROVAL' && (
                  <div className="alert alert-info" style={{ marginTop: '15px' }}>
                    ⏳ Handshake request sent! Waiting for Sender to click <strong>Approve</strong>...
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
