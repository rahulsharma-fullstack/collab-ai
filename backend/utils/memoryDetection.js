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

function parseDate(text) {
  // Basic date parsing - could be enhanced with a library like chrono-node
  const today = new Date();
  
  if (text.includes('today')) {
    return today;
  }
  
  if (text.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  // Try to parse explicit dates
  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
  if (dateMatch) {
    const parsed = new Date(dateMatch[0]);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

function analyzeMessage(text) {
  const lowerText = text.toLowerCase();
  
  // Meeting detection
  if (lowerText.includes('meeting') || lowerText.includes('call') || lowerText.includes('discuss')) {
    return {
      isImportant: true,
      type: 'meeting',
      extractedDate: parseDate(lowerText)
    };
  }
  
  // Task detection
  if (lowerText.includes('todo') || lowerText.includes('task') || lowerText.includes('deadline')) {
    return {
      isImportant: true,
      type: 'task',
      extractedDate: parseDate(lowerText)
    };
  }
  
  // Decision detection
  if (lowerText.includes('decided') || lowerText.includes('agreed') || lowerText.includes('conclusion')) {
    return {
      isImportant: true,
      type: 'decision',
      extractedDate: null
    };
  }
  
  return {
    isImportant: false,
    type: 'general',
    extractedDate: null
  };
}

module.exports = { analyzeMessage };