import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrders, useUpdateOrderStatusPedido, useDeleteOrder } from "@/hooks/useFirestore";
import { getClientById } from "@/lib/firestore";
import { buildFormularioNF, buildFormularioNFAcima6kComPedido } from "@/lib/formularioNF";
import { formatCurrency, formatDate } from "@/lib/mock-data";
import type { Order } from "@/lib/mock-data";
import type { StatusPedido } from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Send, Download, Eye, Loader2, Trash2, Search, Copy, User } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CHAVE_PIX_FIXA = "financeiroapplemeninas@gmail.com";

function getFirstName(nome: string): string {
  const s = (nome || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s.split(" ")[0] || s;
}

function paymentSummary(formaPagamento: string): string {
  const fp = (formaPagamento || "").toLowerCase();
  const hasPix = fp.includes("pix");
  const hasCartao = fp.includes("cart");
  const isDois = fp.includes("2") && hasCartao;

  if (isDois) return "2 Cartões";
  if (hasPix && hasCartao) return "Pix+Cartão";
  if (hasPix) return "Pix";
  if (hasCartao) return "Cartão";
  return formaPagamento || "—";
}

function buildResumoPagamento(order: Order): string {
  const nomeProduto = order.produtos?.length
    ? order.produtos.map((p) => p.nome).join("\n")
    : order.produto;

  const linhasPagamento: string[] = [order.forma_pagamento];
  if (order.entrada_pix != null && order.entrada_pix > 0) {
    linhasPagamento.push(`Entrada (Pix): ${formatCurrency(order.entrada_pix)}`);
  }
  const temDoisCartoes =
    (order.parcelas != null && order.valor_parcela != null) &&
    (order.parcelas_cartao2 != null && order.valor_parcela_cartao2 != null);
  if (order.parcelas != null && order.valor_parcela != null) {
    linhasPagamento.push(
      temDoisCartoes
        ? `Cartão 1: ${order.parcelas}x de ${formatCurrency(order.valor_parcela)}`
        : `Cartão: ${order.parcelas}x de ${formatCurrency(order.valor_parcela)}`
    );
  }
  if (order.parcelas_cartao2 != null && order.valor_parcela_cartao2 != null) {
    linhasPagamento.push(`Cartão 2: ${order.parcelas_cartao2}x de ${formatCurrency(order.valor_parcela_cartao2)}`);
  }
  const detalhePagamento = linhasPagamento.join("\n");

  const temPix =
    (order.entrada_pix != null && order.entrada_pix > 0) ||
    /pix/i.test(order.forma_pagamento);
  const rodapePix = temPix
    ? `

Chave pix:
${CHAVE_PIX_FIXA}

Link para pagamento:
`
    : "";

  return `Encomenda ${order.cliente_nome}
Lacrado | 1 ano de Garantia Apple

Nome do produto:
${nomeProduto}

Cor: Conforme catálogo

Valor total: ${formatCurrency(order.valor)}

Forma de pagamento:
${detalhePagamento}${rodapePix}`;
}

const STATUS_PEDIDO_OPTIONS: { value: StatusPedido; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "concluido", label: "Concluído" },
];

const STATUS_PEDIDO_COR: Record<StatusPedido, string> = {
  pendente: "bg-amber-500",
  pago: "bg-blue-500",
  concluido: "bg-emerald-500",
};

