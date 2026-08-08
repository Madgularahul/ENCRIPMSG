# EncripMsg - Fullstack MERN Encrypted Text Sharing Platform

EncripMsg is a secure, client-side encrypted text sharing platform built using the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **Client-Side Encryption & Decryption**: Messages are encrypted and decrypted directly in your browser. Plaintext and secret keys are **never** transmitted or stored on the server.
- **3 Encryption Methods**:
  1. **AES-256**: Strongest industry standard symmetric cipher.
  2. **Triple-DES**: Classic block cipher.
  3. **Vigenère Cipher**: Polyalphabetic substitution cipher.
- **Dual-Page Flow**:
  - **Page 1 (Create Message)**: Text input area, algorithm selector, custom secret key input (with random generator), expiration timer, and burn-after-reading option. Generates a shareable link and Message ID.
  - **Page 2 (Search & View Message)**: Search message by ID or direct URL link (`?msg=ID`), view ciphertext metadata, and enter secret key to decrypt into plaintext.
- **In-Memory Database Fallback**: Automatically falls back to an in-memory store if MongoDB is not running locally, allowing zero-config instant testing out-of-the-box.
- **Beginner-Friendly Styling**: Simple, clean, straightforward HTML/CSS layout.

## Project Structure

```
ENCRIPMSG/
├── package.json          # Root scripts to run both client and server
├── server/
│   ├── models/           # Mongoose Message Schema
│   ├── routes/           # API routes (POST /api/messages, GET /api/messages/:id)
│   ├── server.js         # Node/Express server setup
│   └── package.json
└── client/
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── components/   # CreateMessagePage & ViewMessagePage components
    │   ├── utils/        # AES-256, Triple-DES & Vigenere crypto helpers
    │   ├── styles/       # Simple CSS styles
    │   ├── App.jsx       # Tab routing and state manager
    │   └── main.jsx
    └── package.json
```

## API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/messages` | Encrypt & save message payload (supports custom ID & expiration) |
| `GET` | `/api/messages/:id` | Fetch encrypted payload by ID (increments view count & handles expiration) |
| `GET` | `/api/health` | System status check (DB connection status) |
| `POST` | `/api/p2p/create-room` | *[Experimental]* Create live P2P handshake room |
| `POST` | `/api/p2p/request-access` | *[Experimental]* Send handshake access request |
| `GET` | `/api/p2p/room-status/:id` | *[Experimental]* Check P2P room status & 2-way messages |
| `POST` | `/api/p2p/approve-request` | *[Experimental]* Approve P2P connection request |
| `POST` | `/api/p2p/send-chat-msg` | *[Experimental]* Post encrypted chat message to room |

## Security Specifications

- **Zero-Knowledge Architecture**: The server and database only store AES-256 / Triple-DES ciphertext. Plaintext and secret keys are never transmitted over the network.
- **Client-Side Cryptography**: Cryptographic operations occur exclusively inside the client's web browser using `crypto-js`.
- **Automatic Fallback**: Includes an in-memory database store so the app functions instantly even without an active MongoDB service.

## Quick Start

### 1. Install Dependencies
Run the following in the root folder:
```bash
npm run install-all
```
*(or run `npm install` inside both `server/` and `client/` directories)*

### 2. Start Application
To run both backend server (port 5000) and frontend React Vite app (port 3000):
```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 3. Usage Guide
1. **Create Message Page**:
   - Type your secret text.
   - Choose encryption algorithm (AES-256, Triple-DES, Vigenère).
   - Enter your secret passphrase/key.
   - Click **Encrypt & Share Message**.
   - Copy the generated Message ID or share link.
2. **View Message Page**:
   - Open the share link or switch to tab 2 and enter the Message ID.
   - Enter the secret key specified during creation.
   - Click **Decrypt Message** to view the original text.
