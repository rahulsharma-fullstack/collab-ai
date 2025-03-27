const { google } = require('googleapis');

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async refreshToken(refreshToken) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date - Date.now()
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh token');
    }
  }

  async getEmails(accessToken, maxResults = 20) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: 'in:inbox'
    });

    const messages = await Promise.all(
      response.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        return this.parseMessage(fullMessage.data);
      })
    );

    return messages;
  }

  parseMessage(message) {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    let body = '';
    if (message.payload.parts) {
      body = this.getTextFromParts(message.payload.parts);
    } else if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from,
      to,
      date,
      snippet: message.snippet,
      body,
      labels: message.labelIds || []
    };
  }

  getTextFromParts(parts) {
    let text = '';
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        text += Buffer.from(part.body.data, 'base64').toString();
      } else if (part.parts) {
        text += this.getTextFromParts(part.parts);
      }
    }
    return text;
  }
}

module.exports = new GmailService();