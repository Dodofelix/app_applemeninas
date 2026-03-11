/** Status do pedido (sinalização por cliente): aguardando produto, aguardando pagamento, pago, pedido concluído. */
export type StatusPedidoCliente =
  | "aguardando_produto"
  | "aguardando_pagamento"
  | "pago"
  | "pedido_concluido";

/** Status da nota fiscal: emitindo, emitida, enviada. */
export type StatusNotaFiscal = "emitindo" | "emitida" | "enviada";

export interface Client {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  nacionalidade: string;
  estado_civil: string;
  profissao: string;
  celular: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  autoriza_instagram: boolean;
  data_cadastro: string;
  /** Status do pedido (sinalização manual do administrador). */
  status_pedido?: StatusPedidoCliente;
  /** Status da nota fiscal: emitindo, emitida, enviada. */
  nota_fiscal?: StatusNotaFiscal;
}

export interface Product {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
}

export type OrderStatus = 'Contrato pendente' | 'Contrato gerado' | 'Aguardando assinatura' | 'Contrato assinado';

/** Status do pedido (sinalização manual do administrador). */
export type StatusPedido = 'pendente' | 'pago' | 'concluido';

/** Item de produto no pedido (quando há mais de um produto). */
export interface OrderProductItem {
  nome: string;
  categoria: string;
  preco: number;
}

export interface Order {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  produto: string;
  categoria: string;
  valor: number;
  /** Lista detalhada de produtos (quando o pedido tem mais de um item). */
  produtos?: OrderProductItem[];
  forma_pagamento: string;
  entrada_pix?: number;
  parcelas?: number;
  valor_parcela?: number;
  parcelas_cartao2?: number;
  valor_parcela_cartao2?: number;
  status: OrderStatus;
  /** Status do pedido (sinalização manual: pendente, pago, concluído). */
  status_pedido?: StatusPedido;
  data: string;
}

export const CATEGORIES = [
  'iPhone', 'iPad', 'MacBook', 'Apple Watch', 'iMac', 'Mac Mini', 'Acessórios'
] as const;

export const mockProducts: Product[] = [
  { id: '1', nome: 'iPhone 15 Pro Max 256GB', categoria: 'iPhone', preco: 9499 },
  { id: '2', nome: 'iPhone 15 128GB', categoria: 'iPhone', preco: 5999 },
  { id: '3', nome: 'MacBook Air M3 256GB', categoria: 'MacBook', preco: 12999 },
  { id: '4', nome: 'iPad Air M2 128GB', categoria: 'iPad', preco: 6499 },
  { id: '5', nome: 'Apple Watch Series 9 45mm', categoria: 'Apple Watch', preco: 3999 },
  { id: '6', nome: 'iMac M3 24" 256GB', categoria: 'iMac', preco: 15499 },
  { id: '7', nome: 'AirPods Pro 2ª geração', categoria: 'Acessórios', preco: 1899 },
  { id: '8', nome: 'Mac Mini M2 256GB', categoria: 'Mac Mini', preco: 5499 },
];

export const mockClients: Client[] = [
  {
    id: '1', nome: 'Maria Silva', cpf: '123.456.789-00', rg: '12.345.678-9',
    data_nascimento: '1990-05-15', nacionalidade: 'Brasileira', estado_civil: 'solteiro',
    profissao: 'Designer', celular: '(11) 99999-1234', email: 'maria@email.com',
    cep: '01001-000', rua: 'Praça da Sé', numero: '100', bairro: 'Sé',
    cidade: 'São Paulo', estado: 'SP', autoriza_instagram: true, data_cadastro: '2024-03-01',
  },
  {
    id: '2', nome: 'Ana Oliveira', cpf: '987.654.321-00', rg: '98.765.432-1',
    data_nascimento: '1985-11-20', nacionalidade: 'Brasileira', estado_civil: 'casado',
    profissao: 'Advogada', celular: '(21) 98888-5678', email: 'ana@email.com',
    cep: '20040-020', rua: 'Av. Rio Branco', numero: '200', bairro: 'Centro',
    cidade: 'Rio de Janeiro', estado: 'RJ', autoriza_instagram: false, data_cadastro: '2024-03-05',
  },
  {
    id: '3', nome: 'Juliana Costa', cpf: '456.789.123-00', rg: '45.678.912-3',
    data_nascimento: '1995-08-10', nacionalidade: 'Brasileira', estado_civil: 'solteiro',
    profissao: 'Médica', celular: '(31) 97777-9012', email: 'juliana@email.com',
    cep: '30130-000', rua: 'Av. Afonso Pena', numero: '300', bairro: 'Centro',
    cidade: 'Belo Horizonte', estado: 'MG', autoriza_instagram: true, data_cadastro: '2024-03-10',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'PED-001', cliente_id: '1', cliente_nome: 'Maria Silva',
    produto: 'iPhone 15 Pro Max 256GB', categoria: 'iPhone', valor: 9499,
    forma_pagamento: 'Pix total', status: 'Contrato assinado', data: '2024-03-01',
  },
  {
    id: 'PED-002', cliente_id: '2', cliente_nome: 'Ana Oliveira',
    produto: 'MacBook Air M3 256GB', categoria: 'MacBook', valor: 12999,
    forma_pagamento: 'Pix entrada + cartão', entrada_pix: 5000, parcelas: 6, valor_parcela: 1333.17,
    status: 'Aguardando assinatura', data: '2024-03-05',
  },
  {
    id: 'PED-003', cliente_id: '3', cliente_nome: 'Juliana Costa',
    produto: 'iPad Air M2 128GB', categoria: 'iPad', valor: 6499,
    forma_pagamento: 'Cartão de crédito total', parcelas: 12, valor_parcela: 541.58,
    status: 'Contrato pendente', data: '2024-03-10',
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}
