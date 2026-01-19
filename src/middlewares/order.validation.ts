import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// item menu
const pesanItemSchema = Joi.object({
  id_menu: Joi.number().integer().positive().required(),
  qty: Joi.number().integer().min(1).required(),
});

// root schema (HANYA 1 STAN)
const createPesanSchema = Joi.object({
  id_stan: Joi.number().integer().positive().required(),
  pesan: Joi.array().items(pesanItemSchema).min(1).required(),
});

export const createPesanValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error } = createPesanSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400).json({
      message: "Validasi gagal",
      errors: error.details.map((e) => e.message),
    });
    return;
  }

  next();
};