/**
 * Seed sample data (skip jika sudah ada — mode aman).
 * Jalankan: npm run seed
 */
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Root .env diutamakan (override config/.env)
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const User = require('../model/user');
const Capster = require('../model/Capster');
const Service = require('../model/Service');
const PaymentMethod = require('../model/PaymentMethod');
const Booking = require('../model/Booking');

const DEFAULT_PASSWORD = 'BarberRoni2024!';

const weekdaySchedule = (activeDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']) => {
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const schedule = {};
  for (const day of days) {
    const isActive = activeDays.includes(day);
    schedule[day] = {
      is_active: isActive,
      jam_kerja: day === 'sabtu' ? '09:00 - 18:00' : '10:00 - 20:00',
      jam_istirahat: '13:00 - 14:00',
    };
  }
  return schedule;
};

const usersSeed = [
  {
    username: 'roni.admin',
    email: 'roni@rumahgunting.id',
    address: 'Jl. Melawai Raya No. 18, Kebayoran Baru, Jakarta Selatan',
    role: 'admin',
  },
  {
    username: 'dewi.kasir',
    email: 'dewi@rumahgunting.id',
    address: 'Jl. Panglima Polim V No. 7, Kebayoran Baru, Jakarta Selatan',
    role: 'staff',
  },
  {
    username: 'andika.pratama',
    email: 'andika.pratama@gmail.com',
    address: 'Jl. Cipete Raya No. 45, Cilandak, Jakarta Selatan',
    role: 'customer',
  },
  {
    username: 'siti.rahma',
    email: 'siti.rahmawati@yahoo.com',
    address: 'Jl. TB Simatupang Kav. 32, Pasar Minggu, Jakarta Selatan',
    role: 'customer',
  },
  {
    username: 'budi.santoso',
    email: 'budi.santoso88@gmail.com',
    address: 'Jl. Raya Jatiwaringin No. 12, Pondok Gede, Bekasi',
    role: 'customer',
  },
];

const servicesSeed = [
  {
    name: 'Potong Rambut Classic',
    description: 'Potongan rambut pria klasik dengan konsultasi gaya sesuai bentuk wajah.',
    price: 45000,
    image:
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fade Haircut',
    description: 'Fade rendah hingga tinggi, rapi di sisi dan belakang, finishing dengan clipper.',
    price: 65000,
    image:
      'https://images.unsplash.com/photo-1622286342621-4bd786c244b1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cukur Jenggot & Kumis',
    description: 'Perawatan dan pembentukan jenggot/kumis dengan pisau cukur dan hot towel.',
    price: 35000,
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Creambath',
    description: 'Perawatan kulit kepala dan rambut dengan cream nutrisi, cocok untuk rambut kering.',
    price: 85000,
    image:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hair Coloring',
    description: 'Pewarnaan rambut profesional, konsultasi warna sesuai keinginan pelanggan.',
    price: 150000,
    image:
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
  },
];

const paymentsSeed = [{ name: 'Cash' }, { name: 'Transfer Bank BCA' }, { name: 'QRIS' }, { name: 'GoPay' }];

const capstersSeed = [
  {
    username: 'rizky.fade',
    phone: '081287654321',
    email: 'rizky@rumahgunting.id',
    address: 'Jl. Kemang Selatan No. 22, Jakarta Selatan',
    spesialis: 'Fade & Undercut',
    description:
      'Capster dengan pengalaman 6 tahun, fokus pada teknik fade modern dan gaya streetwear.',
    rating: 4.8,
    avatar:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
    album: [
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1622286342621-4bd786c244b1?auto=format&fit=crop&w=600&q=80',
    ],
    schedule: weekdaySchedule(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']),
  },
  {
    username: 'fajar.classic',
    phone: '081398765432',
    email: 'fajar@rumahgunting.id',
    address: 'Jl. Fatmawati No. 55, Cilandak, Jakarta Selatan',
    spesialis: 'Classic Cut & Pompadour',
    description:
      'Ahli potongan klasik dan pompadour. Sering menangani pelanggan kantoran dan wedding.',
    rating: 4.7,
    avatar:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
    album: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
    ],
    schedule: weekdaySchedule(['senin', 'selasa', 'rabu', 'kamis', 'jumat']),
  },
  {
    username: 'dimas.color',
    phone: '082112345678',
    email: 'dimas@rumahgunting.id',
    address: 'Jl. Pondok Indah Raya No. 9, Jakarta Selatan',
    spesialis: 'Coloring & Styling',
    description:
      'Spesialis pewarnaan dan styling rambut. Mengutamakan konsultasi warna yang aman untuk kulit kepala.',
    rating: 4.9,
    avatar:
      'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?auto=format&fit=crop&w=600&q=80',
    album: [
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    ],
    schedule: weekdaySchedule(['selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']),
  },
];

