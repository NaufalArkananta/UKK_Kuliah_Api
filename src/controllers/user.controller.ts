import { Request, Response } from "express";
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import fs from "fs"
import path from "path";


const prisma = new PrismaClient()

// Fitur siswa //

// Register Siswa
const createSiswa = async (req: Request, res: Response) => {
    try {
        const { username, password, namaSiswa, alamat, telp } = req.body;

        const findUsername = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if (findUsername) {
            res.status(400).json({ message: "Username sudah digunakan" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            }            
        })

        const newSiswa = await prisma.siswa.create({
            data: {
                namaSiswa,
                alamat,
                telp,
                userId: newUser.id
            }
        })

        const data = {
        user: {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            createdAt: newUser.createdAt,
        },
        siswa: newSiswa,
        };

        res.status(201).json({ 
            message: "Siswa berhasil dibuat", 
            data: data 
        });

        return;
    
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

// Update Siswa

const updateSiswa = async (    req: Request & { user?: { id: number } },
    res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const findSiswa = await prisma.siswa.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!findSiswa) {
      res.status(404).json({ message: "Profil siswa tidak ditemukan" });
      return;
    }

    const { namaSiswa, alamat, telp, username, password } = req.body;

    // 🔐 VALIDASI USERNAME
    if (username && username !== findSiswa.user.username) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) {
        res.status(400).json({ message: "Username sudah digunakan" });
        return;
      }
    }

    // 🖼️ HAPUS FOTO LAMA JIKA ADA
    if (req.file && findSiswa.foto) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        "userImage",
        findSiswa.foto
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // 🔄 UPDATE USER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username ?? findSiswa.user.username,
        password: hashedPassword ?? findSiswa.user.password,
      },
    });

    // 🔄 UPDATE SISWA
    const updatedSiswa = await prisma.siswa.update({
      where: { userId },
      data: {
        namaSiswa: namaSiswa ?? findSiswa.namaSiswa,
        alamat: alamat ?? findSiswa.alamat,
        telp: telp ?? findSiswa.telp,
        foto: req.file ? req.file.filename : findSiswa.foto,
      },
    });

    res.status(200).json({
      message: "Profil siswa berhasil diperbarui",
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
        },
        siswa: updatedSiswa,
      },
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


// Get Profile Siswa

