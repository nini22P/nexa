const fs = require('fs');

const CONFIG = {
  MAX_DEPTH: 4,
  FOLDERS_PER_LAYER: 5,
  LINKS_PER_FOLDER: 20,
  OUTPUT_FILE: 'test-bookmark.html'
};

let totalFolders = 0;
let totalLinks = 0;

function generateBookmarks(depth) {
  if (depth > CONFIG.MAX_DEPTH) return '';

  let html = '<DL><p>\n';
  const indent = '    '.repeat(depth + 1);

  for (let i = 0; i < CONFIG.FOLDERS_PER_LAYER; i++) {
    totalFolders++;
    const folderName = `Folder_D${depth}_I${i}_${Math.random().toString(36).slice(2, 7)}`;
    html += `${indent}<DT><H3 ADD_DATE="${Date.now()}" LAST_MODIFIED="${Date.now()}" LAST_VISITED="0">${folderName}</H3>\n`;
    html += generateBookmarks(depth + 1);
  }

  for (let j = 0; j < CONFIG.LINKS_PER_FOLDER; j++) {
    totalLinks++;
    const title = `Link_${totalLinks}_${Math.random().toString(36).slice(2, 5)}`;
    const url = `https://example.com/${totalLinks}`;
    html += `${indent}<DT><A HREF="${url}" ADD_DATE="${Date.now()}" ICON="data:image/png;base64,iVBOR..."> ${title}</A>\n`;
  }

  html += '    '.repeat(depth) + '</DL><p>\n';
  return html;
}

const body = generateBookmarks(0);
const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Heavy Test Bookmarks</TITLE>
<H1>Bookmarks</H1>
`;

fs.writeFileSync(CONFIG.OUTPUT_FILE, header + body);

console.log(`Saved: ${CONFIG.OUTPUT_FILE}`);
console.log(`Folder x ${totalFolders}, Link x ${totalLinks}, Total x ${totalFolders + totalLinks}`);