from pathlib import Path

path = Path(r'grows/apps/web/app/(dashboard)/dashboard/dashboard-client.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace("import { useMemo, useState } from 'react';", "import { useEffect, useMemo, useState } from 'react';")
if "import type { ChangeEvent } from 'react';" not in text:
    text = text.replace("import { useRouter } from 'next/navigation';", "import type { ChangeEvent } from 'react';\nimport { useRouter } from 'next/navigation';")
if "import { supabase } from '@/lib/supabase';" not in text:
    text = text.replace("import { ensureOrgForUser } from '@/lib/orgs';", "import { ensureOrgForUser } from '@/lib/orgs';\nimport { supabase } from '@/lib/supabase';")
path.write_text(text, encoding='utf-8')
