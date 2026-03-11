import { valorPorExtensoReais } from "./valorPorExtenso";
import type { Client, Order } from "./mock-data";
import logoAppleUrl from "@/assets/simbolo apple.png";

export type TipoPagamento = "pix" | "pix_cartao" | "cartao" | "dois_cartoes";

export interface DadosContrato {
  comprador_nome: string;
  comprador_nacionalidade: string;
  comprador_estado_civil: string;
  comprador_profissao: string;
  comprador_cpf: string;
  comprador_email: string;
  comprador_endereco: string;
  comprador_bairro: string;
  comprador_cidade: string;
  comprador_estado: string;
  comprador_cep: string;
  comprador_whatsapp: string;
  produto_nome: string;
  produto_cor: string;
  produto_especificacao: string;
  /** Lista formatada de produtos (quando há mais de um). */
  lista_produtos: string;
  valor_total: string;
  valor_total_extenso: string;
  valor_entrada: string;
  parcelas: string;
  valor_parcela: string;
  parcelas_cartao_1: string;
  valor_parcela_cartao_1: string;
  parcelas_cartao_2: string;
  valor_parcela_cartao_2: string;
  data_contrato: string;
  data_hora_assinatura: string;
  ip_cliente: string;
  clausula_pagamento: string;
  produto_entrada_texto: string;
}

/** Detalhe de um cartão (preparado para N cartões no futuro). */
export interface PaymentDetail {
  parcelas: number;
  valor: number;
}

interface ClausulaVars {
  valor_total: string;
  valor_entrada: string;
  parcelas: string;
  valor_parcela: string;
  produto_entrada_texto: string;
  parcelas_cartao_1?: string;
  valor_parcela_cartao_1?: string;
  parcelas_cartao_2?: string;
  valor_parcela_cartao_2?: string;
}

function getClausulaPagamento(tipoPagamento: TipoPagamento, vars: ClausulaVars): string {
  if (tipoPagamento === "pix") {
    return `No ato da assinatura, via transferência bancária ou PIX, sendo o valor total de R\$${vars.valor_total} pago integralmente por meio de transferência PIX.`;
  }
  if (tipoPagamento === "pix_cartao") {
    return `Pagamento parcial do valor do produto, sendo R\$${vars.valor_entrada} por meio de transferência bancária via depósito bancário ou PIX, e o restante em ${vars.parcelas}x de R\$${vars.valor_parcela} no cartão de crédito no ato da assinatura do presente contrato${vars.produto_entrada_texto}.`;
  }
  if (tipoPagamento === "cartao") {
    return `No ato da assinatura, via cartão de crédito, sendo o valor parcelado em ${vars.parcelas}x de R\$${vars.valor_parcela} no ato da assinatura do presente contrato.`;
  }
  if (tipoPagamento === "dois_cartoes" && vars.parcelas_cartao_1 && vars.valor_parcela_cartao_1 && vars.parcelas_cartao_2 && vars.valor_parcela_cartao_2) {
    return `No ato da assinatura, via 2 cartões de crédito, sendo o primeiro em ${vars.parcelas_cartao_1}x de R\$${vars.valor_parcela_cartao_1} e o segundo em ${vars.parcelas_cartao_2}x de R\$${vars.valor_parcela_cartao_2} no ato da assinatura do presente contrato.`;
  }
  return "";
}

