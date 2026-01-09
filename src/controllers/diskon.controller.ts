import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createDiskon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { namaDiskon, persenDiskon, tanggalAwal, tanggalAkhir } = req.body;

    if (new Date(tanggalAwal) >= new Date(tanggalAkhir)) {
      res.status(400).json({ message: "Tanggal akhir harus setelah tanggal awal" });
      return;
    }

    const diskon = await prisma.diskon.create({
      data: {
        namaDiskon,
        persenDiskon: Number(persenDiskon),
        tanggalAwal: new Date(tanggalAwal),
        tanggalAkhir: new Date(tanggalAkhir),
      },
    });

    res.status(201).json({
      message: "Diskon berhasil dibuat",
      data: diskon,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getAllDiskon = async (_req: Request, res: Response): Promise<void> => {
  try {
    const diskon = await prisma.diskon.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "Berhasil mengambil semua diskon",
      data: diskon,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getDiskonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const diskon = await prisma.diskon.findUnique({
      where: { id },
      include: {
        menuDiskon: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!diskon) {
      res.status(404).json({ message: "Diskon tidak ditemukan" });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil detail diskon",
      data: diskon,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const updateDiskon = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { namaDiskon, persenDiskon, tanggalAwal, tanggalAkhir } = req.body;

    const findDiskon = await prisma.diskon.findUnique({ where: { id } });
    if (!findDiskon) {
      res.status(404).json({ message: "Diskon tidak ditemukan" });
      return;
    }

    if (tanggalAwal && tanggalAkhir) {
      if (new Date(tanggalAwal) >= new Date(tanggalAkhir)) {
        res.status(400).json({ message: "Tanggal akhir harus setelah tanggal awal" });
        return;
      }
    }

    const updatedDiskon = await prisma.diskon.update({
      where: { id },
      data: {
        namaDiskon: namaDiskon ?? findDiskon.namaDiskon,
        persenDiskon: persenDiskon ?? findDiskon.persenDiskon,
        tanggalAwal: tanggalAwal ? new Date(tanggalAwal) : findDiskon.tanggalAwal,
        tanggalAkhir: tanggalAkhir ? new Date(tanggalAkhir) : findDiskon.tanggalAkhir,
      },
    });

    res.status(200).json({
      message: "Diskon berhasil diperbarui",
      data: updatedDiskon,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const createMenuDiskon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { menuId, diskonId } = req.body;

    const menu = await prisma.menu.findUnique({ where: { id: Number(menuId) } });
    const diskon = await prisma.diskon.findUnique({ where: { id: Number(diskonId) } });

    if (!menu || !diskon) {
      res.status(404).json({ message: "Menu atau Diskon tidak ditemukan" });
      return;
    }

    const exists = await prisma.menuDiskon.findFirst({
      where: { menuId: Number(menuId), diskonId: Number(diskonId) },
    });

    if (exists) {
      res.status(400).json({ message: "Diskon sudah diterapkan pada menu ini" });
      return;
    }

    const menuDiskon = await prisma.menuDiskon.create({
      data: {
        menuId: Number(menuId),
        diskonId: Number(diskonId),
      },
    });

    res.status(201).json({
      message: "Diskon berhasil ditambahkan ke menu",
      data: menuDiskon,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getMenuDiskon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, jenis } = req.query;

    const menu = await prisma.menu.findMany({
      where: {
        namaMakanan: search
          ? { contains: String(search) }
          : undefined,
        jenis: jenis ? (jenis as any) : undefined,
        menuDiskon: { some: {} }, // hanya menu yang punya diskon
      },
      include: {
        menuDiskon: {
          include: {
            diskon: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil menu diskon",
      data: menu,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getMenuDiskonByMenuId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const menuId = Number(req.params.menuId);

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
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
    res.status(500).json(error);
  }
};

export const updateMenuDiskon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { menuId, diskonId } = req.body;

    // cek menuDiskon
    const find = await prisma.menuDiskon.findUnique({ where: { id } });
    if (!find) {
      res.status(404).json({ message: "MenuDiskon tidak ditemukan" });
      return;
    }

    // validasi menu
    if (menuId) {
      const menu = await prisma.menu.findUnique({
        where: { id: Number(menuId) },
      });
      if (!menu) {
        res.status(404).json({ message: "Menu tidak ditemukan" });
        return;
      }
    }

    // validasi diskon
    if (diskonId) {
      const diskon = await prisma.diskon.findUnique({
        where: { id: Number(diskonId) },
      });
      if (!diskon) {
        res.status(404).json({ message: "Diskon tidak ditemukan" });
        return;
      }
    }

    const finalMenuId = menuId ? Number(menuId) : find.menuId;
    const finalDiskonId = diskonId ? Number(diskonId) : find.diskonId;

    // cegah duplikasi
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

    // update
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
    res.status(500).json(error);
  }
};

