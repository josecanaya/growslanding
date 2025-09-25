import type { PageProps } from 'next';

import QrClient from './qr-client';

type Params = {
  token: string;
};

export default async function PublicTaskPage({ params }: PageProps<Params>) {
  const { token } = await params;
  return <QrClient token={decodeURIComponent(token)} />;
}
