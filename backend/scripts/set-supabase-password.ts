import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// The package command runs with backend/ as its working directory.
config();

const expectedUserId = '1852513e-4121-4847-ad3d-4dcc749b07f4';
const expectedEmail = 'ntakhoa.work@gmail.com';
const password = process.env.NEW_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

async function main() {
  if (!supabaseUrl) fail('SUPABASE_URL is not configured in backend/.env.');
  if (!serviceRoleKey)
    fail('SUPABASE_SERVICE_ROLE_KEY is not configured in backend/.env.');
  if (!password) fail('Set NEW_PASSWORD only for this command, then try again.');
  if (password.length < 6)
    fail('NEW_PASSWORD must be at least 6 characters long.');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: lookupError } =
    await supabase.auth.admin.getUserById(expectedUserId);
  if (lookupError || !userData.user)
    fail(`Could not look up the target user: ${lookupError?.message ?? 'not found'}`);
  if (userData.user.email?.toLowerCase() !== expectedEmail)
    fail('Target UID does not belong to the expected email; no change was made.');

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    expectedUserId,
    { password },
  );
  if (updateError) fail(`Password update failed: ${updateError.message}`);

  console.log(`Password updated for ${expectedEmail}.`);
}

void main();
