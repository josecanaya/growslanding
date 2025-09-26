'use client';

import { useState } from 'react';
import { User, Star, Award, DollarSign, Users, Building2, Edit3 } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface CuentaProps {
  user: User;
}

interface LevelProgress {
  phase: string;
  current: number;
  max: number;
  multiplier: number;
}

interface SquadMember {
  id: number;
  name: string;
  level: string;
  rating: number;
}

export function Cuenta({ user }: CuentaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const levelProgress: LevelProgress[] = [
    { phase: 'Estructura', current: 85, max: 100, multiplier: 1.2 },
    { phase: 'Obra Gris', current: 70, max: 100, multiplier: 1.5 },
    { phase: 'Terminaciones', current: 45, max: 100, multiplier: 2.0 }
  ];

  const squadMembers: SquadMember[] = [
    { id: 1, name: 'Carlos Mendoza', level: 'Oro', rating: 4.7 },
    { id: 2, name: 'Ana Rodríguez', level: 'Plata', rating: 4.2 },
    { id: 3, name: 'Miguel Torres', level: 'Platino', rating: 4.9 }
  ];

  const bonuses = [
    { name: 'Bonificación por puntualidad', amount: 5000, description: 'Por cumplir con los tiempos acordados' },
    { name: 'Bonificación por calidad', amount: 8000, description: 'Por mantener altos estándares de calidad' },
    { name: 'Bonificación por equipo', amount: 3000, description: 'Por liderar efectivamente tu cuadrilla' }
  ];

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronce': return 'text-amber-600 bg-amber-100';
      case 'plata': return 'text-gray-600 bg-gray-100';
      case 'oro': return 'text-yellow-600 bg-yellow-100';
      case 'platino': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronce': return '🥉';
      case 'plata': return '🥈';
      case 'oro': return '🥇';
      case 'platino': return '💎';
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

  const calculateHourlyRate = () => {
    const baseRate = 2500;
    const levelMultiplier = levelProgress.reduce((acc, phase) => acc + phase.multiplier, 0) / levelProgress.length;
    const ratingBonus = (user.rating - 4) * 500;
    return Math.round(baseRate * levelMultiplier + ratingBonus);
  };

  const handleSave = () => {
    setUser(editedUser);
    setIsEditing(false);
    // Aquí se guardaría en localStorage o en la base de datos
    localStorage.setItem('user', JSON.stringify(editedUser));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Mi Cuenta</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-accent text-dark px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors duration-200 flex items-center space-x-2"
        >
          <Edit3 className="h-4 w-4" />
          <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Información Personal
          </h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Nombre</label>
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Avatar</label>
                <input
                  type="text"
                  value={editedUser.avatar}
                  onChange={(e) => setEditedUser({ ...editedUser, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="bg-accent text-dark px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors duration-200"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-dark/20 text-dark rounded-lg hover:bg-light transition-colors duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-dark text-3xl">
                  {user.avatar}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-dark">{user.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getLevelColor(user.level)}`}>
                      <span>{getLevelIcon(user.level)}</span>
                      <span>{user.level}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {renderStars(user.rating)}
                </div>
                <span className="text-sm text-dark/70">{user.rating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mi Cuadrilla */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            Mi Cuadrilla
          </h3>
          
          <div className="space-y-3">
            {squadMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-dark text-sm">
                    👷‍♂️
                  </div>
                  <div>
                    <p className="font-medium text-dark text-sm">{member.name}</p>
                    <p className="text-xs text-dark/70">{member.level}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {renderStars(member.rating)}
                  </div>
                  <span className="text-xs text-dark/70">{member.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Niveles por Fase */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Niveles por Fase
          </h3>
          
          <div className="space-y-4">
            {levelProgress.map((phase, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-dark">{phase.phase}</span>
                  <span className="text-sm text-dark/70">
                    {phase.current}/{phase.max} (x{phase.multiplier})
                  </span>
                </div>
                <div className="w-full bg-light rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(phase.current / phase.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cálculo de Pago */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary" />
            Cálculo de Pago por Hora-Hombre
          </h3>
          
          <div className="space-y-4">
            <div className="bg-light rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-dark/70">Tarifa base:</span>
                <span className="font-medium text-dark">$2,500</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-dark/70">Multiplicador por nivel:</span>
                <span className="font-medium text-dark">x1.57</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-dark/70">Bonus por rating:</span>
                <span className="font-medium text-dark">+${Math.round((user.rating - 4) * 500)}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between items-center">
                <span className="font-semibold text-dark">Tarifa final:</span>
                <span className="text-xl font-bold text-primary">${calculateHourlyRate().toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-dark">Bonificaciones Disponibles:</h4>
              {bonuses.map((bonus, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-light rounded">
                  <div>
                    <p className="text-sm font-medium text-dark">{bonus.name}</p>
                    <p className="text-xs text-dark/70">{bonus.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+${bonus.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
