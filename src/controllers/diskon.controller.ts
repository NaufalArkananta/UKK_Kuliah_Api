import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { namaDiskon, persenDiskon, tanggalAwal, tanggalAkhir } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ambil STAN berdasarkan USER ID dari JWT
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    // Validasi tanggal
    if (new Date(tanggalAwal) >= new Date(tanggalAkhir)) {
      res.status(400).json({
        message: "Tanggal akhir harus setelah tanggal awal",
      });
      return;
    }

    // CREATE DISKON → stanId AMAN
    const diskon = await prisma.diskon.create({
      data: {
        namaDiskon,
        persenDiskon: persenDiskon,
        tanggalAwal: new Date(tanggalAwal),
        tanggalAkhir: new Date(tanggalAkhir),
        stanId: stan.id,
      },
    });

    res.status(201).json({
      message: "Diskon berhasil dibuat",
      data: diskon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ambil stan berdasarkan userId dari JWT
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    // Ambil semua diskon milik stan tersebut
    const diskon = await prisma.diskon.findMany({
      where: {
        stanId: stan.id,
      },
      include: {
        menuDiskon: {
          include: {
            menu: {
              include: {
                stan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil semua diskon stan",
      data: diskon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDiskonById = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const diskonId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (isNaN(diskonId)) {
      res.status(400).json({ message: "ID diskon tidak valid" });
      return;
    }

    // Ambil stan dari user JWT
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    // Cari diskon berdasarkan id + stanId
    const diskon = await prisma.diskon.findFirst({
      where: {
        id: diskonId,
        stanId: stan.id,
      },
      include: {
        menuDiskon: {
          include: {
            menu: {
              select: {
                id: true,
                namaMakanan: true,
                harga: true,
                jenis: true,
              },
            },
          },
        },
      },
    });

    if (!diskon) {
      res.status(404).json({
        message: "Diskon tidak ditemukan atau bukan milik stan ini",
      });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil detail diskon",
      data: diskon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const diskonId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (isNaN(diskonId)) {
      res.status(400).json({ message: "ID diskon tidak valid" });
      return;
    }

    const { namaDiskon, persenDiskon, tanggalAwal, tanggalAkhir } = req.body;

    //  Ambil stan dari user JWT
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    // Pastikan diskon milik stan ini
    const findDiskon = await prisma.diskon.findFirst({
      where: {
        id: diskonId,
        stanId: stan.id,
      },
    });

    if (!findDiskon) {
      res.status(404).json({
        message: "Diskon tidak ditemukan atau bukan milik stan ini",
      });
      return;
    }

    // Validasi tanggal (jika dua-duanya dikirim)
    if (tanggalAwal && tanggalAkhir) {
      if (new Date(tanggalAwal) >= new Date(tanggalAkhir)) {
        res.status(400).json({
          message: "Tanggal akhir harus setelah tanggal awal",
        });
        return;
      }
    }

    // Update diskon
    const updatedDiskon = await prisma.diskon.update({
      where: { id: findDiskon.id },
      data: {
        namaDiskon: namaDiskon ?? findDiskon.namaDiskon,
        persenDiskon:
          persenDiskon !== undefined
            ? Number(persenDiskon)
            : findDiskon.persenDiskon,
        tanggalAwal: tanggalAwal
          ? new Date(tanggalAwal)
          : findDiskon.tanggalAwal,
        tanggalAkhir: tanggalAkhir
          ? new Date(tanggalAkhir)
          : findDiskon.tanggalAkhir,
      },
    });

    res.status(200).json({
      message: "Diskon berhasil diperbarui",
      data: updatedDiskon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const createMenuDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { menuIds, diskonId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Array.isArray(menuIds) || menuIds.length === 0 || !diskonId) {
      res.status(400).json({
        message: "menuIds (array) dan diskonId wajib diisi",
      });
      return;
    }

    // Ambil stan dari user JWT
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    // Ambil semua menu milik stan
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds.map(Number) },
        stanId: stan.id,
      },
    });

    if (menus.length !== menuIds.length) {
      res.status(404).json({
        message: "Sebagian menu tidak ditemukan atau bukan milik stan ini",
      });
      return;
    }

    // Ambil diskon
    const diskon = await prisma.diskon.findFirst({
      where: {
        id: Number(diskonId),
        stanId: stan.id,
      },
    });

    if (!diskon) {
      res.status(404).json({
        message: "Diskon tidak ditemukan atau bukan milik stan ini",
      });
      return;
    }

    // Cek duplikasi
    const existing = await prisma.menuDiskon.findMany({
      where: {
        diskonId: diskon.id,
        menuId: { in: menus.map((m) => m.id) },
      },
    });

    const existingMenuIds = new Set(existing.map((e) => e.menuId));

    const dataToCreate = menus
      .filter((m) => !existingMenuIds.has(m.id))
      .map((m) => ({
        menuId: m.id,
        diskonId: diskon.id,
      }));

    if (dataToCreate.length === 0) {
      res.status(400).json({
        message: "Semua menu sudah memiliki diskon ini",
      });
      return;
    }

    // Create MANY sekaligus
    const result = await prisma.menuDiskon.createMany({
      data: dataToCreate,
    });

    res.status(201).json({
      message: "Diskon berhasil diterapkan ke beberapa menu",
      total: result.count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMenuDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { search, jenis } = req.query;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    //  Ambil stan dari user
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({
        message: "Akses ditolak (bukan admin stan)",
      });
      return;
    }

    const menu = await prisma.menu.findMany({
      where: {
        stanId: stan.id,
        namaMakanan: search
          ? { contains: String(search)}
          : undefined,
        jenis: jenis ? (jenis as any) : undefined,
        menuDiskon: {
          some: {},
        },
      },
      include: {
        menuDiskon: {
          include: {
            diskon: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil menu diskon",
      data: menu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMenuDiskonByMenuId = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const menuId = Number(req.params.menuId);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // ambil stan dari user
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak (bukan admin stan)" });
      return;
    }

    // ambil menu + validasi kepemilikan stan
    const menu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        stanId: stan.id,
      },
      include: {
        menuDiskon: {
          include: {
            diskon: true,
          },
        },
      },
    });

    if (!menu || menu.menuDiskon.length === 0) {
      res.status(404).json({ message: "Menu diskon tidak ditemukan" });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil detail menu diskon",
      data: menu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateMenuDiskon = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const id = Number(req.params.id);
    const { menuId, diskonId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Ambil stan dari user
    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(403).json({ message: "Akses ditolak (bukan admin stan)" });
      return;
    }

    // Cari menuDiskon + relasi
    const find = await prisma.menuDiskon.findUnique({
      where: { id },
      include: {
        menu: true,
        diskon: true,
      },
    });

    if (!find) {
      res.status(404).json({ message: "MenuDiskon tidak ditemukan" });
      return;
    }

    // pastikan menuDiskon milik stan ini
    if (
      find.menu.stanId !== stan.id ||
      find.diskon.stanId !== stan.id
    ) {
      res.status(403).json({
        message: "Tidak berhak mengubah menu diskon stan lain",
      });
      return;
    }

    let finalMenuId = find.menuId;
    let finalDiskonId = find.diskonId;

    // Validasi menu baru
    if (menuId) {
      const menu = await prisma.menu.findFirst({
        where: {
          id: Number(menuId),
          stanId: stan.id,
        },
      });

      if (!menu) {
        res.status(404).json({
          message: "Menu tidak ditemukan atau bukan milik stan ini",
        });
        return;
      }

      finalMenuId = Number(menuId);
    }

    // Validasi diskon baru
    if (diskonId) {
      const diskon = await prisma.diskon.findFirst({
        where: {
          id: Number(diskonId),
          stanId: stan.id,
        },
      });

      if (!diskon) {
        res.status(404).json({
          message: "Diskon tidak ditemukan atau bukan milik stan ini",
        });
        return;
      }

      finalDiskonId = Number(diskonId);
    }

    // Cegah duplikasi
    const exists = await prisma.menuDiskon.findFirst({
      where: {
        menuId: finalMenuId,
        diskonId: finalDiskonId,
        NOT: { id },
      },
    });

    if (exists) {
      res.status(400).json({
        message: "Menu sudah memiliki diskon tersebut",
      });
      return;
    }

    // Update
    const updated = await prisma.menuDiskon.update({
      where: { id },
      data: {
        menuId: finalMenuId,
        diskonId: finalDiskonId,
      },
    });

    res.status(200).json({
      message: "Menu diskon berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};