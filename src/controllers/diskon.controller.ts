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

