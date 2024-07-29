import express, { Router, Response } from "express";
import { db } from "../utils.js";
import { ExtendedRequest, requireUser, carIDCheckView, carIDCheckOwner } from "../middleware.js";

const router: Router = express.Router();

router.post('/addcar', requireUser, async (req: ExtendedRequest, res: Response) => {
    //add the car to the cars table using the request body
    let car = await db.query("insert into cars(user_id, name, year, make, model, miles) values($1, $2, $3, $4, $5, $6) returning *;", 
        [req.headers.userid, req.body.name, req.body.year, req.body.make, req.body.model, req.body.miles]
    );

    if(car.rows.length === 1){
        //make this car our users current_car
        await db.query("update users set current_car = $1 where user_id = $2;", [car.rows[0].car_id, req.headers.userid]);
        //add a entry to the access table with Edit permissions
        await db.query("insert into access values($1, $2, $3);", [car.rows[0].car_id, req.headers.userid, "Edit"]);
        //respond with the newly added car 
        res.json(car.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/getcars', requireUser, async(req: ExtendedRequest, res: Response) => {
    //get all the cars that the user has any permissions for
    let cars_db = await db.query("select cars.*, access.permissions from cars inner join access on cars.car_id = access.car_id where access.user_id = $1 order by cars.car_id;", 
        [req.headers.userid]
    );

    //respond with all the cars
    res.json({
        cars: cars_db.rows,
        current_car: req.user_db.current_car,
    });
});

router.get('/deletecar', requireUser, async(req: ExtendedRequest, res: Response) => {
    //implicit owner requirement for delete in sql query
    await db.query("delete from cars where user_id = $1 and car_id = $2;", [req.headers.userid, req.query.car_id])

    //set current car for the user to 0 if we deleted there current car
    if(req.query.car_id === req.user_db.current_car){
        await db.query("update users set current_car = 0 where user_id = $1;", [req.headers.userid]);
    }
    res.json(null);
});

router.get('/getcurrentcar', requireUser, async(req: ExtendedRequest, res: Response) => {
    let access = await db.query("select * from access where car_id = $1 and user_id = $2;", [req.user_db.current_car, req.user_db.user_id]);
    if(access.rows.length === 0){
        res.json(null);
        return;
    }
    let currentCar = await db.query("select * from cars where car_id = $1;", [req.user_db.current_car]);
    if(currentCar.rows.length === 1){
        currentCar.rows[0].permissions = access.rows[0].permissions;
        res.json(currentCar.rows[0]);
    }
    else{
        res.json(null);
    }
});

router.get('/setcurrentcar', carIDCheckView, async(req: ExtendedRequest, res: Response) => {
    await db.query("update users set current_car = $1 where user_id = $2;", [req.query.car_id, req.headers.userid]);
    res.json(null);
});

router.post('/sharecar', carIDCheckOwner, async(req: ExtendedRequest, res: Response) => {
    let user = await db.query("select * from users where email = $1;", [req.body.email]);
    if(user.rows.length === 0){
        res.json({
            success: false
        });
        return;
    }

    //handle deleting a users access if permissions is set to "Remove Access"
    if(req.body.permissions === "Remove Access"){
        await db.query("delete from access where car_id = $1 and user_id = $2;", [req.query.car_id, user.rows[0].user_id]);
        res.json({
            success: true
        });
        return;
    }

    //handle adding or updating access for the user
    let access = await db.query("select * from access where car_id = $1 and user_id = $2;", [req.query.car_id, user.rows[0].user_id]);
    if(access.rows.length === 0){
        await db.query("insert into access values($1, $2, $3);", [req.query.car_id, user.rows[0].user_id, req.body.permissions]);
    }
    else{
        await db.query("update access set permissions = $3 where car_id = $1 and user_id = $2;", [req.query.car_id, user.rows[0].user_id, req.body.permissions]);
    }
    res.json({
        success: true
    });
});

router.get('/removemycaraccess', carIDCheckView, async(req: ExtendedRequest, res: Response) => {
    //check to make sure that we arnt the owner of the car
    let user = await db.query("select * from cars where car_id = $1 and user_id = $2;", [req.query.car_id, req.headers.userid]);
    if(user.rows.length === 1){
        res.json(null);
        return;
    }

    //remove access from access table
    await db.query("delete from access where car_id = $1 and user_id = $2;", [req.query.car_id, req.headers.userid]);
});

export default router;