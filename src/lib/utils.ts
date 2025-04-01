/**
 * Utilitários gerais para a aplicação
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS com suporte a condicionais e merge Tailwind
 * @param inputs - Classes a serem combinadas
 * @returns String com classes CSS combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para moeda brasileira (Real)
 * @param valor - Valor a ser formatado
 * @returns String formatada em moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param data - Data a ser formatada (string ISO ou objeto Date)
 * @returns String formatada em data brasileira
 */
export function formatarData(data: string | Date): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  return dataObj.toLocaleDateString('pt-BR');
}

/**
 * Retorna uma string aleatória de tamanho específico
 * @param length - Tamanho da string (padrão: 8)
 * @returns String aleatória
 */
export function gerarStringAleatoria(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Retorna um número aleatório entre min e max (inclusive)
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Número aleatório
 */
export function gerarNumeroAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitaliza a primeira letra de uma string
 * @param texto - Texto a ser capitalizado
 * @returns String com a primeira letra maiúscula
 */
export function capitalizarPrimeiraLetra(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Trunca um texto em um determinado número de caracteres
 * @param texto - Texto a ser truncado
 * @param tamanho - Tamanho máximo (padrão: 50)
 * @param sufixo - Sufixo a ser adicionado no fim (padrão: '...')
 * @returns String truncada
 */
export function truncarTexto(texto: string, tamanho: number = 50, sufixo: string = '...'): string {
  if (!texto) return '';
  if (texto.length <= tamanho) return texto;
  return texto.slice(0, tamanho) + sufixo;
} 