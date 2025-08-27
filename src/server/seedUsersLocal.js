import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const ROLES = ['customer','admin','presales','support','it'];
const COUNT = parseInt(process.env.SEED_USER_COUNT || '5',10);
const PASSWORD = process.env.SEED_USER_PASSWORD || '1234';
const RESET = process.env.RESET_PASSWORD === '1';
const RENAME = process.env.RENAME_NAMES === '1';

// Realistic name pools per role (extendable)
const ROLE_NAMES = {
  customer: ['Alice Johnson','Brian Keller','Carla Mendes','David Young','Ella Chen','Frank Soto','Grace Li','Hector Ruiz','Ivy Parker','Jake Owens'],
  admin: ['Nora Blake','Oliver Watts','Priya Singh','Quentin Cole','Rita Howard','Sam Patel','Tanya Brooks','Umar Farouk','Vera Long','Willis Grant'],
  presales: ['Adam Rees','Bella Ortiz','Cody Lin','Dana Fox','Ethan Vale','Fiona Cruz','Gavin Hart','Holly Webb','Ian Frost','Julia Stone'],
  support: ['Aaron Diaz','Becky Moss','Chad Nolan','Doris Lane','Eli Turner','Freya Hale','Gina Walsh','Harvey Pike','Iris Boyd','Jon Watts'],
  it: ['Andre Silva','Bianca Reed','Colin Marsh','Derek Hunt','Elena Voss','Felix Braun','Giselle Roy','Harold King','Isabel Lara','Jonah Burke']
};

function buildEmail(role, idx){
  return `${role}${idx}@seed.local`; // deterministic
}
function desiredName(role, idx){
  const pool = ROLE_NAMES[role] || [];
  if(pool.length === 0) return `${role.toUpperCase()} User ${idx}`;
  return pool[(idx-1) % pool.length];
}

async function main(){
  if(!MONGO_URI) { console.error('MONGO_URI missing'); process.exit(1); }
  await mongoose.connect(MONGO_URI);
  console.log('[seedUsersLocal] Connected (reset='+RESET+', rename='+RENAME+')');
  const summary = {};
  for(const role of ROLES){
    let created = 0, skipped = 0, reset = 0, renamed = 0;
    for(let i=1;i<=COUNT;i++){
      const email = buildEmail(role,i);
      const targetName = desiredName(role,i);
      let user = await User.findOne({ email });
      if(user){
        let changed = false;
        if(RESET){
          user.password = PASSWORD; // hashed via pre-save
          changed = true;
          reset++;
        }
        if(RENAME && user.name !== targetName){
          user.name = targetName;
          changed = true;
          renamed++;
        }
        if(changed){
          await user.save();
        } else {
          skipped++;
        }
      } else {
        user = await User.create({ name: targetName, email, password: PASSWORD, role });
        created++;
      }
    }
    const total = await User.countDocuments({ role });
    summary[role] = { created, skipped, reset, renamed, totalRoleUsers: total };
  }
  console.log('[seedUsersLocal] Summary:', summary);
  await mongoose.disconnect();
  console.log('[seedUsersLocal] Done.');
}

if (import.meta.url === `file://${process.argv[1]}`){
  main().catch(e=>{ console.error(e); process.exit(1); });
}
