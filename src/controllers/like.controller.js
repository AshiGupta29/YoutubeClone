import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "Please provide a video id");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid");
    }
    try {
        const video = await Video.findById(videoId);
        if(!video && !video.isPublished){
            throw new ApiError(404, "Video not found");
        }
        const likecriteria = {video:videoId,likedBy:req.user?._id};
        const alreadyLiked = await Like.findOne(likecriteria);

        if(!alreadyLiked){
            const newLike = await Like.create(likecriteria);
            if(!newLike){
                throw new ApiError(500, "Failed to like video");
            }
            return res.status(201).json(new ApiResponse(201, "Video liked", newLike));
        }    
    } catch (error) {
        throw new ApiError(500, error.message);
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400, "Please provide a comment id");
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Comment id is not valid");
    }
    try {
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new ApiError(404, "Comment not found");
        }
        const likecriteria = {comment:commentId,likedBy:req.user?._id};
        const alreadyLiked = await Like.findOne(likecriteria);

        if(!alreadyLiked){
            const newLike = await Like.create(likecriteria);
            if(!newLike){
                throw new ApiError(500, "Failed to like comment");
            }
            return res.status(201).json(new ApiResponse(201, "Comment liked", newLike));
        } 

        //allready liked
        const dislike = await Like.deleteOne(likecriteria);
        if(!dislike){
            throw new ApiError(500, "Failed to dislike comment");
        }
        return res.status(200 ).json(new ApiResponse(200, "Comment disliked", dislike));
    }catch(error){
        throw new ApiError(500, error.message || "Unable to like comment");
    
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "Please provide a tweet id");
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet id is not valid");
    }
    try {
        const tweet = await Tweet.findById(tweetId)
        if(!tweet){
            throw new ApiError(404, "Tweet not found");
        }
        const likecriteria = {tweet:tweetId,likedBy:req.user?._id};
        const alreadyLiked = await Like.findOne(likecriteria);
        if(!alreadyLiked){
            const newLike = await Like.create(likecriteria);
            if(!newLike){
                throw new ApiError(500, "Failed to like tweet");
            }
            return res.status(201).json(new ApiResponse(201, "Tweet liked", newLike));
        }
        //already liked
        const dislike = await Like.deleteOne(likecriteria);
        if(!dislike){
            throw new ApiError(500, "Failed to dislike tweet");
        }
        return res.status(200).json(new ApiResponse(200, "Tweet disliked", dislike));
    }catch(error){
        throw new ApiError(500, error.message || "Unable to like tweet");
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    try{
        const likedVideos = await Like.aggregate([
            {
                $match: {likedBy: new mongoose.Types.ObjectId(userId)}
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos"
                }
            },
            {
                $unwind: "$likedVideos"
            },
            {
                $match:{
                    "likedVideos.isPublished": true
                }
            },
            {
                $lookup:{
                    from:"users",
                    let:{
                        owner_id: "$likedVideos.owner"
                    },
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $eq:["$_id","$$owner_id"]
                                }
                            
                            }
                        },
                        {
                            $project:{
                                 _id:0,
                                username:1,
                                avatar:1,
                                fullName:1
                            }
                        }
                    ],
                    as:"owner"
                }
            },
            {
                $unwind: { path: "$owner", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: "$likedVideos._id",
                    title: "$likedVideos.title",
                    thumbnail: "$likedVideos.thumbnail",
                    owner: {
                        username: "$owner.username",
                        avatar: "$owner.avatar",
                        fullName: "$owner.fullName"
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    likedVideos: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    likedVideos: 1
                }
            }
        ]);
        if(likedVideos.length === 0){
            return res
            .status(200)
            .json(new ApiResponse(200,"No liked videos found"));
        }
        return res
        .status(200)
        .json(new ApiResponse(200,"Success getting liked videos", likedVideos)); 
    }catch(error)
    {
        throw new ApiError(500, error.message || "Unable to get liked videos");
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}