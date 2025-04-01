'use client';

import { FileText, ExternalLink } from 'lucide-react';

export default function DocumentacaoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <FileText className="h-8 w-8 text-blue-500 mr-3" />
        <h1 className="text-2xl font-bold">Documentação</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="text-gray-600 mb-6">
          Bem-vindo à documentação do sistema Nmalls. Aqui você encontrará guias, tutoriais e
          referências para utilizar todas as funcionalidades do sistema.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium mb-2">Guias de Início Rápido</h2>
            <p className="text-gray-600 mb-4">Aprenda os conceitos básicos para começar a usar o sistema.</p>
            <ul className="space-y-2">
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Primeiros passos com Nmalls</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Como configurar seu perfil</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Guia de navegação</a>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium mb-2">Módulos do Sistema</h2>
            <p className="text-gray-600 mb-4">Documentação detalhada de cada módulo.</p>
            <ul className="space-y-2">
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Gerenciamento de Entregas</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Devoluções e Trocas</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Lembretes de Medicamentos</a>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium mb-2">Integrações</h2>
            <p className="text-gray-600 mb-4">Como integrar o Nmalls com outros sistemas.</p>
            <ul className="space-y-2">
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Configurando Webhooks</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">API Reference</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Exemplos de Integração</a>
              </li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-medium mb-2">FAQ</h2>
            <p className="text-gray-600 mb-4">Respostas para perguntas frequentes.</p>
            <ul className="space-y-2">
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Problemas Comuns</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Melhores Práticas</a>
              </li>
              <li className="flex items-center text-blue-600 hover:underline">
                <ExternalLink size={16} className="mr-2" />
                <a href="#">Solução de Problemas</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2">Precisa de ajuda adicional?</h3>
          <p>
            Se você não encontrou o que procura, considere <a href="/dashboard/ajuda/bugs" className="text-blue-600 hover:underline">reportar um problema</a> ou entrar em contato com nossa equipe de suporte.
          </p>
        </div>
      </div>
    </div>
  );
} 