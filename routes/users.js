const express = require("express");
const db = require("../data/db");
const router = express.Router();
const axios = require('axios');
const https = require('https');
const cron = require('node-cron');


router.use("/seviye-ogrenme-testi", async (req, res) => {
    res.render('learn-level');
});

router.use("/seviye-ogren", async (req, res) => {
    try {
        var [data,] = await db.execute("SELECT * FROM words WHERE level IN ('A', 'A+', 'A++') ORDER BY RAND() LIMIT 9");
        var [dataB,] = await db.execute("SELECT * FROM words WHERE level IN ('B', 'B+', 'B++') ORDER BY RAND() LIMIT 6");
        var [dataC,] = await db.execute("SELECT * FROM words WHERE level IN ('C', 'C+', 'C++') ORDER BY RAND() LIMIT 5");
        
        data.forEach(item => item.point = 1); 
        dataB.forEach(item => item.point = 2); 
        dataC.forEach(item => item.point = 3);   
        var combinedData = [...data,...dataB, ...dataC];

        res.json(combinedData);
    }
    catch (err) {
        console.log(err);
    }
});

router.post('/create_box', async (req, res) => {

    const { boxId, words } = req.body;

    try {
        await db.query(`
            INSERT INTO create_box (id, words)
            VALUES (?, ?)
        `, [boxId, JSON.stringify(words)]);

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

router.use("/kategori_:box_name", async (req, res) => {
    try {
        const [data,] = await db.execute("SELECT * FROM categories  where category = ?", [req.params.box_name]);
        res.render("boxes", { data: data });
    }
    catch (err) {
        console.log(err);
    }
});

router.use("/seviye_:box_name", async (req, res) => {
    try {
        const [data,] = await db.execute("SELECT * FROM words  where level = ?", [req.params.box_name]);
        res.render("boxes", { data: data });
    }
    catch (err) {
        console.log(err);
    }
});

router.use("/box_create/:box_id", async (req, res) => {

    try {
        const [data,] = await db.execute("SELECT words FROM create_box  where id = ?", [req.params.box_id]);
        res.json(data[0].words);
    }
    catch (err) {
        console.log(err);
    }
});

router.use("/kutum/:box_id", async (req, res) => {
    res.render("idbox", { box_id: req.params.box_id });
});

router.use("/kutum", (req, res) => {
    res.render("mybox");
});

router.get("/sitemap.xml", (req, res) => {
    res.sendFile("sitemap.xml", { root: __dirname });
});

router.get("/robots.txt", (req, res) => {
    res.sendFile("robots.txt", { root: __dirname });
});

router.use('/etrsoft_odev', async (req, res) => {
    try {
        cron.schedule('*/30 * * * *', fetchDataAndUpdateDB);
        const query = `
      SELECT 
    hesap_kodu, 
    borcu,
    SUBSTRING_INDEX(hesap_kodu, '.', 1) AS level_1,
    SUBSTRING_INDEX(hesap_kodu, '.', 2) AS level_2
FROM 
    data
ORDER BY 
    hesap_kodu;

  `;

    const [rows] = await db.execute(query);
    res.render('etr', { data: rows });
    } catch (error) {
        console.error('Veri çekme hatası:', error.message);
        res.status(500).send('Veri çekme işlemi başarısız.');
    }
});

router.use("/", async (req, res) => {
    const query = "SELECT level, COUNT(*) AS count FROM words  GROUP BY level ORDER BY level ASC;";
    const queryCategory = "SELECT category, COUNT(*) AS count FROM categories  GROUP BY category ORDER BY category ASC;";
    const queryTrCategory = "SELECT english,turkish FROM t_category";

    try {
        const [data,] = await db.execute(query);
        const [dataCategory,] = await db.execute(queryCategory);
        const [turkishCategory,] = await db.execute(queryTrCategory);


        res.render("index", {
            words: data,
            words_category: dataCategory,
            words_TrCategory: turkishCategory,
        });
    }
    catch (err) {
        console.log(err);
    }

});

const agent = new https.Agent({
    rejectUnauthorized: false
});

const username = 'apitest';
const password = 'test123';

async function fetchDataAndUpdateDB() {
    try {
        const tokenResponse = await axios.post(
            'https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions',
            {},
            {
                httpsAgent: agent,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64'),
                    'Content-Type': 'application/json'
                }
            }
        );

        const token = tokenResponse.data.response.token;

        // Verileri almak için PATCH isteği
        const dataResponse = await axios.patch(
            'https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records/1',
            {
                "fieldData": {},
                "script": "getData"
            },
            {
                httpsAgent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = dataResponse.data.response.scriptResult;
        const fetchedData = JSON.parse(data);

        for (const item of fetchedData) {
            const hesap_kodu = item.hesap_kodu;
            const borc = item.borc === '' ? 0 : parseFloat(item.borc);

            // Veritabanında var mı kontrol et
            const [checkResult] = await db.execute('SELECT COUNT(*) AS count FROM data WHERE hesap_kodu = ?', [hesap_kodu]);

            if (checkResult[0].count > 0) {
                // Güncelleme yap
                await db.execute('UPDATE data SET borcu = ? WHERE hesap_kodu = ?', [borc, hesap_kodu]);
            } else {
                // Ekleme yap
                await db.execute('INSERT INTO data (hesap_kodu, borcu) VALUES (?, ?)', [hesap_kodu, borc]);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

module.exports = router;