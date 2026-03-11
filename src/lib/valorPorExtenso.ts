/**
 * Converte valor numérico em reais para extenso (PT-BR).
 */
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZENA_ESPECIAL = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function centenaExtenso(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const parte = CENTENAS[c];
  if (resto === 0) return parte;
  return parte + " e " + dezenaExtenso(resto);
}

function dezenaExtenso(n: number): string {
  if (n < 10) return UNIDADES[n] || "";
  if (n < 20) return DEZENA_ESPECIAL[n - 10] || "";
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return DEZENAS[d] || "";
  return (DEZENAS[d] || "") + " e " + (UNIDADES[u] || "");
}

function triplaExtenso(n: number, feminino = false): string {
  if (n === 0) return "";
  if (n === 1) return feminino ? "uma" : "um";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let s = centenaExtenso(n);
  if (c > 0 && resto > 0) s = CENTENAS[c] + " e " + dezenaExtenso(resto);
  return s;
}

export function valorPorExtensoReais(valor: number): string {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  const milhao = Math.floor(inteiro / 1_000_000);
  const mil = Math.floor((inteiro % 1_000_000) / 1_000);
  const resto = inteiro % 1_000;

  const partes: string[] = [];
  if (milhao > 0) {
    partes.push(milhao === 1 ? "um milhão" : triplaExtenso(milhao) + " milhões");
  }
  if (mil > 0) {
    partes.push(mil === 1 ? "mil" : triplaExtenso(mil) + " mil");
  }
  if (resto > 0 || partes.length === 0) {
    partes.push(triplaExtenso(resto));
  }
  let texto = partes.join(" e ") + " reais";
  if (centavos > 0) {
    texto += " e " + dezenaExtenso(centavos) + " centavos";
  }
  return texto;
}
