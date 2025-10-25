import { readRange, writeRange } from './utils/google.js';

// Escreve cabeçalho na primeira célula da aba (cria a aba se não existir)
async function ensure(range, header) {
  try {
    const rows = await readRange(range);
    if (!rows || rows.length === 0) {
      await writeRange(range.replace(/!.+$/, '!A1'), [header]);
      return { created: true };
    }
    return { created: false };
  } catch {
    await writeRange(range.replace(/!.+$/, '!A1'), [header]);
    return { created: true };
  }
}

export const handler = async () => {
  try {
    const results = {};
    results.config = await ensure('config!A:B', ['key','value']);
    results.ministries = await ensure('ministries!A:D', ['id','name','created_at','updated_at']);
    results.roles = await ensure('roles!A:E', ['id','ministry_id','name','created_at','updated_at']);
    results.members = await ensure('members!A:D', ['id','name','photo_url','active']);
    results.sessions = await ensure('sessions!A:F', ['id','status','ministry_id','role_id','stage','updated_at']);
    results.indications = await ensure('indications!A:E', ['session_id','role_id','member_id','nominee_id','at']);
    results.votes = await ensure('votes!A:E', ['session_id','role_id','member_id','candidate_id','at']);
    results.results = await ensure('results!A:E', ['session_id','role_id','elected_id','ranking_json','at']);
    return { statusCode: 200, body: JSON.stringify({ ok:true, results }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
