const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiService = {
  /**
   * Fetch the list of available candidate profiles
   */
  async getCandidates() {
    const response = await fetch(`${API_BASE_URL}/api/candidates`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch candidates');
    }

    return await response.json();
  },

  /**
   * Initialize a new interview session or send a text message
   */
  async sendJsonTurn(payload) {
    const response = await fetch(`${API_BASE_URL}/api/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send text turn');
    }

    return await response.json();
  },

  /**
   * Upload audio blob alongside sessionId as multipart/form-data
   */
  async sendAudioTurn(sessionId, audioBlob) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio_file', audioBlob, 'candidate_response.webm');

    const response = await fetch(`${API_BASE_URL}/api/interview/audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process audio turn');
    }

    return await response.json();
  },
};