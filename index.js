// app.js - File utama aplikasi Express

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk parsing JSON dan URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Path file database JSON
const dataPath = path.join(__dirname, 'dstat.json');

// Inisialisasi file JSON jika belum ada
const initializeDataFile = () => {
  if (!fs.existsSync(dataPath)) {
    const initialData = { users: {} };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
    console.log('Database file created!');
  }
};

// Baca data dari file JSON
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { users: {} };
  }
};

// Tulis data ke file JSON
const writeData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to data file:', error);
  }
};

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route untuk static files (css, js, dll)
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint untuk mendapatkan data statistik semua user
app.get('/api/stats', (req, res) => {
  const data = readData();
  res.json(data);
});

// Endpoint untuk username yang akan menambah hit count
app.get('/:username', (req, res) => {
  const username = req.params.username;
  const data = readData();

  // Jika username belum ada di database, tambahkan
  if (!data.users[username]) {
    data.users[username] = {
      hits: 0,
      lastHit: new Date().toISOString(),
      history: []
    };
  }

  // Update hit count
  data.users[username].hits += 1;
  data.users[username].lastHit = new Date().toISOString();

  // Tambahkan ke history untuk grafik (batasi history ke 100 entri)
  data.users[username].history.push({
    timestamp: new Date().toISOString(),
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
  });

  if (data.users[username].history.length > 100) {
    data.users[username].history.shift(); // Hapus entri tertua
  }

  // Simpan perubahan
  writeData(data);

  // Kirim respons
  res.send(`Hit recorded for ${username}. Total hits: ${data.users[username].hits}`);
});

// Inisialisasi database sebelum memulai server
initializeDataFile();

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
