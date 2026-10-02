import urllib.request, json

state_path = r'C:\Users\CYBER-TECH\.expo\state.json'
with open(state_path, 'r', encoding='utf-8') as f:
    state = json.load(f)

session_secret = state['auth']['sessionSecret']

# Expo GraphQL query
query = """
query GetAndroidCredentials($appId: String!) {
  app {
    byId(appId: $appId) {
      id
      fullName
      androidAppCredentials {
        id
        androidKeystore {
          id
          keystorePassword
          keyAlias
          sha1Fingerprint
          sha256Fingerprint
        }
      }
    }
  }
}
"""

req_data = json.dumps({
    'query': query,
    'variables': {'appId': '723fd3cb-e637-4109-8967-8c4eebd0f375'}
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.expo.dev/v2/graphql',
    data=req_data,
    headers={
        'Content-Type': 'application/json',
        'expo-session': session_secret
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(json.dumps(res, indent=2))
except Exception as e:
    print('Error:', e)
