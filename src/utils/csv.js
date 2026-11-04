function safeCsvValue(value) {
  let text = String(value ?? '');
  if (['=', '+', '-', '@'].includes(text.trimStart()[0])) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const csv = [columns, ...rows.map(row => columns.map(column => row[column] ?? ''))]
    .map(row => row.map(safeCsvValue).join(','))
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
