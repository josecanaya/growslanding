import { AsyncLocalStorage } from 'node:async_hooks';
import type { User } from '@supabase/supabase-js';
// Only the server dispatcher installs this context after verifying a delegated token.
// No cookie, request body, header with a user ID, or client-selected role can install it.
const actors = new AsyncLocalStorage<User>();
export const connectorActor = () => actors.getStore();
export const withConnectorActor = <T>(user: User, action: () => Promise<T>) => actors.run(user, action);
