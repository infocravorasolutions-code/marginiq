export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  defaultLandedCost: number;
  packagingCost: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  gstRate: number;
  batches?: ProductBatch[];
}

export interface ProductBatch {
  _id: string;
  batchNumber: string;
  remainingQuantity: number;
  landedCost: number;
  receivedDate: string;
}

export const searchProducts = async (token: string, query: string): Promise<Product[]> => {
  if (!query) return [];
  const response = await fetch(`/api/inventory/products?search=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch products');
  }
  return data.data;
};

export const getProductDetails = async (token: string, id: string): Promise<Product> => {
  const response = await fetch(`/api/inventory/products/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch product details');
  }
  return data.data;
};
