import axios from 'axios';
import process from 'process';

const BASE_URL = process.env.SEED_BASE_URL || 'https://bloom-871375843448.europe-west1.run.app';
const ROLES = ['customer','admin','presales','support','it'];
const COUNT = parseInt(process.env.SEED_USER_COUNT || '5',10);
const PASSWORD = process.env.SEED_USER_PASSWORD || '1234';
const DRY_RUN = process.env.DRY_RUN === '1';
const RESET = process.env.RESET_PASSWORD === '1';
const RENAME = process.env.RENAME_NAMES === '1';

// Realistic name pools (same as local seeder)
const ROLE_NAMES = {
  customer: ['Alice Johnson','Brian Keller','Carla Mendes','David Young','Ella Chen','Frank Soto','Grace Li','Hector Ruiz','Ivy Parker','Jake Owens'],
  admin: ['Nora Blake','Oliver Watts','Priya Singh','Quentin Cole','Rita Howard','Sam Patel','Tanya Brooks','Umar Farouk','Vera Long','Willis Grant'],
  presales: ['Adam Rees','Bella Ortiz','Cody Lin','Dana Fox','Ethan Vale','Fiona Cruz','Gavin Hart','Holly Webb','Ian Frost','Julia Stone'],
  support: ['Aaron Diaz','Becky Moss','Chad Nolan','Doris Lane','Eli Turner','Freya Hale','Gina Walsh','Harvey Pike','Iris Boyd','Jon Watts'],
  it: ['Andre Silva','Bianca Reed','Colin Marsh','Derek Hunt','Elena Voss','Felix Braun','Giselle Roy','Harold King','Isabel Lara','Jonah Burke']
};

function email(role, i){ return `${role}${i}@seed.remote`; }
function desiredName(role, i){ const pool = ROLE_NAMES[role] || []; return pool.length ? pool[(i-1)%pool.length] : `${role.toUpperCase()} Remote ${i}`; }

async function userExists(emailAddr){
  try { await axios.get(`${BASE_URL}/api/users/email/${encodeURIComponent(emailAddr)}`); return true; }
  catch(e){ if(e.response && e.response.status===404) return false; throw e; }
}

async function fetchUserByEmail(emailAddr){
  const res = await axios.get(`${BASE_URL}/api/users/email/${encodeURIComponent(emailAddr)}`);
  return res.data;
}

async function createUser(role,i){
  const data = { name: desiredName(role,i), email: email(role,i), password: PASSWORD, role };
  if(DRY_RUN) return { dryRun:true, ...data };
  const res = await axios.post(`${BASE_URL}/api/users`, data);
  return res.data;
}

async function updateUser(userId, patch){
  if(DRY_RUN) return { dryRun:true };
  await axios.put(`${BASE_URL}/api/users/${userId}`, patch);
}

async function main(){
  console.log(`[seedUsersRemote] Start base=${BASE_URL} dryRun=${DRY_RUN} reset=${RESET} rename=${RENAME}`);
  const summary = {};
  for(const role of ROLES){
    let created=0, skipped=0, reset=0, renamed=0;
    for(let i=1;i<=COUNT;i++){
      const e = email(role,i);
      const targetName = desiredName(role,i);
      let exists; let user=null;
      try { exists = await userExists(e); } catch(err){ console.error('Exists check failed', e, err.message); continue; }
      if(exists){
        try { user = await fetchUserByEmail(e); } catch(err){ console.error('Fetch failed', e, err.message); skipped++; continue; }
        const patch = {};
        if(RESET) { patch.password = PASSWORD; }
        if(RENAME && user.name !== targetName){ patch.name = targetName; }
        if(Object.keys(patch).length){
          try { await updateUser(user._id, patch); if(patch.password) reset++; if(patch.name) renamed++; }
          catch(err){ console.error('Update failed', e, err.response?.status, err.response?.data || err.message); }
        } else {
          skipped++;
        }
      } else {
        try { await createUser(role,i); created++; }
        catch(err){ console.error('Create failed', role, i, err.response?.status, err.response?.data || err.message); }
      }
    }
    summary[role] = { created, skipped, reset, renamed };
  }
  console.log('[seedUsersRemote] Summary', summary);
}

if (process.argv[1] && process.argv[1].includes('seedUsersRemote.js')){
  main().catch(e=>{ console.error('Fatal', e.message); process.exit(1); });
}
