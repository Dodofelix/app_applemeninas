/** Modelos de iPhone do cliente (13 ao 16 Pro Max) para troca/upgrade. */
export const CLIENT_MODELS = [
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
] as const;

/** Modelos de iPhone disponíveis na loja (14 ao 17 Pro Max). */
export const STORE_MODELS = [
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17",
  "iPhone 17 Plus",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
] as const;

/** Opções de memória (128 GB a 1 TB). */
export const STORAGES = [
  { value: 128, label: "128 GB" },
  { value: 256, label: "256 GB" },
  { value: 512, label: "512 GB" },
  { value: 1024, label: "1 TB" },
] as const;

export type ClientModel = (typeof CLIENT_MODELS)[number];
export type StoreModel = (typeof STORE_MODELS)[number];
export type StorageGb = (typeof STORAGES)[number]["value"];

/** Chave única para valor (ex: "iPhone 13-128"). */
export function calculatorKey(model: string, storage: number): string {
  return `${model}-${storage}`;
}
