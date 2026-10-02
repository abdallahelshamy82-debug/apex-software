const fs = require('fs');
let content = fs.readFileSync('apex-app/src/context/SettingsContext.tsx', 'utf8');
content = content.replace(/أيكس/g, 'أبكس');
fs.writeFileSync('apex-app/src/context/SettingsContext.tsx', content);
console.log('Fixed in SettingsContext.tsx');
