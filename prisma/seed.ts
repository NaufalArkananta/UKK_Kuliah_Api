import {
  PrismaClient,
  Role,
  MenuJenis,
  TransaksiStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

faker.locale = "id_ID";

const prisma = new PrismaClient();

const MENU_MAKANAN = [
  "Nasi Goreng",
  "Mie Ayam",
  "Bakso",
  "Sate Ayam",
  "Ayam Geprek",
  "Soto Ayam",
  "Rendang",
  "Rawon",
  "Gado-Gado",
  "Pecel",
];

const MENU_MINUMAN = [
  "Es Teh",
  "Es Jeruk",
  "Jus Alpukat",
  "Jus Mangga",
  "Teh Hangat",
  "Kopi Hitam",
];

async function main() {
  console.log("🌱 Seeding Faker Indonesia (v7 FIX)...");

  const password = await bcrypt.hash("12345678", 10);

  // =========================
  // AKUN UTAMA
  // =========================
  const adminUtama = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password,
      role: Role.ADMIN_STAN,
      stan: {
        create: {
          namaStan: "Stan Utama",
          namaPemilik: faker.name.findName(),
          telp: faker.phone.phoneNumber("08##########"),
        },
      },
    },
    include: { stan: true },
  });

  const userUtama = await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      password,
      role: Role.SISWA,
      siswa: {
        create: {
          namaSiswa: faker.name.findName(),
          alamat: faker.address.streetAddress(),
          telp: faker.phone.phoneNumber("08##########"),
        },
      },
    },
    include: { siswa: true },
  });

  // =========================
  // 20 STAN + ADMIN
  // =========================
  const stans = [];

  for (let i = 1; i <= 20; i++) {
    const adminStan = await prisma.user.create({
      data: {
        username: `admin_stan_${i}`,
        password,
        role: Role.ADMIN_STAN,
        stan: {
          create: {
            namaStan: `Stan ${faker.company.companyName()}`,
            namaPemilik: faker.name.findName(),
            telp: faker.phone.phoneNumber("08##########"),
          },
        },
      },
      include: { stan: true },
    });

    stans.push(adminStan.stan!);
  }

  // =========================
  // MENU + DISKON
  // =========================
  const allMenus = [];

  for (const stan of stans) {
    await prisma.menu.createMany({
      data: Array.from({ length: 10 }).map(() => {
        const isFood = faker.datatype.boolean();
        return {
          namaMakanan: faker.helpers.arrayElement(
            isFood ? MENU_MAKANAN : MENU_MINUMAN
          ),
          harga: faker.datatype.number({ min: 5000, max: 30000 }),
          jenis: isFood ? MenuJenis.MAKANAN : MenuJenis.MINUMAN,
          deskripsi: faker.lorem.sentence(),
          stanId: stan.id,
        };
      }),
    });

    const menus = await prisma.menu.findMany({
      where: { stanId: stan.id },
    });

    allMenus.push(...menus);

    const diskon = await prisma.diskon.create({
      data: {
        namaDiskon: `Promo ${faker.random.word()}`,
        persenDiskon: faker.datatype.number({ min: 5, max: 30 }),
        tanggalAwal: faker.date.recent(),
        tanggalAkhir: faker.date.soon(30),
        stanId: stan.id,
      },
    });

    await prisma.menuDiskon.createMany({
      data: faker.helpers.shuffle(menus).slice(0, 3).map((menu) => ({
        menuId: menu.id,
        diskonId: diskon.id,
      })),
    });
  }

  // =========================
  // 10 SISWA
  // =========================
  const siswaList = [];

  for (let i = 1; i <= 10; i++) {
    const siswa = await prisma.user.create({
      data: {
        username: `siswa_${i}`,
        password,
        role: Role.SISWA,
        siswa: {
          create: {
            namaSiswa: faker.name.findName(),
            alamat: faker.address.streetAddress(),
            telp: faker.phone.phoneNumber("08##########"),
          },
        },
      },
      include: { siswa: true },
    });

    siswaList.push(siswa.siswa!);
  }

  // =========================
  // TRANSAKSI
  // =========================
  for (let i = 0; i < 100; i++) {
    const siswa = faker.helpers.arrayElement(siswaList);
    const menu = faker.helpers.arrayElement(allMenus);

    await prisma.transaksi.create({
      data: {
        stanId: menu.stanId,
        siswaId: siswa.id,
        status: faker.helpers.arrayElement([
          TransaksiStatus.BELUM_DIKONFIRM,
          TransaksiStatus.DIMASAK,
          TransaksiStatus.DIANTAR,
          TransaksiStatus.SAMPAI,
        ]),
        detail: {
          create: [
            {
              menuId: menu.id,
              qty: faker.datatype.number({ min: 1, max: 3 }),
              hargaBeli: menu.harga,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seeder faker Indonesia BERHASIL (v7, foto NULL semua)");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
