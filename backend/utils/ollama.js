const { Embeddings } = require('@langchain/core/embeddings');
const { BaseLLM } = require('@langchain/core/language_models/llms');
const axios = require('axios');

class OllamaEmbeddings extends Embeddings {
  constructor(params = {}) {
    super(params);
    this.api = axios.create({ baseURL: 'http://localhost:11434/api' });
  }

  async embedQuery(text) {
    const response = await this.api.post('/embeddings', { model: 'llama2', prompt: text });
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
            model: 'llama2', 
            prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_k: 50,
              top_p: 0.95,
            }
          });

          console.log('Ollama /generate response:', response.data);

          if (!response.data || typeof response.data.response !== 'string') {
            throw new Error(`Invalid response: ${JSON.stringify(response.data)}`);
          }

          return {
            text: response.data.response,
            generationInfo: {
              modelName: 'llama2',
              promptTokens: response.data.prompt_eval_count || 0,
              completionTokens: response.data.eval_count || 0
            }
          };
        } catch (error) {
          console.error('Generation error:', error.message, error.response?.data);
          return {
            text: 'Error: Failed to generate response from Ollama',
            generationInfo: { 
              modelName: 'llama2', 
              error: error.message 
            }
          };
        }
      })
    );

    return {
      generations,
      llmOutput: { modelName: 'llama2' }
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