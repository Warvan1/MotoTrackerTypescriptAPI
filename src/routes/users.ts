import express, { Router, Request, Response } from "express";
import { db } from "../utils.js";
import { ExtendedRequest, requireUser } from "../middleware.js";

const router: Router = express.Router();

function isUser(obj: any){
    return (
        typeof obj.userid === "string" && 
        typeof obj.email === "string" &&
        typeof obj.email_verified === "boolean"
    )
}

router.post('/adduser', async (req: Request, res: Response) => {
    //input validation for post body
    if(isUser(req.body)){
        res.json(null)
        return;
    }

    //check to see if the user already exists
    let user = await db.query("select * from users where user_id = $1;", [req.body.userid]);

    //if the user doesnt exist add a new user
    if(user.rows.length === 0){
        await db.query("insert into users(user_id, email, email_verified) values($1, $2, $3);", 
            [req.body.userid, req.body.email, req.body.email_verified]
        );
    }

    res.json(null);
});

router.get('/getuser', requireUser, async (req: ExtendedRequest, res: Response) => {
    res.json(req.user_db);
});

export default router;