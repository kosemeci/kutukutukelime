const express = require("express");
const db = require("../data/db");
const router = express.Router();

router.post('/update-click', async (req, res) => {
    try {
        await db.execute("UPDATE count SET click = click + 1 ");
        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
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

router.use("/kategori_:box_name", async (req,res) => {
    try{     
        const [data,]= await db.execute("SELECT * FROM categories  where category = ?",[req.params.box_name]);
        res.render("boxes", {data : data }); 
    }
    catch(err){
        console.log(err);
    }
});

router.use("/seviye_:box_name", async (req,res) => {

    try{
        
        const [data,]= await db.execute("SELECT * FROM words  where level = ?",[req.params.box_name]);
        res.render("boxes", {data : data }); 
    }
    catch(err){
        console.log(err);
    }
});

router.use("/box_create/:box_id", async (req,res) => {

    try{
        const [data,]= await db.execute("SELECT words FROM create_box  where id = ?",[req.params.box_id]);
        res.json(data[0].words);
    }
    catch(err){
        console.log(err);
    }
});

router.use("/kutum/:box_id", async (req,res) => {
    res.render("idbox",{box_id:req.params.box_id});
});

router.use("/kutum", (req,res)=>{
    res.render("mybox"); 
});

router.get("/sitemap.xml", (req, res) => {
    res.sendFile("sitemap.xml", { root: __dirname });
});

router.get("/robots.txt", (req, res) => {
    res.sendFile("robots.txt", { root: __dirname });
});

router.use("/", async (req,res)=>{
    const query = "SELECT level, COUNT(*) AS count FROM words  GROUP BY level ORDER BY level ASC;";
    const queryCategory = "SELECT category, COUNT(*) AS count FROM categories  GROUP BY category ORDER BY category ASC;";
    const queryTrCategory = "SELECT english,turkish FROM t_category";

    try{
        const [data,]= await db.execute(query);
        const [dataCategory,]= await db.execute(queryCategory);
        const [turkishCategory,]= await db.execute(queryTrCategory);


        res.render("index",{
            words : data,
            words_category : dataCategory,
            words_TrCategory : turkishCategory,
        }); 
    }
    catch(err){
        console.log(err);
    }

});

module.exports = router;