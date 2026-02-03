import { Request, Response } from "express";
import { PrismaClient, TransaksiStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const createPesan = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id_stan, pesan } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // HANYA 1 STAN
    if (!id_stan || !Array.isArray(pesan) || pesan.length === 0) {
      res.status(400).json({
        message: "Format pesanan tidak valid (hanya 1 stan)",
      });
      return;
    }

    const siswa = await prisma.siswa.findUnique({
      where: { userId },
    });

    if (!siswa) {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }

    const detailData = [];

    for (const item of pesan) {
      const menu = await prisma.menu.findFirst({
        where: {
          id: Number(item.id_menu),
          stanId: Number(id_stan),
        },
        include: {
          menuDiskon: {
            include: { diskon: true },
          },
        },
      });

      if (!menu) {
        res.status(404).json({
          message: `Menu ${item.id_menu} tidak ditemukan di stan ${id_stan}`,
        });
        return;
      }

      // HITUNG DISKON
      const diskon = menu.menuDiskon[0]?.diskon;
      const persenDiskon = diskon?.persenDiskon ?? 0;

      const hargaAwal = menu.harga;
      const hargaSetelahDiskon =
        hargaAwal - hargaAwal * (persenDiskon / 100);

      detailData.push({
        menuId: menu.id,
        qty: Number(item.qty),
        hargaBeli: Math.round(hargaSetelahDiskon), // harga FINAL
      });
    }

    // CREATE TRANSAKSI
    const transaksi = await prisma.transaksi.create({
      data: {
        stanId: Number(id_stan),
        siswaId: siswa.id,
        detail: {
          create: detailData,
        },
      },
      include: {
        detail: {
          include: {
            menu: {
              select: {
                id: true,
                namaMakanan: true,
              },
            },
          },
        },
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Pesanan berhasil dibuat",
      data: transaksi,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderByStatusSiswa = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const statusParam = req.params.status as TransaksiStatus | undefined;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ambil siswa dari user
    const siswa = await prisma.siswa.findUnique({
      where: { userId },
    });

    if (!siswa) {
      res.status(403).json({ message: "Akses ditolak (bukan siswa)" });
      return;
    }

    const whereCondition: any = {
      siswaId: siswa.id,
    };

    if (statusParam) {
      whereCondition.status = statusParam;
    }

    const orders = await prisma.transaksi.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
        detail: {
          include: {
            menu: {
              select: {
                namaMakanan: true,
                harga: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil data pesanan siswa",
      data: orders,
    });
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
  }
};

export const getOrderHistoryByMonthSiswa = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bulanTahun = req.params.bulanTahun; // format: MM-YYYY

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validasi format MM-YYYY
    if (!/^\d{2}-\d{4}$/.test(bulanTahun)) {
      res.status(400).json({
        message: "Format tanggal tidak valid (MM-YYYY)",
      });
      return;
    }

    const [bulanStr, tahunStr] = bulanTahun.split("-");
    const bulan = Number(bulanStr); // 1 - 12
    const tahun = Number(tahunStr);

    if (bulan < 1 || bulan > 12 || isNaN(tahun)) {
      res.status(400).json({
        message: "Bulan atau tahun tidak valid",
      });
      return;
    }

    // Ambil siswa dari user
    const siswa = await prisma.siswa.findUnique({
      where: { userId },
    });

    if (!siswa) {
      res.status(403).json({ message: "Akses ditolak (bukan siswa)" });
      return;
    }

    // Range tanggal
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const orders = await prisma.transaksi.findMany({
      where: {
        siswaId: siswa.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
        detail: {
          include: {
            menu: {
              select: {
                namaMakanan: true,
                harga: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: `Histori pesanan bulan ${bulan}-${tahun}`,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const cetakNotaByOrderId = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const transaksi = await prisma.transaksi.findUnique({
      where: { id: orderId },
      include: {
        stan: {
          select: {
            id: true,
            namaStan: true,
            userId: true,
          },
        },
        siswa: {
          select: {
            id: true,
            namaSiswa: true,
            userId: true,
          },
        },
        detail: {
          include: {
            menu: { select: { namaMakanan: true } },
          },
        },
      },
    });

    if (!transaksi) {
      res.status(404).json({ message: "Transaksi tidak ditemukan" });
      return;
    }

    // ambil user login
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        siswa: { select: { id: true } },
        stan: { select: { id: true } },
      },
    });

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const isSiswaOwner =
      user.role === "SISWA" &&
      user.siswa?.id === transaksi.siswa.id;

    const isStanOwner =
      user.role === "ADMIN_STAN" &&
      user.stan?.id === transaksi.stan.id;

    if (!isSiswaOwner && !isStanOwner) {
      res.status(403).json({
        message: "Anda tidak memiliki akses ke nota ini",
      });
      return;
    }

    // mapping item
    const items = transaksi.detail.map((d) => ({
      namaMenu: d.menu.namaMakanan,
      qty: d.qty,
      hargaSatuan: d.hargaBeli,
      subtotal: d.qty * d.hargaBeli,
    }));

    const totalHarga = items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    res.status(200).json({
      message: "Berhasil mencetak nota",
      data: {
        namaStan: transaksi.stan.namaStan,
        namaSiswa: transaksi.siswa.namaSiswa,
        tanggalOrder: transaksi.createdAt,
        items,
        totalHarga,
      },
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// ADMIN STAN

export const getOrderByStatusStan = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const statusParam = req.params.status as TransaksiStatus | undefined;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    //  Cari stan dari user
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak (bukan admin stan)" });
      return;
    }

    const whereCondition: any = {
      stanId: stan.id,
    };

    if (statusParam) {
      whereCondition.status = statusParam;
    }

    const orders = await prisma.transaksi.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        siswa: {
          select: {
            id: true,
            namaSiswa: true,
          },
        },
        detail: {
          include: {
            menu: {
              select: {
                namaMakanan: true,
                harga: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil data pesanan",
      data: orders,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getOrderHistoryByMonth = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bulanTahun = req.params.bulanTahun; // format: MM-YYYY

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validasi format MM-YYYY
    if (!/^\d{2}-\d{4}$/.test(bulanTahun)) {
      res.status(400).json({
        message: "Format tanggal tidak valid (MM-YYYY)",
      });
      return;
    }

    const [bulanStr, tahunStr] = bulanTahun.split("-");
    const bulan = Number(bulanStr);
    const tahun = Number(tahunStr);

    if (bulan < 1 || bulan > 12 || isNaN(tahun)) {
      res.status(400).json({
        message: "Bulan atau tahun tidak valid",
      });
      return;
    }

    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak" });
      return;
    }

    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const orders = await prisma.transaksi.findMany({
      where: {
        stanId: stan.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        siswa: {
          select: {
            namaSiswa: true,
          },
        },
        detail: {
          include: {
            menu: {
              select: {
                namaMakanan: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: `Histori pesanan bulan ${bulan}-${tahun}`,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const updateOrderStatusByStan = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const transaksiId = Number(req.params.id);
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Object.values(TransaksiStatus).includes(status)) {
      res.status(400).json({ message: "Status transaksi tidak valid" });
      return;
    }

    // 🔎 Ambil stan dari user login
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak (bukan admin stan)" });
      return;
    }

    // 🔎 Cari transaksi & pastikan milik stan ini
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: transaksiId },
    });

    if (!transaksi) {
      res.status(404).json({ message: "Transaksi tidak ditemukan" });
      return;
    }

    if (transaksi.stanId !== stan.id) {
      res.status(403).json({
        message: "Anda tidak berhak mengubah status pesanan ini",
      });
      return;
    }

    // 🔄 UPDATE STATUS
    const updated = await prisma.transaksi.update({
      where: { id: transaksiId },
      data: {
        status,
      },
    });

    res.status(200).json({
      message: "Status pesanan berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getMonthlyIncomeAndTopMenu = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bulanTahun = req.params.bulanTahun;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validasi format MM-YYYY
    if (!/^\d{2}-\d{4}$/.test(bulanTahun)) {
      res.status(400).json({
        message: "Format tanggal tidak valid (MM-YYYY)",
      });
      return;
    }

    const [bulanStr, tahunStr] = bulanTahun.split("-");
    const bulan = Number(bulanStr); // 1 - 12
    const tahun = Number(tahunStr);

    if (bulan < 1 || bulan > 12 || isNaN(tahun)) {
      res.status(400).json({
        message: "Bulan atau tahun tidak valid",
      });
      return;
    }

    // Cari stan dari user
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak (bukan admin stan)" });
      return;
    }

    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    // ===============================
    // TOTAL PEMASUKAN + MENU
    // ===============================
    const transaksi = await prisma.detailTransaksi.findMany({
      where: {
        transaksi: {
          stanId: stan.id,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        menu: {
          select: {
            id: true,
            namaMakanan: true,
          },
        },
      },
    });

    let totalPemasukan = 0;
    const menuCounter: Record<number, { nama: string; qty: number }> = {};

    transaksi.forEach((item) => {
      totalPemasukan += item.qty * item.hargaBeli;

      if (!menuCounter[item.menuId]) {
        menuCounter[item.menuId] = {
          nama: item.menu.namaMakanan,
          qty: 0,
        };
      }

      menuCounter[item.menuId].qty += item.qty;
    });

    // ===============================
    // MENU TERLARIS
    // ===============================
    const menuTerlaris =
      Object.values(menuCounter).sort((a, b) => b.qty - a.qty)[0] || null;

    res.status(200).json({
      message: `Laporan pemasukan bulan ${bulan}-${tahun}`,
      data: {
        bulan,
        tahun,
        totalPemasukan,
        menuTerlaris,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};
