import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Client, Order, StatusPedidoCliente, StatusNotaFiscal } from "./mock-data";

const PRODUCTS = "products";
const CLIENTS = "clients";
const ORDERS = "orders";
const EXPENSES = "expenses";
const SETTINGS = "settings";
const USER_PROFILES = "userProfiles";
const GATEWAY_DOC = "gateway";
const CALCULATOR_DOC = "calculator";
const DEMAND_COLUMNS = "demandColumns";
const DEMAND_CARDS = "demandCards";

/** Taxas do gateway por número de parcelas (1–12). Valores em % (ex: 2.99). */
export type GatewayFees = Record<number, number>;

const DEFAULT_GATEWAY_FEE_PCT = 2.99;

/** Retorna as taxas do gateway (1x a 12x). Se não houver doc, retorna 2,99% para todas. */
export async function getGatewayFees(): Promise<GatewayFees> {
  const snap = await getDoc(doc(db, SETTINGS, GATEWAY_DOC));
  if (!snap.exists()) {
    const def: GatewayFees = {};
    for (let i = 1; i <= 12; i++) def[i] = DEFAULT_GATEWAY_FEE_PCT;
    return def;
  }
  const data = snap.data();
  const fees: GatewayFees = {};
  for (let i = 1; i <= 12; i++) {
    const v = data[`fee_${i}`];
    fees[i] = typeof v === "number" && v >= 0 ? v : DEFAULT_GATEWAY_FEE_PCT;
  }
  return fees;
}

/** Salva as taxas do gateway (1x a 12x). Valores em % (ex: 2.99). */
export async function setGatewayFees(fees: GatewayFees): Promise<void> {
  const data: Record<string, number> = {};
  for (let i = 1; i <= 12; i++) {
    data[`fee_${i}`] = typeof fees[i] === "number" && fees[i] >= 0 ? fees[i] : DEFAULT_GATEWAY_FEE_PCT;
  }
  await setDoc(doc(db, SETTINGS, GATEWAY_DOC), data, { merge: true });
}

// --- Calculadora de upgrade ---
/** Valores que a loja paga pelo iPhone do cliente (trade-in) e preços dos produtos lacrados na loja. Chave: "modelo-storage" (ex: "iPhone 13-128"). */
export type CalculatorValues = {
  tradeIn: Record<string, number>;
  store: Record<string, number>;
};

export async function getCalculatorValues(): Promise<CalculatorValues> {
  const snap = await getDoc(doc(db, SETTINGS, CALCULATOR_DOC));
  if (!snap.exists()) return { tradeIn: {}, store: {} };
  const data = snap.data();
  return {
    tradeIn: typeof data?.tradeIn === "object" && data.tradeIn !== null ? data.tradeIn as Record<string, number> : {},
    store: typeof data?.store === "object" && data.store !== null ? data.store as Record<string, number> : {},
  };
}

export async function setCalculatorValues(values: CalculatorValues): Promise<void> {
  const tradeIn: Record<string, number> = {};
  for (const [k, v] of Object.entries(values.tradeIn || {})) {
    if (v !== undefined && v !== null && typeof v === "number" && !Number.isNaN(v)) {
      tradeIn[k] = v;
    }
  }
  const store: Record<string, number> = {};
  for (const [k, v] of Object.entries(values.store || {})) {
    if (v !== undefined && v !== null && typeof v === "number" && !Number.isNaN(v)) {
      store[k] = v;
    }
  }
  await setDoc(doc(db, SETTINGS, CALCULATOR_DOC), { tradeIn, store }, { merge: true });
}

/** Remove campos undefined do objeto (Firestore não aceita undefined). */
function semUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, PRODUCTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function addProduct(product: Omit<Product, "id">): Promise<string> {
  const data = {
    nome: String(product.nome ?? "").trim(),
    categoria: String(product.categoria ?? "").trim(),
    preco: Number(product.preco),
  };
  if (!data.nome || !data.categoria || data.preco <= 0) {
    throw new Error("Produto inválido: nome, categoria e preço são obrigatórios.");
  }
  const ref = await addDoc(collection(db, PRODUCTS), data);
  return ref.id;
}

export async function setProduct(id: string, data: Partial<Product>): Promise<void> {
  await setDoc(doc(db, PRODUCTS, id), data, { merge: true });
}

/** Cria os produtos iniciais na base (catálogo Apple). */
export async function seedInitialProducts(products: Omit<Product, "id">[]): Promise<void> {
  const batch = products.map((p) => addDoc(collection(db, PRODUCTS), p));
  await Promise.all(batch);
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS, productId));
}

