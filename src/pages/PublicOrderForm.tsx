import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  QrCode,
  Wallet,
  CreditCard,
  Layers,
  User,
  Heart,
  Flower2,
  UserMinus,
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Monitor,
  Box,
  Package,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import logoApple from "@/assets/simbolo apple.png";
import { CATEGORIES, formatCurrency } from "@/lib/mock-data";
import { useProducts, useGatewayFees } from "@/hooks/useFirestore";
import { addClient, addOrder } from "@/lib/firestore";
import { toast } from "sonner";

const PAYMENT_METHODS: { value: string; label: string; Icon: typeof QrCode }[] = [
  { value: "Pix total", label: "Pix total", Icon: QrCode },
  { value: "Pix entrada + cartão de crédito", label: "Pix entrada + cartão de crédito", Icon: Wallet },
  { value: "Cartão de crédito total", label: "Cartão de crédito total", Icon: CreditCard },
  { value: "2 cartões de crédito", label: "2 cartões de crédito", Icon: Layers },
];

const ESTADO_CIVIL_OPTIONS: { value: string; label: string; Icon: typeof User }[] = [
  { value: "solteiro", label: "Solteiro(a)", Icon: User },
  { value: "casado", label: "Casado(a)", Icon: Heart },
  { value: "viúvo", label: "Viúvo(a)", Icon: Flower2 },
  { value: "separado", label: "Separado(a)", Icon: UserMinus },
];

const CATEGORY_ICONS: Record<string, typeof Package> = {
  iPhone: Smartphone,
  iPad: Tablet,
  MacBook: Laptop,
  "Apple Watch": Watch,
  iMac: Monitor,
  "Mac Mini": Box,
  AirPods: Package,
  Acessórios: Package,
};

const DEFAULT_FEE_PCT = 2.99;

