import { auth } from "express-oauth2-jwt-bearer"
import pg from 'pg'
import fs from 'fs';

export const jwtCheck = auth(JSON.parse(fs.readFileSync('auth0Authentication.json').toString()));
export const db = new pg.Pool(JSON.parse(fs.readFileSync('postgresAuthentication.json').toString()));