const TEMPLATE_CONTRATO = `
CONTRATO DE INTERMEDIAÇÃO DE PRODUTOS DA LINHA APPLE 2025

INTERMEDIADORA: Apple Meninas, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 45.462.401/0001-00, endereço eletrônico financeiroapplemeninas@gmail.com, endereço profissional R. Mal. Floriano Peixoto, 631 - Centro, Poá - SP, 08550-010, neste ato denominada INTERMEDIADORA.

COMPRADOR: {{comprador_nome}}, {{comprador_nacionalidade}}, {{comprador_estado_civil}}, {{comprador_profissao}}, inscrito no CPF nº {{comprador_cpf}}, endereço eletrônico {{comprador_email}}, residente e domiciliado em {{comprador_endereco}}, {{comprador_bairro}}, {{comprador_cidade}} - {{comprador_estado}}, {{comprador_cep}}, com a finalidade específica de compromisso de Compra e Venda de Produtos da Linha Apple.

PRELIMINARMENTE

Considerando que a INTERMEDIADORA atua no mercado brasileiro realizando a intermediação na aquisição de produtos eletrônicos da linha Apple através do processo de importação direta de fornecedores nacionais e dos Estados Unidos.

Considerando que o COMPRADOR fez contato com a INTERMEDIADORA através das redes sociais com a intenção de realizar a sua encomenda nos moldes descritos neste contrato.

Resolvem as partes celebrar o presente contrato, que será regido pelas cláusulas e condições abaixo expostas.

CLÁUSULA PRIMEIRA – DO OBJETO

O presente contrato tem por objeto a intermediação realizada pela INTERMEDIADORA na aquisição de produto novo, original e lacrado da linha Apple, junto a fornecedores nacionais e internacionais, em nome do COMPRADOR.

O(s) produto(s) objeto(s) deste contrato é(são):

{{lista_produtos}}

CLÁUSULA SEGUNDA – DO VALOR E PAGAMENTO

O valor total do produto é de R\${{valor_total}} ({{valor_total_extenso}}).

{{clausula_pagamento}}

CLÁUSULA TERCEIRA – DO PRAZO E ENTREGA

O prazo estimado para envio é de até 1 (um) dia útil após a confirmação do pagamento.

Em casos de força maior, como atrasos alfandegários, escassez de estoque global ou imprevistos logísticos, o prazo poderá ser prorrogado uma única vez por até 7 (sete) dias úteis, mediante comunicação prévia ao COMPRADOR.

Caso o produto não seja entregue dentro do prazo total de 14 (quatorze) dias úteis, o COMPRADOR poderá optar por:

Solicitar reembolso integral dos valores pagos; ou

Aguardar nova previsão de entrega.

O reembolso integral será realizado em até 7 (sete) dias úteis após a solicitação formal.

Em caso de extravio, o COMPRADOR poderá escolher entre reembolso integral ou reenvio de um novo produto.

CLÁUSULA QUARTA – DA GARANTIA E NOTA FISCAL

A INTERMEDIADORA garante que o produto entregue será novo, original, lacrado e com número de série válido pela Apple.

O produto possui garantia oficial da Apple de 1 (um) ano, contada a partir da ativação do dispositivo.

A INTERMEDIADORA compromete-se a auxiliar o COMPRADOR no acionamento da garantia junto à Apple.

A nota fiscal será emitida pelo fornecedor responsável pela venda, em nome do COMPRADOR, no ato da expedição do produto, sendo enviada ao WhatsApp {{comprador_whatsapp}} informado no mesmo dia do envio ou junto ao recebimento do produto.

CLÁUSULA QUINTA – DA RESCISÃO E DO REEMBOLSO

O presente contrato terá vigência até a conclusão dos serviços descritos na Cláusula Primeira.

Em caso de desistência antes da confirmação do pagamento, não haverá cobrança de qualquer valor.

Em caso de desistência após a confirmação do pagamento e início do processo de importação, o COMPRADOR poderá solicitar o cancelamento mediante retenção de 20% (vinte por cento) do valor pago, a título de custos operacionais e taxas administrativas, além das tarifas cobradas por operadoras de pagamento, se houver.

O reembolso será realizado em até 7 (sete) dias úteis, contados da solicitação formal.

Caso o produto já tenha sido enviado ou entregue, o cancelamento somente será aceito se o produto estiver em perfeitas condições, sem sinais de uso, com lacre original intacto, acessórios e embalagem completa, devendo ser devolvido no prazo máximo de 7 (sete) dias corridos a contar do recebimento.

CLÁUSULA SEXTA – DA CONFIDENCIALIDADE

O COMPRADOR compromete-se a manter sob sigilo os termos deste contrato, valores e condições comerciais.

O compartilhamento indevido de informações com intuito de prejudicar a imagem da INTERMEDIADORA ensejará multa de R$ 5.000,00 (cinco mil reais), além da indenização por eventuais prejuízos comprovados.

CLÁUSULA SÉTIMA – DA PROTEÇÃO DE DADOS (LGPD)

As partes comprometem-se a cumprir as disposições da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

CLÁUSULA OITAVA – DISPOSIÇÕES GERAIS

O presente contrato não estabelece vínculo de sociedade, emprego ou representação comercial entre as partes.

CLÁUSULA NONA – DO FORO

As partes elegem o Foro da Comarca de Barueri/SP para dirimir quaisquer conflitos oriundos deste contrato.

São Paulo, {{data_contrato}}.

COMPRADOR
{{comprador_nome}}

INTERMEDIADORA
Apple Meninas

Assinatura eletrônica realizada em {{data_hora_assinatura}}
IP do assinante: {{ip_cliente}}
`;

