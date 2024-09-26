import { Schema, model } from "mongoose";


const organizationSchema = Schema({
    name: {
        type: String,
        unique: true
    },
    description: {
        type: String
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

})


const organizationModel = model("Organization", organizationSchema);

export { organizationModel };