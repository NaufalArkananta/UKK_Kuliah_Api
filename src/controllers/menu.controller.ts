import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const createMenu = async (
  req: Request & { user?: { id: number } },
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(404).json({ message: "Stan tidak ditemukan" });
      return;
    }

    const { namaMakanan, harga, jenis, deskripsi } = req.body;

    const menu = await prisma.menu.create({
      data: {
        namaMakanan,
        harga: Number(harga),
        jenis,
        deskripsi,
        foto: req.file!.filename,
        stanId: stan.id,
      },
    });

    res.status(201).json({
      message: "Menu berhasil ditambahkan",
      data: menu,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMenuStan = async (
  req: Request & { user?: { id: number } },
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    const stan = await prisma.stan.findUnique({
      where: { userId },
      include: { menu: true },
    });

    if (!stan) {
      res.status(404).json({ message: "Stan tidak ditemukan" });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil menu",
      data: stan.menu,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateMenu = async (
  req: Request & { user?: { id: number } },
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const id = Number(req.params.id);

    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(404).json({ message: "Stan tidak ditemukan" });
      return;
    }

    const menu = await prisma.menu.findFirst({
      where: { id: id },
    });

    if (!menu) {
      res.status(404).json({ message: "Menu tidak ditemukan" });
      return;
    }

    // 🖼️ hapus foto lama
    if (req.file && menu.foto) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        "menuImage",
        menu.foto,
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updatedMenu = await prisma.menu.update({
      where: { id: id },
      data: {
        namaMakanan: req.body.namaMakanan ?? menu.namaMakanan,
        harga: req.body.harga ? Number(req.body.harga) : menu.harga,
        jenis: req.body.jenis ?? menu.jenis,
        deskripsi: req.body.deskripsi ?? menu.deskripsi,
        foto: req.file ? req.file.filename : menu.foto,
      },
    });

    res.status(200).json({
      message: "Menu berhasil diperbarui",
      data: updatedMenu,
    });
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
  }
};

const deleteMenu = async (
  req: Request & { user?: { id: number } },
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const id = Number(req.params.id);

    const stan = await prisma.stan.findUnique({
      where: { userId },
    });

    if (!stan) {
      res.status(404).json({ message: "Stan tidak ditemukan" });
      return;
    }

    const menu = await prisma.menu.findFirst({
      where: { id: id, stanId: stan.id },
    });

    if (!menu) {
      res.status(404).json({ message: "Menu tidak ditemukan" });
      return;
    }

    if (menu.foto) {
      const pathFile = path.join(
        process.cwd(),
        "public",
        "menuImage",
        menu.foto,
      );
      if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile);
    }

    await prisma.menu.delete({ where: { id: id } });

    res.status(200).json({
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMenuDiskonAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.menu.findMany({
      where: {
        menuDiskon: {
          some: {}, // hanya menu yang punya diskon
        },
      },
      include: {
        menuDiskon: {
          include: {
            diskon: true,
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

    res.status(200).json({
      message: "Berhasil mengambil menu yang memiliki diskon",
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMenuMakanan = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.menu.findMany({
      where: {
        jenis: "MAKANAN",
      },
      include: {
        menuDiskon: {
          include: { diskon: true },
        },
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil menu makanan",
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMenuMinuman = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.menu.findMany({
      where: {
        jenis: "MINUMAN",
      },
      include: {
        menuDiskon: {
          include: { diskon: true },
        },
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil menu minuman",
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMenuAll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    const now = new Date();

    const data = await prisma.menu.findMany({
      where: q
        ? {
            OR: [
              {
                namaMakanan: {
                  contains: q,
                },
              },
              {
                stan: {
                  namaStan: {
                    contains: q,
                  },
                },
              },
            ],
          }
        : undefined,

      include: {
        stan: {
          select: {
            id: true,
            namaStan: true,
          },
        },
        menuDiskon: {
          where: {
            diskon: {
              tanggalAwal: {
                lte: now,
              },
              tanggalAkhir: {
                gte: now,
              },
            },
          },
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
      message: q
        ? `Berhasil mencari menu dengan kata kunci "${q}"`
        : "Berhasil mengambil semua menu",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};

const getMenuByStanId = async (
  req: Request & { user?: { id: number } },
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        message: "ID user tidak valid",
      });
      return;
    }

    const stan = await prisma.stan.findUnique({
      where: { userId },
      include: {
        menu: {
          include: {
            menuDiskon: {
              include: {
                diskon: true,
              },
            },
          },
        },
      },
    });

    if (!stan) {
      res.status(404).json({
        message: "Stan tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil menu",
      data: stan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};

const getAllStanWithMenus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;

    const stans = await prisma.stan.findMany({
      where: q
        ? {
            OR: [
              {
                namaStan: {
                  contains: q,
                },
              },
              {
                menu: {
                  some: {
                    namaMakanan: {
                      contains: q,
                    },
                  },
                },
              },
            ],
          }
        : undefined,
      include: {
        menu: {
          where: q
            ? {
                namaMakanan: {
                  contains: q,
                },
              }
            : undefined,
          include: {
            menuDiskon: {
              include: {
                diskon: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua stan",
      data: stans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

const searchMenu = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Query pencarian (q) wajib diisi",
      });
    }

    const where = {
      OR: [
        {
          namaMakanan: {
            contains: String(q),
          },
        },
        {
          stan: {
            namaStan: {
              contains: String(q),
            },
          },
        },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          stan: {
            select: {
              id: true,
              namaStan: true,
            },
          },
          menuDiskon: {
            include: {
              diskon: true,
            },
          },
        },
      }),
      prisma.menu.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Berhasil mencari menu",
      data,
    });
  } catch (error) {
    console.error("Search menu error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mencari menu",
    });
  }
};

export {
  createMenu,
  getMenuStan,
  updateMenu,
  deleteMenu,
  getMenuDiskonAll,
  getMenuMakanan,
  getMenuMinuman,
  getMenuAll,
  getMenuByStanId,
  getAllStanWithMenus,
  searchMenu,
};
