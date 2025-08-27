import axios from 'axios';
import process from 'process';

const BASE_URL = process.env.SEED_BASE_URL || 'https://bloom-871375843448.europe-west1.run.app';
const ROLES = ['customer','admin','presales','support','it'];
const COUNT = parseInt(process.env.SEED_USER_COUNT || '5',10);
const PASSWORD = process.env.SEED_USER_PASSWORD || '1234';
const DRY_RUN = process.env.DRY_RUN === '1';
const RESET = process.env.RESET_PASSWORD === '1';

function email(role, i){ return `${role}${i}@seed.remote`; }

async function userExists(emailAddr){
  try { await axios.get(`${BASE_URL}/api/users/email/${encodeURIComponent(emailAddr)}`); return true; }
  catch(e){ if(e.response && e.response.status===404) return false; throw e; }
}

async function createUser(role,i){
  const data = { name: `${role.toUpperCase()} Remote ${i}`, email: email(role,i), password: PASSWORD, role };
  if(DRY_RUN) return { dryRun:true, ...data };
  const res = await axios.post(`${BASE_URL}/api/users`, data);
  return res.data;
}

async function updateUserPassword(userId){
  if(DRY_RUN) return { dryRun:true };
  await axios.put(`${BASE_URL}/api/users/${userId}`, { password: PASSWORD });
}

async function main(){
  console.log(`[seedUsersRemote] Start base=${BASE_URL} dryRun=${DRY_RUN}`);
  const summary = {};
  for(const role of ROLES){
    let created=0, skipped=0, reset=0;
    for(let i=1;i<=COUNT;i++){
      const e = email(role,i);
      let exists; let existingUser=null;
      try { exists = await userExists(e); } catch(err){ console.error('Exists check failed', e, err.message); continue; }
      if(exists){
        if(RESET){
          try {
            // fetch user to get _id
            const res = await axios.get(`${BASE_URL}/api/users/email/${encodeURIComponent(e)}`);
            existingUser = res.data;
            await updateUserPassword(existingUser._id);
            reset++;
          } catch(err){ console.error('Password reset failed', e, err.response?.status, err.response?.data || err.message); }
        } else {
          skipped++; continue;
        }
      } else {
        try { await createUser(role,i); created++; } catch(err){ console.error('Create failed', role, i, err.response?.status, err.response?.data || err.message); }
      }
    }
    summary[role] = { created, skipped, reset };
  }
  console.log('[seedUsersRemote] Summary', summary);
}

if (process.argv[1] && process.argv[1].includes('seedUsersRemote.js')){
  main().catch(e=>{ console.error('Fatal', e.message); process.exit(1); });
}
