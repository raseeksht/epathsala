import mongoose from "mongoose";

const dbConnect = async () => {
    try {
        const dbHost = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/";
        let dbName;
        if (process.env.NODE_ENV == 'test') {
            dbName = "testepathsala"
        }
        else if (process.env.NODE_ENV == "dev") {
            dbName = "epathsala_dev"
        } else {
            // production db
            dbName = "ecommerce"
        }
        const db = await mongoose.connect(dbHost + dbName)
        console.log(`mongodb connected to ${db.connection.host}:${db.connection.port}`);
    } catch (err) {
        console.log(err.message)

    }
}

export { dbConnect }