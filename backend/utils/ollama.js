const { Embeddings } = require('@langchain/core/embeddings');
const { BaseLLM } = require('@langchain/core/language_models/llms');
const axios = require('axios');

class OllamaEmbeddings extends Embeddings {
  constructor(params = {}) {
    super(params);
    this.api = axios.create({ baseURL: 'http://localhost:11434/api' });
  }

  async embedQuery(text) {
    const response = await this.api.post('/embeddings', { model: 'nomic-embed-text', prompt: text });
    console.log('nomic-embed-text embedding response:', response.data);
    if (!response.data.embedding || !Array.isArray(response.data.embedding)) {
      throw new Error('Invalid embedding response from nomic-embed-text');
    }
    return response.data.embedding;
  }

  async embedDocuments(texts) {
    return Promise.all(texts.map(text => this.embedQuery(text)));
  }
}

class OllamaLLM extends BaseLLM {
  constructor(params = {}) {
    super(params);
    this.api = axios.create({ baseURL: 'http://localhost:11434/api' });
  }

  async _generate(prompts) {
    const generations = await Promise.all(
      prompts.map(async (prompt) => {
        try {
          const response = await this.api.post('/generate', { 
            model: 'gemma3:4b', // Switch to Gemma 3 4B
            prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_k: 50,
              top_p: 0.95,
            }
          });

          console.log('Gemma 3 4B /generate response:', response.data);

          if (!response.data || !response.data.response) {
            throw new Error('Invalid response from Gemma 3 4B');
          }

          return {
            text: response.data.response,
            generationInfo: {
              modelName: 'gemma3:4b',
              promptTokens: response.data.prompt_eval_count || 0,
              completionTokens: response.data.eval_count || 0
            }
          };
        } catch (error) {
          console.error('Generation error:', error.message, error.response?.data);
          return {
            text: "I apologize, but I encountered an error processing your request.",
            generationInfo: { error: error.message }
          };
        }
      })
    );

    return {
      generations,
      llmOutput: { modelName: 'gemma3:4b' }
    };
  }

  async invoke(prompts) {
    const result = await this._generate(Array.isArray(prompts) ? prompts : [prompts]);
    console.log('Invoke result:', result);
    return result.generations[0].text;
  }

  _llmType() {
    return 'ollama';
  }
}

module.exports = { OllamaEmbeddings, OllamaLLM };