const ESTADO_CIVIL_LABEL: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  viúvo: "Viúvo(a)",
  separado: "Separado(a)",
};

function substituirVariaveis(template: string, dados: DadosContrato): string {
  let out = template;
  const entradas = Object.entries(dados) as [keyof DadosContrato, string][];
  for (const [key, value] of entradas) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return out;
}

/** Item de produto para o contrato (nome, categoria, preço). */
export interface ProdutoContratoItem {
  nome: string;
  categoria: string;
  preco: number;
}

export function buildDadosContrato(params: {
  nome: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  cpf: string;
  email: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  celular: string;
  /** Um produto (quando há apenas um). */
  produtoNome?: string;
  produtoCor?: string;
  produtoEspecificacao?: string;
  /** Vários produtos (quando há mais de um). As informações vão para o formulário/contrato. */
  produtos?: ProdutoContratoItem[];
  valorTotal: number;
  valorEntrada?: number;
  parcelas?: number;
  valorParcela?: number;
  parcelasCartao1?: number;
  valorParcelaCartao1?: number;
  parcelasCartao2?: number;
  valorParcelaCartao2?: number;
  tipoPagamento: TipoPagamento;
  produtoEntrada?: string;
}): DadosContrato {
  const endereco = [params.rua, params.numero, params.complemento].filter(Boolean).join(", ");
  const valorTotalStr = params.valorTotal.toFixed(2).replace(".", ",");
  const valorTotalExtenso = valorPorExtensoReais(params.valorTotal);
  const isDoisCartoes = params.tipoPagamento === "dois_cartoes";

  const valorEntradaStr = (params.valorEntrada ?? 0).toFixed(2).replace(".", ",");
  const parcelasStr = String(params.parcelas ?? 1);
  const valorParcelaStr = (params.valorParcela ?? 0).toFixed(2).replace(".", ",");

  const parcelasCartao1Str = params.parcelasCartao1 != null ? String(params.parcelasCartao1) : "";
  const valorParcelaCartao1Str = params.valorParcelaCartao1 != null ? params.valorParcelaCartao1.toFixed(2).replace(".", ",") : "";
  const parcelasCartao2Str = params.parcelasCartao2 != null ? String(params.parcelasCartao2) : "";
  const valorParcelaCartao2Str = params.valorParcelaCartao2 != null ? params.valorParcelaCartao2.toFixed(2).replace(".", ",") : "";

  const produtoEntradaTexto = params.produtoEntrada
    ? ` (além da entrega de um ${params.produtoEntrada} como parte do pagamento)`
    : "";

  const clausula_pagamento = getClausulaPagamento(params.tipoPagamento, {
    valor_total: valorTotalStr,
    valor_entrada: isDoisCartoes ? "" : valorEntradaStr,
    parcelas: isDoisCartoes ? "" : parcelasStr,
    valor_parcela: isDoisCartoes ? "" : valorParcelaStr,
    produto_entrada_texto: produtoEntradaTexto,
    parcelas_cartao_1: parcelasCartao1Str,
    valor_parcela_cartao_1: valorParcelaCartao1Str,
    parcelas_cartao_2: parcelasCartao2Str,
    valor_parcela_cartao_2: valorParcelaCartao2Str,
  });

  const agora = new Date();
  const dataContrato = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const dataHoraAssinatura = agora.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const produtos = params.produtos && params.produtos.length > 0
    ? params.produtos
    : params.produtoNome
      ? [{ nome: params.produtoNome, categoria: params.produtoEspecificacao ?? "Conforme especificação do fabricante", preco: params.valorTotal }]
      : [];
  const lista_produtos = produtos.length === 0
    ? ""
    : produtos
        .map(
          (p, i) =>
            `${i + 1}. ${p.nome} — Cor: Conforme catálogo — Especificação: ${p.categoria}`
        )
        .join("\n");
  const produto_nome =
    produtos.length === 0
      ? ""
      : produtos.length === 1
        ? produtos[0].nome
        : `Vários (${produtos.length} itens)`;
  const produto_cor = "Conforme catálogo";
  const produto_especificacao =
    produtos.length <= 1 && (params.produtoEspecificacao ?? produtos[0]?.categoria)
      ? (params.produtoEspecificacao ?? produtos[0]?.categoria ?? "Conforme especificação do fabricante")
      : produtos.length > 1
        ? "Vários"
        : "Conforme especificação do fabricante";

  return {
    comprador_nome: params.nome,
    comprador_nacionalidade: params.nacionalidade,
    comprador_estado_civil: ESTADO_CIVIL_LABEL[params.estadoCivil] ?? params.estadoCivil,
    comprador_profissao: params.profissao,
    comprador_cpf: params.cpf,
    comprador_email: params.email,
    comprador_endereco: endereco,
    comprador_bairro: params.bairro,
    comprador_cidade: params.cidade,
    comprador_estado: params.estado,
    comprador_cep: params.cep,
    comprador_whatsapp: params.celular,
    produto_nome,
    produto_cor,
    produto_especificacao,
    lista_produtos,
    valor_total: valorTotalStr,
    valor_total_extenso: valorTotalExtenso,
    valor_entrada: isDoisCartoes ? "" : valorEntradaStr,
    parcelas: isDoisCartoes ? "" : parcelasStr,
    valor_parcela: isDoisCartoes ? "" : valorParcelaStr,
    parcelas_cartao_1: parcelasCartao1Str,
    valor_parcela_cartao_1: valorParcelaCartao1Str,
    parcelas_cartao_2: parcelasCartao2Str,
    valor_parcela_cartao_2: valorParcelaCartao2Str,
    data_contrato: dataContrato,
    data_hora_assinatura: dataHoraAssinatura,
    ip_cliente: "", // preenchido no cliente via API ou deixado em branco
    clausula_pagamento,
    produto_entrada_texto: produtoEntradaTexto.trim(),
  };
}

