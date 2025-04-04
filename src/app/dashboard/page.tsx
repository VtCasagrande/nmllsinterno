'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  ChevronRight,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';

// Função de log para debug
const logger = {
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] 📊 DASHBOARD: ${message}`, data);
    } else {
      console.log(`[${timestamp}] 📊 DASHBOARD: ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ DASHBOARD ERROR: ${message}`, error);
  }
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    logger.debug('Inicializando dashboard');
    
    setTimeout(() => {
      setIsLoading(false);
      logger.debug('Dashboard carregado com sucesso');
    }, 500);
  }, []);

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel de Controle</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Vendas do Mês</p>
              <h3 className="text-2xl font-bold mt-1">R$ 24.780,00</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <span>+12% </span>
                <span className="ml-1 text-gray-500">vs. mês anterior</span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Pedidos */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Pedidos Novos</p>
              <h3 className="text-2xl font-bold mt-1">132</h3>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <span>-3% </span>
                <span className="ml-1 text-gray-500">vs. mês anterior</span>
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </div>

        {/* Entregas */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Entregas Pendentes</p>
              <h3 className="text-2xl font-bold mt-1">28</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <span>+4% </span>
                <span className="ml-1 text-gray-500">vs. semana anterior</span>
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Truck className="h-6 w-6 text-orange-700" />
            </div>
          </div>
        </div>

        {/* Novos Clientes */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Novos Clientes</p>
              <h3 className="text-2xl font-bold mt-1">48</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <span>+8% </span>
                <span className="ml-1 text-gray-500">vs. mês anterior</span>
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Atividades Recentes e Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico simplificado */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Visão Geral de Vendas</h3>
            <div className="flex items-center text-sm text-blue-600">
              <button className="flex items-center">
                Ver mais <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center h-64 border-b pb-4">
            <div className="flex items-end space-x-2 h-full w-full px-4">
              {[60, 40, 75, 90, 30, 80, 95, 50, 65, 72, 85].map((height, index) => (
                <div 
                  key={index}
                  className="bg-blue-500 rounded-t w-full"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="flex justify-between pt-4 text-sm text-gray-500">
            <span>Janeiro</span>
            <span>Fevereiro</span>
            <span>Março</span>
            <span>Abril</span>
            <span>Maio</span>
            <span>Junho</span>
          </div>
        </div>

        {/* Pedidos Recentes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Pedidos Recentes</h3>
              <div className="flex items-center text-sm text-blue-600">
                <button className="flex items-center">
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map(index => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-2 rounded">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Pedido #{Math.floor(Math.random() * 10000)}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Cliente: João Silva
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">R$ {(Math.random() * 1000).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Hoje</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 