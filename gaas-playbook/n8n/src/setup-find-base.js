// n8n Code node: "Find base" (Airtable setup)
const BASE_NAME = 'GaaS Client Files';

// n8n versions differ: some return { statusCode, body }, others return the body itself.
const raw = $input.first().json;
const body = raw && raw.body !== undefined ? raw.body : raw;
if (!body || !Array.isArray(body.bases)) {
  const detail = body && body.error ? JSON.stringify(body.error) : JSON.stringify(raw).slice(0, 300);
  throw new Error(`Airtable did not return a list of bases. Airtable said: ${detail}. Check that the Airtable credential's token has the schema.bases:read and schema.bases:write scopes and access to the "${BASE_NAME}" base.`);
}
const matches = body.bases.filter((b) => b.name.trim().toLowerCase() === BASE_NAME.toLowerCase());
if (!matches.length) {
  const seen = body.bases.map((b) => `"${b.name}"`).join(', ') || 'none';
  throw new Error(`No base called "${BASE_NAME}" was found. Bases this token can see: ${seen}. Create the base (or rename it) and give the token access to it.`);
}
if (matches.length > 1) {
  throw new Error(`Found ${matches.length} bases called "${BASE_NAME}" (IDs: ${matches.map((b) => b.id).join(', ')}). Keep one: delete or rename the others in Airtable, then run this again. A base's ID is the part of its web address that starts with "app".`);
}
return [{ json: { baseId: matches[0].id, baseName: matches[0].name } }];
