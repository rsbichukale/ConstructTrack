import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Database } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  searchKey,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found in local database.',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const filteredData = useMemo(() => {
    let list = [...data];

    if (searchTerm && searchKey) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => {
        const val = item[searchKey];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      });
    }

    if (sortColumn) {
      list.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA > valB ? 1 : -1;
        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return list;
  }, [data, searchTerm, searchKey, sortColumn, sortDirection]);

  const handleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md ${className}`}>
      {searchKey && (
        <div className="flex items-center justify-between border-b border-slate-800/80 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredData.length}</strong> entries
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                  className={`px-4 py-3 ${col.sortable !== false && col.key ? 'cursor-pointer select-none hover:text-white' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{col.header}</span>
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-amber-400" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIdx) => (
                <tr key={rowIdx} className="transition-colors hover:bg-slate-800/40">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  <Database className="mx-auto h-8 w-8 text-slate-600 opacity-60" />
                  <p className="mt-2 text-xs font-medium">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