function StatusPedidoDot({ status }: { status: StatusPedido }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-background shadow-sm ${STATUS_PEDIDO_COR[status]}`}
      aria-hidden
    />
  );
}

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [loadingPdfForId, setLoadingPdfForId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const updateStatusPedido = useUpdateOrderStatusPedido();
  const deleteOrder = useDeleteOrder();
  const [nomeCompletoOpen, setNomeCompletoOpen] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");

  const normalized = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
  const filteredOrders = !searchQuery.trim()
    ? orders
    : orders.filter((order) => {
        const q = normalized(searchQuery);
        const text = [
          order.cliente_nome,
          order.produto,
          order.categoria,
          formatCurrency(order.valor),
          order.forma_pagamento,
          order.status,
          order.status_pedido ?? "pendente",
          formatDate(order.data),
        ].join(" ");
        return normalized(text).includes(q);
      });

  const statusPedidoOf = (o: Order): StatusPedido => (o.status_pedido ?? "pendente") as StatusPedido;
  const pendentes = filteredOrders.filter((o) => statusPedidoOf(o) === "pendente");
  const pagos = filteredOrders.filter((o) => statusPedidoOf(o) === "pago");
  const concluidos = filteredOrders.filter((o) => statusPedidoOf(o) === "concluido");

  const handleVerPdf = async (order: Order) => {
    setLoadingPdfForId(order.id);
    try {
      const client = await getClientById(order.cliente_id);
      if (!client) {
        toast.error("Cliente não encontrado para este pedido.");
        return;
      }
      const { buildDadosContratoFromOrder, gerarHtmlContrato, abrirContratoEmNovaAba } = await import("@/lib/contrato");
      const dados = buildDadosContratoFromOrder(client, order);
      const html = gerarHtmlContrato(dados);
      abrirContratoEmNovaAba(html);
      toast.success("Contrato aberto em nova aba.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir contrato.");
    } finally {
      setLoadingPdfForId(null);
    }
  };

  const handleOpenNomeCompleto = (nome: string) => {
    setNomeCompleto(nome);
    setNomeCompletoOpen(true);
  };

  const handleStatusPedidoChange = (orderId: string, value: StatusPedido) => {
    updateStatusPedido.mutate(
      { orderId, status_pedido: value },
      { onSuccess: () => toast.success("Status do pedido atualizado."), onError: () => toast.error("Erro ao atualizar status.") }
    );
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder.mutateAsync(orderToDelete.id);
      toast.success("Pedido excluído.");
      setOrderToDelete(null);
    } catch {
      toast.error("Erro ao excluir pedido.");
    }
  };

  const handleCopiarResumo = (order: Order) => {
    const texto = buildResumoPagamento(order);
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Resumo de pagamento copiado!"),
      () => toast.error("Erro ao copiar.")
    );
  };

  const handleCopiarFormularioNF = async (order: Order) => {
    try {
      const client = await getClientById(order.cliente_id);
      if (!client) {
        toast.error("Cliente não encontrado para este pedido.");
        return;
      }
      const texto =
        order.valor > 6000
          ? buildFormularioNFAcima6kComPedido(client, order)
          : buildFormularioNF(client);
      await navigator.clipboard.writeText(texto);
      toast.success(order.valor > 6000 ? "Formulário NF (> 6 mil) copiado!" : "Formulário NF copiado!");
    } catch {
      toast.error("Erro ao copiar.");
    }
  };

  const handleBaixarPdf = async (order: Order) => {
    setLoadingPdfForId(order.id);
    try {
      const client = await getClientById(order.cliente_id);
      if (!client) {
        toast.error("Cliente não encontrado para este pedido.");
        return;
      }
      const modContrato = await import("@/lib/contrato");
      const { gerarPdfDeHtml } = await import("@/lib/gerarPdf");
      const dados = modContrato.buildDadosContratoFromOrder(client, order);
      const html = modContrato.getHtmlConteudoParaPdf(dados);
      const nome = order.cliente_nome.replace(/\s+/g, "_");
      const nomeArquivo = `Contrato_${nome}_${order.id}.pdf`;
      await gerarPdfDeHtml(html, nomeArquivo);
      toast.success("PDF baixado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar PDF.");
    } finally {
      setLoadingPdfForId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie todos os pedidos</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por cliente, produto, valor, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Lista de pedidos</CardTitle>
          <p className="text-sm text-muted-foreground">Filtre e gerencie os pedidos</p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <Tabs defaultValue="pendente">
            <TabsList className="mx-4 mt-4 w-[calc(100%-2rem)]">
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="pago">Pagos</TabsTrigger>
              <TabsTrigger value="concluido">Concluídos</TabsTrigger>
            </TabsList>

            {/* Desktop: tabela */}
            <TabsContent value="pendente" className="mt-0">
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Produto</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Pagamento</TableHead>
                      <TableHead className="text-xs">Status do pedido</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum pedido ainda.
                        </TableCell>
                      </TableRow>
                    ) : pendentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchQuery.trim()
                            ? `Nenhum pedido encontrado para "${searchQuery}".`
                            : "Nenhum pedido pendente."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendentes.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm py-2 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Ver nome completo"
                                onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-2 px-3">{order.produto}</TableCell>
                          <TableCell className="text-sm py-2 px-3">{formatCurrency(order.valor)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{paymentSummary(order.forma_pagamento)}</TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={order.status_pedido ?? "pendente"}
                              onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                              disabled={updateStatusPedido.isPending}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                    <StatusPedidoDot status={opt.value} />
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{formatDate(order.data)}</TableCell>
                          <TableCell className="p-2">
                            <div className="flex flex-nowrap gap-1 items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Ver contrato (PDF)"
                                onClick={() => handleVerPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Baixar PDF"
                                onClick={() => handleBaixarPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button size="icon" variant="ghost" title="Copiar resumo de pagamento" onClick={() => handleCopiarResumo(order)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir pedido"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setOrderToDelete(order)}
                                disabled={deleteOrder.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {order.status === "Contrato gerado" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toast.info("Enviar para assinatura (em breve)")}
                                  title="Enviar assinatura"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="pago" className="mt-0">
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Produto</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Pagamento</TableHead>
                      <TableHead className="text-xs">Status do pedido</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum pedido ainda.
                        </TableCell>
                      </TableRow>
                    ) : pagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchQuery.trim()
                            ? `Nenhum pedido encontrado para "${searchQuery}".`
                            : "Nenhum pedido pago."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagos.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm py-2 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Ver nome completo"
                                onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-2 px-3">{order.produto}</TableCell>
                          <TableCell className="text-sm py-2 px-3">{formatCurrency(order.valor)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{paymentSummary(order.forma_pagamento)}</TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={order.status_pedido ?? "pendente"}
                              onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                              disabled={updateStatusPedido.isPending}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                    <StatusPedidoDot status={opt.value} />
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{formatDate(order.data)}</TableCell>
                          <TableCell className="p-2">
                            <div className="flex flex-nowrap gap-1 items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Ver contrato (PDF)"
                                onClick={() => handleVerPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Baixar PDF"
                                onClick={() => handleBaixarPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button size="icon" variant="ghost" title="Copiar resumo de pagamento" onClick={() => handleCopiarResumo(order)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir pedido"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setOrderToDelete(order)}
                                disabled={deleteOrder.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {order.status === "Contrato gerado" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toast.info("Enviar para assinatura (em breve)")}
                                  title="Enviar assinatura"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="concluido" className="mt-0">
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Produto</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Pagamento</TableHead>
                      <TableHead className="text-xs">Status do pedido</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum pedido ainda.
                        </TableCell>
                      </TableRow>
                    ) : concluidos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          {searchQuery.trim()
                            ? `Nenhum pedido encontrado para "${searchQuery}".`
                            : "Nenhum pedido concluído."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      concluidos.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm py-2 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Ver nome completo"
                                onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                              >
                                <User className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-2 px-3">{order.produto}</TableCell>
                          <TableCell className="text-sm py-2 px-3">{formatCurrency(order.valor)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{paymentSummary(order.forma_pagamento)}</TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={order.status_pedido ?? "pendente"}
                              onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                              disabled={updateStatusPedido.isPending}
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                    <StatusPedidoDot status={opt.value} />
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-2 px-3">{formatDate(order.data)}</TableCell>
                          <TableCell className="p-2">
                            <div className="flex flex-nowrap gap-1 items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Ver contrato (PDF)"
                                onClick={() => handleVerPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Baixar PDF"
                                onClick={() => handleBaixarPdf(order)}
                                disabled={loadingPdfForId === order.id}
                              >
                                {loadingPdfForId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button size="icon" variant="ghost" title="Copiar resumo de pagamento" onClick={() => handleCopiarResumo(order)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir pedido"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setOrderToDelete(order)}
                                disabled={deleteOrder.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {order.status === "Contrato gerado" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toast.info("Enviar para assinatura (em breve)")}
                                  title="Enviar assinatura"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Mobile: cards */}
            <TabsContent value="pendente" className="mt-0">
              <div className="md:hidden space-y-4 p-4 pt-0">
                {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
                {!isLoading && orders.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido ainda.</p>}
                {!isLoading && pendentes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery.trim()
                      ? `Nenhum pedido encontrado para "${searchQuery}".`
                      : "Nenhum pedido pendente."}
                  </p>
                )}
                {!isLoading &&
                  pendentes.length > 0 &&
                  pendentes.map((order) => (
                    <Card key={order.id} className="border bg-card p-4 shadow-sm">
                      <div className="space-y-3 text-sm">
                        <p>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground shrink-0">Cliente:</span>
                            <span className="font-medium truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              title="Ver nome completo"
                              onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Produto:</span> {order.produto}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Valor:</span> {formatCurrency(order.valor)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Pagamento:</span> {paymentSummary(order.forma_pagamento)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Data:</span> {formatDate(order.data)}
                        </p>
                        <div>
                          <span className="text-muted-foreground block mb-1.5">Status do pedido</span>
                          <Select
                            value={order.status_pedido ?? "pendente"}
                            onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                            disabled={updateStatusPedido.isPending}
                          >
                            <SelectTrigger className="w-full h-9 text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                  <StatusPedidoDot status={opt.value} />
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => handleVerPdf(order)} disabled={loadingPdfForId === order.id}>
                            {loadingPdfForId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            <span className="ml-1.5">Ver PDF</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBaixarPdf(order)} disabled={loadingPdfForId === order.id}>
                            <Download className="h-4 w-4" />
                            <span className="ml-1.5">Baixar</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopiarResumo(order)}>
                            <Copy className="h-4 w-4" />
                            <span className="ml-1.5">Copiar resumo</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setOrderToDelete(order)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1.5">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="pago" className="mt-0">
              <div className="md:hidden space-y-4 p-4 pt-0">
                {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
                {!isLoading && orders.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido ainda.</p>}
                {!isLoading && pagos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery.trim()
                      ? `Nenhum pedido encontrado para "${searchQuery}".`
                      : "Nenhum pedido pago."}
                  </p>
                )}
                {!isLoading &&
                  pagos.length > 0 &&
                  pagos.map((order) => (
                    <Card key={order.id} className="border bg-card p-4 shadow-sm">
                      <div className="space-y-3 text-sm">
                        <p>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground shrink-0">Cliente:</span>
                            <span className="font-medium truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              title="Ver nome completo"
                              onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Produto:</span> {order.produto}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Valor:</span> {formatCurrency(order.valor)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Pagamento:</span> {paymentSummary(order.forma_pagamento)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Data:</span> {formatDate(order.data)}
                        </p>
                        <div>
                          <span className="text-muted-foreground block mb-1.5">Status do pedido</span>
                          <Select
                            value={order.status_pedido ?? "pendente"}
                            onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                            disabled={updateStatusPedido.isPending}
                          >
                            <SelectTrigger className="w-full h-9 text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                  <StatusPedidoDot status={opt.value} />
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => handleVerPdf(order)} disabled={loadingPdfForId === order.id}>
                            {loadingPdfForId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            <span className="ml-1.5">Ver PDF</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBaixarPdf(order)} disabled={loadingPdfForId === order.id}>
                            <Download className="h-4 w-4" />
                            <span className="ml-1.5">Baixar</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopiarResumo(order)}>
                            <Copy className="h-4 w-4" />
                            <span className="ml-1.5">Copiar resumo</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setOrderToDelete(order)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1.5">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="concluido" className="mt-0">
              <div className="md:hidden space-y-4 p-4 pt-0">
                {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
                {!isLoading && orders.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido ainda.</p>}
                {!isLoading && concluidos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery.trim()
                      ? `Nenhum pedido encontrado para "${searchQuery}".`
                      : "Nenhum pedido concluído."}
                  </p>
                )}
                {!isLoading &&
                  concluidos.length > 0 &&
                  concluidos.map((order) => (
                    <Card key={order.id} className="border bg-card p-4 shadow-sm">
                      <div className="space-y-3 text-sm">
                        <p>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground shrink-0">Cliente:</span>
                            <span className="font-medium truncate">{getFirstName(order.cliente_nome) || order.cliente_nome}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              title="Ver nome completo"
                              onClick={() => handleOpenNomeCompleto(order.cliente_nome)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Produto:</span> {order.produto}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Valor:</span> {formatCurrency(order.valor)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Pagamento:</span> {paymentSummary(order.forma_pagamento)}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Data:</span> {formatDate(order.data)}
                        </p>
                        <div>
                          <span className="text-muted-foreground block mb-1.5">Status do pedido</span>
                          <Select
                            value={order.status_pedido ?? "pendente"}
                            onValueChange={(v) => handleStatusPedidoChange(order.id, v as StatusPedido)}
                            disabled={updateStatusPedido.isPending}
                          >
                            <SelectTrigger className="w-full h-9 text-xs [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_PEDIDO_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs flex items-center gap-3">
                                  <StatusPedidoDot status={opt.value} />
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => handleVerPdf(order)} disabled={loadingPdfForId === order.id}>
                            {loadingPdfForId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            <span className="ml-1.5">Ver PDF</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBaixarPdf(order)} disabled={loadingPdfForId === order.id}>
                            <Download className="h-4 w-4" />
                            <span className="ml-1.5">Baixar</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopiarResumo(order)}>
                            <Copy className="h-4 w-4" />
                            <span className="ml-1.5">Copiar resumo</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setOrderToDelete(order)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1.5">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={nomeCompletoOpen} onOpenChange={setNomeCompletoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nome completo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cliente</p>
          <p className="text-base font-semibold break-words">{nomeCompleto}</p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido será removido permanentemente.
              {orderToDelete && (
                <span className="block mt-2 text-foreground font-medium">
                  Cliente: {orderToDelete.cliente_nome} · Valor: {formatCurrency(orderToDelete.valor)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
