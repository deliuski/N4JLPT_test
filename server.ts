import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const DATA_FILE = path.resolve(process.cwd(), 'data', 'lessons.json');

app.use(cors());
app.use(express.json());

async function readLessons() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function writeLessons(arr: any[]) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Write failed', e);
    return false;
  }
}

app.get('/api/lessons', async (req, res) => {
  const lessons = await readLessons();
  res.json(lessons);
});

app.post('/api/lessons', async (req, res) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: 'Expected an array of lessons' });
  }
  const ok = await writeLessons(body);
  if (!ok) return res.status(500).json({ error: 'Save failed' });
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Server API listening on http://localhost:${port}`));
