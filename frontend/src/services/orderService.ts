export const getOrders = async (token: string) => {
  const response = await fetch('/api/orders', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch orders');
  }
  
  return data.data;
};
