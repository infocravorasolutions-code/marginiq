export const getReconciliationSummary = async (token: string) => {
  const response = await fetch('/api/reconciliation/summary', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch reconciliation summary');
  }
  
  return data.data;
};

export const runReconciliation = async (token: string) => {
  const response = await fetch('/api/reconciliation/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to run reconciliation');
  }
  
  return data.data;
};

export const getOrderReconciliation = async (token: string, orderId: string) => {
  const response = await fetch(`/api/reconciliation/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch order reconciliation');
  }
  
  return data.data;
};
