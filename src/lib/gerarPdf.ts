import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const CONTAINER_WIDTH_PX = 794;
const MARGIN_MM = 12;
const GAP_ENTRE_PAGINAS_MM = 14;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

/**
 * Gera PDF a partir do HTML do conteúdo do contrato (use getHtmlConteudoParaPdf).
 * Pagina por viewport: cada página é renderizada com altura fixa e overflow hidden,
 * para que o texto nunca seja cortado no meio da linha — o que não couber pula para a próxima página.
 */
export async function gerarPdfDeHtml(htmlConteudo: string, nomeArquivo: string): Promise<void> {
  const baseStyles = "position: fixed; left: -9999px; top: 0; width: " + CONTAINER_WIDTH_PX + "px; background: #ffffff; color: #222222; pointer-events: none;";

  const contentHeightMm = PAGE_HEIGHT_MM - MARGIN_MM * 2 - GAP_ENTRE_PAGINAS_MM;
  const pageContentHeightCssPx = (contentHeightMm / PAGE_WIDTH_MM) * CONTAINER_WIDTH_PX;

  const measureWrap = document.createElement("div");
  measureWrap.setAttribute("style", baseStyles + " overflow: visible; min-height: 100px;");
  measureWrap.innerHTML = htmlConteudo;
  document.body.appendChild(measureWrap);

  await new Promise((r) => setTimeout(r, 150));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const totalContentHeightPx = measureWrap.offsetHeight;
  document.body.removeChild(measureWrap);

  const numPages = Math.max(1, Math.ceil(totalContentHeightPx / pageContentHeightCssPx));

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidthMm = pageWidth - MARGIN_MM * 2;

  for (let page = 0; page < numPages; page++) {
    const isLastPage = page === numPages - 1;
    const remainingHeightPx = totalContentHeightPx - page * pageContentHeightCssPx;
    const viewportHeightPx = isLastPage
      ? Math.max(pageContentHeightCssPx * 0.5, Math.ceil(remainingHeightPx))
      : pageContentHeightCssPx;

    const viewport = document.createElement("div");
    viewport.setAttribute(
      "style",
      baseStyles +
        " height: " +
        viewportHeightPx +
        "px; overflow: hidden; box-sizing: border-box;"
    );
    const inner = document.createElement("div");
    inner.setAttribute("style", "margin-top: " + -page * pageContentHeightCssPx + "px;");
    inner.innerHTML = htmlConteudo;
    viewport.appendChild(inner);
    document.body.appendChild(viewport);

    await new Promise((r) => setTimeout(r, 80));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(viewport, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });
    document.body.removeChild(viewport);

    const sliceHeightMm = (viewportHeightPx / pageContentHeightCssPx) * contentHeightMm;
    if (page > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN_MM, MARGIN_MM, contentWidthMm, sliceHeightMm);
  }

  pdf.save(nomeArquivo);
}
