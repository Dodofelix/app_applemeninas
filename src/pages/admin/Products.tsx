import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useAddProduct, useSeedInitialProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/useFirestore";
import { CATEGORIES, formatCurrency, mockProducts } from "@/lib/mock-data";
import { toast } from "sonner";

const initialCatalog: Omit<import("@/lib/mock-data").Product, "id">[] = mockProducts.map(
  ({ id: _, ...p }) => p
);

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const addProduct = useAddProduct();
  const seedProducts = useSeedInitialProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [lancamento, setLancamento] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editLancamento, setEditLancamento] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todos");

  const handleAdd = async () => {
    if (!nome || !categoria || !preco) {
      toast.error("Preencha todos os campos");
      return;
    }
    const precoNum = parseFloat(preco);
    if (Number.isNaN(precoNum) || precoNum <= 0) {
      toast.error("Preço inválido");
      return;
    }
    const lanc = lancamento.trim() ? Number(lancamento) : undefined;
    if (lancamento.trim() && (Number.isNaN(lanc) || (lanc as number) <= 0)) {
      toast.error("Lançamento inválido");
      return;
    }
    try {
      await addProduct.mutateAsync({ nome: nome.trim(), categoria, preco: precoNum, lancamento: lanc });
      setNome("");
      setCategoria("");
      setPreco("");
      setLancamento("");
      setOpen(false);
      toast.success("Produto cadastrado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar produto. Tente novamente.";
      toast.error(message);
      console.error("Erro ao cadastrar produto:", err);
    }
  };

  const openEdit = (product: import("@/lib/mock-data").Product) => {
    setEditId(product.id);
    setEditNome(product.nome);
    setEditCategoria(product.categoria);
    setEditPreco(String(product.preco));
    setEditLancamento(product.lancamento ? String(product.lancamento) : "");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId || !editNome || !editCategoria || !editPreco) {
      toast.error("Preencha todos os campos");
      return;
    }
    const precoNum = parseFloat(editPreco);
    if (Number.isNaN(precoNum) || precoNum <= 0) {
      toast.error("Preço inválido");
      return;
    }
    const lanc = editLancamento.trim() ? Number(editLancamento) : undefined;
    if (editLancamento.trim() && (Number.isNaN(lanc) || (lanc as number) <= 0)) {
      toast.error("Lançamento inválido");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: editId,
        data: { nome: editNome.trim(), categoria: editCategoria, preco: precoNum, lancamento: lanc },
      });
      setEditOpen(false);
      toast.success("Produto atualizado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar produto. Tente novamente.";
      toast.error(message);
      console.error("Erro ao atualizar produto:", err);
    }
  };

  const handleDelete = async (product: import("@/lib/mock-data").Product) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${product.nome}"?`)) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Produto excluído com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao excluir produto. Tente novamente.";
      toast.error(message);
      console.error("Erro ao excluir produto:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o catálogo de produtos Apple</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome do produto</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="iPhone 15 Pro Max 256GB" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Preço (R$)</Label>
                <Input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="9499" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Lançamento (ano/ordem)</Label>
                <Input
                  type="number"
                  value={lancamento}
                  onChange={(e) => setLancamento(e.target.value)}
                  placeholder="Ex: 2022"
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={addProduct.isPending}>
                Cadastrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Nome do produto</Label>
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="iPhone 15 Pro Max 256GB"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Categoria</Label>
                <Select value={editCategoria} onValueChange={setEditCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Preço (R$)</Label>
                <Input
                  type="number"
                  value={editPreco}
                  onChange={(e) => setEditPreco(e.target.value)}
                  placeholder="9499"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Lançamento (ano/ordem)</Label>
                <Input
                  type="number"
                  value={editLancamento}
                  onChange={(e) => setEditLancamento(e.target.value)}
                  placeholder="Ex: 2022"
                />
              </div>
              <Button
                onClick={handleUpdate}
                className="w-full"
                disabled={updateProduct.isPending}
              >
                Salvar alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Catálogo de produtos</CardTitle>
          <p className="text-sm text-muted-foreground">Produtos disponíveis para venda</p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="px-4 pb-3 pt-3 border-b border-border/60 flex gap-2 overflow-x-auto">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                categoriaFiltro === "Todos"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/60"
              }`}
              onClick={() => setCategoriaFiltro("Todos")}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  categoriaFiltro === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/60"
                }`}
                onClick={() => setCategoriaFiltro(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {(() => {
            const filtered =
              categoriaFiltro === "Todos"
                ? products
                : products.filter((p) => p.categoria === categoriaFiltro);
            const list = filtered;
            const hasProducts = list.length > 0;
            return (
              <>
          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[320px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs">Preço</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : !hasProducts ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-muted-foreground">
                        {products.length === 0
                          ? "Nenhum produto na base."
                          : `Nenhum produto na categoria "${categoriaFiltro}".`}
                      </p>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await seedProducts.mutateAsync(initialCatalog);
                            toast.success("Catálogo inicial criado na base de dados!");
                          } catch {
                            toast.error("Erro ao criar catálogo. Tente novamente.");
                          }
                        }}
                        disabled={seedProducts.isPending}
                      >
                        {seedProducts.isPending ? "Criando..." : "Criar catálogo inicial na base"}
                      </Button>
                      <p className="text-xs text-muted-foreground">ou use &quot;Novo Produto&quot; para cadastrar um a um.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.categoria}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(p.preco)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive border-destructive/40"
                          onClick={() => handleDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
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
            {!isLoading && !hasProducts && (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-muted-foreground text-center">
                  {products.length === 0
                    ? "Nenhum produto na base."
                    : `Nenhum produto na categoria "${categoriaFiltro}".`}
                </p>
                {products.length === 0 && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await seedProducts.mutateAsync(initialCatalog);
                          toast.success("Catálogo inicial criado na base de dados!");
                        } catch {
                          toast.error("Erro ao criar catálogo. Tente novamente.");
                        }
                      }}
                      disabled={seedProducts.isPending}
                    >
                      {seedProducts.isPending ? "Criando..." : "Criar catálogo inicial na base"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      ou use &quot;Novo Produto&quot; para cadastrar um a um.
                    </p>
                  </>
                )}
              </div>
            )}
            {!isLoading &&
              hasProducts &&
              list.map((p) => (
                <Card key={p.id} className="border bg-card p-4 shadow-sm space-y-3">
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nome:</span>{" "}
                      <span className="font-medium">{p.nome}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Categoria:</span> {p.categoria}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Preço:</span> {formatCurrency(p.preco)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40"
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
