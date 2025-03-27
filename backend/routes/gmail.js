const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const GmailIntegration = require('../models/GmailIntegration');
const { authenticateToken } = require('../middleware/auth');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { processUserEmails } = require('../utils/emailProcessor');

router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) throw new Error('No authorization code received');

    const tokens = await gmailService.getTokens(code);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: tokens.access_token });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;

    const tempToken = jwt.sign(
      { tokens, email },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/gmail/callback?token=${tempToken}`);
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/gmail?error=auth_failed`);
  }
});

router.post('/complete-integration', authenticateToken, async (req, res) => {
  try {
    const { tempToken } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { tokens, email } = decoded;

    await GmailIntegration.findOneAndUpdate(
      { userId: req.user.userId },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        email: email
      },
      { upsert: true, new: true }
    );

    await processUserEmails(req.user.userId, req.app.locals.vectorStores); // Use app.locals

    res.json({ message: 'Gmail integration successful' });
  } catch (error) {
    console.error('Error completing Gmail integration:', error);
    res.status(500).json({ error: 'Failed to complete Gmail integration' });
  }
});

router.get('/emails', authenticateToken, async (req, res) => {
  try {
    const integration = await GmailIntegration.findOne({ userId: req.user.userId });
    if (!integration) {
      return res.status(404).json({ error: 'Gmail not integrated' });
    }

    try {
      const accessToken = await integration.getAccessToken();
      const emails = await gmailService.getEmails(accessToken);
      res.json(emails);
    } catch (error) {
      if (error.message === 'Token expired') {
        try {
          const tokens = await gmailService.refreshToken(integration.refreshToken);
          
          // Update integration with new tokens
          integration.accessToken = tokens.access_token;
          integration.expiryDate = new Date(Date.now() + tokens.expires_in);
          await integration.save();

          // Retry fetching emails with new token
          const emails = await gmailService.getEmails(tokens.access_token);
          res.json(emails);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Force re-authentication if refresh fails
          res.status(401).json({ 
            error: 'Authentication failed', 
            needsReauth: true 
          });
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

module.exports = router;