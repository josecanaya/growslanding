import { createRequire } from 'module';
import path from 'path';

const require = createRequire(path.resolve('apps/web/package.json'));
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase configuration: check SUPABASE_URL and keys');
  process.exit(1);
}

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase.from('orgs').select('id').limit(1);

  if (error) {
    throw error;
  }

  console.log('Supabase connection OK.');

  if (Array.isArray(data) && data.length > 0) {
    console.log('First org id:', data[0].id);
  } else {
    console.log('Query succeeded but returned no rows.');
  }
} catch (error) {
  console.error('Supabase connection failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
