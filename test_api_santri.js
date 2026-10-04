const fetch = require('node-fetch');

async function test() {
  const url = 'http://localhost:3001/api/master/santri?kelas_id=17853f33-75b5-402a-91c6-62c097915203';
  console.log('Fetching', url);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log('API returned santri count:', json.santri ? json.santri.length : 'undefined');
    console.log('Stats:', json.stats);
  } catch (err) {
    console.log('Error', err);
  }
}
test();
