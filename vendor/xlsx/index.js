/**
 * Minimal xlsx implementation for IWFSA.
 * Implements only the subset used by the project:
 *   write, read, utils.aoa_to_sheet, utils.book_new,
 *   utils.book_append_sheet, utils.sheet_to_json
 *
 * Produces valid Office Open XML (.xlsx) files that are
 * compatible with real Excel/LibreOffice readers.
 */

"use strict";

const { deflateRawSync, inflateRawSync } = require("zlib");

// ---------------------------------------------------------------------------
// CRC-32 table
// ---------------------------------------------------------------------------
const CRC32_TABLE = (function buildTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// Column index → letter(s), e.g. 0→A, 25→Z, 26→AA
// ---------------------------------------------------------------------------
function colToLetter(col) {
  let result = "";
  let n = col;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

// ---------------------------------------------------------------------------
// Cell reference, e.g. row=0 col=0 → "A1"
// ---------------------------------------------------------------------------
function cellRef(row, col) {
  return colToLetter(col) + (row + 1);
}

// ---------------------------------------------------------------------------
// XML escaping
// ---------------------------------------------------------------------------
function escXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------------
// Minimal ZIP writer
// ---------------------------------------------------------------------------
function dosDateTime() {
  const now = new Date();
  const time =
    (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date =
    ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  return { time, date };
}

function writeZip(files) {
  // files: Array<{ name: string, data: Buffer }>
  const localHeaders = [];
  let offset = 0;
  const dt = dosDateTime();

  for (const file of files) {
    const nameBytes = Buffer.from(file.name, "utf8");
    const uncompressed = file.data;
    const compressed = deflateRawSync(uncompressed, { level: 6 });
    const useCompressed = compressed.length < uncompressed.length;
    const fileData = useCompressed ? compressed : uncompressed;
    const method = useCompressed ? 8 : 0;
    const checksum = crc32(uncompressed);

    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);          // version needed
    localHeader.writeUInt16LE(0, 6);           // flags
    localHeader.writeUInt16LE(method, 8);      // compression method
    localHeader.writeUInt16LE(dt.time, 10);    // mod time
    localHeader.writeUInt16LE(dt.date, 12);    // mod date
    localHeader.writeUInt32LE(checksum, 14);   // CRC-32
    localHeader.writeUInt32LE(fileData.length, 18); // compressed size
    localHeader.writeUInt32LE(uncompressed.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28);          // extra field length
    nameBytes.copy(localHeader, 30);

    localHeaders.push({
      name: nameBytes,
      localHeader,
      fileData,
      method,
      checksum,
      compressedSize: fileData.length,
      uncompressedSize: uncompressed.length,
      offset
    });
    offset += localHeader.length + fileData.length;
  }

  const cdOffset = offset;
  const centralDirs = [];

  for (const entry of localHeaders) {
    const cd = Buffer.alloc(46 + entry.name.length);
    cd.writeUInt32LE(0x02014b50, 0);  // signature
    cd.writeUInt16LE(63, 4);          // version made by (Unix 3.11)
    cd.writeUInt16LE(20, 6);          // version needed
    cd.writeUInt16LE(0, 8);           // flags
    cd.writeUInt16LE(entry.method, 10);
    cd.writeUInt16LE(dt.time, 12);
    cd.writeUInt16LE(dt.date, 14);
    cd.writeUInt32LE(entry.checksum, 16);
    cd.writeUInt32LE(entry.compressedSize, 20);
    cd.writeUInt32LE(entry.uncompressedSize, 24);
    cd.writeUInt16LE(entry.name.length, 28);
    cd.writeUInt16LE(0, 30);          // extra field length
    cd.writeUInt16LE(0, 32);          // comment length
    cd.writeUInt16LE(0, 34);          // disk start
    cd.writeUInt16LE(0, 36);          // internal attrs
    cd.writeUInt32LE(0, 38);          // external attrs
    cd.writeUInt32LE(entry.offset, 42); // local header offset
    entry.name.copy(cd, 46);
    centralDirs.push(cd);
  }

  const cdSize = centralDirs.reduce((acc, b) => acc + b.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk with cd
  eocd.writeUInt16LE(localHeaders.length, 8);
  eocd.writeUInt16LE(localHeaders.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);         // comment length

  const parts = [];
  for (const entry of localHeaders) {
    parts.push(entry.localHeader, entry.fileData);
  }
  for (const cd of centralDirs) {
    parts.push(cd);
  }
  parts.push(eocd);

  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------
// Minimal ZIP reader
// ---------------------------------------------------------------------------
function readZip(buf) {
  const files = new Map();
  let pos = 0;

  while (pos < buf.length - 4) {
    const sig = buf.readUInt32LE(pos);
    if (sig === 0x04034b50) {
      // Local file header
      const method = buf.readUInt16LE(pos + 8);
      const compressedSize = buf.readUInt32LE(pos + 18);
      const uncompressedSize = buf.readUInt32LE(pos + 22);
      const nameLength = buf.readUInt16LE(pos + 26);
      const extraLength = buf.readUInt16LE(pos + 28);
      const name = buf.slice(pos + 30, pos + 30 + nameLength).toString("utf8");
      const dataStart = pos + 30 + nameLength + extraLength;
      const compressed = buf.slice(dataStart, dataStart + compressedSize);
      const data = method === 8 ? inflateRawSync(compressed) : compressed;
      files.set(name, data);
      pos = dataStart + compressedSize;
    } else if (sig === 0x02014b50 || sig === 0x06054b50) {
      // Central directory or EOCD — done with local entries
      break;
    } else {
      pos++;
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Simple XML parser (regex-based, sufficient for xlsx XML)
// ---------------------------------------------------------------------------
function parseXmlText(xml, tagName) {
  const results = [];
  const pattern = new RegExp(`<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "g");
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    results.push({ attrs: match[1], content: match[2] });
  }
  return results;
}

function getAttr(attrStr, attrName) {
  const match = attrStr.match(new RegExp(`${attrName}="([^"]*)"`));
  return match ? match[1] : null;
}

function xmlDecode(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ---------------------------------------------------------------------------
// Build xlsx XML content
// ---------------------------------------------------------------------------
function buildContentTypesXml(sheetNames) {
  const overrides = sheetNames
    .map(
      (_, i) =>
        `  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;
}

function buildRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookXml(sheetNames) {
  const sheets = sheetNames
    .map((name, i) => `    <sheet name="${escXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheets}
  </sheets>
</workbook>`;
}

function buildWorkbookRelsXml(sheetNames) {
  const rels = sheetNames
    .map(
      (_, i) =>
        `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
  <Relationship Id="rId${sheetNames.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;
}

function buildSharedStringsXml(strings) {
  const items = strings.map((s) => `  <si><t xml:space="preserve">${escXml(s)}</t></si>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${items}
</sst>`;
}

function buildWorksheetXml(wsData, sharedStrings) {
  // wsData: Map<cellRef, { v: any, t: string }> where t is 's' (string/shared), 'n' (number), 'b' (bool), '' (blank)
  const rows = new Map();

  for (const [ref, cell] of Object.entries(wsData)) {
    if (ref === "!ref") continue;
    const colMatch = ref.match(/^([A-Z]+)(\d+)$/);
    if (!colMatch) continue;
    const rowNum = parseInt(colMatch[2], 10);
    if (!rows.has(rowNum)) rows.set(rowNum, []);
    rows.get(rowNum).push({ ref, cell });
  }

  const sortedRows = [...rows.keys()].sort((a, b) => a - b);

  const rowXml = sortedRows.map((rowNum) => {
    const cells = rows.get(rowNum).sort((a, b) => a.ref.localeCompare(b.ref));
    const cellXml = cells.map(({ ref, cell }) => {
      if (cell.t === "s") {
        return `      <c r="${ref}" t="s"><v>${cell.v}</v></c>`;
      } else if (cell.t === "b") {
        return `      <c r="${ref}" t="b"><v>${cell.v ? 1 : 0}</v></c>`;
      } else if (cell.t === "n" || cell.t === "") {
        if (cell.v === null || cell.v === undefined || cell.v === "") return "";
        return `      <c r="${ref}"><v>${escXml(String(cell.v))}</v></c>`;
      }
      return "";
    }).filter(Boolean).join("\n");
    return `    <row r="${rowNum}">\n${cellXml}\n    </row>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${rowXml}
  </sheetData>
</worksheet>`;
}

// ---------------------------------------------------------------------------
// XLSX.utils.aoa_to_sheet
// ---------------------------------------------------------------------------
function aoa_to_sheet(data) {
  // data: array of arrays (rows × cols)
  const ws = {};
  let maxRow = 0;
  let maxCol = 0;

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      const ref = cellRef(r, c);
      let t;
      if (v === null || v === undefined || v === "") {
        t = "";
      } else if (typeof v === "boolean") {
        t = "b";
      } else if (typeof v === "number") {
        t = "n";
      } else {
        t = "str"; // will be shared string when written
      }
      ws[ref] = { v, t };
      maxRow = Math.max(maxRow, r);
      maxCol = Math.max(maxCol, c);
    }
  }

  if (data.length > 0) {
    ws["!ref"] = `A1:${cellRef(maxRow, maxCol)}`;
  }

  return ws;
}

// ---------------------------------------------------------------------------
// XLSX.utils.book_new
// ---------------------------------------------------------------------------
function book_new() {
  return { SheetNames: [], Sheets: {} };
}

// ---------------------------------------------------------------------------
// XLSX.utils.book_append_sheet
// ---------------------------------------------------------------------------
function book_append_sheet(workbook, worksheet, name) {
  const sheetName = name || `Sheet${workbook.SheetNames.length + 1}`;
  workbook.SheetNames.push(sheetName);
  workbook.Sheets[sheetName] = worksheet;
}

// ---------------------------------------------------------------------------
// XLSX.write
// ---------------------------------------------------------------------------
function write(workbook, options) {
  const type = (options && options.type) || "buffer";

  // Collect all shared strings across all sheets
  const sharedStrings = [];
  const sharedIndex = new Map();

  function getSharedIndex(str) {
    const s = String(str);
    if (sharedIndex.has(s)) return sharedIndex.get(s);
    const idx = sharedStrings.length;
    sharedStrings.push(s);
    sharedIndex.set(s, idx);
    return idx;
  }

  // Build worksheet data with shared string indices resolved
  const sheetFiles = [];
  for (let si = 0; si < workbook.SheetNames.length; si++) {
    const sheetName = workbook.SheetNames[si];
    const ws = workbook.Sheets[sheetName];
    const wsResolved = {};

    for (const [ref, cell] of Object.entries(ws)) {
      if (ref === "!ref") {
        wsResolved[ref] = cell;
        continue;
      }
      if (cell.t === "str" || (cell.t !== "n" && cell.t !== "b" && cell.t !== "")) {
        // String → shared string
        const idx = getSharedIndex(cell.v);
        wsResolved[ref] = { v: idx, t: "s" };
      } else {
        wsResolved[ref] = { ...cell };
      }
    }

    sheetFiles.push({ name: `xl/worksheets/sheet${si + 1}.xml`, ws: wsResolved });
  }

  const sheetNames = workbook.SheetNames;

  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(buildContentTypesXml(sheetNames), "utf8") },
    { name: "_rels/.rels", data: Buffer.from(buildRelsXml(), "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(buildWorkbookXml(sheetNames), "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(buildWorkbookRelsXml(sheetNames), "utf8") },
    { name: "xl/sharedStrings.xml", data: Buffer.from(buildSharedStringsXml(sharedStrings), "utf8") }
  ];

  for (const sf of sheetFiles) {
    files.push({ name: sf.name, data: Buffer.from(buildWorksheetXml(sf.ws, sharedStrings), "utf8") });
  }

  const zipBuf = writeZip(files);

  if (type === "buffer") return zipBuf;
  if (type === "base64") return zipBuf.toString("base64");
  if (type === "binary") return zipBuf.toString("binary");
  if (type === "array") return Array.from(zipBuf);
  return zipBuf;
}

// ---------------------------------------------------------------------------
// XLSX.read
// ---------------------------------------------------------------------------
function read(data, options) {
  let buf;
  const type = (options && options.type) || "buffer";

  if (type === "buffer" || Buffer.isBuffer(data)) {
    buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  } else if (type === "base64") {
    buf = Buffer.from(String(data), "base64");
  } else if (type === "binary") {
    buf = Buffer.from(String(data), "binary");
  } else if (type === "array") {
    buf = Buffer.from(data);
  } else {
    buf = Buffer.from(data);
  }

  const zipFiles = readZip(buf);

  // Read shared strings
  const sharedStrings = [];
  const ssXml = zipFiles.get("xl/sharedStrings.xml");
  if (ssXml) {
    const xmlStr = ssXml.toString("utf8");
    const siMatches = parseXmlText(xmlStr, "si");
    for (const si of siMatches) {
      // Get all <t> elements and join (for rich text)
      const tMatches = parseXmlText(si.content, "t");
      const text = tMatches.map((t) => xmlDecode(t.content)).join("");
      sharedStrings.push(text);
    }
  }

  // Read workbook to get sheet names
  const wbXml = zipFiles.get("xl/workbook.xml");
  const sheetDefs = [];
  if (wbXml) {
    const xmlStr = wbXml.toString("utf8");
    // Match <sheet .../>
    const sheetPattern = /<sheet\s([^/]*)\/?>/g;
    let m;
    while ((m = sheetPattern.exec(xmlStr)) !== null) {
      const attrsStr = m[1];
      const name = getAttr(attrsStr, "name");
      const sheetId = getAttr(attrsStr, "sheetId");
      const rId = getAttr(attrsStr, "r:id");
      sheetDefs.push({ name: name || `Sheet${sheetId}`, sheetId, rId });
    }
  }

  // Read workbook rels to map rId → target
  const wbRelsXml = zipFiles.get("xl/_rels/workbook.xml.rels");
  const rIdToTarget = new Map();
  if (wbRelsXml) {
    const xmlStr = wbRelsXml.toString("utf8");
    const relPattern = /<Relationship\s([^/]*)\/?>/g;
    let m;
    while ((m = relPattern.exec(xmlStr)) !== null) {
      const id = getAttr(m[1], "Id");
      const target = getAttr(m[1], "Target");
      if (id && target) rIdToTarget.set(id, target);
    }
  }

  const workbook = { SheetNames: [], Sheets: {} };

  for (const sd of sheetDefs) {
    const target = sd.rId ? rIdToTarget.get(sd.rId) : null;
    const worksheetPath = target
      ? `xl/${target}`.replace(/\/\//g, "/")
      : `xl/worksheets/sheet${sd.sheetId}.xml`;

    const wsData = zipFiles.get(worksheetPath) || zipFiles.get(`xl/worksheets/sheet${sheetDefs.indexOf(sd) + 1}.xml`);

    const ws = {};

    if (wsData) {
      const xmlStr = wsData.toString("utf8");
      const rowMatches = parseXmlText(xmlStr, "row");

      for (const rowEl of rowMatches) {
        // Parse cells within this row
        const cellPattern = /<c\s([^>]*)>([\s\S]*?)<\/c>/g;
        let cm;
        while ((cm = cellPattern.exec(rowEl.content)) !== null) {
          const attrsStr = cm[1];
          const cellContent = cm[2];
          const ref = getAttr(attrsStr, "r");
          const cellType = getAttr(attrsStr, "t") || "n";
          if (!ref) continue;

          // Get <v> value
          const vMatch = cellContent.match(/<v>([\s\S]*?)<\/v>/);
          const rawValue = vMatch ? xmlDecode(vMatch[1]) : "";

          let v;
          let t;
          if (cellType === "s") {
            // Shared string
            const idx = parseInt(rawValue, 10);
            v = isNaN(idx) ? rawValue : (sharedStrings[idx] !== undefined ? sharedStrings[idx] : rawValue);
            t = "s";
          } else if (cellType === "inlineStr") {
            const tMatch = cellContent.match(/<t>([\s\S]*?)<\/t>/);
            v = tMatch ? xmlDecode(tMatch[1]) : "";
            t = "s";
          } else if (cellType === "b") {
            v = rawValue === "1";
            t = "b";
          } else if (cellType === "str" || cellType === "e") {
            v = rawValue;
            t = "str";
          } else {
            // Numeric (default)
            const num = parseFloat(rawValue);
            v = isNaN(num) ? rawValue : num;
            t = "n";
          }

          ws[ref] = { v, t, w: String(v) };
        }
      }

      // Compute !ref range
      const refs = Object.keys(ws).filter((k) => k !== "!ref");
      if (refs.length > 0) {
        ws["!ref"] = computeRef(refs);
      }
    }

    workbook.SheetNames.push(sd.name);
    workbook.Sheets[sd.name] = ws;
  }

  return workbook;
}

function computeRef(refs) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const ref of refs) {
    const m = ref.match(/^([A-Z]+)(\d+)$/);
    if (!m) continue;
    const r = parseInt(m[2], 10);
    const c = lettersToCol(m[1]);
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  return `${colToLetter(minC)}${minR}:${colToLetter(maxC)}${maxR}`;
}

function lettersToCol(letters) {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1;
}

// ---------------------------------------------------------------------------
// XLSX.utils.sheet_to_json
// ---------------------------------------------------------------------------
function sheet_to_json(ws, options) {
  const opt = options || {};
  const header = opt.header;
  const defval = opt.defval !== undefined ? opt.defval : undefined;
  const range = ws["!ref"];

  if (!range) return [];

  const [startRef, endRef] = range.split(":");
  const startMatch = startRef.match(/^([A-Z]+)(\d+)$/);
  const endMatch = endRef.match(/^([A-Z]+)(\d+)$/);

  if (!startMatch || !endMatch) return [];

  const startRow = parseInt(startMatch[2], 10);
  const endRow = parseInt(endMatch[2], 10);
  const startCol = lettersToCol(startMatch[1]);
  const endCol = lettersToCol(endMatch[1]);

  // Collect all cell values
  const grid = [];
  for (let r = startRow; r <= endRow; r++) {
    const row = [];
    for (let c = startCol; c <= endCol; c++) {
      const ref = cellRef(r - 1, c);
      const cell = ws[ref];
      if (cell !== undefined) {
        row.push(cell.v !== undefined ? cell.v : (defval !== undefined ? defval : ""));
      } else {
        row.push(defval !== undefined ? defval : "");
      }
    }
    grid.push(row);
  }

  if (header === 1) {
    // Return array of arrays (raw rows)
    return grid;
  }

  // Default: return array of objects using first row as keys
  if (grid.length === 0) return [];
  const keys = grid[0].map((k) => String(k !== undefined && k !== null ? k : ""));
  const result = [];
  for (let i = 1; i < grid.length; i++) {
    const obj = {};
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (key === "") continue;
      const val = grid[i][c];
      obj[key] = val !== undefined ? val : (defval !== undefined ? defval : "");
    }
    result.push(obj);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
const utils = {
  aoa_to_sheet,
  book_new,
  book_append_sheet,
  sheet_to_json
};

module.exports = { write, read, utils };
