import type { Client, Order } from "./mock-data";
import { formatCurrency } from "./mock-data";

/** Formulário de NF padrão (até R$ 6 mil). */
export function buildFormularioNF(c: Client): string {
  return `📑FORMULÁRIO DE NOTA FISCAL 📑

NOME COMPLETO
${c.nome ?? ""}

CPF:
${c.cpf ?? ""}

DATA DE NASCIMENTO:
${c.data_nascimento ?? ""}

CEP:
${c.cep ?? ""}

ENDEREÇO:
${c.rua ?? ""}

NÚMERO DA CASA
${c.numero ?? ""}

BAIRRO:
${c.bairro ?? ""}

MODELO E GB


COR:


SERIAL:


VALOR:
`;
}

/** Formulário de NF para pedidos acima de R$ 6 mil (só dados do cliente; demais em branco). */
export function buildFormularioNFAcima6k(c: Client): string {
  const cidadeEstado = [c.cidade, c.estado].filter(Boolean).join(" / ");
  return `*Nome completo: 
${c.nome ?? ""}

*CPF: 
${c.cpf ?? ""}

*CEP: 
${c.cep ?? ""}

*Endereço: 
${c.rua ?? ""}

*cidade/ estado: 
${cidadeEstado}

*Telefone:
${c.celular ?? ""}

*email: 
${c.email ?? ""}


*Modelo e GB: 


*Cor: 


*S/N ou IMEI :

SERIAL: 

MEI: 

Valor:

*Forma de pagamento: 
`;
}

/** Formulário de NF acima de R$ 6 mil preenchido com dados do cliente e do pedido. */
export function buildFormularioNFAcima6kComPedido(c: Client, order: Order): string {
  const cidadeEstado = [c.cidade, c.estado].filter(Boolean).join(" / ");
  const modeloGB = order.produtos?.length
    ? order.produtos.map((p) => p.nome).join(" / ")
    : order.produto;
  return `*Nome completo: 
${c.nome ?? ""}

*CPF: 
${c.cpf ?? ""}

*CEP: 
${c.cep ?? ""}

*Endereço: 
${c.rua ?? ""}

*cidade/ estado: 
${cidadeEstado}

*Telefone:
${c.celular ?? ""}

*email: 
${c.email ?? ""}


*Modelo e GB: 
${modeloGB}

*Cor: 


*S/N ou IMEI :

SERIAL: 

MEI: 

Valor:
${formatCurrency(order.valor)}

*Forma de pagamento: 
${order.forma_pagamento ?? ""}
`;
}
