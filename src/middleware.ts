import { Request, Response, NextFunction } from "express";
import { db } from "./utils.js";

export interface ExtendedRequest extends Request {
    user_db?: any,
    car_db?: any
}

//stops the request if the userid header does not have a coresponding user object in the database
export const requireUser = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if(req.headers.userid !== undefined){
        //get the user from the database
        let user = await db.query("select * from users where user_id = $1;", [req.headers.userid]);
        //if user object is not found return
        if(user.rows.length === 0){
            return res.json(null);
        }
        //add the user object to the req object
        req.user_db = user.rows[0];
        next();
    }
    else{
        res.json(null);
    }
}

//if the car_id query exists check to see if the user is the car owner
export const carIDCheckOwner = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if(req.query.car_id !== undefined && req.headers.userid !== undefined){
        //get the car from the database
        let car = await db.query("select * from cars where car_id = $1 and user_id = $2;", [req.query.car_id, req.headers.userid]);
        //if the user object is not found return
        if(car.rows.length === 0){
            res.json(null);
            return;
        }
        //add the car object to the req object
        req.car_db = car.rows[0];
        next();
    }
    else{
        res.json(null);
    }
}

//if the car_id query exists check to see if the user has edit permissions
export const carIDCheckEdit = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if(req.query.car_id !== undefined && req.headers.userid !== undefined){
        //check to see if there is an access entry for the car and the user with edit permissions
        let car = await db.query("select cars.*, access.permissions from access inner join cars on access.car_id = cars.car_id where access.car_id = $1 and access.user_id = $2 and access.permissions = $3;",
            [req.query.car_id, req.headers.userid, "Edit"]
        );
        //if the user does not have acces to the car
        if(car.rows.length === 0) {
            res.json(null);
            return;
        }
        req.car_db = car.rows[0];
        next();
    }
    else{
        res.json(null);
    }
}

//if the car_id query exists check to see if the user has any permissions
export const carIDCheckView = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if(req.query.car_id !== undefined && req.headers.userid !== undefined){
        //check to see if there is an access entry for the car and the user with any permissions
        let car = await db.query("select cars.*, access.permissions from access inner join cars on access.car_id = cars.car_id where access.car_id = $1 and access.user_id = $2;",
            [req.query.car_id, req.headers.userid]
        );
        //if the user does not have access to the car
        if(car.rows.length === 0) {
            res.json(null);
            return;
        }
        req.car_db = car.rows[0];
        next();
    }
    else{
        res.json(null);
    }
}