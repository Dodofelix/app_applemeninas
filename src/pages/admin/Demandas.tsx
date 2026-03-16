          <p className="font-medium text-sm leading-tight break-words">{card.title || "Sem título"}</p>
          {card.descricao && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{card.descricao}</p>
          )}    setEditingCard(card);
    setEditCardTitle(card.title);
    setEditCardResponsible(card.responsible);
    setEditCardDueDate(card.dueDate || "");
    setEditCardDescricao(card.descricao || "");import { useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Pencil, Trash2, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemandColumns, useDemandCards, useAddDemandColumn, useUpdateDemandColumn, useDeleteDemandColumn, useAddDemandCard, useUpdateDemandCard, useDeleteDemandCard } from "@/hooks/useFirestore";
import type { DemandColumn, DemandCard } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDueDate(value: string): string {
  if (!value) return "—";
  const d = value.length === 10 ? parseISO(value) : new Date(value);
  return isValid(d) ? format(d, "dd/MM/yyyy", { locale: ptBR }) : value;
}

function DemandCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: DemandCard;
  onEdit: (card: DemandCard) => void;
  onDelete: (card: DemandCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-grab active:cursor-grabbing border-border/80 bg-card shadow-sm",
        isDragging && "opacity-90 shadow-md ring-2 ring-primary/20 z-10"
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 touch-none shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight break-words">{card.title || "Sem título"}</p>
          {card.responsible && (
            <p className="text-xs text-muted-foreground mt-1 truncate" title={card.responsible}>
              Responsável: {card.responsible}
            </p>
          )}
          {card.dueDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Entrega: {formatDueDate(card.dueDate)}
            </p>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(card)} title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(card)} title="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DemandColumnWithDroppable({
  column,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onEditColumn,
  onDeleteColumn,
}: {
  column: DemandColumn;
  cards: DemandCard[];
  onAddCard: (columnId: string) => void;
  onEditCard: (card: DemandCard) => void;
  onDeleteCard: (card: DemandCard) => void;
  onEditColumn: (col: DemandColumn) => void;
  onDeleteColumn: (col: DemandColumn) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const cardIds = cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[280px] shrink-0 rounded-xl border bg-muted/40 flex flex-col min-h-[200px] transition-colors",
        isOver && "ring-2 ring-primary/30 bg-muted/60"
      )}
    >
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm truncate">{column.title}</h3>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditColumn(column)} title="Editar coluna">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDeleteColumn(column)} title="Excluir coluna">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0">
          {cards.map((card) => (
            <DemandCardItem
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>
      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => onAddCard(column.id)}>
          <Plus className="h-4 w-4" />
          Adicionar demanda
        </Button>
      </div>
    </div>
  );
}

