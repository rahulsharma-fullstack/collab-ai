const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const GmailIntegration = require('../models/GmailIntegration');
const { authenticateToken } = require('../middleware/auth');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

// Get Gmail auth URL
router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle Gmail OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('No authorization code received');
    }

    // Get tokens from the authorization code
    const tokens = await gmailService.getTokens(code);
    
    // Set up temporary credentials to get user profile
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: tokens.access_token });

    // Get user email
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const email = profile.data.emailAddress;

    // Create a temporary token to securely pass data to the frontend
    const tempToken = jwt.sign(
      { 
        tokens,
        email
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Redirect to frontend with the temporary token
    res.redirect(`${process.env.FRONTEND_URL}/gmail/callback?token=${tempToken}`);

  } catch (error) {
    console.error('Error in Gmail callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/gmail?error=auth_failed`);
  }
});

// Complete Gmail integration
router.post('/complete-integration', authenticateToken, async (req, res) => {
  try {
    const { tempToken } = req.body;
    
    // Verify and decode the temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { tokens, email } = decoded;

    // Save or update Gmail integration
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

    res.json({ message: 'Gmail integration successful' });
  } catch (error) {
    console.error('Error completing Gmail integration:', error);
    res.status(500).json({ error: 'Failed to complete Gmail integration' });
  }
});

// Get emails
router.get('/emails', authenticateToken, async (req, res) => {
  try {
    const integration = await GmailIntegration.findOne({ userId: req.user.userId });
    if (!integration) {
      return res.status(404).json({ error: 'Gmail not integrated' });
    }

    const emails = await gmailService.getEmails(integration.accessToken);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

module.exports = router; 