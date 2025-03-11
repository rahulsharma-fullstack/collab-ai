const chrono = require('chrono-node');

const KEYWORDS = {
  meeting: ['meeting', 'sync', 'catch up', 'discussion', 'call'],
  deadline: ['deadline', 'due', 'by', 'complete by', 'finish by'],
  decision: ['decided', 'agreed', 'conclusion', 'decision', 'plan']
};

function detectMemoryType(text) {
  for (const [type, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return type;
    }
  }
  return 'other';
}

function extractDate(text) {
  const parsedDate = chrono.parseDate(text);
  return parsedDate || null;
}

function analyzeMessage(text) {
  const meetingKeywords = ['meeting', 'appointment', 'schedule', 'call', 'conference'];
  const deadlineKeywords = ['deadline', 'due date', 'by', 'until'];
  const decisionKeywords = ['decided', 'agreed', 'conclusion', 'decision'];
  
  const datePattern = /(?:\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b|\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b|\b(?:today|tomorrow|next week|next month)\b|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i;

  const textLower = text.toLowerCase();
  let type = null;
  let isImportant = false;
  let extractedDate = null;

  // Check for meeting-related content
  if (meetingKeywords.some(keyword => textLower.includes(keyword))) {
    type = 'meeting';
    isImportant = true;
  }
  // Check for deadlines
  else if (deadlineKeywords.some(keyword => textLower.includes(keyword))) {
    type = 'deadline';
    isImportant = true;
  }
  // Check for decisions
  else if (decisionKeywords.some(keyword => textLower.includes(keyword))) {
    type = 'decision';
    isImportant = true;
  }

  // Extract date if present
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    extractedDate = dateMatch[0];
    isImportant = true;
    if (!type) type = 'date_reference';
  }

  return {
    isImportant,
    type,
    extractedDate
  };
}

module.exports = {
  analyzeMessage
}; 