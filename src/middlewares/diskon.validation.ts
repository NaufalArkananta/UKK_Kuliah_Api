import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const createDiskonSchema = Joi.object({
  namaDiskon: Joi.string().min(3).required(),
  persenDiskon: Joi.number()
    .min(1)
    .max(100)
    .required()
    .messages({
      "number.base": "Persen diskon harus berupa angka",
      "number.min": "Persen diskon minimal 1%",
      "number.max": "Persen diskon maksimal 100%",
    }),
  tanggalAwal: Joi.date().required(),
  tanggalAkhir: Joi.date()
    .greater(Joi.ref("tanggalAwal"))
    .required()
    .messages({
      "date.greater": "Tanggal akhir harus setelah tanggal awal",
    }),
});

export const createDiskonValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = createDiskonSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: error.details.map((d) => d.message).join(", "),
    });
    return;
  }

  next();
};

const updateDiskonSchema = Joi.object({
  namaDiskon: Joi.string().min(3).optional(),
  persenDiskon: Joi.number().min(1).max(100).optional(),
  tanggalAwal: Joi.date().optional(),
  tanggalAkhir: Joi.date()
    .greater(Joi.ref("tanggalAwal"))
    .optional()
    .messages({
      "date.greater": "Tanggal akhir harus setelah tanggal awal",
    }),
})

export const updateDiskonValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = updateDiskonSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: error.details.map((d) => d.message).join(", "),
    });
    return;
  }

  next();
};

export const createMenuDiskonSchema = Joi.object({
  diskonId: Joi.number().required(),
  menuIds: Joi.array()
    .items(Joi.number().required())
    .min(1)
    .required(),
});

const updateMenuDiskonSchema = Joi.object({
  menuId: Joi.number()
    .integer()
    .positive()
    .optional(),

  diskonId: Joi.number()
    .integer()
    .positive()
    .optional(),
}).min(1).messages({
  "object.min": "Minimal salah satu field (menuId atau diskonId) harus diisi",
});

export const createMenuDiskonValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = createMenuDiskonSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: error.details.map((d) => d.message).join(", "),
    });
    return;
  }

  next();
};

export const updateMenuDiskonValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = updateMenuDiskonSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: error.details.map((d) => d.message).join(", "),
    });
    return;
  }

  next();
};
