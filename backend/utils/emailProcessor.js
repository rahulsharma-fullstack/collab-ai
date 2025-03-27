const { ChromaClient } = require('chromadb');
const { Chroma } = require('@langchain/community/vectorstores/chroma');
const { Document } = require('langchain/document');
const GmailIntegration = require('../models/GmailIntegration');
const gmailService = require('../services/gmailService');
const { OllamaEmbeddings } = require('./ollama');

const chroma = new ChromaClient({
  path: 'http://localhost:8000'
});

async function processUserEmails(userId, vectorStores) {
  try {
    // Skip if already processed
    if (vectorStores.has(userId)) {
      return;
    }

    const integration = await GmailIntegration.findOne({ userId });
    if (!integration) {
      console.log(`No Gmail integration found for user ${userId}`);
      return;
    }

    const emails = await gmailService.getEmails(integration.accessToken, 50);
    
    const documents = emails.map(email => {
      const content = `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\nBody: ${email.body}`;
      return new Document({
        pageContent: content,
        metadata: {
          source: 'gmail',
          date: email.date,
          subject: email.subject,
          from: email.from,
          userId: userId
        }
      });
    });

    const embeddings = new OllamaEmbeddings();
    
    // Delete existing collection if it exists
    const collections = await chroma.listCollections();
    const collectionName = `emails_${userId}`;
    if (collections.some(c => c.name === collectionName)) {
      await chroma.deleteCollection({ name: collectionName });
    }

    const vectorStore = await Chroma.fromDocuments(documents, embeddings, {
      collectionName: collectionName,
      url: 'http://localhost:8000',
      collectionMetadata: {
        'userId': userId,
        'hnsw:space': 'cosine',
        'hnsw:construction_ef': 100,
        'hnsw:search_ef': 100
      }
    });

    vectorStores.set(userId, vectorStore);
    console.log(`Processed ${emails.length} emails for user ${userId}`);
  } catch (error) {
    console.error('Error processing emails:', error);
  }
}

module.exports = { processUserEmails };