import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import fs from "fs";
import path from "path";

const deleteUploadedFile = (file?: Express.Multer.File) => {
  if (!file) return;

  const filePath = path.join(file.destination, file.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const createMenuSchema = Joi.object({
  namaMakanan: Joi.string().required(),
  harga: Joi.number().positive().required(),
  jenis: Joi.string().valid("MAKANAN", "MINUMAN").required(),
  deskripsi: Joi.string().allow("", null),
});

const createMenuValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = createMenuSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    deleteUploadedFile(req.file);
    res.status(400).json({
      message: error.details.map((d) => d.message).join(", "),
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      message: "Foto menu wajib diupload",
    });
    return;
  }

  next();
};

const updateMenuSchema = Joi.object({
  namaMakanan: Joi.string().min(3).optional(),
  harga: Joi.number().positive().optional(),
  jenis: Joi.string().valid("MAKANAN", "MINUMAN").optional(),
  deskripsi: Joi.string().allow("", null).optional(),
});

const updateMenuValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateMenuSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    // 🔥 HAPUS FILE JIKA VALIDASI GAGAL
    deleteUploadedFile(req.file);

    res.status(400).json({
      message: error.details.map((d) => d.message),
    });
    return;
  }

  next();
};

export { createMenuValidation, updateMenuValidation };