/** Monta DadosContrato a partir de cliente e pedido já salvos (ex.: para gerar PDF no admin). */
export function buildDadosContratoFromOrder(client: Client, order: Order): DadosContrato {
  const tipoPagamento: TipoPagamento =
    order.forma_pagamento === "Pix total"
      ? "pix"
      : order.forma_pagamento === "Pix entrada + cartão de crédito"
        ? "pix_cartao"
        : order.forma_pagamento === "2 cartões de crédito"
          ? "dois_cartoes"
          : "cartao";

  const endereco = [client.rua, client.numero, client.complemento].filter(Boolean).join(", ");
  const valorTotalStr = order.valor.toFixed(2).replace(".", ",");
  const valorTotalExtenso = valorPorExtensoReais(order.valor);
  const isDoisCartoes = tipoPagamento === "dois_cartoes";

  const valorEntradaStr = (order.entrada_pix ?? 0).toFixed(2).replace(".", ",");
  const parcelasStr = String(order.parcelas ?? 1);
  const valorParcelaStr = (order.valor_parcela ?? 0).toFixed(2).replace(".", ",");
  const parcelasCartao1Str = order.parcelas != null ? String(order.parcelas) : "";
  const valorParcelaCartao1Str = order.valor_parcela != null ? order.valor_parcela.toFixed(2).replace(".", ",") : "";
  const parcelasCartao2Str = order.parcelas_cartao2 != null ? String(order.parcelas_cartao2) : "";
  const valorParcelaCartao2Str = order.valor_parcela_cartao2 != null ? order.valor_parcela_cartao2.toFixed(2).replace(".", ",") : "";

  const clausula_pagamento = getClausulaPagamento(tipoPagamento, {
    valor_total: valorTotalStr,
    valor_entrada: isDoisCartoes ? "" : valorEntradaStr,
    parcelas: isDoisCartoes ? "" : parcelasStr,
    valor_parcela: isDoisCartoes ? "" : valorParcelaStr,
    produto_entrada_texto: "",
    parcelas_cartao_1: parcelasCartao1Str,
    valor_parcela_cartao_1: valorParcelaCartao1Str,
    parcelas_cartao_2: parcelasCartao2Str,
    valor_parcela_cartao_2: valorParcelaCartao2Str,
  });

  let dataContrato = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  if (order.data) {
    try {
      const d = new Date(order.data + "T12:00:00");
      dataContrato = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    } catch {
      /* usa dataContrato já definida */
    }
  }
  const dataHoraAssinatura = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    comprador_nome: client.nome,
    comprador_nacionalidade: client.nacionalidade ?? "",
    comprador_estado_civil: ESTADO_CIVIL_LABEL[client.estado_civil] ?? client.estado_civil ?? "",
    comprador_profissao: client.profissao ?? "",
    comprador_cpf: client.cpf ?? "",
    comprador_email: client.email ?? "",
    comprador_endereco: endereco,
    comprador_bairro: client.bairro ?? "",
    comprador_cidade: client.cidade ?? "",
    comprador_estado: client.estado ?? "",
    comprador_cep: client.cep ?? "",
    comprador_whatsapp: client.celular ?? "",
    produto_nome: order.produtos && order.produtos.length > 0
      ? order.produtos.length === 1
        ? order.produtos[0].nome
        : `Vários (${order.produtos.length} itens)`
      : order.produto ?? "",
    produto_cor: "Conforme catálogo",
    produto_especificacao: order.produtos && order.produtos.length > 1 ? "Vários" : (order.categoria ?? "Conforme especificação do fabricante"),
    lista_produtos: order.produtos && order.produtos.length > 0
      ? order.produtos
          .map((p, i) => `${i + 1}. ${p.nome} — Cor: Conforme catálogo — Especificação: ${p.categoria}`)
          .join("\n")
      : order.produto
        ? `1. ${order.produto} — Cor: Conforme catálogo — Especificação: ${order.categoria ?? "Conforme especificação do fabricante"}`
        : "",
    valor_total: valorTotalStr,
    valor_total_extenso: valorTotalExtenso,
    valor_entrada: isDoisCartoes ? "" : valorEntradaStr,
    parcelas: isDoisCartoes ? "" : parcelasStr,
    valor_parcela: isDoisCartoes ? "" : valorParcelaStr,
    parcelas_cartao_1: parcelasCartao1Str,
    valor_parcela_cartao_1: valorParcelaCartao1Str,
    parcelas_cartao_2: parcelasCartao2Str,
    valor_parcela_cartao_2: valorParcelaCartao2Str,
    data_contrato: dataContrato,
    data_hora_assinatura: dataHoraAssinatura,
    ip_cliente: "",
    clausula_pagamento,
    produto_entrada_texto: "",
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const CONTRATO_STYLES = {
  font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  primary: "#db2777",
  primaryLight: "#fce7f3",
  text: "#1a1a1a",
  textMuted: "#64748b",
  border: "#e5e7eb",
  radius: "10px",
  bg: "#ffffff",
};

/** Converte o texto do contrato (já com variáveis substituídas) em HTML estilizado. */
function contractTextToStyledHtml(text: string): string {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let i = 0;

  const pushBlock = (tag: string, content: string, style: string) => {
    blocks.push(`<${tag} style="${style}">${content.trim() ? escapeHtml(content.trim()) : ""}</${tag}>`);
  };

  const pushRaw = (html: string) => {
    blocks.push(html);
  };

  const pStyle = `margin: 0 0 0.65em; font-size: 11pt; line-height: 1.5; color: ${CONTRATO_STYLES.text};`;
  const h2Style = `margin: 1.25em 0 0.5em; font-size: 12pt; font-weight: 600; color: ${CONTRATO_STYLES.primary}; border-left: 4px solid ${CONTRATO_STYLES.primary}; padding-left: 12px;`;
  const h1Style = `margin: 0 0 0.25em; font-size: 16pt; font-weight: 600; color: ${CONTRATO_STYLES.primary}; letter-spacing: -0.02em;`;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("CONTRATO DE INTERMEDIAÇÃO")) {
      pushBlock("h1", trimmed, h1Style);
      i++;
      continue;
    }

    if (trimmed.startsWith("INTERMEDIADORA:") || trimmed.startsWith("COMPRADOR:")) {
      let content = trimmed;
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("INTERMEDIADORA:") && !lines[i].trim().startsWith("COMPRADOR:") && !lines[i].trim().startsWith("PRELIMINARMENTE") && !lines[i].trim().startsWith("CLÁUSULA")) {
        content += " " + lines[i].trim();
        i++;
      }
      const bg = `background: ${CONTRATO_STYLES.primaryLight}; border-radius: ${CONTRATO_STYLES.radius}; padding: 12px 14px; margin-bottom: 12px; font-size: 10.5pt; line-height: 1.45; color: ${CONTRATO_STYLES.text};`;
      pushBlock("div", content, bg);
      continue;
    }

    if (trimmed === "PRELIMINARMENTE") {
      pushBlock("h2", trimmed, h2Style);
      i++;
      const parLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("CLÁUSULA")) {
        parLines.push(lines[i].trim());
        i++;
      }
      parLines.forEach((para) => pushBlock("p", para, pStyle));
      continue;
    }

    if (trimmed.startsWith("CLÁUSULA")) {
      pushBlock("h2", trimmed, h2Style);
      i++;
      const parLines: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        const nextTrim = next.trim();
        if (nextTrim.startsWith("CLÁUSULA") || nextTrim.startsWith("São Paulo,") || nextTrim === "COMPRADOR" || nextTrim === "INTERMEDIADORA") break;
        if (nextTrim) parLines.push(nextTrim);
        i++;
      }
      parLines.forEach((para) => pushBlock("p", para, pStyle));
      continue;
    }

    if (trimmed.startsWith("São Paulo,")) {
      pushBlock("p", trimmed, `margin-top: 1.5em; ${pStyle}`);
      i++;
      continue;
    }

    if (trimmed === "COMPRADOR" || trimmed === "INTERMEDIADORA") {
      const label = trimmed;
      i += 2; // consome linha do label e da linha do nome
      const sigStyle = `margin-top: 2em; padding-top: 1em; border-top: 1px solid ${CONTRATO_STYLES.border}; font-size: 10.5pt; color: ${CONTRATO_STYLES.textMuted};`;
      if (label === "COMPRADOR") {
        pushRaw(`<div style="${sigStyle}">${escapeHtml(label)}<br/><span style="color: ${CONTRATO_STYLES.text}; font-size: 11pt; min-height: 1.2em;"></span></div>`);
      } else {
        const rubricStyle = `font-family: 'Razurada', 'Momo Signature', cursive; font-size: 20pt; font-weight: 400; color: ${CONTRATO_STYLES.text};`;
        pushRaw(`<div style="${sigStyle}">${escapeHtml(label)}<br/><span style="${rubricStyle}">Apple Meninas</span><br/><span style="font-size: 9pt; color: ${CONTRATO_STYLES.textMuted};">CNPJ 45.462.401/0001-00</span></div>`);
      }
      continue;
    }

    if (trimmed.startsWith("Assinatura eletrônica") || trimmed.startsWith("IP do assinante")) {
      pushBlock("p", trimmed, `margin-top: 1em; font-size: 9pt; color: ${CONTRATO_STYLES.textMuted};`);
      i++;
      continue;
    }

    if (trimmed) {
      pushBlock("p", trimmed, pStyle);
    }
    i++;
  }

  return blocks.join("\n");
}

