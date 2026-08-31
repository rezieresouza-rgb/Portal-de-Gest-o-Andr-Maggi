import { User } from '../types';

/**
 * Normaliza strings para comparação (remove acentos, espaços extras e converte para caixa alta)
 */
export const normalizeName = (str?: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

/**
 * Verifica se um agendamento pertence ao usuário logado
 */
export const isMyBooking = (teacherName: string, user?: User | null): boolean => {
  if (!user || !user.name || !teacherName) return false;
  
  const normUser = normalizeName(user.name);
  const normTeacher = normalizeName(teacherName);
  
  if (!normUser || !normTeacher) return false;
  
  return (
    normUser === normTeacher ||
    normUser.includes(normTeacher) ||
    normTeacher.includes(normUser)
  );
};

/**
 * Verifica se o usuário logado tem permissão para cancelar/gerenciar o agendamento
 * (O próprio criador do agendamento OU administradores/gestão escolar)
 */
export const canCancelBooking = (teacherName: string, user?: User | null): boolean => {
  if (!user) return false;
  
  // Cargos com permissão global de administração
  const adminRoles = [
    'GESTAO',
    'ADMINISTRADOR',
    'DIRETOR',
    'COORDENADOR PEDAGÓGICO',
    'COORDENACAO',
    'SECRETÁRIO',
    'SECRETARIA'
  ];
  
  const userRole = (user.role || '').toUpperCase();
  const userJob = (user.jobFunction || '').toUpperCase();
  
  const isAdmin = adminRoles.some(
    r => userRole.includes(r) || userJob.includes(r)
  );
  
  if (isAdmin) return true;
  
  return isMyBooking(teacherName, user);
};
