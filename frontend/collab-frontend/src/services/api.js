export const getSmartReply = async (message) => {
  try {
    const response = await axios.post('/api/ai/smart-reply', { message });
    return response.data[0];
  } catch (error) {
    console.error('Smart reply error:', error);
    throw error;
  }
}; 