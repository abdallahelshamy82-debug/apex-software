const fs = require('fs');
let dict = fs.readFileSync('src/lib/dictionary.ts', 'utf8');

if (dict.includes('أبكس')) {
    dict = dict.replace(/أبكس/g, 'أبكس');
    fs.writeFileSync('src/lib/dictionary.ts', dict);
    console.log('Fixed typo in dictionary.ts');
} else {
    console.log('Typo not found in dictionary.ts');
}
