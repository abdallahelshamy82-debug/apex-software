
with open('apex-backend/server.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix multipart upload response at lines 1888-1895 (0-indexed: 1887-1894)
# Replace to read the file and return as data URL
new_block = [
    "    // Convert to data URL for Vercel (no persistent filesystem)\n",
    "    try {\n",
    "      const fileBuffer = fs.readFileSync(req.file.path);\n",
    "      const dataUrl = 'data:' + req.file.mimetype + ';base64,' + fileBuffer.toString('base64');\n",
    "      try { fs.unlinkSync(req.file.path); } catch(e) {}\n",
    "      res.json({\n",
    "        success: true,\n",
    "        url: dataUrl,\n",
    "        filename: req.file.originalname,\n",
    "        mimetype: req.file.mimetype,\n",
    "        size: req.file.size\n",
    "      });\n",
    "    } catch(readErr) {\n",
    "      const fileUrl = '/uploads/' + req.file.filename;\n",
    "      res.json({\n",
    "        success: true,\n",
    "        url: fileUrl,\n",
    "        filename: req.file.originalname,\n",
    "        mimetype: req.file.mimetype,\n",
    "        size: req.file.size\n",
    "      });\n",
    "    }\n",
]

# Replace lines 1887-1894 (0-indexed)
print('Original lines 1888-1895:')
for i in range(1887, 1895):
    print(f'  {i+1}: {repr(lines[i][:80])}')

lines[1887:1895] = new_block

print(f'\nNew block ({len(new_block)} lines):')
print(f'Total lines now: {len(lines)}')

with open('apex-backend/server.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done writing server.js')
