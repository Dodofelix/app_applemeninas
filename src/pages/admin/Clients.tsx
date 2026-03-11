import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useClients, useOrders, useDeleteClient, useUpdateClientStatusPedido, useUpdateClientNotaFiscal } from "@/hooks/useFirestore";
import { formatDate, formatCurrency } from "@/lib/mock-data";
import { buildFormularioNF } from "@/lib/formularioNF";
import type { Client, Order, StatusPedidoCliente, StatusNotaFiscal } from "@/lib/mock-data";
import { Eye, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const STATUS_PEDIDO_CLIENTE_OPTIONS: { value: StatusPedidoCliente; label: string }[] = [
  { value: "aguardando_produto", label: "Aguardando produto" },
  { value: "aguardando_pagamento", label: "Aguardando pagamento" },
  { value: "pago", label: "Pago" },
  { value: "pedido_concluido", label: "Pedido concluído" },
];

function statusPedidoClienteLabel(value: StatusPedidoCliente | undefined): string {
  return STATUS_PEDIDO_CLIENTE_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

const NOTA_FISCAL_OPTIONS: { value: StatusNotaFiscal; label: string }[] = [
  { value: "emitindo", label: "Emitindo" },
  { value: "emitida", label: "Emitida" },
  { value: "enviada", label: "Enviada" },
];

function notaFiscalLabel(value: StatusNotaFiscal | undefined): string {
  return NOTA_FISCAL_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

function DetalheCliente({ c, orders }: { c: Client; orders: Order[] }) {
  const linha = (label: string, value: string | number | undefined) =>
    value !== undefined && value !== "" ? (
      <div className="flex gap-2 py-1 text-sm">
        <span className="text-muted-foreground shrink-0 w-40">{label}:</span>
        <span className="break-words">{String(value)}</span>
      </div>
    ) : null;

  const pedidosDoCliente = orders.filter((o) => o.cliente_id === c.id);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2 border-b pb-1">Dados cadastrais</h3>
        <div className="space-y-0.5">
          {linha("Nome", c.nome)}
          {linha("CPF", c.cpf)}
          {linha("RG", c.rg)}
          {linha("Data de nascimento", c.data_nascimento)}
          {linha("Nacionalidade", c.nacionalidade)}
          {linha("Estado civil", c.estado_civil)}
          {linha("Profissão", c.profissao)}
          {linha("Celular", c.celular)}
          {linha("Email", c.email)}
          {linha("CEP", c.cep)}
          {linha("Rua", c.rua)}
          {linha("Número", c.numero)}
          {linha("Complemento", c.complemento)}
          {linha("Bairro", c.bairro)}
          {linha("Cidade", c.cidade)}
          {linha("Estado", c.estado)}
          {c.autoriza_instagram != null && linha("Autoriza Instagram", c.autoriza_instagram ? "Sim" : "Não")}
          {linha("Status do pedido", statusPedidoClienteLabel(c.status_pedido))}
          {linha("Nota fiscal", notaFiscalLabel(c.nota_fiscal))}
          {linha("Data de cadastro", c.data_cadastro ? formatDate(c.data_cadastro) : undefined)}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2 border-b pb-1">
          Pedidos ({pedidosDoCliente.length})
        </h3>
        {pedidosDoCliente.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum pedido vinculado a este cliente.</p>
        ) : (
          <div className="space-y-4">
            {pedidosDoCliente.map((order) => (
              <Card key={order.id} className="border bg-muted/30 p-3 text-sm">
                <div className="space-y-1.5">
                  <p><span className="text-muted-foreground">Data:</span> {formatDate(order.data)}</p>
                  <p>
                    <span className="text-muted-foreground">Produto(s):</span>{" "}
                    {order.produtos?.length
                      ? order.produtos.map((p) => `${p.nome} (${formatCurrency(p.preco)})`).join(" · ")
                      : `${order.produto} (${formatCurrency(order.valor)})`}
                  </p>
                  <p><span className="text-muted-foreground">Valor total:</span> {formatCurrency(order.valor)}</p>
                  <p><span className="text-muted-foreground">Forma de pagamento:</span> {order.forma_pagamento}</p>
                  {order.entrada_pix != null && order.entrada_pix > 0 && (
                    <p><span className="text-muted-foreground">Entrada (Pix):</span> {formatCurrency(order.entrada_pix)}</p>
                  )}
                  {order.parcelas != null && order.valor_parcela != null && (
                    <p>
                      <span className="text-muted-foreground">Parcelas:</span> {order.parcelas}x de {formatCurrency(order.valor_parcela)}
                    </p>
                  )}
                  {order.parcelas_cartao2 != null && order.valor_parcela_cartao2 != null && (
                    <p>
                      <span className="text-muted-foreground">Segundo cartão:</span> {order.parcelas_cartao2}x de {formatCurrency(order.valor_parcela_cartao2)}
                    </p>
                  )}
                  <p><span className="text-muted-foreground">Status do pedido:</span> {order.status_pedido ?? "pendente"}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: orders = [] } = useOrders();
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const deleteClient = useDeleteClient();
  const updateStatusPedido = useUpdateClientStatusPedido();
  const updateNotaFiscal = useUpdateClientNotaFiscal();

  const handleStatusPedidoChange = (clientId: string, value: StatusPedidoCliente) => {
    updateStatusPedido.mutate(
      { clientId, status_pedido: value },
      { onSuccess: () => toast.success("Status atualizado."), onError: () => toast.error("Erro ao atualizar status.") }
    );
  };

  const handleNotaFiscalChange = (clientId: string, value: StatusNotaFiscal) => {
    updateNotaFiscal.mutate(
      { clientId, nota_fiscal: value },
      { onSuccess: () => toast.success("Nota fiscal atualizada."), onError: () => toast.error("Erro ao atualizar nota fiscal.") }
    );
  };

  const handleCopiarFormularioNF = (c: Client) => {
    const texto = buildFormularioNF(c);
    navigator.clipboard.writeText(texto).then(
      () => toast.success("Formulário de NF copiado!"),
      () => toast.error("Erro ao copiar.")
    );
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient.mutateAsync(clientToDelete.id);
      toast.success("Cliente excluído.");
      setClientToDelete(null);
    } catch {
      toast.error("Erro ao excluir cliente.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos os clientes cadastrados</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Lista de clientes</CardTitle>
          <p className="text-sm text-muted-foreground">Visualize e gerencie os clientes cadastrados</p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">CPF</TableHead>
                <TableHead className="text-xs">Celular</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Cidade</TableHead>
                <TableHead className="text-xs">Status do pedido</TableHead>
                <TableHead className="text-xs">Copiar</TableHead>
                <TableHead className="text-xs">Nota fiscal</TableHead>
                <TableHead className="text-xs">Data de Cadastro</TableHead>
                <TableHead className="text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.cpf}</TableCell>
                    <TableCell className="text-sm">{c.celular}</TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.cidade} - {c.estado}</TableCell>
                    <TableCell>
                      <Select
                        value={c.status_pedido ?? "aguardando_produto"}
                        onValueChange={(v) => handleStatusPedidoChange(c.id, v as StatusPedidoCliente)}
                        disabled={updateStatusPedido.isPending}
                      >
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_PEDIDO_CLIENTE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Copiar formulário de nota fiscal"
                        onClick={() => handleCopiarFormularioNF(c)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.nota_fiscal ?? "emitindo"}
                        onValueChange={(v) => handleNotaFiscalChange(c.id, v as StatusNotaFiscal)}
                        disabled={updateNotaFiscal.isPending}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTA_FISCAL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.data_cadastro)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Visualizar"
                          onClick={() => setClientToView(c)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setClientToDelete(c)}
                          disabled={deleteClient.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-4 p-4 pt-0">
            {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
            {!isLoading && clients.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado.</p>}
            {!isLoading && clients.length > 0 && clients.map((c) => (
              <Card key={c.id} className="border bg-card p-4 shadow-sm">
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{c.nome}</span></p>
                  <p><span className="text-muted-foreground">CPF:</span> {c.cpf}</p>
                  <p><span className="text-muted-foreground">Celular:</span> {c.celular}</p>
                  <p><span className="text-muted-foreground">Email:</span> {c.email}</p>
                  <p><span className="text-muted-foreground">Cidade:</span> {c.cidade} – {c.estado}</p>
                  <div>
                    <span className="text-muted-foreground block mb-1">Status do pedido</span>
                    <Select
                      value={c.status_pedido ?? "aguardando_produto"}
                      onValueChange={(v) => handleStatusPedidoChange(c.id, v as StatusPedidoCliente)}
                      disabled={updateStatusPedido.isPending}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_PEDIDO_CLIENTE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopiarFormularioNF(c)}>
                      <Copy className="h-4 w-4" />
                      <span className="ml-1.5">Copiar formulário NF</span>
                    </Button>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Nota fiscal</span>
                    <Select
                      value={c.nota_fiscal ?? "emitindo"}
                      onValueChange={(v) => handleNotaFiscalChange(c.id, v as StatusNotaFiscal)}
                      disabled={updateNotaFiscal.isPending}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTA_FISCAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p><span className="text-muted-foreground">Cadastro:</span> {formatDate(c.data_cadastro)}</p>
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <Button size="sm" variant="outline" onClick={() => setClientToView(c)}>
                      <Eye className="h-4 w-4" />
                      <span className="ml-1.5">Visualizar</span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setClientToDelete(c)} disabled={deleteClient.isPending}>
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1.5">Excluir</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!clientToView} onOpenChange={(open) => !open && setClientToView(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Dados do cliente</DialogTitle>
          </DialogHeader>
          {clientToView && <DetalheCliente c={clientToView} orders={orders} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
              {clientToDelete && (
                <span className="block mt-2 text-foreground font-medium">
                  {clientToDelete.nome} · {clientToDelete.email}
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
