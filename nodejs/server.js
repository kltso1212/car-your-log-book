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

// Liveness probe for Docker / Cloud Run / Render / Railway health checks.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Vehicle: id INTEGER PK (surrogate), plate TEXT (non-unique, upper-cased),
// type 1 petrol / 2 hybrid / 3 electric / 4 diesel (changeable via PUT),
// brand/model TEXT, year INTEGER|null. plate/type/brand/model/year are mutable via PUT.
const VALID_VEHICLE_TYPES = [1, 2, 3, 4];

const normalizePlate = (v) => String(v ?? '').trim().toUpperCase();
const isValidYear = (v) => {
    if (v === null || v === undefined || v === '') return true;
    const n = Number(v);
    if (!Number.isInteger(n)) return false;
    return n >= 1900 && n <= new Date().getFullYear() + 1;
};

app.get('/api/vehicles', async (req, res) => {
    const { rows } = await db.query(
        `SELECT id, plate, CAST(type AS INTEGER) AS type, brand, model, year
        FROM vehicles
        ORDER BY id`);
    res.json(rows);
});

app.get('/api/vehicles/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ message: '找不到車輛' });
    const { rows } = await db.query(
        `SELECT id, plate, CAST(type AS INTEGER) AS type, brand, model, year
        FROM vehicles
        WHERE id=$1`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: '找不到車輛' });
    res.json(rows[0]);
});

app.post('/api/vehicles', async (req, res) => {
    const { plate, type, brand, model, year } = req.body;
    const vehicleType = Number(type);
    if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return res.status(400).json({ message: '車輛類別無效' });
    }
    const normPlate = normalizePlate(plate);
    if (!normPlate) {
        return res.status(400).json({ message: '車牌無效' });
    }
    const normBrand = String(brand ?? '').trim();
    const normModel = String(model ?? '').trim();
    const normYear = (year === null || year === undefined || year === '') ? null : Number(year);
    if (!isValidYear(normYear)) {
        return res.status(400).json({ message: '年份無效' });
    }
    try {
        const result = await db.query(
            `INSERT INTO vehicles (plate, type, brand, model, year)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [normPlate, vehicleType, normBrand, normModel, normYear]);
        res.status(200).json({ message: '車輛註冊成功', id: result.rows[0]?.id ?? null });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '車輛已被註冊' });
        return res.status(500).end();
    }
});

app.put('/api/vehicles/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ message: '找不到車輛' });
    const { plate, type, brand, model, year } = req.body;
    const vehicleType = Number(type);
    if (!VALID_VEHICLE_TYPES.includes(vehicleType)) {
        return res.status(400).json({ message: '車輛類別無效' });
    }
    const normPlate = normalizePlate(plate);
    if (!normPlate) {
        return res.status(400).json({ message: '車牌無效' });
    }
    const normBrand = String(brand ?? '').trim();
    const normModel = String(model ?? '').trim();
    const normYear = (year === null || year === undefined || year === '') ? null : Number(year);
    if (!isValidYear(normYear)) {
        return res.status(400).json({ message: '年份無效' });
    }
    const result = await db.query(
        `UPDATE vehicles
        SET plate=$1, type=$2, brand=$3, model=$4, year=$5
        WHERE id=$6`,
        [normPlate, vehicleType, normBrand, normModel, normYear, id]);
    if (result.rowCount === 0) return res.status(404).json({ message: '找不到車輛' });
    res.status(200).json({ message: '車輛已更新' });
});

app.delete('/api/vehicles/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ message: '找不到車輛' });
    await db.query(
        `DELETE FROM vehicles
        WHERE id=$1`, [id]);
    res.status(204).json({ message: '車輛已刪除' });
});

app.get('/api/fuelrecords/:id', async (req, res) => {
    const { id } = req.params;
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
    await db.query(
        `DELETE FROM fuel_records 
        WHERE vehicle_id=$1 AND odm=$2`, [id, odm]);
    res.status(204).json({ message: '入油記錄已刪除' });
});

app.put('/api/fuelrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, odm, vendor, fuelType, litre, price } = req.body;
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

// Service records: date/odm/items(JSON int[])/custom_item/price.
// UNIQUE(vehicle_id, odm) like fuel — one service per mileage point.
app.get('/api/servicerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query(
        `SELECT id, date, odm, items, custom_item AS "customItem", price
        FROM service_records
        WHERE vehicle_id=$1
        ORDER BY odm`, [id]);
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
});
// No UNIQUE constraint; deletes key on the surrogate id.
app.get('/api/finerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query(
        `SELECT id, date, offences, custom_offence AS "customOffence", location, penalty
        FROM fine_records
        WHERE vehicle_id=$1
        ORDER BY date DESC, id DESC`, [id]);
    res.json(rows.map(r => ({ ...r, offences: JSON.parse(r.offences || '[]') })));
});

app.post('/api/finerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, offences, customOffence, location, penalty } = req.body;
    const result = await db.query(
        `INSERT INTO fine_records
        (vehicle_id, date, offences, custom_offence, location, penalty)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [id, date, JSON.stringify(offences ?? []), customOffence ?? null, location ?? null, penalty]);
    res.status(201).json({ message: '罰款記錄已新增', id: result.rows[0]?.id ?? null });
});

