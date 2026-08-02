import re

with open('db.ts', 'r') as f:
    code = f.read()

# Replace db.prepare('...').run(
code = re.sub(r"db\.prepare\('([^']+)'\)\.run\(", r"await db.run('\1', ", code)
code = re.sub(r"db\.prepare\(`([^`]+)`\)\.run\(", r"await db.run(`\1`, ", code)

# Ensure no other .prepare remain
code = re.sub(r"db\.prepare\('([^']+)'\)\.get\(", r"await db.get('\1', ", code)
code = re.sub(r"db\.prepare\(`([^`]+)`\)\.get\(", r"await db.get(`\1`, ", code)
code = re.sub(r"db\.prepare\('([^']+)'\)\.all\(", r"await db.all('\1', ", code)
code = re.sub(r"db\.prepare\(`([^`]+)`\)\.all\(", r"await db.all(`\1`, ", code)

# Fix remaining ones that didn't have parameters
code = re.sub(r"await db\.run\('([^']+)', \)", r"await db.run('\1')", code)
code = re.sub(r"await db\.get\('([^']+)', \)", r"await db.get('\1')", code)
code = re.sub(r"await db\.all\('([^']+)', \)", r"await db.all('\1')", code)

with open('db.ts', 'w') as f:
    f.write(code)

