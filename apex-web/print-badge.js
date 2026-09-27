const fs = require('fs');
let dict = fs.readFileSync('src/lib/dictionary.ts', 'utf8');
const match = dict.match(/hero: \{\s*title: "(.*?)",\s*highlights: \[(.*?)\],\s*desc: "(.*?)",\s*badge: "(.*?)",\s*badgeDesc: "(.*?)"/);
if (match) {
    console.log("Badge: " + match[4]);
    console.log("BadgeDesc: " + match[5]);
}