app.delete('/api/finerecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    await db.query(
        `DELETE FROM fine_records
        WHERE id=$1 AND vehicle_id=$2`, [recordId, vehicleId]);
    res.status(204).json({ message: '罰款記錄已刪除' });
});

app.put('/api/finerecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, offences, customOffence, location, penalty } = req.body;
    const result = await db.query(
        `UPDATE fine_records
        SET date=$1, offences=$2, custom_offence=$3, location=$4, penalty=$5
        WHERE id=$6 AND vehicle_id=$7`,
        [date, JSON.stringify(offences ?? []), customOffence ?? null, location ?? null, penalty, recordId, vehicleId]);
    if (result.rowCount === 0) return res.status(404).json({ message: '找不到罰款記錄' });
    res.status(200).json({ message: '罰款記錄已更新' });
});

// Service records: date/odm/items(JSON int[])/custom_item/price.
// UNIQUE(vehicle_id, odm) like fuel — one service per mileage point;
// deletes key on (vehicle, odm) like fuel too.
app.get('/api/servicerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query(
        `SELECT id, date, odm, items, custom_item AS "customItem", price
        FROM service_records
        WHERE vehicle_id=$1
        ORDER BY odm`, [id]);
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
});

app.post('/api/servicerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, odm, items, customItem, price } = req.body;
    try {
        await db.query(
            `INSERT INTO service_records
            (vehicle_id, date, odm, items, custom_item, price)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, date, odm, JSON.stringify(items ?? []), customItem ?? null, price]);
        res.status(201).json({ message: '保養記錄已新增' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '保養記錄已存在' });
        return res.status(500).end();
    }
});

app.delete('/api/servicerecords/:id', async (req, res) => {
    const { id } = req.params;
    const { odm } = req.query;
    await db.query(
        `DELETE FROM service_records
        WHERE vehicle_id=$1 AND odm=$2`, [id, odm]);
    res.status(204).json({ message: '保養記錄已刪除' });
});

app.put('/api/servicerecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, odm, items, customItem, price } = req.body;
    try {
        const result = await db.query(
            `UPDATE service_records
            SET date=$1, odm=$2, items=$3, custom_item=$4, price=$5
            WHERE id=$6 AND vehicle_id=$7`,
            [date, odm, JSON.stringify(items ?? []), customItem ?? null, price, recordId, vehicleId]);
        if (result.rowCount === 0) return res.status(404).json({ message: '找不到保養記錄' });
        res.status(200).json({ message: '保養記錄已更新' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: '保養記錄已存在' });
        return res.status(500).end();
    }
});

// Parking records: date/carpark/rental_type/fee. No UNIQUE constraint
// (multiple parks per day are normal); deletes key on the surrogate id.
app.get('/api/parkingrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query(
        `SELECT id, date, carpark, rental_type AS "rentalType", fee
        FROM parking_records
        WHERE vehicle_id=$1
        ORDER BY date DESC, id DESC`, [id]);
    res.json(rows);
});

app.post('/api/parkingrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, carpark, rentalType, fee } = req.body;
    const result = await db.query(
        `INSERT INTO parking_records
        (vehicle_id, date, carpark, rental_type, fee)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [id, date, carpark, rentalType, fee]);
    res.status(201).json({ message: '泊車記錄已新增', id: result.rows[0]?.id ?? null });
});

app.delete('/api/parkingrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    await db.query(
        `DELETE FROM parking_records
        WHERE id=$1 AND vehicle_id=$2`, [recordId, vehicleId]);
    res.status(204).json({ message: '泊車記錄已刪除' });
});

app.put('/api/parkingrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, carpark, rentalType, fee } = req.body;
    const result = await db.query(
        `UPDATE parking_records
        SET date=$1, carpark=$2, rental_type=$3, fee=$4
        WHERE id=$5 AND vehicle_id=$6`,
        [date, carpark, rentalType, fee, recordId, vehicleId]);
    if (result.rowCount === 0) return res.status(404).json({ message: '找不到泊車記錄' });
    res.status(200).json({ message: '泊車記錄已更新' });
});

// Charge records: same CRUD shape as fuel (kwh instead of litre),
// for electric vehicles only (enforced in the frontends).
app.get('/api/chargerecords/:id', async (req, res) => {
    const { id } = req.params;
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
    await db.query(
        `DELETE FROM charge_records
        WHERE vehicle_id=$1 AND odm=$2`, [id, odm]);
    res.status(204).json({ message: '充電記錄已刪除' });
});

