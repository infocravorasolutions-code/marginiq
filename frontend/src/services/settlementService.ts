export const importSettlement = async (token: string, file: File, marketplaceCode: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('marketplaceCode', marketplaceCode);

  const response = await fetch('/api/settlements/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to import settlement');
  }
  
  return data.data;
};

export const getImports = async (token: string) => {
  const response = await fetch('/api/settlements/imports', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch settlement imports');
  }
  
  return data.data;
};
