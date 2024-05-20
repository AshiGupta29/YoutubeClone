import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    uploadOnCloudinary,
    getPublicIdFromUrl,
    deleteOnCloudinary
} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
        populate: { path: 'owner', select: 'username fullName avatar' }
    };

    const match = {};
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    if (userId) {
        match.owner = userId;
    }

    const aggregation = Video.aggregate([
        { $match: match },
        { $sort: options.sort },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        { $unwind: '$owner' },
        {
            $project: {
                title: 1,
                description: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);

    const videos = await Video.aggregatePaginate(aggregation, {
        page: options.page,
        limit: options.limit
    });

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(
        [title, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoCreated = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration,
        owner: req.user._id
    })

    if (!videoCreated) {
        throw new ApiError(500, "Something went wrong while saving the video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videoCreated, "Video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const {title, description} = req.body;

    if(
        [title, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const previousVideo = await Video.findOne({_id: videoId});

    if(!previousVideo){
        throw new ApiError(404, "video not found")
    }

    let updateFields = {
        $set: { title, description },
      };

    const thumbnailLocalPath = req.file.path;
    console.log("thumbnailLocalPath is:   ",thumbnailLocalPath);
    
    if(thumbnailLocalPath){
       const publicId = getPublicIdFromUrl(previousVideo.thumbnail);
       const deletedFile = await deleteOnCloudinary(publicId);

       console.log("delete file: ", deletedFile);
       if (deletedFile && deletedFile.result === "not found") {
         throw new ApiError(404, "File not found for deleting");
       }
    
       const thumbnailImage = await uploadOnCloudinary(thumbnailLocalPath)

       if(!thumbnailImage){
            throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
        }

       const newThumbnailUrl = thumbnailImage.url
       
       updateFields.$set.thumbnail = newThumbnailUrl;
    }

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new: true,
        }
    );

    if(!updatedVideoDetails){
        throw new ApiError(500, "Error updating video details");
    }

    return res  
    .status(200)
    .json(new ApiResponse(200, updatedVideoDetails, "Video details updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(deletedVideo === null){
        throw new ApiError(404, "Video not found or already deleted")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, "video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    const isPublished = video.isPublished;

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !isPublished
            }
        },
        {new: true}
    );

    return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "Video Status Changed Successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}