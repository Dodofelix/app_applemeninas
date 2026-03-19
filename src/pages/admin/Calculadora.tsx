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
  ArrowLeftRight,
} from "lucide-react";

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

  const [storeProductId, setStoreProductId] = useState<string>("");

  type ItemProduto = { categoria: string; produtoId: string };
  const [itensProduto, setItensProduto] = useState<ItemProduto[]>([{ categoria: "", produtoId: "" }]);
  const [nomeClienteOrcamento, setNomeClienteOrcamento] = useState("");
  const [nomeClienteUpgrade, setNomeClienteUpgrade] = useState("");
  const [parcelasUpgrade, setParcelasUpgrade] = useState("12");
  const [parcelasOrcamento, setParcelasOrcamento] = useState("12");
  const [tipoPagamentoOrcamento, setTipoPagamentoOrcamento] = useState<"pix_total" | "pix_entrada_cartao">(
    "pix_total",
  );
  const [entradaPixOrcamento, setEntradaPixOrcamento] = useState("");

  const clientKey = clientModel && clientStorage ? calculatorKey(clientModel, clientStorage as number) : "";

  const clientValue = useMemo(() => {
    return clientKey ? (savedValues.tradeIn[clientKey] ?? 0) : 0;
  }, [clientKey, savedValues.tradeIn]);

  const storeProduct = useMemo(
    () => (storeProductId ? products.find((p) => p.id === storeProductId) : undefined),
    [products, storeProductId],
  );
  const storeValue = storeProduct?.preco ?? 0;

  const valorUpgrade = storeValue - clientValue;

  const getFeeForParcelas = (n: number) => {
    const pct = gatewayFees[n] ?? DEFAULT_FEE_PCT;
    return pct / 100;
  };

  const produtoObjs = itensProduto
    .map((item) => products.find((p) => p.id === item.produtoId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const valorTotal = produtoObjs.reduce((s, p) => s + p.preco, 0);

  const numParcelasOrcamento = parseInt(parcelasOrcamento) || 1;
  const feeParcelasOrcamento = getFeeForParcelas(numParcelasOrcamento);
  const entradaPixOrcamentoNum = parseFloat(String(entradaPixOrcamento || "").replace(",", ".")) || 0;
  const restanteOrcamento =
    tipoPagamentoOrcamento === "pix_entrada_cartao" && valorTotal > 0
      ? Math.max(0, valorTotal - entradaPixOrcamentoNum)
      : valorTotal;
  const valorParcelaOrcamento =
    restanteOrcamento > 0 ? (restanteOrcamento * (1 + feeParcelasOrcamento)) / numParcelasOrcamento : 0;

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

    const linhasProdutos = produtoObjs.map((p) => `- ${p.nome}`);

    const formaTexto =
      tipoPagamentoOrcamento === "pix_entrada_cartao"
        ? `Valor total produto: ${formatCurrency(valorTotal)}\nEntrada Pix - ${formatCurrency(entradaPixOrcamentoNum)}\nParcelamento - ${numParcelasOrcamento}x de ${formatCurrency(valorParcelaOrcamento)}`
        : `Pix total - ${formatCurrency(valorTotal)}\nParcelamento - ${numParcelasOrcamento}x de ${formatCurrency(valorParcelaOrcamento)}`;

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
                  <Label>iPhone (catálogo)</Label>
                  <Select value={storeProductId} onValueChange={setStoreProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o iPhone" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((p) => p.categoria === "iPhone")
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} — {formatCurrency(p.preco)}
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
                      storeProduct ? formatCurrency(storeProduct.preco) : ""
                    }
                    placeholder="Selecione um iPhone do catálogo"
                  />
                  {storeProductId && !storeProduct && (
                    <p className="text-xs text-muted-foreground">Produto não encontrado no catálogo.</p>
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
                <Select
                  value={tipoPagamentoOrcamento}
                  onValueChange={(v) => setTipoPagamentoOrcamento(v as "pix_total" | "pix_entrada_cartao")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix_total">Pix à vista</SelectItem>
                    <SelectItem value="pix_entrada_cartao">Entrada Pix + Cartão</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium">Pix à vista</p>
                    <p className="text-sm text-muted-foreground">
                      Pix total - <span className="font-medium text-foreground">{formatCurrency(valorTotal)}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                    <Label className="text-sm font-medium">Parcelamento (1–12x)</Label>
                    <Select value={parcelasOrcamento} onValueChange={setParcelasOrcamento}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de {formatCurrency(restanteOrcamento > 0 ? (restanteOrcamento * (1 + getFeeForParcelas(n))) / n : 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Taxa do gateway: {(feeParcelasOrcamento * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {tipoPagamentoOrcamento === "pix_entrada_cartao" && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Entrada Pix (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={entradaPixOrcamento}
                    onChange={(e) => setEntradaPixOrcamento(e.target.value)}
                    placeholder="0,00"
                  />
                  {valorTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Restante no cartão: <span className="font-medium text-foreground">{formatCurrency(restanteOrcamento)}</span>
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