function buildContratoHtml(dados: DadosContrato, fullPage: boolean): string {
  const corpo = substituirVariaveis(TEMPLATE_CONTRATO, dados);
  const corpoStyled = contractTextToStyledHtml(corpo);

  const headerHtml = `
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid ${CONTRATO_STYLES.border};">
      <div style="width: 48px; height: 48px; border-radius: ${CONTRATO_STYLES.radius}; background: ${CONTRATO_STYLES.primary}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 8px; box-sizing: border-box;"><img src="${logoAppleUrl}" alt="Apple Meninas" style="width:100%;height:100%;object-fit:contain;filter:brightness(0) invert(1);" /></div>
      <div>
        <div style="font-size: 14pt; font-weight: 600; color: ${CONTRATO_STYLES.primary}; letter-spacing: -0.02em;">Contrato de Intermediação</div>
        <div style="font-size: 11pt; color: ${CONTRATO_STYLES.textMuted}; margin-top: 2px;">Apple Meninas · Produtos da Linha Apple 2025</div>
      </div>
    </div>
  `;

  const wrapperStyle = `font-family: ${CONTRATO_STYLES.font}; max-width: 210mm; margin: 0 auto; padding: 28px 28px 40px; color: ${CONTRATO_STYLES.text}; background: ${CONTRATO_STYLES.bg}; box-sizing: border-box; font-size: 11pt;`;

  const content = `<div style="${wrapperStyle}">${headerHtml}<div class="conteudo-contract">${corpoStyled}</div></div>`;

  if (fullPage) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Contrato - ${escapeHtml(dados.comprador_nome)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Momo+Signature&display=swap" rel="stylesheet" />
  <style>
    @font-face { font-family: 'Razurada'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/momosignature/v2/RrQJbop99C51b06IDAuFoM0yCpcvO8g.woff2) format('woff2'); }
    body { margin: 0; background: #f8fafc; font-family: Inter, sans-serif; }
    .conteudo-contract p { margin: 0 0 0.65em; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
    .conteudo-contract h2 { margin: 1.25em 0 0.5em; font-size: 12pt; font-weight: 600; color: #db2777; border-left: 4px solid #db2777; padding-left: 12px; }
    .conteudo-contract h1 { margin: 0 0 0.25em; font-size: 16pt; font-weight: 600; color: #db2777; }
    .conteudo-contract div[style*="background: #fce7f3"] { border-radius: 10px; }
  </style>
</head>
<body style="margin: 0; padding: 24px 0;">
${content}
</body>
</html>`;
  }

  return `<div style="${wrapperStyle}">${headerHtml}<div class="conteudo-contract">${corpoStyled}</div></div>`;
}

export function gerarHtmlContrato(dados: DadosContrato): string {
  return buildContratoHtml(dados, true);
}

/** Retorna apenas o conteúdo do contrato com estilos inline para gerar PDF (evita página em branco). */
export function getHtmlConteudoParaPdf(dados: DadosContrato): string {
  return buildContratoHtml(dados, false);
}

/** Abre o contrato em nova aba para o usuário imprimir ou salvar como PDF. */
export function abrirContratoEmNovaAba(html: string): void {
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Permita pop-ups para abrir o contrato.");
  }
  w.document.write(html);
  w.document.close();
}
