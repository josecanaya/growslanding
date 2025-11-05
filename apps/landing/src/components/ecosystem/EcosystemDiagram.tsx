'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ecosystems, EcosystemNode, EcosystemConnection } from '@/data/ecosystems';

interface EcosystemDiagramProps {
  variant: keyof typeof ecosystems;
  className?: string;
}

const getNodeSize = (size: EcosystemNode['size']): number => {
  const sizeMap = {
    xs: 8,
    s: 32,
    m: 35,
    l: 45,
    xl: 60
  };
  return sizeMap[size] || 35;
};

const getConnectionStyle = (type: EcosystemConnection['type']) => {
  const styles = {
    center: { width: 3, opacity: 0.8 },
    inner: { width: 2, opacity: 0.6 },
    middle: { width: 2.5, opacity: 0.7 },
    outer: { width: 1.5, opacity: 0.5 }
  };
  return styles[type] || styles.outer;
};

const iconMap: Record<string, JSX.Element> = {
  document: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  money: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  check: (
    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  star: (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  alert: (
    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM15 7h5l-5-5v5zM4 5h6V3H4v2z" />
    </svg>
  ),
  payments: (
    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  analytics: (
    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
};

export function EcosystemDiagram({ variant, className = '' }: EcosystemDiagramProps) {
  const config = ecosystems[variant];

  const renderNode = (node: EcosystemNode) => {
    const isLink = node.href !== undefined;
    const Wrapper = isLink ? motion.a : motion.div;
    const wrapperProps = isLink ? { href: node.href } : {};

    return (
      <Wrapper
        key={node.id}
        className={`text-center group block ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        {...wrapperProps}
      >
        <div
          className="relative rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-[#C6A34F] cursor-pointer"
          style={{
            width: `${getNodeSize(node.size) * 2}px`,
            height: `${getNodeSize(node.size) * 2}px`,
            backgroundColor: node.color
          }}
        >
          {node.image && (
            <img
              src={node.image}
              alt={node.name}
              className="w-24 h-24 rounded-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          )}
          {node.icon && iconMap[node.icon]}
          {!node.image && !node.icon && (
            <span className="text-sm font-medium" style={{ color: '#1D4E48' }}>
              {node.name}
            </span>
          )}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1E40AF] opacity-30 group-hover:opacity-60 transition-all duration-300" />
        </div>
        {node.name && (
          <h3 className="text-xl font-medium text-[#1E293B] mb-3 font-['Inter']">{node.name}</h3>
        )}
        {node.description && (
          <p className="text-sm text-[#6B7280] max-w-48 font-['Inter'] font-normal">{node.description}</p>
        )}
      </Wrapper>
    );
  };

  return (
    <div className="w-full">
      <div className="text-center mb-20">
        <h2 className="text-6xl font-bold text-[#1E293B] mb-6 tracking-tight leading-tight">
          {config.title}
        </h2>
        {'subtitle' in config && config.subtitle && (
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {config.subtitle}
          </p>
        )}
      </div>

      <div className="relative bg-white rounded-2xl p-16 shadow-sm border border-gray-100">
        {/* Render nodes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {config.nodes.map(renderNode)}
        </div>
      </div>
    </div>
  );
}

