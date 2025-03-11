// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Feature Flags
const ENABLE_KNOWLEDGE_GRAPH = true;
const ENABLE_RAG = true;
const ENABLE_MULTI_MODEL = true;

// AI Models Configuration
const AI_MODELS = {
  DEFAULT: 'gpt-4o',
  CREATIVE: 'gpt-4o',
  ANALYTICAL: 'gemini-pro',
  SUMMARIZATION: 'llama-3-70b',
};

// Integration Endpoints
const INTEGRATIONS = {
  SLACK: `${API_URL}/api/integrations/slack`,
  GMAIL: `${API_URL}/api/integrations/gmail`,
  OUTLOOK: `${API_URL}/api/integrations/outlook`,
  ZOOM: `${API_URL}/api/integrations/zoom`,
  NOTION: `${API_URL}/api/integrations/notion`,
  WHATSAPP: `${API_URL}/api/integrations/whatsapp`,
};