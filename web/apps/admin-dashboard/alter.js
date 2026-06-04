const postgres = require('postgres');
const sql = postgres('postgresql://postgres.rrcabxsqnmefeoefflmm:projectKARU2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres');
sql.unsafe('ALTER TABLE workspaces ADD COLUMN assigned_user_id text REFERENCES "user"(id) ON DELETE SET NULL;')
  .then(() => {
    console.log('success');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
