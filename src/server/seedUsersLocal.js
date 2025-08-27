import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const ROLES = ['customer','admin','presales','support','it'];
const COUNT = parseInt(process.env.SEED_USER_COUNT || '5',10);
const PASSWORD = process.env.SEED_USER_PASSWORD || '1234';
const RESET = process.env.RESET_PASSWORD === '1';

function buildEmail(role, idx){
  return `${role}${idx}@seed.local`; // deterministic
}

async function main(){
  if(!MONGO_URI) { console.error('MONGO_URI missing'); process.exit(1); }
  await mongoose.connect(MONGO_URI);
  console.log('[seedUsersLocal] Connected (reset='+RESET+')');
  const summary = {};
  for(const role of ROLES){
    let created = 0, skipped = 0, reset = 0;
    for(let i=1;i<=COUNT;i++){
      const email = buildEmail(role,i);
      let user = await User.findOne({ email });
      if(user){
        if(RESET){
          user.password = PASSWORD; // will hash via pre-save hook
            await user.save();
            reset++;
        } else {
          skipped++; continue;
        }
      } else {
        user = await User.create({ name: `${role.toUpperCase()} User ${i}`, email, password: PASSWORD, role });
        created++;
      }
    }
    const total = await User.countDocuments({ role });
    summary[role] = { created, skipped, reset, totalRoleUsers: total };
  }
  console.log('[seedUsersLocal] Summary:', summary);
  await mongoose.disconnect();
  console.log('[seedUsersLocal] Done.');
}

if (import.meta.url === `file://${process.argv[1]}`){
  main().catch(e=>{ console.error(e); process.exit(1); });
}
