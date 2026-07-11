import { db } from './index';
import { user, workspaces, pestsDiseases, aiScanLogs } from './schema';

async function main() {
  console.log("Checking DB tables...");
  try {
    const users = await db.select().from(user);
    console.log(`Users: ${users.length}`);
    users.forEach(u => console.log(` - ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`));

    const ws = await db.select().from(workspaces);
    console.log(`Workspaces: ${ws.length}`);
    ws.forEach(w => console.log(` - ID: ${w.id}, Name: ${w.name}`));

    const pd = await db.select().from(pestsDiseases);
    console.log(`Pests/Diseases: ${pd.length}`);
    pd.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.nama}, Type: ${p.jenis}`));

    const scans = await db.select().from(aiScanLogs);
    console.log(`AI Scans: ${scans.length}`);
  } catch (err) {
    console.error("Error reading tables:", err);
  } finally {
    // @ts-ignore
    process.exit(0);
  }
}

main();
