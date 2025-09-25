import QrClient from './qr-client';

export default function PublicTaskPage({
  params,
}: {
  params: { token: string };
}) {
  return <QrClient token={decodeURIComponent(params.token)} />;
}
