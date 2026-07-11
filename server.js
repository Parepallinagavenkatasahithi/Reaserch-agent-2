require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const {
  IBM_API_KEY,
  IBM_PROJECT_ID,
  IBM_MODEL_ID,
  IBM_CHAT_URL,
  IBM_IAM_URL,
  PORT = 3000
} = process.env;

// Cache IAM token to avoid fetching on every request
let iamTokenCache = { token: null, expiresAt: 0 };

async function getIAMToken() {
  const now = Date.now();
  if (iamTokenCache.token && now < iamTokenCache.expiresAt) {
    return iamTokenCache.token;
  }

  let iamResponse;
  try {
    iamResponse = await axios.post(
      IBM_IAM_URL,
      new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: IBM_API_KEY
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
  } catch (iamErr) {
    const iamMsg =
      iamErr.response?.data?.errorMessage ??
      iamErr.response?.data?.errorCode ??
      iamErr.message;
    console.error('IAM token error:', iamMsg);
    const e = new Error(`IBM API key error: ${iamMsg}`);
    e.status = 401;
    throw e;
  }

  const { access_token, expires_in } = iamResponse.data;
  iamTokenCache = {
    token: access_token,
    expiresAt: now + (expires_in - 60) * 1000
  };
  return access_token;
}

// POST /api/chat — sends messages to IBM Granite-4 and returns the reply
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const token = await getIAMToken();

    const payload = {
      model_id: IBM_MODEL_ID,
      project_id: IBM_PROJECT_ID,
      messages,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7
      }
    };

    const response = await axios.post(IBM_CHAT_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    const choice = response.data.choices?.[0];
    const reply = choice?.message?.content ?? '';
    res.json({ reply, usage: response.data.usage });
  } catch (err) {
    const status = err.status ?? err.response?.status ?? 500;
    const message =
      err.response?.data?.errors?.[0]?.message ??
      err.response?.data?.error ??
      err.message;
    console.error(`[${status}]`, message);
    res.status(status).json({ error: message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Research Agent running at http://localhost:${PORT}`);
  });
}

module.exports = app;
