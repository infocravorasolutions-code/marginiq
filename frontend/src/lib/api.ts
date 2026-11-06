export const api = {
  get: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  patch: async (endpoint: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${endpoint}`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  delete: async (endpoint: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
