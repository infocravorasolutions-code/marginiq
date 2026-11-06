export function jsonToCsv(data: any[]): string {
  if (!data || !data.length) return '';

  const headers = Object.keys(data[0]);
  
  const escapeCsvValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCsvValue).join(',');
  
  const rows = data.map(row => {
    return headers.map(header => escapeCsvValue(row[header])).join(',');
  });

  return [headerRow, ...rows].join('\n');
}
