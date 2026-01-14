import puppeteer from "puppeteer";

export const htmlToPdf = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 220,
    height: 1000,
  });

  await page.setContent(html, { waitUntil: "load" });

  const pdf = await page.pdf({
    width: "58mm",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  return Buffer.from(pdf);
};