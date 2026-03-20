import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  addProduct as addProductApi,
  seedInitialProducts as seedInitialProductsApi,
  setProduct as setProductApi,
  deleteProduct as deleteProductApi,
  getClients,
  addClient,
  getOrders,
  addOrder as addOrderApi,
  getGatewayFees,
  setGatewayFees as setGatewayFeesApi,
  getCalculatorValues as getCalculatorValuesApi,
  setCalculatorValues as setCalculatorValuesApi,
  updateOrderStatusPedido,
  updateOrder as updateOrderApi,
  deleteOrder as deleteOrderApi,
  updateClientNotaFiscal as updateClientNotaFiscalApi,
  deleteClient as deleteClientApi,
  updateClientStatusPedido as updateClientStatusPedidoApi,
  getExpenses as getExpensesApi,
  addExpense as addExpenseApi,
  updateExpense as updateExpenseApi,
  deleteExpense as deleteExpenseApi,
  getUserProfile,
  setUserProfile,
  getDemandColumns as getDemandColumnsApi,
  addDemandColumn as addDemandColumnApi,
  updateDemandColumn as updateDemandColumnApi,
  deleteDemandColumn as deleteDemandColumnApi,
  getDemandCards as getDemandCardsApi,
  addDemandCard as addDemandCardApi,
  updateDemandCard as updateDemandCardApi,
  deleteDemandCard as deleteDemandCardApi,
} from "@/lib/firestore";
import type { GatewayFees, StatusPedido, CalculatorValues, UserProfile, DemandColumn, DemandCard, Client } from "@/lib/firestore";
import type { Expense } from "@/lib/firestore";
import type { Product, Order } from "@/lib/mock-data";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    placeholderData: [],
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: Omit<Product, "id">) => addProductApi(product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useSeedInitialProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (products: Omit<Product, "id">[]) => seedInitialProductsApi(products),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => setProductApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProductApi(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
    placeholderData: [],
  });
}

export function useAddClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (client: Omit<Client, "id">) => addClient(client),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => deleteClientApi(clientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClientStatusPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      status_pedido,
    }: {
      clientId: string;
      status_pedido: import("@/lib/mock-data").StatusPedidoCliente;
    }) => updateClientStatusPedidoApi(clientId, status_pedido),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClientNotaFiscal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      nota_fiscal,
    }: {
      clientId: string;
      nota_fiscal: import("@/lib/mock-data").StatusNotaFiscal;
    }) => updateClientNotaFiscalApi(clientId, nota_fiscal),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    placeholderData: [],
  });
}

export function useAddOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Omit<Order, "id">) => addOrderApi(order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

const DEFAULT_FEES: GatewayFees = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [i + 1, 2.99])
) as GatewayFees;

export function useGatewayFees() {
  return useQuery({
    queryKey: ["gatewayFees"],
    queryFn: getGatewayFees,
    placeholderData: DEFAULT_FEES,
    staleTime: 60 * 1000,
  });
}

export function useSetGatewayFees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fees: GatewayFees) => setGatewayFeesApi(fees),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gatewayFees"] }),
  });
}

export function useUpdateOrderStatusPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status_pedido }: { orderId: string; status_pedido: StatusPedido }) =>
      updateOrderStatusPedido(orderId, status_pedido),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Order, "id">> }) => updateOrderApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => deleteOrderApi(orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCalculatorValues() {
  return useQuery({
    queryKey: ["calculatorValues"],
    queryFn: getCalculatorValuesApi,
    placeholderData: { tradeIn: {}, store: {} } as CalculatorValues,
    staleTime: 60 * 1000,
  });
}

export function useSetCalculatorValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CalculatorValues) => setCalculatorValuesApi(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calculatorValues"] }),
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: getExpensesApi,
    placeholderData: [],
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expense: Omit<Expense, "id">) => addExpenseApi(expense),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Expense, "id">> }) => updateExpenseApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpenseApi(expenseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUserProfile(userId: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: () => (userId ? getUserProfile(userId) : Promise.resolve(null)),
    enabled: !!userId,
  });
}

export function useSetUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, profile }: { userId: string; profile: { displayName?: string; photoURL?: string; email?: string } }) =>
      setUserProfile(userId, profile),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["userProfile", variables.userId] });
    },
  });
}

// --- Demandas (board) ---
export function useDemandColumns() {
  return useQuery({
    queryKey: ["demandColumns"],
    queryFn: getDemandColumnsApi,
    placeholderData: [],
  });
}

export function useAddDemandColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (column: Omit<DemandColumn, "id">) => addDemandColumnApi(column),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandColumns"] }),
  });
}

export function useUpdateDemandColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<DemandColumn, "title" | "order">> }) =>
      updateDemandColumnApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandColumns"] }),
  });
}

export function useDeleteDemandColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDemandColumnApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandColumns", "demandCards"] }),
  });
}

export function useDemandCards() {
  return useQuery({
    queryKey: ["demandCards"],
    queryFn: getDemandCardsApi,
    placeholderData: [],
  });
}

export function useAddDemandCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (card: Omit<DemandCard, "id">) => addDemandCardApi(card),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandCards"] }),
  });
}

export function useUpdateDemandCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<DemandCard, "id">> }) =>
      updateDemandCardApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandCards"] }),
  });
}

export function useDeleteDemandCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDemandCardApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["demandCards"] }),
  });
}
