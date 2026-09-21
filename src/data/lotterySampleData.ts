export const DEFAULT_LOTTERY_CSV = `DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Ball Set,Machine,DrawNumber
18-Sep-26,8,17,25,30,44,19,15,1982
15-Sep-26,10,16,18,22,28,19,15,1981
11-Sep-26,1,7,15,39,50,19,15,1980
08-Sep-26,13,17,33,35,39,19,15,1979
04-Sep-26,11,12,19,27,46,19,15,1978
01-Sep-26,2,10,23,37,47,19,15,1977
28-Aug-26,7,14,28,42,45,21,13,1976
25-Aug-26,8,16,30,47,48,21,13,1975
21-Aug-26,10,14,15,19,45,21,13,1974
18-Aug-26,3,9,38,40,50,21,13,1973
14-Aug-26,5,29,39,48,49,21,13,1972
11-Aug-26,3,11,17,46,48,21,13,1971
07-Aug-26,26,29,35,38,47,21,13,1970
04-Aug-26,25,30,34,46,50,21,13,1969
31-Jul-26,10,24,25,31,45,20,14,1968
28-Jul-26,5,7,24,30,49,20,14,1967
24-Jul-26,8,10,30,36,47,20,14,1966
21-Jul-26,2,3,8,28,39,20,14,1965
17-Jul-26,12,21,23,34,40,20,14,1964
14-Jul-26,10,19,37,42,47,20,14,1963
10-Jul-26,2,14,28,33,48,20,14,1962
07-Jul-26,5,29,33,45,47,20,14,1961
03-Jul-26,2,12,17,25,39,20,14,1960
30-Jun-26,1,8,37,44,48,19,15,1959
26-Jun-26,6,16,26,34,35,19,15,1958
23-Jun-26,3,33,36,45,46,19,15,1957
19-Jun-26,8,34,39,41,42,19,15,1956
16-Jun-26,18,25,31,37,45,19,15,1955
12-Jun-26,4,7,14,22,23,19,15,1954
09-Jun-26,2,7,23,44,46,19,15,1953
05-Jun-26,5,6,16,17,49,19,15,1952
02-Jun-26,6,9,17,18,42,19,15,1951
29-May-26,5,14,18,31,35,21,13,1950
26-May-26,6,23,25,35,37,21,13,1949
22-May-26,6,22,26,31,37,21,13,1948
19-May-26,2,12,20,38,45,21,13,1947
15-May-26,3,10,38,41,43,21,13,1946
12-May-26,4,26,32,35,36,21,13,1945
08-May-26,2,17,19,34,37,21,13,1944
05-May-26,3,4,8,20,31,21,13,1943
01-May-26,3,9,42,46,47,21,13,1942
28-Apr-26,26,29,41,46,47,20,14,1941
24-Apr-26,25,26,30,40,45,20,14,1940
21-Apr-26,13,16,29,40,47,20,14,1939
17-Apr-26,22,23,28,41,47,20,14,1938
14-Apr-26,1,2,4,28,44,20,14,1937
10-Apr-26,10,13,14,38,41,20,14,1936
07-Apr-26,11,14,19,36,49,20,14,1935
03-Apr-26,8,27,29,46,49,20,14,1934
31-Mar-26,5,8,10,33,38,19,15,1933
27-Mar-26,4,10,43,44,48,19,15,1932`;

export interface ParsedRowData {
  rawRow: Record<string, any>;
  date?: string;
  drawNumber?: number;
  numbers: number[];
  columns: string[];
}

export interface ParsedDataset {
  headers: string[];
  numericColumns: string[];
  rows: ParsedRowData[];
  minVal: number;
  maxVal: number;
  frequencyMap: Record<number, number>;
  totalRows: number;
}

export function parseNumberRowsCSV(csvText: string, selectedCols?: string[]): ParsedDataset {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      headers: [],
      numericColumns: [],
      rows: [],
      minVal: 1,
      maxVal: 50,
      frequencyMap: {},
      totalRows: 0
    };
  }

  // Parse CSV header line
  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' || c === "'") inQ = !inQ;
      else if (c === ',' && !inQ) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res.map(s => s.replace(/^["']|["']$/g, ''));
  };

  const headers = parseLine(lines[0]);
  const rowsRaw: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const raw = vals[idx] !== undefined ? vals[idx] : '';
      if (raw !== '' && !isNaN(Number(raw))) {
        obj[h] = Number(raw);
      } else {
        obj[h] = raw;
      }
    });
    rowsRaw.push(obj);
  }

  // Find numerical columns representing drawn numbers
  const numericColumns = headers.filter(h => {
    const lower = h.toLowerCase().trim();
    if (
      lower === 'id' ||
      lower === 'row' ||
      lower === 'index' ||
      lower === 'seq' ||
      lower === 'sequence' ||
      lower.includes('drawnumber') ||
      lower.includes('draw_number') ||
      lower.includes('draw_no') ||
      lower.includes('drawid') ||
      lower.includes('draw_id') ||
      lower.includes('ball set') ||
      lower.includes('ball_set') ||
      lower.includes('machine') ||
      lower.includes('timestamp') ||
      lower === 'year'
    ) {
      return false; // usually metadata ID, not ball number
    }
    const numericCount = rowsRaw.filter(r => typeof r[h] === 'number').length;
    return numericCount > rowsRaw.length * 0.7;
  });

  // Effective columns to predict
  const colsToUse = selectedCols && selectedCols.length > 0 ? selectedCols : numericColumns;

  let minVal = Infinity;
  let maxVal = -Infinity;
  const frequencyMap: Record<number, number> = {};

  const rows: ParsedRowData[] = rowsRaw.map(r => {
    const numbers: number[] = [];
    colsToUse.forEach(c => {
      const n = Number(r[c]);
      if (!isNaN(n)) {
        numbers.push(n);
        if (n < minVal) minVal = n;
        if (n > maxVal) maxVal = n;
        frequencyMap[n] = (frequencyMap[n] || 0) + 1;
      }
    });

    return {
      rawRow: r,
      date: r['DrawDate'] || r['Date'] || r['date'],
      drawNumber: r['DrawNumber'] || r['draw_number'],
      numbers,
      columns: colsToUse
    };
  });

  if (minVal === Infinity) minVal = 1;
  if (maxVal === -Infinity) maxVal = 50;

  return {
    headers,
    numericColumns,
    rows,
    minVal,
    maxVal,
    frequencyMap,
    totalRows: rows.length
  };
}
