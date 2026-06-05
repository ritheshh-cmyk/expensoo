const fs = require('fs');
let code = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

const newEn = {
  'error-loading': 'Error loading',
  'refresh': 'Refresh',
  'last-updated': 'Last Updated',
  'no-logs': 'No audit logs found.',
  'loading': 'Loading...',
  'end-reached': 'No more logs.',
  'timestamp': 'Timestamp',
  'action': 'Action',
  'actor': 'User',
  'target': 'Target',
  'ip-address': 'IP Address',
  'status': 'Status',
  'details': 'Details',
  'success': 'Success',
  'failed': 'Failed',
  'active': 'Active',
  'error-revoking-session': 'Could not revoke session.'
};

const newTe = {
  'error-loading': 'లోడ్ చేయడంలో లోపం',
  'refresh': 'రీఫ్రెష్ చేయండి',
  'last-updated': 'చివరిగా అప్‌డేట్ చేయబడింది',
  'no-logs': 'ఆడిట్ లాగ్‌లు ఏవీ కనుగొనబడలేదు.',
  'loading': 'లోడ్ అవుతోంది...',
  'end-reached': 'ఇక లాగ్‌లు లేవు.',
  'timestamp': 'సమయం',
  'action': 'చర్య',
  'actor': 'యూజర్',
  'target': 'లక్ష్యం',
  'ip-address': 'IP చిరునామా',
  'status': 'స్థితి',
  'details': 'వివరాలు',
  'success': 'విజయవంతమైంది',
  'failed': 'విఫలమైంది',
  'active': 'యాక్టివ్',
  'error-revoking-session': 'సెషన్‌ను రద్దు చేయలేకపోయాము.'
};

let enStr = Object.entries(newEn).map(([k,v]) => `    "${k}": "${v}",`).join('\n');
let teStr = Object.entries(newTe).map(([k,v]) => `    "${k}": "${v}",`).join('\n');

code = code.replace(/(\s*)(te:\s*\{)/, `\n${enStr}\n$1$2`);
code = code.replace(/(\s*)(\}\s*;\s*type Language)/, `\n${teStr}\n$1$2`);

fs.writeFileSync('src/contexts/LanguageContext.tsx', code);
console.log('LanguageContext updated');
