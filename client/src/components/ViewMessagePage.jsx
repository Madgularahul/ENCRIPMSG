import React, { useState, useEffect } from 'react';
import { decryptText } from '../utils/crypto';
import { API_BASE_URL } from '../config';

export default function ViewMessagePage({ initialMessageId }) {
  const [messageId, setMessageId] = useState(initialMessageId || '');
  const [secretKey, setSecretKey] = useState('');
  
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [decryptError, setDecryptError] = useState('');

  const [messageData, setMessageData] = useState(null);
  const [decryptedText, setDecryptedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialMessageId) {
      handleFetchMessage(initialMessageId);
    }
  }, [initialMessageId]);

  const handleFetchMessage = async (idToFetch) => {
    const targetId = idToFetch || messageId;
    setError('');
    setDecryptError('');
    setMessageData(null);
    setDecryptedText('');

    if (!targetId.trim()) {
      setError('Please enter a Message ID.');
      return;
    }

    try {
      setFetching(true);
      const response = await fetch(`${API_BASE_URL}/api/messages/${targetId.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Message not found');
      }

      setMessageData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleDecrypt = (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptedText('');

    if (!secretKey.trim()) {
      setDecryptError('Please enter the secret key specified by the sender.');
      return;
    }

    if (!messageData) {
      setDecryptError('No encrypted message loaded.');
      return;
    }

    try {
      const result = decryptText(messageData.encryptedContent, secretKey, messageData.algorithm);
      setDecryptedText(result);
    } catch (err) {
      setDecryptError(err.message);
    }
  };

  const handleCopyDecrypted = () => {
    if (decryptedText) {
      navigator.clipboard.writeText(decryptedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h2>Search & View Encrypted Message</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Search for a message by entering its ID, then enter the secret key specified by the user who created it to decrypt.
      </p>

      {/* Search Input Box */}
      <div className="result-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleFetchMessage(); }}>
          <div className="form-group">
            <label htmlFor="searchMsgId">Enter Message ID:</label>
            <div className="copy-box">
              <input
                id="searchMsgId"
                type="text"
                className="form-control"
                placeholder="e.g. a1b2c3d4"
                value={messageId}
                onChange={(e) => setMessageId(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-info" disabled={fetching}>
                {fetching ? 'Searching...' : 'Search Message'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Loaded Encrypted Message Details */}
      {messageData && (
        <div className="result-card">
          <div className="alert alert-info">
            <strong>Encrypted Message Found!</strong>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p><strong>Message ID:</strong> {messageData.messageId}</p>
            <p>
              <strong>Encryption Algorithm:</strong> 
              <span className="badge">{messageData.algorithm}</span>
            </p>
            <p><strong>Created At:</strong> {new Date(messageData.createdAt).toLocaleString()}</p>
            {messageData.maxViews > 0 && (
              <p><strong>Views:</strong> {messageData.viewCount} / {messageData.maxViews}</p>
            )}
          </div>

          <div className="form-group">
            <label>Raw Encrypted Data (Ciphertext):</label>
            <div className="message-box" style={{ fontSize: '12px', color: '#555', maxHeight: '100px', overflowY: 'auto' }}>
              {messageData.encryptedContent}
            </div>
          </div>

          {/* Decryption Form */}
          <form onSubmit={handleDecrypt} style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #ccc' }}>
            {decryptError && <div className="alert alert-danger">{decryptError}</div>}

            <div className="form-group">
              <label htmlFor="viewSecretKey">Enter Secret Decryption Key:</label>
              <input
                id="viewSecretKey"
                type="password"
                className="form-control"
                placeholder="Enter secret key..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Decrypt Message
            </button>
          </form>

          {/* Decrypted Plaintext Output */}
          {decryptedText && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #28a745' }}>
              <h3 style={{ color: '#28a745' }}>Decrypted Original Message:</h3>
              <div className="message-box">
                {decryptedText}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={handleCopyDecrypted} 
                style={{ marginTop: '10px' }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Decrypted Text'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
