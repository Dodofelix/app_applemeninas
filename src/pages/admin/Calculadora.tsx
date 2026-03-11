import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, useGatewayFees, useCalculatorValues } from "@/hooks/useFirestore";
import {
  CLIENT_MODELS,
  STORE_MODELS,
  STORAGES,
  calculatorKey,
} from "@/lib/calculadora";
import { CATEGORIES, formatCurrency } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Calculator,
  Smartphone,
  Store,
  CreditCard,
  Package,
  QrCode,
  Wallet,
  Layers,
  ArrowLeftRight,
} from "lucide-react";

const PAYMENT_METHODS: { value: string; label: string; Icon: typeof QrCode }[] = [
  { value: "Pix total", label: "Pix total", Icon: QrCode },
  { value: "Pix entrada + cartão de crédito", label: "Pix entrada + cartão de crédito", Icon: Wallet },
  { value: "Cartão de crédito total", label: "Cartão de crédito total", Icon: CreditCard },
  { value: "2 cartões de crédito", label: "2 cartões de crédito", Icon: Layers },
];

const CATEGORY_ICONS: Record<string, typeof Package> = {
  iPhone: Smartphone,
  iPad: Package,
  MacBook: Package,
  "Apple Watch": Package,
  iMac: Package,
  "Mac Mini": Package,
  Acessórios: Package,
};

const DEFAULT_FEE_PCT = 2.99;

