const url = 'https://wwrjskjhemaapnwtumlt.supabase.co/rest/v1/users?select=name,role';
const key = 'sb_publishable_ShynnkPdqbx5Zzr0phpUHQ_L9s6LSy-';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
