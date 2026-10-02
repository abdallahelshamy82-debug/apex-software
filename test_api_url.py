import urllib.request
import re

try:
    html = urllib.request.urlopen('https://apex-admin-seven.vercel.app/login').read().decode('utf-8')
    scripts = re.findall(r'src=\"(/_expo/static/js/web/[^\"]+)\"', html)
    for script in scripts:
        print('Downloading', script)
        js = urllib.request.urlopen('https://apex-admin-seven.vercel.app' + script).read().decode('utf-8')
        if 'apex-backend' in js:
            print('Found apex-backend in', script)
            # Find the actual API URL used
            urls = re.findall(r'https://apex-backend[^\"]+', js)
            for u in set(urls):
                print('URL:', u)
except Exception as e:
    print(e)
