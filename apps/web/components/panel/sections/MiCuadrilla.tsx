'use client';

import { useState } from 'react';
import { Users, Plus, X, Star, Award } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface MiCuadrillaProps {
  user: User;
}

interface Member {
  id: number;
  name: string;
  role: string;
  level: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  rating: number;
  avatar: string;
  specialties: string[];
}

export function MiCuadrilla({ user }: MiCuadrillaProps) {
  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      name: 'Carlos Mendoza',
      role: 'Albañil Senior',
      level: 'Oro',
      rating: 4.7,
      avatar: '👷‍♂️',
      specialties: ['Mampostería', 'Hormigón', 'Replanteo']
    },
    {
      id: 2,
      name: 'Ana Rodríguez',
      role: 'Ayudante',
      level: 'Plata',
      rating: 4.2,
      avatar: '👷‍♀️',
      specialties: ['Preparación', 'Limpieza', 'Apoyo']
    },
    {
      id: 3,
      name: 'Miguel Torres',
      role: 'Especialista en Estructuras',
      level: 'Platino',
      rating: 4.9,
      avatar: '👨‍🔧',
      specialties: ['Estructuras', 'Hierros', 'Encofrados']
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    level: 'Bronce' as 'Bronce' | 'Plata' | 'Oro' | 'Platino',
    specialties: ''
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronce': return 'text-amber-600 bg-amber-100';
      case 'Plata': return 'text-gray-600 bg-gray-100';
      case 'Oro': return 'text-yellow-600 bg-yellow-100';
      case 'Platino': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Bronce': return '🥉';
      case 'Plata': return '🥈';
      case 'Oro': return '🥇';
      case 'Platino': return '💎';
      default: return '⭐';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-accent' : 'text-gray-400'}>
        ★
      </span>
    ));
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.role) {
      const member: Member = {
        id: members.length + 1,
        name: newMember.name,
        role: newMember.role,
        level: newMember.level,
        rating: 4.0,
        avatar: '👷‍♂️',
        specialties: newMember.specialties.split(',').map(s => s.trim()).filter(s => s)
      };
      setMembers([...members, member]);
      setNewMember({ name: '', role: '', level: 'Bronce', specialties: '' });
      setShowAddModal(false);
    }
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter(member => member.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Mi Cuadrilla</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-accent text-dark px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar miembro</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-light rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-dark text-2xl">
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-dark">{member.name}</h3>
                  <p className="text-sm text-dark/70">{member.role}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveMember(member.id)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark/70">Nivel:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getLevelColor(member.level)}`}>
                  <span>{getLevelIcon(member.level)}</span>
                  <span>{member.level}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark/70">Rating:</span>
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {renderStars(member.rating)}
                  </div>
                  <span className="text-sm text-dark/70 ml-1">{member.rating}</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-dark/70">Especialidades:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.specialties.map((specialty, index) => (
                    <span key={index} className="px-2 py-1 bg-white text-xs text-dark/70 rounded">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para agregar miembro */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-dark mb-4">Agregar miembro a la cuadrilla</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Nombre</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Nombre del miembro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Rol</label>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Albañil, Ayudante, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Nivel</label>
                  <select
                    value={newMember.level}
                    onChange={(e) => setNewMember({ ...newMember, level: e.target.value as any })}
                    className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="Bronce">Bronce</option>
                    <option value="Plata">Plata</option>
                    <option value="Oro">Oro</option>
                    <option value="Platino">Platino</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">Especialidades</label>
                  <input
                    type="text"
                    value={newMember.specialties}
                    onChange={(e) => setNewMember({ ...newMember, specialties: e.target.value })}
                    className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Separadas por comas"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddMember}
                  className="flex-1 bg-accent text-dark py-2 px-4 rounded-lg hover:bg-accent/90 transition-colors duration-200"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-dark/20 text-dark rounded-lg hover:bg-light transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
