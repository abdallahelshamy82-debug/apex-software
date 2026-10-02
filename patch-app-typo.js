const fs = require('fs');
let content = fs.readFileSync('apex-app/src/app/index.tsx', 'utf8');
content = content.replace(/أيكس/g, 'أبكس');
fs.writeFileSync('apex-app/src/app/index.tsx', content);
console.log('Fixed in apex-app/src/app/index.tsx');