app.put('/api/chargerecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, odm, kwh, price } = req.body;
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

// Tunnel records: same CRUD shape as fuel, but no odm and no UNIQUE
// constraint (same tunnel twice a day is normal). Deletes key on the
// surrogate id instead of ?odm=.
app.get('/api/tunnelrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await db.query(
        `SELECT id, date, tunnel, bound, fee
        FROM tunnel_records
        WHERE vehicle_id=$1
        ORDER BY date DESC, id DESC`, [id]);
    res.json(rows);
});

app.post('/api/tunnelrecords/:id', async (req, res) => {
    const { id } = req.params;
    const { date, tunnel, bound, fee } = req.body;
    const result = await db.query(
        `INSERT INTO tunnel_records
        (vehicle_id, date, tunnel, bound, fee)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [id, date, tunnel, bound, fee]);
    res.status(201).json({ message: '隧道記錄已新增', id: result.rows[0]?.id ?? null });
});

app.delete('/api/tunnelrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    await db.query(
        `DELETE FROM tunnel_records
        WHERE id=$1 AND vehicle_id=$2`, [recordId, vehicleId]);
    res.status(204).json({ message: '隧道記錄已刪除' });
});

app.put('/api/tunnelrecords/:vehicleId/:recordId', async (req, res) => {
    const { vehicleId, recordId } = req.params;
    const { date, tunnel, bound, fee } = req.body;
    const result = await db.query(
        `UPDATE tunnel_records
        SET date=$1, tunnel=$2, bound=$3, fee=$4
        WHERE id=$5 AND vehicle_id=$6`,
        [date, tunnel, bound, fee, recordId, vehicleId]);
    if (result.rowCount === 0) return res.status(404).json({ message: '找不到隧道記錄' });
    res.status(200).json({ message: '隧道記錄已更新' });
});

// Insurance records: date/type/broker/fee. One policy per start date.
// Licence records: date/type/fee. One licence per start date.
const datedRecordRoutes = (name, table, addedMsg, updatedMsg, notFoundMsg, columns) => {
    const cols = columns.join(', ');
    const placeholders = (i, n) => Array.from({ length: n }, (_, k) => `$${i + k}`).join(', ');
    app.get(`/api/${name}/:id`, async (req, res) => {
        const { id } = req.params;
        const { rows } = await db.query(
            `SELECT id, ${cols}
            FROM ${table}
            WHERE vehicle_id=$1
            ORDER BY date DESC, id DESC`, [id]);
        res.json(rows);
    });
    app.post(`/api/${name}/:id`, async (req, res) => {
        const { id } = req.params;
        try {
            const vals = columns.map(c => req.body[c] ?? null);
            const result = await db.query(
                `INSERT INTO ${table}
                (vehicle_id, ${cols})
                VALUES ($1, ${placeholders(2, columns.length)})
                RETURNING id`, [id, ...vals]);
            res.status(201).json({ message: addedMsg, id: result.rows[0]?.id ?? null });
        } catch (err) {
            if (err.code === '23505') return res.status(409).json({ message: '記錄已存在' });
            return res.status(500).end();
        }
    });
    app.delete(`/api/${name}/:vehicleId/:recordId`, async (req, res) => {
        const { vehicleId, recordId } = req.params;
        await db.query(
            `DELETE FROM ${table}
            WHERE id=$1 AND vehicle_id=$2`, [recordId, vehicleId]);
        res.status(204).json({ message: '記錄已刪除' });
    });
    app.put(`/api/${name}/:vehicleId/:recordId`, async (req, res) => {
        const { vehicleId, recordId } = req.params;
        try {
            const sets = columns.map((c, k) => `${c}=$${k + 1}`).join(', ');
            const vals = columns.map(c => req.body[c] ?? null);
            const result = await db.query(
                `UPDATE ${table} SET ${sets} WHERE id=$${columns.length + 1} AND vehicle_id=$${columns.length + 2}`,
                [...vals, recordId, vehicleId]);
            if (result.rowCount === 0) return res.status(404).json({ message: notFoundMsg });
            res.status(200).json({ message: updatedMsg });
        } catch (err) {
            if (err.code === '23505') return res.status(409).json({ message: '記錄已存在' });
            return res.status(500).end();
        }
    });
};

datedRecordRoutes('insurancerecords', 'insurance_records',
    '保險記錄已新增', '保險記錄已更新', '找不到保險記錄',
    ['date', 'type', 'broker', 'fee']);
datedRecordRoutes('licencerecords', 'licence_records',
    '牌費記錄已新增', '牌費記錄已更新', '找不到牌費記錄',
    ['date', 'type', 'fee']);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));