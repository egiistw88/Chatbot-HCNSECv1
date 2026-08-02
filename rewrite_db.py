import re

with open('db.ts', 'r') as f:
    code = f.read()

# Replace imports
code = code.replace("import Database from 'better-sqlite3';", "import sqlite3 from 'sqlite3';\nimport { open } from 'sqlite';")

# Replace initialization
old_init = "db = new Database(path.join(dbDir, 'database.sqlite'));"
new_init = """db = await open({
    filename: path.join(dbDir, 'database.sqlite'),
    driver: sqlite3.Database
  });"""
code = code.replace(old_init, new_init)

# Replace db.exec
code = code.replace("db.exec(", "await db.exec(")
code = code.replace("await await", "await")

# Replace db.prepare(...).get(...)
code = re.sub(r"db\.prepare\(([^)]+)\)\.get\(([^)]*)\)", r"await db.get(\1, \2)", code)
code = re.sub(r"db\.prepare\(([^)]+)\)\.get\(\)", r"await db.get(\1)", code)

# Replace db.prepare(...).all(...)
code = re.sub(r"db\.prepare\(([^)]+)\)\.all\(([^)]*)\)", r"await db.all(\1, \2)", code)
code = re.sub(r"db\.prepare\(([^)]+)\)\.all\(\)", r"await db.all(\1)", code)

# Replace db.prepare(...).run(...)
code = re.sub(r"db\.prepare\(([^)]+)\)\.run\(([^)]*)\)", r"await db.run(\1, \2)", code)
code = re.sub(r"db\.prepare\(([^)]+)\)\.run\(\)", r"await db.run(\1)", code)

# Clean up any trailing commas in empty args like db.all('...', )
code = re.sub(r", \)", ")", code)

# Also fix the encryption key processing to be robust
key_setup = "const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || '01234567890123456789012345678901'; // Must be 32 chars"
new_key_setup = """const rawKey = process.env.DB_ENCRYPTION_KEY || '01234567890123456789012345678901';
const ENCRYPTION_KEY = rawKey.padEnd(32, '0').substring(0, 32);"""
code = code.replace(key_setup, new_key_setup)

with open('db.ts', 'w') as f:
    f.write(code)

