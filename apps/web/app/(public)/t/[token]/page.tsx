import QrClient from './qr-client';

type Params = {
  token: string;
};

export default async function PublicTaskPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  return <QrClient token={decodeURIComponent(token)} />;
}
