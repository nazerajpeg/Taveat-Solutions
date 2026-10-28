// n8n Code node: "Diagnosis" (Airtable diagnostic)
const read = (name) => {
  const r = $(name).first().json || {};
  const body = r.body !== undefined ? r.body : r;
  const err = (body && body.error) || r.error || null;
  return { body, err, ok: Boolean(body && body.id && !err) };
};
const errText = (e) => (e ? (typeof e === 'string' ? e : e.type ? `${e.type}: ${e.message || ''}` : e.message || JSON.stringify(e)) : '');

const who = read('Who am I');
const base = $('Find base').first().json;
const small = read('Write test: 2 columns');
const full = read('Write test: all columns');
const scopes = (who.body && who.body.scopes) || [];
const needed = ['data.records:read', 'data.records:write', 'schema.bases:read', 'schema.bases:write'];
const missing = needed.filter((s) => !scopes.includes(s));

let diagnosis;
if (who.err) {
  diagnosis = `The credential's token was rejected (${errText(who.err)}). Paste a fresh token into the Airtable credential.`;
} else if (missing.length) {
  diagnosis = `This credential's token is missing: ${missing.join(', ')}. Either the scopes weren't saved on the token, or this credential holds a different token. Paste the token that has all four scopes into this credential.`;
} else if (!small.ok) {
  diagnosis = `The token has the right scopes but Airtable won't let it add rows to Process Maps (${errText(small.err)}). Check that your Airtable account is the owner or a creator of the "${base.baseName}" base, and that the token's Access list includes this exact base.`;
} else if (!full.ok) {
  diagnosis = `Permissions are fine: a 2-column row saved. A full row failed, so one column is the problem: ${errText(full.err)}. Send this message to Claude.`;
} else {
  diagnosis = 'Airtable accepts full rows from this credential. The Process Mapper\'s "Save to client file" box must be using a different credential: open it and select this same credential.';
}

return [{
  json: {
    diagnosis,
    tokenScopes: scopes.join(', ') || '(none returned)',
    base: `${base.baseName} (${base.baseId})`,
    write2Columns: small.ok ? 'Saved' : `Failed: ${errText(small.err)}`,
    writeAllColumns: full.ok ? 'Saved' : `Failed: ${errText(full.err)}`,
    cleanUp: 'Delete the rows with Client = "Diagnostic test" from Process Maps.',
  },
}];