// --- Clients ---
export async function getClients(): Promise<Client[]> {
  const snap = await getDocs(collection(db, CLIENTS));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
  list.sort((a, b) => (b.data_cadastro || "").localeCompare(a.data_cadastro || ""));
  return list;
}

export async function getClientById(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, CLIENTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
}

export async function addClient(client: Omit<Client, "id">): Promise<string> {
  const data = semUndefined({
    nome: String(client.nome ?? "").trim(),
    cpf: String(client.cpf ?? "").trim(),
    rg: String(client.rg ?? "").trim(),
    data_nascimento: String(client.data_nascimento ?? "").trim(),
    nacionalidade: String(client.nacionalidade ?? "").trim(),
    estado_civil: String(client.estado_civil ?? "").trim(),
    profissao: String(client.profissao ?? "").trim(),
    celular: String(client.celular ?? "").trim(),
    email: String(client.email ?? "").trim(),
    cep: String(client.cep ?? "").trim(),
    rua: String(client.rua ?? "").trim(),
    numero: String(client.numero ?? "").trim(),
    complemento: client.complemento ? String(client.complemento).trim() : undefined,
    bairro: String(client.bairro ?? "").trim(),
    cidade: String(client.cidade ?? "").trim(),
    estado: String(client.estado ?? "").trim(),
    autoriza_instagram: Boolean(client.autoriza_instagram),
    data_cadastro: String(client.data_cadastro ?? "").trim(),
    status_pedido: client.status_pedido ? String(client.status_pedido) : undefined,
    nota_fiscal: client.nota_fiscal ? String(client.nota_fiscal) : undefined,
  });
  const ref = await addDoc(collection(db, CLIENTS), data);
  return ref.id;
}

export async function updateClientStatusPedido(
  clientId: string,
  status_pedido: StatusPedidoCliente
): Promise<void> {
  await setDoc(doc(db, CLIENTS, clientId), { status_pedido }, { merge: true });
}

export async function updateClientNotaFiscal(clientId: string, nota_fiscal: StatusNotaFiscal): Promise<void> {
  await setDoc(doc(db, CLIENTS, clientId), { nota_fiscal }, { merge: true });
}

// --- Orders ---
export async function getOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db, ORDERS));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return list;
}

export async function addOrder(order: Omit<Order, "id">): Promise<string> {
  const data = semUndefined({
    cliente_id: String(order.cliente_id ?? ""),
    cliente_nome: String(order.cliente_nome ?? "").trim(),
    produto: String(order.produto ?? "").trim(),
    categoria: String(order.categoria ?? "").trim(),
    valor: Number(order.valor),
    produtos: Array.isArray(order.produtos) && order.produtos.length > 0 ? order.produtos : undefined,
    forma_pagamento: String(order.forma_pagamento ?? "").trim(),
    entrada_pix: order.entrada_pix != null ? Number(order.entrada_pix) : undefined,
    parcelas: order.parcelas != null ? Number(order.parcelas) : undefined,
    valor_parcela: order.valor_parcela != null ? Number(order.valor_parcela) : undefined,
    parcelas_cartao2: order.parcelas_cartao2 != null ? Number(order.parcelas_cartao2) : undefined,
    valor_parcela_cartao2: order.valor_parcela_cartao2 != null ? Number(order.valor_parcela_cartao2) : undefined,
    status: String(order.status ?? "Contrato pendente").trim(),
    status_pedido: order.status_pedido ?? "pendente",
    data: String(order.data ?? "").trim(),
  });
  const ref = await addDoc(collection(db, ORDERS), data);
  return ref.id;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  await setDoc(doc(db, ORDERS, orderId), { status }, { merge: true });
}

export type StatusPedido = import("./mock-data").StatusPedido;

export async function updateOrderStatusPedido(orderId: string, status_pedido: StatusPedido): Promise<void> {
  await setDoc(doc(db, ORDERS, orderId), { status_pedido }, { merge: true });
}

export async function deleteOrder(orderId: string): Promise<void> {
  await deleteDoc(doc(db, ORDERS, orderId));
}

export async function deleteClient(clientId: string): Promise<void> {
  await deleteDoc(doc(db, CLIENTS, clientId));
}

// --- Saídas (fluxo de caixa) ---
export type ExpenseTipo = "fornecedor" | "outro";

export interface Expense {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo?: ExpenseTipo;
  cliente_id?: string;
  cliente_nome?: string;
}

