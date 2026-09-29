require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
// CORS_ORIGIN=* (or empty) = allow all origins: zero-config for localhost,
// LAN/mobile (phone on same Wi-Fi), and other PCs. Set explicit URL(s) in
// production/cloud, e.g. CORS_ORIGIN=https://app-xxx.run.app (see .env.example).
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').trim();
if (CORS_ORIGIN === '' || CORS_ORIGIN === '*') {
  app.use(cors());
} else {
  app.use(cors({ origin: CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) }));
}
app.use(express.json());

// Vehicle type: 1 petrol / 2 hybrid / 3 electric / 4 diesel.
// Set once at creation; no update endpoint exists so it is immutable.
const VALID_VEHICLE_TYPES = [1, 2, 3, 4];

app.get('/api/vehicles', async (req, res) => {
    console.log('GET api/vehicles');
    const { rows } = await db.query(
        `SELECT id, CAST(type AS INTEGER) AS type
        FROM vehicles 
        ORDER BY id`);
    res.json(rows);
});

app.post('/api/vehicles', async (req, res) => {
    const { id, type } = req.body;
    const vehicleType = Number(type);
    if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return res.status(400).json({ message: '車輛類別無效' });
    }
    console.log(`POST api/vehicles ${JSON.stringify(req.body)}`);
    try {
        await db.query(
            `INSERT INTO vehicles (id, type) 
            VALUES ($1, $2)`, [id, vehicleType]);
        res.status(200).json({ message: '車輛註冊成功' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '車輛已被註冊' });
        return res.status(500).end();
    }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE api/vehicles/${id}`);
    await db.query(
        `DELETE FROM vehicles 
        WHERE id=$1`, [id]);
    res.status(204).json({ message: '車輛已刪除' });
});

app.get('/api/fuelrecords/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`GET api/fuelrecords/${id}`);
    const { rows } = await db.query(
        `SELECT id, date, odm, vendor, fuel_type AS "fuelType", litre, price, 
        COALESCE(price / NULLIF(litre, 0), 0) AS "pricePerLitre"
        FROM fuel_records
        WHERE vehicle_id=$1
        ORDER BY odm`, [id]);
    res.json(rows);
});

app.post('/api/fuelrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, odm, vendor, fuelType, litre, price } = req.body;
    console.log(`POST api/fuelrecords/${id} ${JSON.stringify(req.body)}`);
    await db.query(
        `INSERT INTO fuel_records
        (vehicle_id, date, odm, vendor, fuel_type, litre, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, date, odm, vendor, fuelType, litre, price]);
    res.status(201).json({ message: '入油記錄已新增' });
});

app.delete('/api/fuelrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { odm } = req.query;
    console.log(`DELETE api/fuelrecords/${id} ${JSON.stringify(req.query)}`);
    await db.query(
        `DELETE FROM fuel_records 
        WHERE vehicle_id=$1 AND odm=$2`, [id, odm]);
    res.status(204).json({ message: '入油記錄已刪除' });
});

app.put('/api/fuelrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, odm, vendor, fuelType, litre, price } = req.body;
    console.log(`PUT api/fuelrecords/${vehicleId}/${recordId} ${JSON.stringify(req.body)}`);
    try {
        const result = await db.query(
            `UPDATE fuel_records
            SET date=$1, odm=$2, vendor=$3, fuel_type=$4, litre=$5, price=$6
            WHERE id=$7 AND vehicle_id=$8`,
            [date, odm, vendor, fuelType, litre, price, recordId, vehicleId]);
        if (result.rowCount === 0) return res.status(404).json({ message: '找不到入油記錄' });
        res.status(200).json({ message: '入油記錄已更新' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '入油記錄已存在' });
        return res.status(500).end();
    }
});

// Charge records: same CRUD shape as fuel (kwh instead of litre),
// for electric vehicles only (enforced in the frontends).
app.get('/api/chargerecords/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`GET api/chargerecords/${id}`);
    const { rows } = await db.query(
        `SELECT id, date, odm, kwh, price,
        COALESCE(price / NULLIF(kwh, 0), 0) AS "pricePerKwh"
        FROM charge_records
        WHERE vehicle_id=$1
        ORDER BY odm`, [id]);
    res.json(rows);
});

app.post('/api/chargerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, odm, kwh, price } = req.body;
    console.log(`POST api/chargerecords/${id} ${JSON.stringify(req.body)}`);
    try {
        await db.query(
            `INSERT INTO charge_records
            (vehicle_id, date, odm, kwh, price)
            VALUES ($1, $2, $3, $4, $5)`,
            [id, date, odm, kwh, price]);
        res.status(201).json({ message: '充電記錄已新增' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '充電記錄已存在' });
        return res.status(500).end();
    }
});

app.delete('/api/chargerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { odm } = req.query;
    console.log(`DELETE api/chargerecords/${id} ${JSON.stringify(req.query)}`);
    await db.query(
        `DELETE FROM charge_records
        WHERE vehicle_id=$1 AND odm=$2`, [id, odm]);
    res.status(204).json({ message: '充電記錄已刪除' });
});

app.put('/api/chargerecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, odm, kwh, price } = req.body;
    console.log(`PUT api/chargerecords/${vehicleId}/${recordId} ${JSON.stringify(req.body)}`);
    try {
        const result = await db.query(
            `UPDATE charge_records
            SET date=$1, odm=$2, kwh=$3, price=$4
            WHERE id=$5 AND vehicle_id=$6`,
            [date, odm, kwh, price, recordId, vehicleId]);
        if (result.rowCount === 0) return res.status(404).json({ message: '找不到充電記錄' });
        res.status(200).json({ message: '充電記錄已更新' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '充電記錄已存在' });
        return res.status(500).end();
    }
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));