const fs = require('fs');
const path = require('path');

function searchAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchAndReplace(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('أبكس')) {
                console.log('Found in ' + fullPath);
                content = content.replace(/أبكس/g, 'أبكس');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

searchAndReplace('src');
