import express from "express"
import { jwtCheck } from "./utils.js"
import cors, { CorsOptions } from "cors"
import helmet from 'helmet'
import users from './routes/users.js';
import cars from './routes/cars.js';
import maintenanceLog from './routes/maintenanceLog.js';
import imageHandler from './routes/imageHandler.js';

const app = express();

let corsOptions: CorsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccessStatus: 200
}

//global middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(jwtCheck);

//routes
app.use('/express', users);
app.use('/express', cars);
app.use('/express', maintenanceLog);
app.use('/express', imageHandler);

app.listen(5000, () => {
    console.log("application listening at port 5000");
});