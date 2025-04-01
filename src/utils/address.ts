/**
 * Utilitários para formatação de endereços
 */

/**
 * Formata um endereço completo para navegação GPS
 * Garante que o número fique logo após o logradouro para funcionamento correto do GPS
 */
export function formatAddressForNavigation(endereco: { 
  logradouro?: string; 
  numero?: string;
  bairro?: string;
  cidade: string;
  cep: string;
  complemento?: string;
  endereco?: string; // Campo do formato antigo
}) {
  // Se temos logradouro e número no novo formato
  if (endereco.logradouro && endereco.numero) {
    const enderecoBase = `${endereco.logradouro}, ${endereco.numero}`;
    const bairro = endereco.bairro ? `, ${endereco.bairro}` : '';
    const cidade = endereco.cidade ? `, ${endereco.cidade}` : '';
    const cep = endereco.cep ? `, ${endereco.cep}` : '';
    
    return `${enderecoBase}${bairro}${cidade}${cep}`;
  }
  
  // Formato antigo (backward compatibility)
  // Verifica se é o endereço antigo completo que já contém o número
  if (endereco.endereco) {
    return `${endereco.endereco}, ${endereco.cidade}, ${endereco.cep}`;
  }
  
  // Caso extremo onde não temos nenhum formato completo
  return `${endereco.cidade}, ${endereco.cep}`;
}

/**
 * Formata o endereço para exibição na interface
 */
export function formatAddressForDisplay(endereco: {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  cep: string;
  complemento?: string;
  endereco?: string; // Campo do formato antigo
}) {
  // Se temos logradouro e número no novo formato
  if (endereco.logradouro && endereco.numero) {
    const enderecoBase = `${endereco.logradouro}, ${endereco.numero}`;
    const bairro = endereco.bairro ? ` - ${endereco.bairro}` : '';
    
    return {
      linhaEndereco: `${enderecoBase}${bairro}`,
      linhaCidade: `${endereco.cidade}, ${endereco.cep}`,
      complemento: endereco.complemento
    };
  }
  
  // Formato antigo (backward compatibility)
  return {
    linhaEndereco: endereco.endereco || '',
    linhaCidade: `${endereco.cidade || ''}, ${endereco.cep || ''}`,
    complemento: endereco.complemento
  };
} 