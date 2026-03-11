import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGatewayFees, useSetGatewayFees, useCalculatorValues, useSetCalculatorValues, useUserProfile, useSetUserProfile } from "@/hooks/useFirestore";
import { useAuth } from "@/contexts/AuthContext";
import type { GatewayFees } from "@/lib/firestore";
import { CLIENT_MODELS, STORE_MODELS, STORAGES, calculatorKey } from "@/lib/calculadora";
import { toast } from "sonner";
import { Calculator, ChevronDown, ChevronUp, Building2, Percent, Plug, User as UserIcon } from "lucide-react";

function parseVal(v: string): number {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: gatewayFees = {}, isLoading: loadingFees } = useGatewayFees();
  const setGatewayFees = useSetGatewayFees();
  const [fees, setFees] = useState<GatewayFees>(() => {
    const f: GatewayFees = {};
    for (let i = 1; i <= 12; i++) f[i] = 2.99;
    return f;
  });

  const { data: calculatorValues = { tradeIn: {}, store: {} }, isLoading: loadingCalc } = useCalculatorValues();
  const setCalculatorValues = useSetCalculatorValues();
  const [tradeIn, setTradeIn] = useState<Record<string, number>>({});
  const [storePrices, setStorePrices] = useState<Record<string, number>>({});
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [integracoesOpen, setIntegracoesOpen] = useState(false);
  const calculatorSynced = useRef(false);

  const userId = user?.uid;
  const userEmail = user?.email ?? "";
  const { data: profile } = useUserProfile(userId);
  const setUserProfileMutation = useSetUserProfile();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Object.keys(gatewayFees).length > 0) setFees({ ...gatewayFees });
  }, [gatewayFees]);

  useEffect(() => {
    if (loadingCalc) return;
    if (!calculatorSynced.current) {
      calculatorSynced.current = true;
      setTradeIn({ ...calculatorValues.tradeIn });
      setStorePrices({ ...calculatorValues.store });
    }
  }, [loadingCalc, calculatorValues.tradeIn, calculatorValues.store]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(profile?.displayName || user.displayName || userEmail.split("@")[0] || "");
    setPhotoURL(profile?.photoURL || user.photoURL || undefined);
  }, [user, userEmail, profile?.displayName, profile?.photoURL]);

  const handleFeeChange = (parcelas: number, value: string) => {
    const num = parseFloat(value.replace(",", "."));
    setFees((prev) => ({ ...prev, [parcelas]: Number.isNaN(num) || num < 0 ? 0 : num }));
  };

  const handleTradeInChange = (model: string, storage: number, value: string) => {
    const key = calculatorKey(model, storage);
    setTradeIn((prev) => ({ ...prev, [key]: parseVal(value) }));
  };

  const handleStorePriceChange = (model: string, storage: number, value: string) => {
    const key = calculatorKey(model, storage);
    setStorePrices((prev) => ({ ...prev, [key]: parseVal(value) }));
  };

  const handleSaveGatewayFees = async () => {
    try {
      await setGatewayFees.mutateAsync(fees);
      toast.success("Taxas do gateway salvas.");
    } catch {
      toast.error("Erro ao salvar taxas. Tente novamente.");
    }
  };

  const handleSaveCalculatorData = async () => {
    try {
      await setCalculatorValues.mutateAsync({
        tradeIn: { ...tradeIn },
        store: { ...storePrices },
      });
      toast.success("Dados da calculadora salvos. O cálculo de upgrade usará esses valores automaticamente.");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const handleSaveUserProfile = async () => {
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    try {
      await setUserProfileMutation.mutateAsync({
        userId,
        profile: {
          displayName: displayName || undefined,
          photoURL: photoURL || undefined,
          email: userEmail || undefined,
        },
      });
      toast.success("Perfil atualizado.");
    } catch {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurações gerais do sistema</p>
      </div>

      <Card className="w-full max-w-2xl min-w-0 shadow-card">
        <Collapsible open={empresaOpen} onOpenChange={setEmpresaOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {photoURL ? (
                    <AvatarImage src={photoURL} alt={displayName || userEmail} />
                  ) : (
                    <AvatarFallback>
                      {(displayName || userEmail || "U")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Usuário
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nome e foto do usuário logado.
                  </p>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
                  {empresaOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver mais
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {photoURL ? (
                    <AvatarImage src={photoURL} alt={displayName || userEmail} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {(displayName || userEmail || "U")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Nome</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">URL da foto (opcional)</Label>
                    <Input
                      value={photoURL ?? ""}
                      onChange={(e) => setPhotoURL(e.target.value || undefined)}
                      placeholder="https://exemplo.com/sua-foto.jpg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Email</Label>
                    <Input value={userEmail} disabled className="bg-muted/60" />
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={handleSaveUserProfile} disabled={setUserProfileMutation.isPending}>
                {setUserProfileMutation.isPending ? "Salvando..." : "Salvar perfil"}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="w-full max-w-2xl min-w-0 shadow-card">
        <Collapsible open={gatewayOpen} onOpenChange={setGatewayOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Taxas do Gateway de Pagamento
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Taxa (%) por parcelamento (1x a 12x) no formulário do cliente.
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
                  {gatewayOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver mais
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="space-y-1.5">
                    <Label className="text-sm">{n}x</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="2,99"
                      value={fees[n] != null ? String(fees[n]) : ""}
                      onChange={(e) => handleFeeChange(n, e.target.value)}
                      disabled={loadingFees}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveGatewayFees} disabled={setGatewayFees.isPending || loadingFees} size="sm">
                {setGatewayFees.isPending ? "Salvando..." : "Salvar taxas"}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="w-full max-w-2xl min-w-0 shadow-card">
        <Collapsible open={calculatorOpen} onOpenChange={setCalculatorOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Dados da calculadora
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Valores de troca e preços da loja por modelo e memória.
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
                  {calculatorOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver mais
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valores de troca (iPhone do cliente)</Label>
                <p className="text-xs text-muted-foreground">iPhone 13 ao 16 Pro Max · R$ por modelo/memória</p>
                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/50">
                        <th className="text-left p-2 font-medium">Modelo</th>
                        {STORAGES.map((s) => (
                          <th key={s.value} className="p-2 font-medium text-center min-w-[3.5rem]">{s.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CLIENT_MODELS.map((model) => (
                        <tr key={model} className="border-b border-border/60 last:border-0">
                          <td className="p-2 font-medium whitespace-nowrap text-xs">{model}</td>
                          {STORAGES.map((s) => (
                            <td key={s.value} className="p-1">
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                className="h-8 text-center text-xs"
                                value={tradeIn[calculatorKey(model, s.value)] ?? ""}
                                onChange={(e) => handleTradeInChange(model, s.value, e.target.value)}
                                disabled={loadingCalc}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Preços loja (lacrados)</Label>
                <p className="text-xs text-muted-foreground">iPhone 14 ao 17 Pro Max · R$ por modelo/memória</p>
                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/50">
                        <th className="text-left p-2 font-medium">Modelo</th>
                        {STORAGES.map((s) => (
                          <th key={s.value} className="p-2 font-medium text-center min-w-[3.5rem]">{s.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STORE_MODELS.map((model) => (
                        <tr key={model} className="border-b border-border/60 last:border-0">
                          <td className="p-2 font-medium whitespace-nowrap text-xs">{model}</td>
                          {STORAGES.map((s) => (
                            <td key={s.value} className="p-1">
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                className="h-8 text-center text-xs"
                                value={storePrices[calculatorKey(model, s.value)] ?? ""}
                                onChange={(e) => handleStorePriceChange(model, s.value, e.target.value)}
                                disabled={loadingCalc}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleSaveCalculatorData} disabled={setCalculatorValues.isPending || loadingCalc} size="sm">
                {setCalculatorValues.isPending ? "Salvando..." : "Salvar dados da calculadora"}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="w-full max-w-2xl min-w-0 shadow-card">
        <Collapsible open={integracoesOpen} onOpenChange={setIntegracoesOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Plug className="h-5 w-5" />
                  Integrações
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Chaves de API para assinatura e pagamento.
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
                  {integracoesOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Ver mais
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <Label className="text-sm">API Key Autentique</Label>
                <Input type="password" placeholder="Chave da API Autentique" />
              </div>
              <Button size="sm">Salvar</Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
