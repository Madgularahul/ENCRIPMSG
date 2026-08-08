import React, { useState } from 'react';
import { encryptText } from '../utils/crypto';

export default function CreateMessagePage({ onNavigateToView }) {
  const [text, setText] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [customId, setCustomId] = useState('');
  const [algorithm, setAlgorithm] = useState('AES-256');
  const [expiryMinutes, setExpiryMinutes] = useState('0');
  const [maxViews, setMaxViews] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generate a simple random key
  const handleGenerateKey = () => {
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    setSecretKey(key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    if (!text.trim()) {
      setError('Please enter a message to encrypt.');
      return;
    }
    if (!secretKey.trim()) {
      setError('Please specify a secret key for encryption.');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Encrypt message client-side
      const encryptedContent = encryptText(text, secretKey, algorithm);

      // Step 2: Post encrypted payload to Node/Express backend
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedContent,
          algorithm,
          customId: customId.trim(),
          expiryMinutes: parseInt(expiryMinutes),
          maxViews: parseInt(maxViews)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post message');
      }

      setSuccessData({
        messageId: data.messageId,
        secretKey: secretKey,
        algorithm: algorithm,
        viewLink: `${window.location.origin}?msg=${data.messageId}`
      });

      // Clear sensitive text input
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.viewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h2>Create & Encrypt Message</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Write your message below. It will be encrypted in your browser using your custom secret key before sending to the server.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {successData ? (
        <div className="result-card">
          <div className="alert alert-success">
            <strong>Message Created Successfully!</strong>
          </div>
          <p>Share this <strong>Message ID</strong> or link with the recipient along with your secret key.</p>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Message ID:</label>
            <input type="text" className="form-control" value={successData.messageId} readOnly />
          </div>

          <div className="form-group">
            <label>Share Link:</label>
            <div className="copy-box">
              <input type="text" className="form-control" value={successData.viewLink} readOnly />
              <button className="btn btn-secondary" onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Your Secret Key (Don't lose this!):</label>
            <input type="text" className="form-control" value={successData.secretKey} readOnly style={{ backgroundColor: '#fff3cd' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn btn-info" onClick={() => onNavigateToView(successData.messageId)}>
              Go to View Page
            </button>
            <button className="btn btn-secondary" onClick={() => setSuccessData(null)}>
              Create Another Message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="secretMessage">Secret Message:</label>
            <textarea
              id="secretMessage"
              className="form-control"
              placeholder="Enter your confidential text message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customIdInput">Custom Message ID (Optional):</label>
            <input
              id="customIdInput"
              type="text"
              className="form-control"
              placeholder="Leave blank to auto-generate (e.g. my-custom-id)"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              If left blank, a random unique ID will be created automatically.
            </small>
          </div>

          <div className="row">
            <div className="col">
              <div className="form-group">
                <label htmlFor="algorithmSelect">Encryption Type:</label>
                <select
                  id="algorithmSelect"
                  className="form-control"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <option value="AES-256">AES-256 (Strongest Standard)</option>
                  <option value="Triple-DES">Triple-DES (Classic Cipher)</option>
                  <option value="Vigenere-Cipher">Vigenère Cipher (Polyalphabetic)</option>
                </select>
              </div>
            </div>

            <div className="col">
              <div className="form-group">
                <label htmlFor="secretKeyInput">Secret Key / Passphrase:</label>
                <div className="copy-box">
                  <input
                    id="secretKeyInput"
                    type="text"
                    className="form-control"
                    placeholder="Enter secret key..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleGenerateKey}
                    title="Generate a random key"
                  >
                    Random
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="form-group">
                <label htmlFor="expirySelect">Expiration Time:</label>
                <select
                  id="expirySelect"
                  className="form-control"
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(e.target.value)}
                >
                  <option value="0">Never (Persistent)</option>
                  <option value="5">5 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="1440">24 Hours</option>
                </select>
              </div>
            </div>

            <div className="col">
              <div className="form-group">
                <label htmlFor="maxViewsSelect">Burn After Reading (Max Views):</label>
                <select
                  id="maxViewsSelect"
                  className="form-control"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                >
                  <option value="0">Unlimited Views</option>
                  <option value="1">1 View (Burn after read)</option>
                  <option value="5">5 Views</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Encrypting & Saving...' : 'Encrypt & Share Message'}
          </button>
        </form>
      )}
    </div>
  );
}