export async function getExpenses(): Promise<Expense[]> {
  const snap = await getDocs(collection(db, EXPENSES));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
  list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return list;
}

export async function addExpense(expense: Omit<Expense, "id">): Promise<string> {
  const data: Record<string, unknown> = {
    descricao: String(expense.descricao ?? "").trim(),
    valor: Number(expense.valor),
    data: String(expense.data ?? "").trim(),
  };
  if (!data.descricao || (data.valor as number) <= 0 || !data.data) {
    throw new Error("Saída inválida: descrição, valor positivo e data são obrigatórios.");
  }
  if (expense.tipo) data.tipo = expense.tipo;
  if (expense.cliente_id) data.cliente_id = expense.cliente_id;
  if (expense.cliente_nome) data.cliente_nome = expense.cliente_nome;
  const ref = await addDoc(collection(db, EXPENSES), data);
  return ref.id;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, EXPENSES, expenseId));
}

// --- Perfis de usuário (admin) ---
export interface UserProfile {
  id: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const snap = await getDoc(doc(db, USER_PROFILES, userId));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserProfile>;
  return {
    id: snap.id,
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? "",
    email: data.email ?? "",
  };
}

export async function setUserProfile(
  userId: string,
  profile: { displayName?: string; photoURL?: string; email?: string }
): Promise<void> {
  if (!userId) throw new Error("userId obrigatório para salvar perfil.");
  const data = semUndefined({
    displayName: profile.displayName?.trim(),
    photoURL: profile.photoURL,
    email: profile.email?.trim(),
  });
  await setDoc(doc(db, USER_PROFILES, userId), data, { merge: true });
}

// --- Demandas (board estilo Trello) ---
export interface DemandColumn {
  id: string;
  title: string;
  order: number;
}

export interface DemandCard {
  id: string;
  columnId: string;
  order: number;
  title: string;
  responsible: string;
  dueDate: string;
  descricao?: string;
}

export async function getDemandColumns(): Promise<DemandColumn[]> {
  const snap = await getDocs(collection(db, DEMAND_COLUMNS));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DemandColumn));
  list.sort((a, b) => a.order - b.order);
  return list;
}

export async function addDemandColumn(column: Omit<DemandColumn, "id">): Promise<string> {
  const data = {
    title: String(column.title ?? "").trim(),
    order: Number(column.order) ?? 0,
  };
  const ref = await addDoc(collection(db, DEMAND_COLUMNS), data);
  return ref.id;
}

export async function updateDemandColumn(id: string, data: Partial<Pick<DemandColumn, "title" | "order">>): Promise<void> {
  await setDoc(doc(db, DEMAND_COLUMNS, id), data, { merge: true });
}

export async function deleteDemandColumn(id: string): Promise<void> {
  await deleteDoc(doc(db, DEMAND_COLUMNS, id));
}

export async function getDemandCards(): Promise<DemandCard[]> {
  const snap = await getDocs(collection(db, DEMAND_CARDS));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DemandCard));
  list.sort((a, b) => {
    if (a.columnId !== b.columnId) return a.columnId.localeCompare(b.columnId);
    return a.order - b.order;
  });
  return list;
}

export async function addDemandCard(card: Omit<DemandCard, "id">): Promise<string> {
  const data = {
    columnId: String(card.columnId),
    order: Number(card.order),
    title: String(card.title ?? "").trim(),
    responsible: String(card.responsible ?? "").trim(),
    dueDate: String(card.dueDate ?? "").trim(),
    descricao: card.descricao ? String(card.descricao).trim() : "",
  };
  const ref = await addDoc(collection(db, DEMAND_CARDS), data);
  return ref.id;
}

export async function updateDemandCard(id: string, data: Partial<Omit<DemandCard, "id">>): Promise<void> {
  const clean: Record<string, unknown> = {};
  if (data.columnId !== undefined) clean.columnId = data.columnId;
  if (data.order !== undefined) clean.order = data.order;
  if (data.title !== undefined) clean.title = String(data.title).trim();
  if (data.responsible !== undefined) clean.responsible = String(data.responsible).trim();
  if (data.dueDate !== undefined) clean.dueDate = String(data.dueDate).trim();
  if (data.descricao !== undefined) clean.descricao = String(data.descricao).trim();
  if (Object.keys(clean).length > 0) {
    await setDoc(doc(db, DEMAND_CARDS, id), clean, { merge: true });
  }
}

export async function deleteDemandCard(id: string): Promise<void> {
  await deleteDoc(doc(db, DEMAND_CARDS, id));
}