export default function Calculadora() {
  const { data: savedValues = { tradeIn: {}, store: {} }, isLoading } = useCalculatorValues();

  const { data: products = [] } = useProducts();
  const { data: gatewayFees = {} } = useGatewayFees();

  const [clientModel, setClientModel] = useState<string>("");
  const [clientStorage, setClientStorage] = useState<number | "">("");

  const [storeModel, setStoreModel] = useState<string>("");
  const [storeStorage, setStoreStorage] = useState<number | "">("");

  type ItemProduto = { categoria: string; produtoId: string };
  const [itensProduto, setItensProduto] = useState<ItemProduto[]>([{ categoria: "", produtoId: "" }]);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [entradaPix, setEntradaPix] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [valorCartao1, setValorCartao1] = useState("");
  const [parcelasCartao1, setParcelasCartao1] = useState("");
  const [parcelasCartao2, setParcelasCartao2] = useState("");
  const [nomeClienteOrcamento, setNomeClienteOrcamento] = useState("");
  const [nomeClienteUpgrade, setNomeClienteUpgrade] = useState("");
  const [parcelasUpgrade, setParcelasUpgrade] = useState("12");

  const clientKey = clientModel && clientStorage ? calculatorKey(clientModel, clientStorage as number) : "";
  const storeKey = storeModel && storeStorage ? calculatorKey(storeModel, storeStorage as number) : "";

  const clientValue = useMemo(() => {
    return clientKey ? (savedValues.tradeIn[clientKey] ?? 0) : 0;
  }, [clientKey, savedValues.tradeIn]);

  const storeValue = useMemo(() => {
    return storeKey ? savedValues.store[storeKey] ?? 0 : 0;
  }, [storeKey, savedValues.store]);

  const valorUpgrade = storeValue - clientValue;

  const getFeeForParcelas = (n: number) => {
    const pct = gatewayFees[n] ?? DEFAULT_FEE_PCT;
    return pct / 100;
  };

  const produtoObjs = itensProduto
    .map((item) => products.find((p) => p.id === item.produtoId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const valorTotal = produtoObjs.reduce((s, p) => s + p.preco, 0);

  const needsInstallments =
    formaPagamento === "Pix entrada + cartão de crédito" ||
    formaPagamento === "Cartão de crédito total" ||
    formaPagamento === "2 cartões de crédito";

  const valorRestante =
    formaPagamento === "Pix entrada + cartão de crédito" && valorTotal > 0
      ? valorTotal - (parseFloat(entradaPix) || 0)
      : valorTotal;

  const isDoisCartoes = formaPagamento === "2 cartões de crédito";
  const valorCartao1Num = isDoisCartoes && valorTotal > 0 ? parseFloat(valorCartao1) || 0 : 0;
  const valorCartao2Num = isDoisCartoes && valorTotal > 0 ? valorTotal - valorCartao1Num : 0;
  const numParcelasCartao1 = parseInt(parcelasCartao1) || 1;
  const numParcelasCartao2 = parseInt(parcelasCartao2) || 1;
  const feeCartao1 = getFeeForParcelas(numParcelasCartao1);
  const feeCartao2 = getFeeForParcelas(numParcelasCartao2);
  const valorParcelaCartao1 =
    isDoisCartoes && valorCartao1Num > 0 ? (valorCartao1Num * (1 + feeCartao1)) / numParcelasCartao1 : 0;
  const valorParcelaCartao2 =
    isDoisCartoes && valorCartao2Num > 0 ? (valorCartao2Num * (1 + feeCartao2)) / numParcelasCartao2 : 0;

  const numParcelas = parseInt(parcelas) || 1;
  const feeParcelas = getFeeForParcelas(numParcelas);
  const valorParcela =
    needsInstallments && !isDoisCartoes ? (valorRestante * (1 + feeParcelas)) / numParcelas : 0;

  const handleCopyUpgrade = async () => {
    if (!nomeClienteUpgrade.trim()) {
      toast.error("Informe o nome do cliente para o upgrade.");
      return;
    }
    if (!clientModel) {
      toast.error("Selecione o modelo do iPhone do cliente.");
      return;
    }
    if (valorUpgrade <= 0) {
      toast.error("O valor do upgrade precisa ser maior que zero.");
      return;
    }

    const nParcelas = parcelasUpgrade ? parseInt(parcelasUpgrade) || 1 : 1;
    const valorParcelaUpgrade =
      nParcelas > 0 ? valorUpgrade / nParcelas : valorUpgrade;

    const texto = `${nomeClienteUpgrade.trim()}, fica assim:\nSeu ${clientModel}\n+ ${valorUpgrade.toLocaleString(
      "pt-BR",
      { style: "currency", currency: "BRL" },
    )} à vista ou ${nParcelas}x de ${valorParcelaUpgrade.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;

    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Upgrade copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o upgrade. Tente selecionar e copiar manualmente.");
    }
  };

  const handleCopyOrcamento = async () => {
    if (!nomeClienteOrcamento.trim()) {
      toast.error("Informe o nome do cliente para montar o orçamento.");
      return;
    }
    if (produtoObjs.length === 0) {
      toast.error("Selecione ao menos um produto para o orçamento.");
      return;
    }

    const linhasProdutos = produtoObjs.map(
      (p) => `- ${p.nome} (${p.categoria}) - ${formatCurrency(p.preco)}`,
    );

    let formaTexto = formaPagamento || "Não informado";
    if (formaPagamento === "Pix total") {
      formaTexto = `Pix total - ${formatCurrency(valorTotal)}`;
    } else if (formaPagamento === "Pix entrada + cartão de crédito") {
      formaTexto = `Pix entrada de ${formatCurrency(parseFloat(entradaPix) || 0)} + restante no cartão`;
      if (parcelas) {
        formaTexto += ` em ${parcelas}x de ${formatCurrency(valorParcela)}`;
      }
    } else if (formaPagamento === "Cartão de crédito total") {
      if (parcelas) {
        formaTexto = `Cartão de crédito total em ${parcelas}x de ${formatCurrency(valorParcela)}`;
      } else {
        formaTexto = `Cartão de crédito total - ${formatCurrency(valorTotal)}`;
      }
    } else if (formaPagamento === "2 cartões de crédito") {
      formaTexto = `2 cartões:\n  1º cartão: ${
        parcelasCartao1
          ? `${parcelasCartao1}x de ${formatCurrency(valorParcelaCartao1)}`
          : formatCurrency(valorCartao1Num)
      }\n  2º cartão: ${
        parcelasCartao2
          ? `${parcelasCartao2}x de ${formatCurrency(valorParcelaCartao2)}`
          : formatCurrency(valorCartao2Num)
      }`;
    }

    const texto = `Orçamento ${nomeClienteOrcamento.trim()}\n\nProdutos:\n${linhasProdutos.join(
      "\n",
    )}\n\nForma de pagamento:\n${formaTexto}`;

    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Orçamento copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o orçamento. Tente selecionar e copiar manualmente.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calculator className="h-7 w-7" />
          Calculadora
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Simule trocas e orçamentos em um só lugar.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-1 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Calculadora de upgrade</h2>
            <p className="text-sm text-muted-foreground">
              Defina o valor do iPhone do cliente, o valor do produto na loja e veja quanto fica o upgrade.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  iPhone do cliente
                </CardTitle>
                <p className="text-sm text-muted-foreground">Aparelho que o cliente entrega na troca.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={clientModel} onValueChange={setClientModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Memória</Label>
                  <Select
                    value={clientStorage === "" ? "" : String(clientStorage)}
                    onValueChange={(v) => setClientStorage(v === "" ? "" : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a memória" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGES.map((s) => (
                        <SelectItem key={s.value} value={String(s.value)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor que pagamos pelo iPhone do cliente (R$)</Label>
                  <Input
                    type="text"
                    readOnly
                    value={
                      clientKey && savedValues.tradeIn[clientKey] != null
                        ? savedValues.tradeIn[clientKey].toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : ""
                    }
                    placeholder={clientKey ? "Cadastre este valor em Configurações › Dados da calculadora" : "Selecione modelo e memória"}
                  />
                  {clientKey && savedValues.tradeIn[clientKey] == null && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum valor cadastrado para este modelo/memória. Ajuste em Configurações &gt; Dados da calculadora.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Produto na loja
                </CardTitle>
                <p className="text-sm text-muted-foreground">iPhone lacrado que o cliente vai levar.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={storeModel} onValueChange={setStoreModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORE_MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Memória</Label>
                  <Select
                    value={storeStorage === "" ? "" : String(storeStorage)}
                    onValueChange={(v) => setStoreStorage(v === "" ? "" : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a memória" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGES.map((s) => (
                        <SelectItem key={s.value} value={String(s.value)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor do produto lacrado na loja (R$)</Label>
                  <Input
                    type="text"
                    readOnly
                    value={
                      storeKey && savedValues.store[storeKey] != null
                        ? savedValues.store[storeKey].toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : ""
                    }
                    placeholder={storeKey ? "Cadastre este valor em Configurações › Dados da calculadora" : "Selecione modelo e memória"}
                  />
                  {storeKey && savedValues.store[storeKey] == null && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum valor cadastrado para este modelo/memória. Ajuste em Configurações &gt; Dados da calculadora.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resultado do upgrade</CardTitle>
              <p className="text-sm text-muted-foreground">
                Valor do produto na loja − valor do iPhone do cliente
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-muted-foreground">
                  {storeValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span className="text-muted-foreground">−</span>
                <span className="text-muted-foreground">
                  {clientValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span className="text-muted-foreground">=</span>
                <span className="text-2xl font-bold text-foreground">
                  {valorUpgrade.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {valorUpgrade >= 0
                  ? "Valor que o cliente paga (ou financia) pelo upgrade."
                  : "O valor do iPhone do cliente é maior que o produto; ajuste os valores se necessário."}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] items-end">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nome do cliente</Label>
                  <Input
                    value={nomeClienteUpgrade}
                    onChange={(e) => setNomeClienteUpgrade(e.target.value)}
                    placeholder="Digite o nome do cliente"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Parcelamento do upgrade</Label>
                  <Select value={parcelasUpgrade} onValueChange={setParcelasUpgrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {valorUpgrade > 0 && parcelasUpgrade && (
                    <p className="text-xs text-muted-foreground">
                      {parcelasUpgrade}x de{" "}
                      {(
                        valorUpgrade /
                        (parseInt(parcelasUpgrade || "1") || 1)
                      ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  )}
                </div>
                <div className="flex md:justify-end">
                  <Button
                    type="button"
                    onClick={handleCopyUpgrade}
                    disabled={valorUpgrade <= 0 || !clientModel}
                    className="w-full md:w-auto"
                  >
                    Copiar upgrade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Calculadora de orçamento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione o produto e a forma de pagamento para simular o valor das parcelas, sem criar pedido.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome do cliente</Label>
                <Input
                  value={nomeClienteOrcamento}
                  onChange={(e) => setNomeClienteOrcamento(e.target.value)}
                  placeholder="Digite o nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label>Produto Apple</Label>
                <div className="space-y-3">
                  {itensProduto.map((item, index) => {
                    const produtosFiltrados = products.filter((p) => p.categoria === item.categoria);
                    return (
                      <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Produto {itensProduto.length > 1 ? index + 1 : ""}
                          </span>
                          {itensProduto.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setItensProduto((prev) => prev.filter((_, i) => i !== index))}
                            >
                              Excluir
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm">Categoria</Label>
                          <Select
                            value={item.categoria}
                            onValueChange={(v) =>
                              setItensProduto((prev) =>
                                prev.map((it, i) => (i === index ? { ...it, categoria: v, produtoId: "" } : it)),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => {
                                const CatIcon = CATEGORY_ICONS[c] ?? Package;
                                return (
                                  <SelectItem key={c} value={c}>
                                    <span className="flex items-center gap-2">
                                      <CatIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      {c}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        {item.categoria && (
                          <div className="space-y-1.5">
                            <Label className="text-sm">Produto</Label>
                            <Select
                              value={item.produtoId}
                              onValueChange={(v) =>
                                setItensProduto((prev) =>
                                  prev.map((it, i) => (i === index ? { ...it, produtoId: v } : it)),
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {produtosFiltrados.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <span className="flex items-center gap-2">
                                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      {p.nome} — {formatCurrency(p.preco)}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setItensProduto((prev) => [...prev, { categoria: "", produtoId: "" }])}
                >
                  Adicionar produto
                </Button>
              </div>

              {valorTotal > 0 && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-medium text-sm">
                    Total ({produtoObjs.length} {produtoObjs.length === 1 ? "produto" : "produtos"})
                  </p>
                  <p className="text-lg font-semibold text-primary mt-1">{formatCurrency(valorTotal)}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formaPagamento === "Pix entrada + cartão de crédito" && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Valor de entrada via Pix (R$)</Label>
                  <Input
                    type="number"
                    value={entradaPix}
                    onChange={(e) => setEntradaPix(e.target.value)}
                    placeholder="0"
                  />
                  {valorTotal > 0 && entradaPix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Restante no cartão: {formatCurrency(valorRestante)}
                    </p>
                  )}
                </div>
              )}

              {formaPagamento === "2 cartões de crédito" && valorTotal > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                    <Label className="text-sm font-medium">1º cartão</Label>
                    <Input
                      type="number"
                      placeholder="Valor (R$)"
                      value={valorCartao1}
                      onChange={(e) => setValorCartao1(e.target.value)}
                    />
                    {valorCartao1 && (
                      <p className="text-xs text-muted-foreground">
                        2º cartão: {formatCurrency(valorTotal - (parseFloat(valorCartao1) || 0))}
                      </p>
                    )}
                    <Select value={parcelasCartao1} onValueChange={setParcelasCartao1}>
                      <SelectTrigger>
                        <SelectValue placeholder="Parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de{" "}
                            {formatCurrency(
                              valorCartao1Num > 0 ? (valorCartao1Num * (1 + getFeeForParcelas(n))) / n : 0,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {parcelasCartao1 && valorCartao1Num > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {parcelasCartao1}x de {formatCurrency(valorParcelaCartao1)} (taxa{" "}
                        {(getFeeForParcelas(numParcelasCartao1) * 100).toFixed(2)}%)
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                    <Label className="text-sm font-medium">2º cartão</Label>
                    <p className="text-sm text-muted-foreground">
                      Valor: {formatCurrency(valorCartao2Num)}
                    </p>
                    <Select value={parcelasCartao2} onValueChange={setParcelasCartao2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de{" "}
                            {formatCurrency(
                              valorCartao2Num > 0 ? (valorCartao2Num * (1 + getFeeForParcelas(n))) / n : 0,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {parcelasCartao2 && valorCartao2Num > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {parcelasCartao2}x de {formatCurrency(valorParcelaCartao2)} (taxa{" "}
                        {(getFeeForParcelas(numParcelasCartao2) * 100).toFixed(2)}%)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {needsInstallments && !isDoisCartoes && valorTotal > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Parcelas</Label>
                  <Select value={parcelas} onValueChange={setParcelas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de {formatCurrency((valorRestante * (1 + getFeeForParcelas(n))) / n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {parcelas && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {parcelas}x de {formatCurrency(valorParcela)} (taxa de {(feeParcelas * 100).toFixed(2)}%)
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="button" onClick={handleCopyOrcamento} disabled={valorTotal <= 0}>
                  Copiar orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
