import { useState, useRef, useMemo } from "react";
import { ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Trash2, UserCheck, PiggyBank, Calendar } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useClients, useOrders, useExpenses, useAddExpense, useDeleteExpense, useDeleteOrder } from "@/hooks/useFirestore";
import { formatCurrency, formatDate } from "@/lib/mock-data";
import PublicOrderForm from "@/pages/PublicOrderForm";
import { toast } from "sonner";

type MovItem =
  | { type: "entrada"; id: string; data: string; descricao: string; valor: number }
  | { type: "saida"; id: string; data: string; descricao: string; valor: number };

export default function Dashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const deleteOrder = useDeleteOrder();

  const queryClient = useQueryClient();
  const [openSaida, setOpenSaida] = useState(false);
  const [openEntrada, setOpenEntrada] = useState(false);
  const [descricaoSaida, setDescricaoSaida] = useState("");
  const [valorSaida, setValorSaida] = useState("");
  const [dataSaida, setDataSaida] = useState(() => new Date().toISOString().slice(0, 10));
  const [tipoSaida, setTipoSaida] = useState<"fornecedor" | "outro">("outro");
  const [clienteIdSaida, setClienteIdSaida] = useState<string>("__nenhum__");
  const lucroPorClienteRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const anoAtual = now.getFullYear();
  const mesAtual = now.getMonth() + 1;
  const [filtroAno, setFiltroAno] = useState<number>(anoAtual);
  const [filtroMes, setFiltroMes] = useState<number>(mesAtual);
  const [mostrarFiltroPeriodo, setMostrarFiltroPeriodo] = useState(false);

  const prefixMes = useMemo(
    () => `${filtroAno}-${String(filtroMes).padStart(2, "0")}`,
    [filtroAno, filtroMes]
  );

  // Só contam como entrada pedidos cujo cliente está com status "pago" ou "pedido_concluido"
  const clientesComPedidoPago = useMemo(
    () =>
      new Set(
        clients
          .filter((c) => c.status_pedido === "pago" || c.status_pedido === "pedido_concluido")
          .map((c) => c.id)
      ),
    [clients]
  );

  const ordersNoPeriodo = useMemo(
    () => orders.filter((o) => (o.data || "").startsWith(prefixMes)),
    [orders, prefixMes]
  );
  const ordersNoPeriodoPagos = useMemo(
    () => ordersNoPeriodo.filter((o) => clientesComPedidoPago.has(o.cliente_id)),
    [ordersNoPeriodo, clientesComPedidoPago]
  );
  const expensesNoPeriodo = useMemo(
    () => expenses.filter((e) => (e.data || "").startsWith(prefixMes)),
    [expenses, prefixMes]
  );

  const faturamentoMes = useMemo(
    () => ordersNoPeriodoPagos.reduce((acc, o) => acc + (o.valor || 0), 0),
    [ordersNoPeriodoPagos]
  );
  const faturamentoAno = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            (o.data || "").startsWith(String(filtroAno)) && clientesComPedidoPago.has(o.cliente_id)
        )
        .reduce((acc, o) => acc + (o.valor || 0), 0),
    [orders, filtroAno, clientesComPedidoPago]
  );
  const saidasMes = useMemo(
    () => expensesNoPeriodo.reduce((acc, e) => acc + (e.valor || 0), 0),
    [expensesNoPeriodo]
  );

  // Saldo acumulado: soma (entradas - saídas) de todos os meses até o mês selecionado.
  // Assim, quando você avançar o filtro para meses seguintes, ele "puxa" o saldo do mês anterior.
  const toMonthKey = (dateStr?: string) => (dateStr && dateStr.length >= 7 ? dateStr.slice(0, 7) : "");

  const entradasPorMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const key = toMonthKey(o.data);
      if (!key) continue;
      if (!clientesComPedidoPago.has(o.cliente_id)) continue;
      map.set(key, (map.get(key) || 0) + (o.valor || 0));
    }
    return map;
  }, [orders, clientesComPedidoPago]);

  const saidasPorMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = toMonthKey(e.data);
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + (e.valor || 0));
    }
    return map;
  }, [expenses]);

  const saldoAtual = useMemo(() => {
    const keys = new Set<string>([...entradasPorMes.keys(), ...saidasPorMes.keys()]);
    const sorted = Array.from(keys).sort(); // YYYY-MM ordena lexicograficamente
    let saldo = 0;
    for (const key of sorted) {
      if (key > prefixMes) break;
      saldo += (entradasPorMes.get(key) || 0) - (saidasPorMes.get(key) || 0);
    }
    return saldo;
  }, [entradasPorMes, saidasPorMes, prefixMes]);
  const loading = ordersLoading || clientsLoading || expensesLoading;

  const movimentacoes: MovItem[] = useMemo(
    () =>
      [
        ...ordersNoPeriodoPagos.map((o) => ({
          type: "entrada" as const,
          id: o.id,
          data: o.data || "",
          descricao: `${o.cliente_nome} — ${o.produto}`,
          valor: o.valor || 0,
        })),
        ...expensesNoPeriodo.map((e) => ({
          type: "saida" as const,
          id: e.id,
          data: e.data || "",
          descricao: e.cliente_nome ? `${e.descricao} (${e.cliente_nome})` : e.descricao,
          valor: e.valor || 0,
        })),
      ].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 15),
    [ordersNoPeriodoPagos, expensesNoPeriodo]
  );

  const MESES: { value: number; label: string }[] = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];
  const ANOS = useMemo(() => {
    const list = [];
    for (let y = anoAtual; y >= 2020; y--) list.push(y);
    return list;
  }, [anoAtual]);

  const handleAddSaida = async () => {
    const desc = descricaoSaida.trim();
    const val = parseFloat(valorSaida.replace(",", "."));
    if (!desc) {
      toast.error("Informe o motivo da saída.");
      return;
    }
    if (Number.isNaN(val) || val <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (!dataSaida) {
      toast.error("Informe a data.");
      return;
    }
    const cliente = clienteIdSaida && clienteIdSaida !== "__nenhum__" ? clients.find((c) => c.id === clienteIdSaida) : null;
    try {
      await addExpense.mutateAsync({
        descricao: desc,
        valor: val,
        data: dataSaida,
        tipo: tipoSaida,
        ...(cliente && { cliente_id: cliente.id, cliente_nome: cliente.nome }),
      });
      setDescricaoSaida("");
      setValorSaida("");
      setDataSaida(new Date().toISOString().slice(0, 10));
      setTipoSaida("outro");
      setClienteIdSaida("__nenhum__");
      setOpenSaida(false);
      toast.success("Saída registrada. Veja o lucro por cliente abaixo.");
      setTimeout(() => lucroPorClienteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/permission|Permission|denied|insufficient/i.test(msg)) {
        toast.error("Permissão negada. Publique as regras do Firestore (coleção expenses) e tente novamente.");
      } else {
        toast.error(msg || "Erro ao registrar saída.");
      }
    }
  };

  const handleEntradaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    setOpenEntrada(false);
    toast.success("Entrada adicionada ao painel.");
  };

  const handleDeleteSaida = async (id: string) => {
    if (!window.confirm("Excluir esta saída?")) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Saída excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const handleDeleteEntrada = async (id: string) => {
    if (!window.confirm("Excluir esta entrada (pedido)?")) return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success("Entrada excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const lucroPorCliente = useMemo(
    () =>
      clients
        .map((client) => {
          const faturamento = ordersNoPeriodoPagos
            .filter((o) => o.cliente_id === client.id)
            .reduce((acc, o) => acc + (o.valor || 0), 0);
          const custos = expensesNoPeriodo
            .filter((e) => e.cliente_id === client.id)
            .reduce((acc, e) => acc + (e.valor || 0), 0);
          const lucro = faturamento - custos;
          return { client, faturamento, custos, lucro };
        })
        .filter((row) => row.faturamento > 0 || row.custos > 0)
        .sort((a, b) => b.lucro - a.lucro),
    [clients, ordersNoPeriodoPagos, expensesNoPeriodo]
  );

  // Reserva acumulada: 10% do lucro positivo por cliente, acumulando todos os meses até o período selecionado.
  const reservaAtual = useMemo(() => {
    const entriesByClient = new Map<string, number>();
    for (const o of orders) {
      const month = toMonthKey(o.data);
      if (!month || month > prefixMes) continue;
      if (!clientesComPedidoPago.has(o.cliente_id)) continue;
      const id = o.cliente_id;
      entriesByClient.set(id, (entriesByClient.get(id) || 0) + (o.valor || 0));
    }

    const costsByClient = new Map<string, number>();
    for (const e of expenses) {
      const month = toMonthKey(e.data);
      if (!month || month > prefixMes) continue;
      if (!e.cliente_id) continue; // mantém regra original: só custos vinculados ao cliente entram no lucro por cliente
      const id = e.cliente_id;
      costsByClient.set(id, (costsByClient.get(id) || 0) + (e.valor || 0));
    }

    let totalLucroPositivo = 0;
    const ids = new Set<string>([...entriesByClient.keys(), ...costsByClient.keys()]);
    for (const id of ids) {
      const lucro = (entriesByClient.get(id) || 0) - (costsByClient.get(id) || 0);
      if (lucro > 0) totalLucroPositivo += lucro;
    }

    return totalLucroPositivo * 0.1;
  }, [orders, expenses, clientesComPedidoPago, prefixMes]);

  const clientesComPedidoNoPeriodo = useMemo(
    () => new Set(ordersNoPeriodoPagos.map((o) => o.cliente_id).filter(Boolean)).size,
    [ordersNoPeriodoPagos]
  );

  const nomeMesSelecionado = MESES.find((m) => m.value === filtroMes)?.label ?? "";
  const periodoLabel = `${nomeMesSelecionado} ${filtroAno}`;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border/80 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do seu negócio</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={mostrarFiltroPeriodo ? "secondary" : "outline"}
            size="default"
            className="gap-2"
            onClick={() => setMostrarFiltroPeriodo((v) => !v)}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            {mostrarFiltroPeriodo ? "Ocultar filtro de período" : "Filtrar por mês e ano"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Saldo atual ({periodoLabel}): <strong className="text-foreground">{loading ? "—" : formatCurrency(saldoAtual)}</strong>
          </span>
        </div>
        {mostrarFiltroPeriodo && (
          <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-muted/50 border border-border/80">
            <Label className="text-sm font-medium shrink-0">Escolha o período:</Label>
            <Select
              value={String(filtroMes)}
              onValueChange={(v) => setFiltroMes(Number(v))}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(filtroAno)}
              onValueChange={(v) => setFiltroAno(Number(v))}
            >
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pedidos no período (pagos)" value={loading ? "—" : ordersNoPeriodoPagos.length} icon={ShoppingCart} />
        <MetricCard title="Clientes no período" value={loading ? "—" : clientesComPedidoNoPeriodo} icon={Users} />
        <MetricCard title="Faturamento do mês" value={loading ? "—" : formatCurrency(faturamentoMes)} icon={DollarSign} />
        <MetricCard title={`Faturamento ${filtroAno}`} value={loading ? "—" : formatCurrency(faturamentoAno)} icon={DollarSign} />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Fluxo de Caixa
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Resumo e últimas movimentações. Entradas só entram quando o status do pedido (em Clientes) for Pago ou Pedido concluído.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => lucroPorClienteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Ver lucro por cliente
            </Button>
            <Dialog open={openSaida} onOpenChange={setOpenSaida}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar saída
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova saída</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de saída</Label>
                    <Select value={tipoSaida} onValueChange={(v: "fornecedor" | "outro") => setTipoSaida(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fornecedor">Pagamento a fornecedor</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cliente (opcional)</Label>
                    <Select value={clienteIdSaida} onValueChange={setClienteIdSaida}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum — saída geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__nenhum__">Nenhum — saída geral</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Vincule ao cliente para calcular o lucro por cliente (ex.: pagamento de fornecedor do pedido dele).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Motivo da saída (descrição) *</Label>
                    <Textarea
                      value={descricaoSaida}
                      onChange={(e) => setDescricaoSaida(e.target.value)}
                      placeholder="Ex: Pagamento ao fornecedor, aluguel, material de escritório..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={valorSaida}
                        onChange={(e) => setValorSaida(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={dataSaida}
                        onChange={(e) => setDataSaida(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddSaida} className="w-full" disabled={addExpense.isPending}>
                    {addExpense.isPending ? "Salvando..." : "Registrar saída"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openEntrada} onOpenChange={setOpenEntrada}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0" variant="secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <div className="p-4 sm:p-6">
                  {openEntrada ? <PublicOrderForm embedded onSuccess={handleEntradaSuccess} /> : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-hidden pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/80 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Entradas (período)</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(faturamentoMes)}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Saídas (período)</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(saidasMes)}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Saldo atual</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(saldoAtual)}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-violet-500/10 p-4">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                <PiggyBank className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Reserva (10% do lucro)</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">
                {loading ? "—" : formatCurrency(reservaAtual)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                10% do lucro de cada cliente
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Movimentações do período</h3>
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border/80">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : movimentacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimentacoes.map((m) => (
                      <TableRow key={`${m.type}-${m.id}`} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm text-muted-foreground">{formatDate(m.data)}</TableCell>
                        <TableCell className="text-sm">{m.descricao}</TableCell>
                        <TableCell className="text-sm">
                          {m.type === "entrada" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                              Saída
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {m.type === "entrada" ? (
                            <span className="text-emerald-700 dark:text-emerald-400">+ {formatCurrency(m.valor)}</span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400">− {formatCurrency(m.valor)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => (m.type === "entrada" ? handleDeleteEntrada(m.id) : handleDeleteSaida(m.id))}
                            disabled={m.type === "entrada" ? deleteOrder.isPending : deleteExpense.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {loading && <p className="text-center text-muted-foreground py-6">Carregando...</p>}
              {!loading && movimentacoes.length === 0 && (
                <p className="text-center text-muted-foreground py-6">Nenhuma movimentação ainda.</p>
              )}
              {!loading && movimentacoes.length > 0 && movimentacoes.map((m) => (
                <Card key={`${m.type}-${m.id}`} className="border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-sm min-w-0">
                      <p className="font-medium truncate">{m.descricao}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(m.data)}</p>
                      {m.type === "entrada" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                          Saída
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className={`text-sm font-semibold ${m.type === "entrada" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                        {m.type === "entrada" ? "+" : "−"} {formatCurrency(m.valor)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => (m.type === "entrada" ? handleDeleteEntrada(m.id) : handleDeleteSaida(m.id))}
                        disabled={m.type === "entrada" ? deleteOrder.isPending : deleteExpense.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card ref={lucroPorClienteRef} className="shadow-card scroll-mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Lucro por cliente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Faturamento (pedidos) menos saídas vinculadas ao cliente no período selecionado (ex.: pagamento a fornecedor). Vincule a saída ao cliente ao registrar.
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs text-right">Faturamento</TableHead>
                  <TableHead className="text-xs text-right">Custos (saídas)</TableHead>
                  <TableHead className="text-xs text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : lucroPorCliente.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum cliente com pedidos ou saídas vinculadas ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  lucroPorCliente.map(({ client, faturamento, custos, lucro }) => (
                    <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-sm">{client.nome}</TableCell>
                      <TableCell className="text-sm text-right text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(faturamento)}
                      </TableCell>
                      <TableCell className="text-sm text-right text-red-700 dark:text-red-400">
                        {formatCurrency(custos)}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        <span className={lucro >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                          {formatCurrency(lucro)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3 p-4 pt-0">
            {loading && <p className="text-center text-muted-foreground py-6">Carregando...</p>}
            {!loading && lucroPorCliente.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Nenhum cliente com pedidos ou saídas vinculadas ainda.</p>
            )}
            {!loading && lucroPorCliente.length > 0 && lucroPorCliente.map(({ client, faturamento, custos, lucro }) => (
              <Card key={client.id} className="border bg-card p-4 shadow-sm">
                <p className="font-medium text-sm">{client.nome}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(faturamento)}</span>
                  <span className="text-muted-foreground">Custos:</span>
                  <span className="text-right text-red-700 dark:text-red-400">{formatCurrency(custos)}</span>
                  <span className="text-muted-foreground font-medium">Lucro:</span>
                  <span className={`text-right font-semibold ${lucro >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                    {formatCurrency(lucro)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