function daysFromToday(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

async function upsertUser(data, passwordHash) {
  const existing = await User.findOne({
    $or: [{ email: data.email }, { username: data.username }],
  });
  if (existing) {
    console.log(`  skip user: ${data.username}`);
    return existing;
  }
  const user = await User.create({ ...data, password: passwordHash });
  console.log(`  + user: ${data.username}`);
  return user;
}

async function upsertService(data) {
  const existing = await Service.findOne({ name: data.name });
  if (existing) {
    console.log(`  skip service: ${data.name}`);
    return existing;
  }
  const service = await Service.create(data);
  console.log(`  + service: ${data.name}`);
  return service;
}

async function upsertPayment(data) {
  const existing = await PaymentMethod.findOne({ name: data.name });
  if (existing) {
    console.log(`  skip payment: ${data.name}`);
    return existing;
  }
  const payment = await PaymentMethod.create(data);
  console.log(`  + payment: ${data.name}`);
  return payment;
}

async function upsertCapster(data) {
  const existing = await Capster.findOne({
    $or: [{ email: data.email }, { username: data.username }, { phone: data.phone }],
  });
  if (existing) {
    console.log(`  skip capster: ${data.username}`);
    return existing;
  }
  const capster = await Capster.create(data);
  console.log(`  + capster: ${data.username}`);
  return capster;
}

async function upsertBooking(data) {
  const existing = await Booking.findOne({
    email: data.email,
    date: data.date,
    hour: data.hour,
    capster_id: data.capster_id,
  });
  if (existing) {
    console.log(`  skip booking: ${data.name} ${data.date.toISOString().slice(0, 10)} ${data.hour}:00`);
    return existing;
  }
  const booking = await Booking.create(data);
  console.log(`  + booking: ${data.name} (${data.status})`);
  return booking;
}

async function seed() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DB_URL tidak ditemukan. Pastikan .env atau config/.env terisi.');
  }

  await mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Terhubung ke MongoDB: ${mongoose.connection.host}\n`);

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

  console.log('Users');
  for (const u of usersSeed) {
    await upsertUser(u, passwordHash);
  }

  console.log('\nServices');
  const services = {};
  for (const s of servicesSeed) {
    const doc = await upsertService(s);
    services[s.name] = doc;
  }

  console.log('\nPayment methods');
  const payments = {};
  for (const p of paymentsSeed) {
    const doc = await upsertPayment(p);
    payments[p.name] = doc;
  }

  console.log('\nCapsters');
  const capsters = {};
  for (const c of capstersSeed) {
    const doc = await upsertCapster(c);
    capsters[c.username] = doc;
  }

  console.log('\nBookings');
  const bookingsSeed = [
    {
      name: 'Andika Pratama',
      email: 'andika.pratama@gmail.com',
      phone: '081234567890',
      date: daysFromToday(-2),
      hour: 14,
      capster_id: capsters['rizky.fade']._id,
      payment_id: payments['QRIS']._id,
      service_id: services['Fade Haircut']._id,
      haircut_type: 'Mid fade',
      status: 'Selesai',
      rating: 5,
    },
    {
      name: 'Siti Rahmawati',
      email: 'siti.rahmawati@yahoo.com',
      phone: '081876543210',
      date: daysFromToday(-1),
      hour: 11,
      capster_id: capsters['fajar.classic']._id,
      payment_id: payments['Transfer Bank BCA']._id,
      service_id: services['Potong Rambut Classic']._id,
      haircut_type: 'Short classic',
      status: 'Selesai',
      rating: 4,
    },
    {
      name: 'Budi Santoso',
      email: 'budi.santoso88@gmail.com',
      phone: '082198765432',
      date: daysFromToday(0),
      hour: 10,
      capster_id: capsters['rizky.fade']._id,
      payment_id: payments['Cash']._id,
      service_id: services['Cukur Jenggot & Kumis']._id,
      haircut_type: 'Beard trim',
      status: 'Sedang Di Layani',
    },
    {
      name: 'Andika Pratama',
      email: 'andika.pratama@gmail.com',
      phone: '081234567890',
      date: daysFromToday(0),
      hour: 16,
      capster_id: capsters['dimas.color']._id,
      payment_id: payments['GoPay']._id,
      service_id: services['Creambath']._id,
      status: 'Di Konfirmasi',
    },
    {
      name: 'Rizki Hidayat',
      email: 'rizki.hidayat@gmail.com',
      phone: '081355512345',
      date: daysFromToday(1),
      hour: 13,
      capster_id: capsters['fajar.classic']._id,
      payment_id: payments['QRIS']._id,
      service_id: services['Potong Rambut Classic']._id,
      haircut_type: 'Side part',
      status: 'Menunggu',
    },
    {
      name: 'Fauzan Malik',
      email: 'fauzan.malik@outlook.com',
      phone: '085712398765',
      date: daysFromToday(2),
      hour: 15,
      capster_id: capsters['dimas.color']._id,
      payment_id: payments['Transfer Bank BCA']._id,
      service_id: services['Hair Coloring']._id,
      haircut_type: 'Ash brown',
      status: 'Menunggu',
    },
    {
      name: 'Budi Santoso',
      email: 'budi.santoso88@gmail.com',
      phone: '082198765432',
      date: daysFromToday(3),
      hour: 11,
      capster_id: capsters['rizky.fade']._id,
      payment_id: payments['Cash']._id,
      service_id: services['Fade Haircut']._id,
      haircut_type: 'Low fade',
      status: 'Di Konfirmasi',
    },
  ];

  for (const b of bookingsSeed) {
    await upsertBooking(b);
  }

  console.log('\nSelesai.');
  console.log(`Password default semua user: ${DEFAULT_PASSWORD}`);
}

seed()
  .catch((err) => {
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
