import { NextFunction, Request, Response } from "express";
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

const createSiswaSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(8).required(),
  namaSiswa: Joi.string().min(3).required(),
  alamat: Joi.string().allow("", null),
  telp: Joi.string().pattern(/^[0-9]+$/).min(10).max(20).allow("", null),
});

const createSiswaValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const validate = createSiswaSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validate.error) {
    res.status(400).json({
      message: validate.error.details.map(it => it.message).join(", "),
    });
    return;
  }

  next();
};

const updateSiswaSchema = Joi.object({
  namaSiswa: Joi.string().min(3).optional(),
  alamat: Joi.string().allow("", null).optional(),
  telp: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(8)
    .max(15)
    .optional()
    .messages({
      "string.pattern.base": "Nomor telepon hanya boleh angka",
    }),

  // USER TABLE
  username: Joi.string().min(4).optional(),
  password: Joi.string().min(6).optional(),
})

const updateSiswaValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = updateSiswaSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    // HAPUS FILE JIKA VALIDASI GAGAL
    deleteUploadedFile(req.file);

    res.status(400).json({
      message: error.details.map((d) => d.message),
    });
    return;
  }

  next();
};

// ------------------ STAN VALIDATION ------------------ //

const createStanSchema = Joi.object({
  username: Joi.string()
    .min(4)
    .max(30)
    .required()
    .messages({
      "string.empty": "Username wajib diisi",
      "string.min": "Username minimal 4 karakter",
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.empty": "Password wajib diisi",
      "string.min": "Password minimal 6 karakter",
    }),

  namaStan: Joi.string()
    .required()
    .messages({
      "string.empty": "Nama stan wajib diisi",
    }),

  namaPemilik: Joi.string().allow("", null),
  telp: Joi.string().allow("", null),
});

const createStanValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createStanSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: "Validasi gagal",
      errors: error.details.map((err) => err.message),
    });
    return;
  }

  next();
};

const updateStanSchema = Joi.object({
  username: Joi.string()
    .min(4)
    .max(30)
    .optional()
    .messages({
      "string.min": "Username minimal 4 karakter",
    }),

  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.min": "Password minimal 6 karakter",
    }),

  namaStan: Joi.string().optional(),
  namaPemilik: Joi.string().allow("", null),
  telp: Joi.string().allow("", null),
});

const updateStanValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = updateStanSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    // HAPUS FILE JIKA VALIDASI GAGAL
    deleteUploadedFile(req.file);

    res.status(400).json({
      message: error.details.map((d) => d.message),
    });
    return;
  }

  next();
};

const loginSchema = Joi.object({
  username: Joi.string().min(4).required().messages({
    "string.empty": "Username wajib diisi",
    "string.min": "Username minimal 4 karakter",
  }),

  password: Joi.string().min(6).required().messages({
    "string.empty": "Password wajib diisi",
    "string.min": "Password minimal 6 karakter",
  }),
});

const loginValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = loginSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: error.details.map((d) => d.message),
    });
    return;
  }

  next();
};

export { createSiswaValidation, updateSiswaValidation, loginValidation, createStanValidation, updateStanValidation };
