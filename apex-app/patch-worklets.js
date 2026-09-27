const fs = require('fs');
let content = fs.readFileSync('src/components/animated-icon.tsx', 'utf8');

content = content.replace(
    /import Animated, { Easing, Keyframe } from 'react-native-reanimated';\s+import { scheduleOnRN } from 'react-native-worklets';/,
    `import Animated, { Easing, Keyframe, runOnJS } from 'react-native-reanimated';`
);

content = content.replace(
    /scheduleOnRN\(setVisible, false\);/g,
    `runOnJS(setVisible)(false);`
);

fs.writeFileSync('src/components/animated-icon.tsx', content);
console.log("Worklets replaced");
