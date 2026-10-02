const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.expo' || file === 'assets') continue;
        
        if (fs.statSync(fullPath).isDirectory()) {
            replaceAll(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.json')) {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('أيكس')) {
                    content = content.replace(/أيكس/g, 'أبكس');
                    fs.writeFileSync(fullPath, content);
                    console.log('Fixed typo in: ' + fullPath);
                }
            } catch(e) {}
        }
    }
}

replaceAll('apex-app');
replaceAll('apex-web');
