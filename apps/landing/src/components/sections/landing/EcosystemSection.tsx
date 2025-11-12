'use client';

import { motion } from 'framer-motion';
import { EcosystemEnterprise } from './EcosystemEnterprise';

export function EcosystemSection() {
  return (
    <section id="ecosystem" className="py-14 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* GROWS Ecosystem Enterprise */}
        <EcosystemEnterprise />
      </div>
    </section>
  );
}