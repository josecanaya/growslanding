'use client';

import { ChatPorObra } from '@/components/messages/ChatPorObra';
import { STITCH_INNER } from '@/components/socio/stitch/socioStitchUi';

export default function MensajesPage() {
  return (
    <div className={STITCH_INNER + ' h-full min-h-[50vh] font-stitch-body'}>
      <ChatPorObra role="socio" />
    </div>
  );
}








