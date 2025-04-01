'use client';

import { ArrowUpRight, Package, Truck, Users } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkText: string;
  href: string;
}

function StatCard({ title, value, icon, linkText, href }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-full text-blue-500">
          {icon}
        </div>
      </div>
      <Link
        href={href}
        className="flex items-center mt-4 text-sm text-blue-600 font-medium hover:underline"
      >
        {linkText}
        <ArrowUpRight size={16} className="ml-1" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo ao sistema de gestão da Nmalls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Entregas Pendentes"
            value={12}
            icon={<Truck size={24} />}
            linkText="Ver entregas"
            href="/dashboard/entregas/rotas"
          />
          <StatCard
            title="Devoluções"
            value={5}
            icon={<Package size={24} />}
            linkText="Ver devoluções"
            href="/dashboard/devolucoes/registro"
          />
          <StatCard
            title="Motoristas Ativos"
            value={8}
            icon={<Users size={24} />}
            linkText="Ver motoristas"
            href="/dashboard/entregas/rastreamento"
          />
          <StatCard
            title="Usuários"
            value={15}
            icon={<Users size={24} />}
            linkText="Gerenciar usuários"
            href="/dashboard/usuarios"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Atividades Recentes</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">
                    <span className="font-medium">Usuário {item}</span> realizou uma ação no sistema
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Há {item} hora(s)</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/logs"
              className="flex items-center mt-4 text-sm text-blue-600 font-medium hover:underline"
            >
              Ver todos os logs
              <ArrowUpRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Próximas Entregas</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">
                    <span className="font-medium">Rota #{item + 100}</span> - {item} produto(s)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Agendado para hoje</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/entregas/rotas"
              className="flex items-center mt-4 text-sm text-blue-600 font-medium hover:underline"
            >
              Ver todas as rotas
              <ArrowUpRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 