const getProfileSiswa = async (
    req: Request & { user?: { id: number } },
    res: Response
    ) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
        }

        const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            role: true,
            siswa: true,
            createdAt: true,
        },
        });

        if (!user || !user.siswa) {
        res.status(404).json({ message: "Profil siswa tidak ditemukan" });
        return;
        }

        res.status(200).json({
        message: "Berhasil mengambil profil",
        data: user,
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

// Authentication Siswa
const authentication = async(req: Request, res: Response): Promise<void> => {
    try {
        const {username, password} = req.body
        
        /**check existing user*/
        const findUser = await prisma.user.findUnique({ where: {username} })
        if(!findUser){
            res.status(200).json({
                message: "Username tidak ditemukan"
            })
            return
        }

        const isMatchPassword = await bcrypt.compare(password, findUser?.password)
        if(!isMatchPassword){
            res.status(200).json({
                message: "Username atau Password yang anda masukkan salah"
            })
            return
        }

        /** prepare to generate token using JWT */
        const payload = {
            username: findUser?.username,
            id: findUser?.id,
            role: findUser?.role
        }

        const secret = process.env.SECRET;
        if (!secret) {
        throw new Error("JWT secret belum diset");
        }

        const token = jwt.sign(payload, secret, {
        expiresIn: "1d",
        });
        
        res.status(200).json({
            message: "Login berhasil",
            data: {            
            logged: true,
            token: token,
            id: findUser?.id,
            username: findUser?.username,}
        })
    } catch (error) {
        res.status(500).json(error)
    }
}

// Fitur Stan //

const createStan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, namaStan, namaPemilik, telp } = req.body;

    const findUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (findUsername) {
      res.status(400).json({ message: "Username sudah digunakan" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "ADMIN_STAN", // penting
      },
    });

    const newStan = await prisma.stan.create({
      data: {
        namaStan,
        namaPemilik,
        telp,
        foto: req.file ? req.file.filename : null,
        userId: newUser.id,
      },
    });

    res.status(201).json({
      message: "Stan berhasil dibuat",
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        stan: newStan,
      },
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateStan = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const findStan = await prisma.stan.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!findStan) {
      res.status(404).json({ message: "Profil stan tidak ditemukan" });
      return;
    }

    const { namaStan, namaPemilik, telp, username, password } = req.body;

    // 🔐 VALIDASI USERNAME
    if (username && username !== findStan.user.username) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) {
        res.status(400).json({ message: "Username sudah digunakan" });
        return;
      }
    }

    // 🖼️ HAPUS FOTO LAMA
    if (req.file && findStan.foto) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        "userImage",
        findStan.foto
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // 🔄 UPDATE USER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username ?? findStan.user.username,
        password: hashedPassword ?? findStan.user.password,
      },
    });

    // 🔄 UPDATE STAN
    const updatedStan = await prisma.stan.update({
      where: { userId },
      data: {
        namaStan: namaStan ?? findStan.namaStan,
        namaPemilik: namaPemilik ?? findStan.namaPemilik,
        telp: telp ?? findStan.telp,
        foto: req.file ? req.file.filename : findStan.foto,
      },
    });

    res.status(200).json({
      message: "Profil stan berhasil diperbarui",
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
        },
        stan: updatedStan,
      },
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getProfileStan = async (
  req: Request & { user?: { id: number } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        stan: true,
        createdAt: true,
      },
    });

    if (!user || !user.stan) {
      res.status(404).json({ message: "Profil stan tidak ditemukan" });
      return;
    }

    res.status(200).json({
      message: "Berhasil mengambil profil stan",
      data: user,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateSiswaByStan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ message: "User ID tidak valid" });
      return;
    }

    // 🔎 Cari siswa berdasarkan userId
    const findSiswa = await prisma.siswa.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!findSiswa) {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }

    const { namaSiswa, alamat, telp, username, password } = req.body;

    // 🔐 Validasi username (jika diubah)
    if (username && username !== findSiswa.user.username) {
      const exists = await prisma.user.findUnique({
        where: { username },
      });

      if (exists) {
        res.status(400).json({ message: "Username sudah digunakan" });
        return;
      }
    }

    // 🖼️ Hapus foto lama jika upload baru
    if (req.file && findSiswa.foto) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        "userImage",
        findSiswa.foto
      );

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // 🔐 Hash password jika diisi
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // 🔄 Update USER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username ?? findSiswa.user.username,
        password: hashedPassword ?? findSiswa.user.password,
      },
    });

    // 🔄 Update SISWA
    const updatedSiswa = await prisma.siswa.update({
      where: { userId },
      data: {
        namaSiswa: namaSiswa ?? findSiswa.namaSiswa,
        alamat: alamat ?? findSiswa.alamat,
        telp: telp ?? findSiswa.telp,
        foto: req.file ? req.file.filename : findSiswa.foto,
      },
    });

    res.status(200).json({
      message: "Data siswa berhasil diperbarui",
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
        },
        siswa: updatedSiswa,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllSiswa = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const siswa = await prisma.siswa.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Berhasil mengambil semua data siswa",
      data: siswa,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteSiswa = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ message: "User ID tidak valid" });
      return;
    }

    // 🔎 Cari siswa berdasarkan userId
    const siswa = await prisma.siswa.findUnique({
      where: { userId },
    });

    if (!siswa) {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }

    // 🖼️ Hapus foto jika ada
    if (siswa.foto) {
      const filePath = path.join(
        process.cwd(),
        "public",
        "userImage",
        siswa.foto
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 🗑️ Hapus SISWA dulu (FK ke User)
    await prisma.siswa.delete({
      where: { userId },
    });

    // 🗑️ Hapus USER
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      message: "Siswa dan user berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { createSiswa, authentication, getProfileSiswa, updateSiswa, createStan, updateStan, getProfileStan, updateSiswaByStan, getAllSiswa, deleteSiswa };