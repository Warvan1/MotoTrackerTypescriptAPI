import express, { Router, Response } from "express";
import fs from "fs";
import path from "path";
import { ExtendedRequest, carIDCheckView, carIDCheckEdit } from "../middleware.js";

const router: Router = express.Router();

//create the uploads directory if it doesnt exist
const uploadsDir: string = path.join(import.meta.dirname, "../../uploads");
if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

router.post('/uploadCarImage', express.raw({type: "image/*", limit: "64mb"}), carIDCheckEdit, async (req: ExtendedRequest, res: Response) => {
    let filename: string = req.query.car_id + ".jpg";
    let filepath: string = path.join(uploadsDir, filename);

    fs.writeFile(filepath, req.body, (err) => {
        if(err){
            console.log(err);
            res.status(500).send({ message: 'Failed to upload file' });
            return;
        }
        res.send({ message: 'file uploaded successfully.' });
    });

});

router.get('/downloadCarImage', express.static('../../uploads'), carIDCheckView, async (req: ExtendedRequest, res: Response) => {
    let filename: string = req.query.car_id + ".jpg";
    let filepath: string = path.join(uploadsDir, filename);

    if(!fs.existsSync(filepath)){
        res.status(404).send({ message: 'File not found'});
        return;
    }

    res.sendFile(path.join(filepath));
});

export default router;