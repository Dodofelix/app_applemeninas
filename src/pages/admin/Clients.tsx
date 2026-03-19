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
import { useClients, useOrders, useAddClient, useDeleteClient, useUpdateClientStatusPedido, useUpdateClientNotaFiscal } from "@/hooks/useFirestore";
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

function getFirstName(nome: string): string {
  const s = (nome || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s.split(" ")[0] || s;
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
  const addClient = useAddClient();
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoCpf, setNovoCpf] = useState("");
  const [novoCelular, setNovoCelular] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoCidade, setNovoCidade] = useState("");
  const [novoEstado, setNovoEstado] = useState("");
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

  const handleAddClient = async () => {
    const nome = novoNome.trim();
    const cpf = novoCpf.trim();
    if (!nome || !cpf) {
      toast.error("Preencha pelo menos nome e CPF.");
      return;
    }
    const hoje = new Date().toISOString().slice(0, 10);
    try {
      await addClient.mutateAsync({
        nome,
        cpf,
        rg: "",
        data_nascimento: "",
        nacionalidade: "",
        estado_civil: "",
        profissao: "",
        celular: novoCelular.trim(),
        email: novoEmail.trim(),
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: novoCidade.trim(),
        estado: novoEstado.trim(),
        autoriza_instagram: false,
        data_cadastro: hoje,
        status_pedido: undefined,
        nota_fiscal: undefined,
      });
      setNovoNome("");
      setNovoCpf("");
      setNovoCelular("");
      setNovoEmail("");
      setNovoCidade("");
      setNovoEstado("");
      setAddOpen(false);
      toast.success("Cliente adicionado manualmente.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao adicionar cliente.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Todos os clientes cadastrados</p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => setAddOpen(true)}>
          + Adicionar cliente
        </Button>
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
                    <TableCell className="font-medium text-sm py-2 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{getFirstName(c.nome) || c.nome}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          title="Visualizar completo"
                          onClick={() => setClientToView(c)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2 px-3">{c.cpf}</TableCell>
                    <TableCell className="text-sm py-2 px-3">{c.celular}</TableCell>
                    <TableCell className="text-sm py-2 px-3">{c.email}</TableCell>
                    <TableCell className="text-sm py-2 px-3">{c.cidade} - {c.estado}</TableCell>
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
                    <TableCell className="p-2">
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
                    <TableCell className="text-sm text-muted-foreground py-2 px-3">{formatDate(c.data_cadastro)}</TableCell>
                    <TableCell className="p-2">
                      <div className="flex items-center gap-1">
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="text-muted-foreground">Nome:</span>{" "}
                        <span className="font-medium">{getFirstName(c.nome) || c.nome}</span>
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">
                        {c.cidade} - {c.estado}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title="Visualizar completo"
                      onClick={() => setClientToView(c)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cliente manualmente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Use este atalho para cadastrar rapidamente um cliente sem precisar do formulário público.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">CPF *</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={novoCpf}
                onChange={(e) => setNovoCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Celular</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={novoCelular}
                  onChange={(e) => setNovoCelular(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cidade</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={novoCidade}
                  onChange={(e) => setNovoCidade(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estado</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={novoEstado}
                  onChange={(e) => setNovoEstado(e.target.value)}
                  placeholder="SP, RJ..."
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddClient} disabled={addClient.isPending}>
              {addClient.isPending ? "Salvando..." : "Salvar cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