export default function PublicOrderForm({
  onSuccess,
  embedded,
}: {
  onSuccess?: () => void;
  embedded?: boolean;
}) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [profissao, setProfissao] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [autorizaInstagram, setAutorizaInstagram] = useState("");
  type ItemProduto = { categoria: string; produtoId: string };
  const [itensProduto, setItensProduto] = useState<ItemProduto[]>([{ categoria: "", produtoId: "" }]);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [entradaPix, setEntradaPix] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [valorCartao1, setValorCartao1] = useState("");
  const [parcelasCartao1, setParcelasCartao1] = useState("");
  const [parcelasCartao2, setParcelasCartao2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: products = [] } = useProducts();
  const { data: gatewayFees = {} } = useGatewayFees();

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
  const valorParcelaCartao1 = isDoisCartoes && valorCartao1Num > 0 ? (valorCartao1Num * (1 + feeCartao1)) / numParcelasCartao1 : 0;
  const valorParcelaCartao2 = isDoisCartoes && valorCartao2Num > 0 ? (valorCartao2Num * (1 + feeCartao2)) / numParcelasCartao2 : 0;

  const numParcelas = parseInt(parcelas) || 1;
  const feeParcelas = getFeeForParcelas(numParcelas);
  const valorParcela = needsInstallments && !isDoisCartoes ? (valorRestante * (1 + feeParcelas)) / numParcelas : 0;

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.erro) {
            setRua(data.logradouro || "");
            setBairro(data.bairro || "");
            setCidade(data.localidade || "");
            setEstado(data.uf || "");
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCep(false));
    }
  }, [cep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const temTodosProdutos = itensProduto.every((item) => item.categoria && item.produtoId);
    if (!nome || !cpf || !email || !formaPagamento || !temTodosProdutos || produtoObjs.length === 0) {
      toast.error("Preencha todos os campos obrigatórios, incluindo ao menos um produto.");
      return;
    }
    setSubmitting(true);
    try {
      const dataCadastro = new Date().toISOString().slice(0, 10);
      const clientId = await addClient({
        nome: nome.trim(),
        cpf: cpf.trim(),
        rg: "",
        data_nascimento: dataNascimento.trim(),
        nacionalidade: nacionalidade.trim(),
        estado_civil: estadoCivil.trim(),
        profissao: profissao.trim(),
        celular: celular.trim(),
        email: email.trim(),
        cep: cep.trim(),
        rua: rua.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        autoriza_instagram: autorizaInstagram === "sim",
        data_cadastro: dataCadastro,
      });
      const valor = valorTotal;
      const entradaPixVal = formaPagamento === "Pix entrada + cartão de crédito" ? parseFloat(entradaPix) || 0 : 0;
      const orderPayload: Parameters<typeof addOrder>[0] = {
        cliente_id: clientId,
        cliente_nome: nome.trim(),
        produto: produtoObjs.length === 1 ? produtoObjs[0].nome : `Vários (${produtoObjs.length} itens)`,
        categoria: produtoObjs.length === 1 ? produtoObjs[0].categoria : "Vários",
        valor,
        produtos: produtoObjs.map((p) => ({ nome: p.nome, categoria: p.categoria, preco: p.preco })),
        forma_pagamento: formaPagamento,
        status: "Contrato pendente",
        status_pedido: "pendente",
        data: dataCadastro,
      };
      if (formaPagamento === "Pix entrada + cartão de crédito") {
        orderPayload.entrada_pix = entradaPixVal;
        orderPayload.parcelas = numParcelas;
        orderPayload.valor_parcela = valorParcela;
      } else if (formaPagamento === "Cartão de crédito total") {
        orderPayload.parcelas = numParcelas;
        orderPayload.valor_parcela = valorParcela;
      } else if (formaPagamento === "2 cartões de crédito") {
        orderPayload.parcelas = numParcelasCartao1;
        orderPayload.valor_parcela = valorParcelaCartao1;
        orderPayload.parcelas_cartao2 = numParcelasCartao2;
        orderPayload.valor_parcela_cartao2 = valorParcelaCartao2;
      }
      await addOrder(orderPayload);
      onSuccess?.();

      const tipoPagamento =
        formaPagamento === "Pix total"
          ? "pix"
          : formaPagamento === "Pix entrada + cartão de crédito"
            ? "pix_cartao"
            : formaPagamento === "2 cartões de crédito"
              ? "dois_cartoes"
              : "cartao";

      let ipCliente = "";
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const json = await res.json();
        ipCliente = json.ip ?? "";
      } catch {
        // ignora falha de IP
      }

      const modContrato = await import("@/lib/contrato");
      const { buildDadosContrato, gerarHtmlContrato, getHtmlConteudoParaPdf, abrirContratoEmNovaAba } = modContrato;

      const dadosContrato = buildDadosContrato({
        nome,
        nacionalidade,
        estadoCivil,
        profissao,
        cpf,
        email,
        rua,
        numero,
        complemento: complemento || undefined,
        bairro,
        cidade,
        estado,
        cep,
        celular,
        produtos: produtoObjs.map((p) => ({ nome: p.nome, categoria: p.categoria, preco: p.preco })),
        valorTotal: valor,
        valorEntrada: formaPagamento === "Pix entrada + cartão de crédito" ? entradaPixVal : undefined,
        parcelas: isDoisCartoes ? undefined : numParcelas,
        valorParcela: isDoisCartoes ? undefined : (needsInstallments ? valorParcela : undefined),
        parcelasCartao1: isDoisCartoes ? numParcelasCartao1 : undefined,
        valorParcelaCartao1: isDoisCartoes ? valorParcelaCartao1 : undefined,
        parcelasCartao2: isDoisCartoes ? numParcelasCartao2 : undefined,
        valorParcelaCartao2: isDoisCartoes ? valorParcelaCartao2 : undefined,
        tipoPagamento: tipoPagamento as "pix" | "pix_cartao" | "cartao" | "dois_cartoes",
      });
      dadosContrato.ip_cliente = ipCliente;

      const htmlContrato = gerarHtmlContrato(dadosContrato);
      const htmlParaPdf = getHtmlConteudoParaPdf(dadosContrato);

      try {
        const { gerarPdfDeHtml } = await import("@/lib/gerarPdf");
        const nomeArquivo = `Contrato_${nome.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
        await gerarPdfDeHtml(htmlParaPdf, nomeArquivo);
        toast.success("Pedido enviado! O PDF do contrato foi baixado.");
      } catch (_pdfErr) {
        abrirContratoEmNovaAba(htmlContrato);
        toast.success(
          "Pedido enviado! O contrato abriu em nova aba. Use Ctrl+P (ou Cmd+P) e escolha \"Salvar como PDF\" para gerar o PDF."
        );
      }
    } catch (err: unknown) {
      let msg = "Erro ao enviar pedido. Tente novamente.";
      if (err instanceof Error) {
        msg = err.message;
        if (err.message.includes("permission") || err.message.includes("Permission") || err.message.includes("insufficient"))
          msg = "Erro de permissão no banco de dados. Verifique as regras do Firestore (veja FIREBASE-REGRAS.md).";
      }
      toast.error(msg);
      console.error("Erro no formulário:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const SectionTitle = ({
    step,
    title,
    icon: Icon,
  }: {
    step: number;
    title: string;
    icon?: typeof User;
  }) => (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">{step}</span>
        </div>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
    </CardHeader>
  );

  return (
    <div
      className={
        embedded
          ? "w-full min-h-0 bg-transparent py-0 px-0"
          : "min-h-screen min-h-dvh bg-muted/40 py-6 px-3 sm:py-10 sm:px-4"
      }
    >
      <div className="max-w-xl mx-auto space-y-4 sm:space-y-5 w-full min-w-0">
        {/* Header */}
        <div className="text-center space-y-3 pb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-card p-2 shrink-0">
            <img src={logoApple} alt="Apple Meninas" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Apple Meninas</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">Preencha seus dados para finalizar seu pedido</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Data */}
          <Card>
            <SectionTitle step={1} title="Dados Pessoais" icon={User} />
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome completo *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">CPF *</Label>
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Data de nascimento</Label>
                  <Input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Nacionalidade *</Label>
                <Input value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Estado civil *</Label>
                  <Select value={estadoCivil} onValueChange={setEstadoCivil}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ESTADO_CIVIL_OPTIONS.map(({ value, label, Icon }) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Profissão *</Label>
                  <Input value={profissao} onChange={(e) => setProfissao(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <SectionTitle step={2} title="Contato" icon={Phone} />
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Celular *</Label>
                  <Input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="(00) 00000-0000" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <SectionTitle step={3} title="Endereço" icon={MapPin} />
            <CardContent className="space-y-3">
              <div className="max-w-[180px] space-y-1.5">
                <Label className="text-sm">CEP *</Label>
                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" required />
                {loadingCep && <p className="text-xs text-muted-foreground">Buscando...</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm">Rua</Label>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Número *</Label>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Complemento</Label>
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Bairro</Label>
                  <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Cidade</Label>
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Estado</Label>
                  <Input value={estado} onChange={(e) => setEstado(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instagram */}
          <Card>
            <SectionTitle step={4} title="Autorização" icon={ShieldCheck} />
            <CardContent>
              <Label className="text-sm mb-3 block">Você autoriza ser mencionado no Instagram?</Label>
              <RadioGroup value={autorizaInstagram} onValueChange={setAutorizaInstagram} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sim" id="ig-sim" />
                  <Label htmlFor="ig-sim" className="cursor-pointer text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Sim
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="nao" id="ig-nao" />
                  <Label htmlFor="ig-nao" className="cursor-pointer text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Não
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Product */}
          <Card>
            <SectionTitle step={5} title="Qual produto Apple você quer adquirir?" icon={Package} />
            <CardContent className="space-y-3">
              {itensProduto.map((item, index) => {
                const produtosFiltrados = products.filter((p) => p.categoria === item.categoria);
                return (
                  <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Produto {itensProduto.length > 1 ? index + 1 : ""}</span>
                      {itensProduto.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setItensProduto((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Categoria *</Label>
                      <Select
                        value={item.categoria}
                        onValueChange={(v) =>
                          setItensProduto((prev) =>
                            prev.map((it, i) => (i === index ? { ...it, categoria: v, produtoId: "" } : it))
                          )
                        }
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => {
                            const CatIcon = CATEGORY_ICONS[c] ?? Package;
                            return (
                              <SelectItem key={c} value={c}>
                                <span className="flex items-center gap-2">
                                  <CatIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
                        <Label className="text-sm">Produto *</Label>
                        <Select
                          value={item.produtoId}
                          onValueChange={(v) =>
                            setItensProduto((prev) => prev.map((it, i) => (i === index ? { ...it, produtoId: v } : it)))
                          }
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                          <SelectContent>
                            {produtosFiltrados.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="flex items-center gap-2">
                                  <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                                  {p.nome} — {formatCurrency(p.preco)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {products.find((p) => p.id === item.produtoId) && (
                      <div className="p-3 bg-background rounded border">
                        <p className="font-medium text-sm">{products.find((p) => p.id === item.produtoId)!.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.categoria}</p>
                        <p className="text-base font-semibold text-primary mt-1">{formatCurrency(products.find((p) => p.id === item.produtoId)!.preco)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setItensProduto((prev) => [...prev, { categoria: "", produtoId: "" }])}
              >
                Adicionar produto
              </Button>
              {valorTotal > 0 && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-medium text-sm">Total ({produtoObjs.length} {produtoObjs.length === 1 ? "produto" : "produtos"})</p>
                  <p className="text-lg font-semibold text-primary mt-1">{formatCurrency(valorTotal)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <SectionTitle step={6} title="Forma de Pagamento" icon={CreditCard} />
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Como deseja pagar? *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
                  <Input type="number" value={entradaPix} onChange={(e) => setEntradaPix(e.target.value)} placeholder="0" />
                  {valorTotal > 0 && entradaPix && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Restante no cartão: {formatCurrency(valorRestante)}
                    </p>
                  )}
                </div>
              )}

              {formaPagamento === "2 cartões de crédito" && valorTotal > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <SelectTrigger><SelectValue placeholder="Parcelas" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x de {formatCurrency(valorCartao1Num > 0 ? (valorCartao1Num * (1 + getFeeForParcelas(n))) / n : 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {parcelasCartao1 && valorCartao1Num > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {parcelasCartao1}x de {formatCurrency(valorParcelaCartao1)} (taxa {(getFeeForParcelas(numParcelasCartao1) * 100).toFixed(2)}%)
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                      <Label className="text-sm font-medium">2º cartão</Label>
                      <p className="text-sm text-muted-foreground">
                        Valor: {formatCurrency(valorCartao2Num)}
                      </p>
                      <Select value={parcelasCartao2} onValueChange={setParcelasCartao2}>
                        <SelectTrigger><SelectValue placeholder="Parcelas" /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}x de {formatCurrency(valorCartao2Num > 0 ? (valorCartao2Num * (1 + getFeeForParcelas(n))) / n : 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {parcelasCartao2 && valorCartao2Num > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {parcelasCartao2}x de {formatCurrency(valorParcelaCartao2)} (taxa {(getFeeForParcelas(numParcelasCartao2) * 100).toFixed(2)}%)
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {needsInstallments && !isDoisCartoes && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Parcelas</Label>
                  <Select value={parcelas} onValueChange={setParcelas}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full min-h-[48px] touch-manipulation" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </div>
    </div>
  );
}
