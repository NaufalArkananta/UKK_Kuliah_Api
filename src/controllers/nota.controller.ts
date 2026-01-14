import { Request, Response } from "express";
import { notaHtml } from "../templates/nota.html";
import { htmlToPdf } from "../utils/pdf.util";
import { PrismaClient } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

export const cetakNotaHtml = async (
  req: Request & { user?: { id: number } },
  res: Response
) => {
  const userId = req.user?.id;
  const orderId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const transaksi = await prisma.transaksi.findUnique({
    where: { id: orderId },
    include: {
      stan: true,
      siswa: {
        include: { user: true },
      },
      detail: {
        include: {
          menu: {
            include: {
              menuDiskon: {
                include: { diskon: true },
              },
            },
          },
        },
      },
    },
  });

  if (!transaksi) {
    res.status(404).json({ message: "Transaksi tidak ditemukan" });
    return;
  }

  // CEK HAK AKSES
  if (transaksi.siswa.userId !== userId) {
    res.status(403).json({
      message: "Anda tidak berhak mencetak nota ini",
    });
    return;
  }

  const items = transaksi.detail.map((d) => {
    const diskon = d.menu.menuDiskon[0]?.diskon;

    return {
      namaMenu: d.menu.namaMakanan,
      harga: d.hargaBeli,
      qty: d.qty,
      diskonPersen: diskon?.persenDiskon,
    };
  });

  const html = notaHtml({
    namaStan: transaksi.stan.namaStan,
    orderId: transaksi.id,
    tanggal: transaksi.createdAt.toLocaleDateString("id-ID"),
    jam: transaksi.createdAt.toLocaleTimeString("id-ID"),
    items,
  });

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};

export const cetakNotaPdf = async (
  req: Request & { user?: { id: number } },
  res: Response
) => {
  const userId = req.user?.id;
  const orderId = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const transaksi = await prisma.transaksi.findUnique({
    where: { id: orderId },
    include: {
      stan: true,
      siswa: {
        include: { user: true },
      },
      detail: {
        include: {
          menu: {
            include: {
              menuDiskon: {
                include: { diskon: true },
              },
            },
          },
        },
      },
    },
  });

  if (!transaksi) {
    res.status(404).json({ message: "Transaksi tidak ditemukan" });
    return;
  }

  // CEK HAK AKSES
  if (transaksi.siswa.userId !== userId) {
    res.status(403).json({
      message: "Anda tidak berhak mencetak nota ini",
    });
    return;
  }

  const items = transaksi.detail.map((d) => {
    const diskon = d.menu.menuDiskon[0]?.diskon;

    return {
      namaMenu: d.menu.namaMakanan,
      harga: d.hargaBeli,
      qty: d.qty,
      diskonPersen: diskon?.persenDiskon,
    };
  });

  const html = notaHtml({
    namaStan: transaksi.stan.namaStan,
    orderId: transaksi.id,
    tanggal: transaksi.createdAt.toLocaleDateString("id-ID"),
    jam: transaksi.createdAt.toLocaleTimeString("id-ID"),
    logoUrl: "file:///ABSOLUTE/PATH/logo.png",
    items,
  });

  const pdf = await htmlToPdf(html);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=nota.pdf");
  res.send(pdf);
};
