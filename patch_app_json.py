
import json

with open('apex-app/app.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

plugins = data['expo'].get('plugins', [])
new_plugins = []
for p in plugins:
    if isinstance(p, list) and p[0] == 'expo-audio':
        new_plugins.append('expo-av')
    elif p == 'expo-audio':
        new_plugins.append('expo-av')
    else:
        new_plugins.append(p)

data['expo']['plugins'] = new_plugins

with open('apex-app/app.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Done patching app.json")
