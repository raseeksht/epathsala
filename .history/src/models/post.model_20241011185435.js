import mongoose, { mongo } from "mongoose";
import commentModel from "./comment.models.js";
import likeModel from "./like.models.js";

const postSchema = mongoose.Schema({
    // string content of a post
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
    },
    // for picture content of post
    picUrl: {
        type: String,
    },
    edited: {
        type: Boolean,
        default: false
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    postedOn: {
        type: String,
        enum: ['user', 'community', 'page'],
        required: true
    },
    postedOnRef: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "postedOn"
    }

}, { timestamps: true });

// delete all comments and likes if the post is deleted
postSchema.pre('findOneAndDelete', async function (next) {
    // Access the post being removed using `this`
    const _id = this.getQuery()._id;
    await commentModel.deleteMany({ post_ref: _id })
    await likeModel.deleteMany({ pc_ref: _id })
    next();
});




const postModel = mongoose.model("post", postSchema);


export default postModel;