export default function Demandas() {
  const { data: columns = [], isLoading: colsLoading } = useDemandColumns();
  const { data: cards = [], isLoading: cardsLoading } = useDemandCards();
  const addColumn = useAddDemandColumn();
  const updateColumn = useUpdateDemandColumn();
  const deleteColumn = useDeleteDemandColumn();
  const addCard = useAddDemandCard();
  const updateCard = useUpdateDemandCard();
  const deleteCard = useDeleteDemandCard();

  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editColumnOpen, setEditColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<DemandColumn | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");

  const [addCardColumnId, setAddCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardResponsible, setNewCardResponsible] = useState("");
  const [newCardDueDate, setNewCardDueDate] = useState("");
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DemandCard | null>(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardResponsible, setEditCardResponsible] = useState("");
  const [editCardDueDate, setEditCardDueDate] = useState("");

  const [activeCard, setActiveCard] = useState<DemandCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  }, [cards]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;
      const card = cards.find((c) => c.id === active.id);
      if (!card) return;

      const overId = String(over.id);
      const isColumn = columns.some((col) => col.id === overId);
      const overCard = cards.find((c) => c.id === overId);

      let targetColumnId: string;
      let newOrder: number;

      if (isColumn) {
        targetColumnId = overId;
        const inColumn = cards.filter((c) => c.columnId === overId);
        newOrder = inColumn.length;
      } else if (overCard) {
        targetColumnId = overCard.columnId;
        const inColumn = cards.filter((c) => c.columnId === targetColumnId).sort((a, b) => a.order - b.order);
        const overIndex = inColumn.findIndex((c) => c.id === overCard.id);
        newOrder = overIndex >= 0 ? overIndex : inColumn.length;
      } else {
        return;
      }

      if (card.columnId === targetColumnId && card.order === newOrder) return;

      const targetCards = cards
        .filter((c) => c.columnId === targetColumnId && c.id !== card.id)
        .sort((a, b) => a.order - b.order);
      const newOrders: { id: string; order: number }[] = [];
      let idx = 0;
      for (const c of targetCards) {
        if (idx === newOrder) idx++;
        newOrders.push({ id: c.id, order: idx });
        idx++;
      }
      newOrders.push({ id: card.id, order: newOrder });
      newOrders.sort((a, b) => a.order - b.order);
      for (let i = 0; i < newOrders.length; i++) {
        newOrders[i].order = i;
      }

      try {
        await updateCard.mutateAsync({
          id: card.id,
          data: { columnId: targetColumnId, order: newOrders.find((x) => x.id === card.id)!.order },
        });
        for (const { id, order } of newOrders) {
          if (id !== card.id) {
            await updateCard.mutateAsync({ id, data: { order } });
          }
        }
        toast.success("Demanda movida.");
      } catch {
        toast.error("Erro ao mover demanda.");
      }
    },
    [cards, columns, updateCard]
  );

  const openAddColumn = () => {
    setNewColumnTitle("");
    setAddColumnOpen(true);
  };

  const handleAddColumn = async () => {
    const title = newColumnTitle.trim();
    if (!title) {
      toast.error("Digite o nome da coluna.");
      return;
    }
    try {
      await addColumn.mutateAsync({ title, order: columns.length });
      setAddColumnOpen(false);
      setNewColumnTitle("");
      toast.success("Coluna criada.");
    } catch {
      toast.error("Erro ao criar coluna.");
    }
  };

  const openEditColumn = (col: DemandColumn) => {
    setEditingColumn(col);
    setEditColumnTitle(col.title);
    setEditColumnOpen(true);
  };

  const handleEditColumn = async () => {
    if (!editingColumn) return;
    const title = editColumnTitle.trim();
    if (!title) {
      toast.error("Digite o nome da coluna.");
      return;
    }
    try {
      await updateColumn.mutateAsync({ id: editingColumn.id, data: { title } });
      setEditColumnOpen(false);
      setEditingColumn(null);
      toast.success("Coluna atualizada.");
    } catch {
      toast.error("Erro ao atualizar coluna.");
    }
  };

  const handleDeleteColumn = async (col: DemandColumn) => {
    if (!confirm(`Excluir a coluna "${col.title}"? As demandas desta coluna serão excluídas.`)) return;
    try {
      const inCol = cards.filter((c) => c.columnId === col.id);
      for (const c of inCol) await deleteCard.mutateAsync(c.id);
      await deleteColumn.mutateAsync(col.id);
      toast.success("Coluna excluída.");
    } catch {
      toast.error("Erro ao excluir coluna.");
    }
  };

  const openAddCard = (columnId: string) => {
    setAddCardColumnId(columnId);
    setNewCardTitle("");
    setNewCardResponsible("");
    setNewCardDueDate("");
    setNewCardDescricao("");
  };

  const handleAddCard = async () => {
    if (!addCardColumnId) return;
    const title = newCardTitle.trim();
    if (!title) {
      toast.error("Digite o título da demanda.");
      return;
    }
    const columnCards = cards.filter((c) => c.columnId === addCardColumnId);
    const order = columnCards.length;
    try {
      await addCard.mutateAsync({
        columnId: addCardColumnId,
        order,
        title,
        responsible: newCardResponsible.trim(),
        dueDate: newCardDueDate.trim(),
        descricao: newCardDescricao.trim(),
      });
      setAddCardColumnId(null);
      toast.success("Demanda adicionada.");
    } catch {
      toast.error("Erro ao adicionar demanda.");
    }
  };

  const openEditCard = (card: DemandCard) => {
    setEditingCard(card);
    setEditCardTitle(card.title);
    setEditCardResponsible(card.responsible);
    setEditCardDueDate(card.dueDate || "");
    setEditCardOpen(true);
  };

  const handleEditCard = async () => {
    if (!editingCard) return;
    const title = editCardTitle.trim();
    if (!title) {
      toast.error("Digite o título da demanda.");
      return;
    }
    try {
      await updateCard.mutateAsync({
        id: editingCard.id,
        data: {
          title,
          responsible: editCardResponsible.trim(),
          dueDate: editCardDueDate.trim(),
          descricao: editCardDescricao.trim(),
        },
      });
      setEditCardOpen(false);
      setEditingCard(null);
      toast.success("Demanda atualizada.");
    } catch {
      toast.error("Erro ao atualizar demanda.");
    }
  };

  const handleDeleteCard = async (card: DemandCard) => {
    if (!confirm(`Excluir a demanda "${card.title}"?`)) return;
    try {
      await deleteCard.mutateAsync(card.id);
      toast.success("Demanda excluída.");
    } catch {
      toast.error("Erro ao excluir demanda.");
    }
  };

  const isLoading = colsLoading || cardsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Demandas</h1>
          <p className="text-sm text-muted-foreground">Organizador de tarefas (estilo Trello). Arraste para mover.</p>
        </div>
        <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Nova coluna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-col-title">Nome da coluna</Label>
                <Input
                  id="new-col-title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Ex: A fazer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddColumnOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddColumn}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
          {columns.map((col) => (
            <DemandColumnWithDroppable
              key={col.id}
              column={col}
              cards={cards.filter((c) => c.columnId === col.id).sort((a, b) => a.order - b.order)}
              onAddCard={openAddCard}
              onEditCard={openEditCard}
              onDeleteCard={handleDeleteCard}
              onEditColumn={openEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <Card className="w-[260px] cursor-grabbing shadow-lg ring-2 ring-primary/20 opacity-95">
              <CardContent className="p-3 space-y-1">
                <p className="font-medium text-sm">{activeCard.title || "Sem título"}</p>
                {activeCard.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                    {activeCard.descricao}
                  </p>
                )}
                {activeCard.responsible && (
                  <p className="text-xs text-muted-foreground mt-1">Responsável: {activeCard.responsible}</p>
                )}
                {activeCard.dueDate && (
                  <p className="text-xs text-muted-foreground mt-0.5">Entrega: {formatDueDate(activeCard.dueDate)}</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {columns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma coluna ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie a primeira coluna para começar a organizar as demandas.</p>
            <Button className="mt-4" onClick={openAddColumn}>
              <Plus className="h-4 w-4 mr-2" />
              Nova coluna
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Adicionar demanda */}
      <Dialog open={addCardColumnId !== null} onOpenChange={(open) => !open && setAddCardColumnId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova demanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-card-title">Título</Label>
              <Input
                id="new-card-title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Ex: Revisar contrato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-responsible">Responsável</Label>
              <Input
                id="new-card-responsible"
                value={newCardResponsible}
                onChange={(e) => setNewCardResponsible(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-due">Data de entrega</Label>
              <Input
                id="new-card-due"
                type="date"
                value={newCardDueDate}
                onChange={(e) => setNewCardDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-notes">Anotações / o que precisa ser feito</Label>
              <Textarea
                id="new-card-notes"
                value={newCardDescricao}
                onChange={(e) => setNewCardDescricao(e.target.value)}
                placeholder="Descreva as etapas, links importantes, contexto da demanda..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCardColumnId(null)}>Cancelar</Button>
            <Button onClick={handleAddCard}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar coluna */}
      <Dialog open={editColumnOpen} onOpenChange={setEditColumnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-col-title">Nome da coluna</Label>
              <Input
                id="edit-col-title"
                value={editColumnTitle}
                onChange={(e) => setEditColumnTitle(e.target.value)}
                placeholder="Ex: Em andamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditColumn}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar demanda */}
      <Dialog open={editCardOpen} onOpenChange={setEditCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar demanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-card-title">Título</Label>
              <Input
                id="edit-card-title"
                value={editCardTitle}
                onChange={(e) => setEditCardTitle(e.target.value)}
                placeholder="Título da demanda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-responsible">Responsável</Label>
              <Input
                id="edit-card-responsible"
                value={editCardResponsible}
                onChange={(e) => setEditCardResponsible(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-due">Data de entrega</Label>
              <Input
                id="edit-card-due"
                type="date"
                value={editCardDueDate}
                onChange={(e) => setEditCardDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-notes">Anotações / o que precisa ser feito</Label>
              <Textarea
                id="edit-card-notes"
                value={editCardDescricao}
                onChange={(e) => setEditCardDescricao(e.target.value)}
                placeholder="Atualize as anotações e próximos passos desta demanda..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCardOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditCard}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
