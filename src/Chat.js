// src/Chat.js
import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { nanoid } from 'nanoid';

/* -------------------------------------------------------------------------- */
/*  ⚡️  Tiny client-side “SDK” – keep here or move to src/lib/weatherChat.js   */
/* -------------------------------------------------------------------------- */
let cachedToken = null;
let tokenExpiry = 0; // epoch millis – used for auto-refresh

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60_000) return cachedToken; // refresh 1 min early

  const res = await fetch('/api/token');
  if (!res.ok) throw new Error(`Token fetch failed – ${await res.text()}`);

  const { access_token, expires_in } = await res.json();
  cachedToken = access_token;
  tokenExpiry = now + expires_in * 1000;
  return cachedToken;
}

async function sendWeatherChat(sessionId, message) {
  const token = await getToken();

  const res = await fetch(
    'https://d4fb1e32-b3d2-4f23-a608-053637ab4490-prod.e1-us-east-azure.bijiraapis.dev/default/ytweather/v1.0/chat',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, message }),
    },
  );

  if (!res.ok) throw new Error(`Chat API failed – ${await res.text()}`);
  const { message: assistantMsg } = await res.json();
  return assistantMsg;
}

/* -------------------------------------------------------------------------- */
/*                              MUI Chat component                            */
/* -------------------------------------------------------------------------- */
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => nanoid(12)); // one ID for the tab

  const append = useCallback(
    (role, text) =>
      setMessages((prev) => [...prev, { id: nanoid(6), sender: role, text }]),
    [],
  );

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    append('user', trimmed);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const reply = await sendWeatherChat(sessionId, trimmed);
      append('bot', reply);
    } catch (e) {
      console.error(e);
      setError(e);
      append('bot', '⚠️ Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* chat log */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map(({ id, sender, text }) => (
          <Box
            key={id}
            sx={{
              display: 'flex',
              justifyContent: sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                bgcolor: sender === 'user' ? 'primary.main' : 'grey.100',
                color: sender === 'user' ? 'primary.contrastText' : 'text.primary',
                maxWidth: '75%',
              }}
            >
              <Typography variant="body1">{text}</Typography>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* composer */}
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message"
              variant="outlined"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              color="primary"
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={loading}
            >
              Send
            </Button>
          </Grid>
        </Grid>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error.message}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default Chat;
