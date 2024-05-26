import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const findTweetById = async (tweetId) => {
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    } else {
      return tweet;
    }
  };
  const validateCurrentUserAgainstOwner = async (
    currentUser,
    tweetId,
    message
  ) => {
    const tweet = await findTweetById(tweetId);
  
    if (tweet.owner.toString() !== currentUser) {
      throw new ApiError(403, message);
    }
  };

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const owner = req.user._id.toString();

    if(!content)
    {
        throw new ApiError(400, "Content is required")
    }

    if(!isValidObjectId(owner)){
        throw new ApiError(400, "Video Id is not valid")
    }

    const tweet = await Tweet.create({
        content,
        owner
    });

    if(!tweet){
        throw new ApiError(500,"Error while creating tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"))
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId)
    {
        throw new ApiError(400, "UserId is not available in params")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "User Id is not valid")
    }

    const currentUser = req.user._id.toString();
    if(currentUser !== userId){
        throw new ApiError(403, "You don't have permission to fetch tweets")
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not Exists");
    }

    const tweets = await Tweet.find({owner: userId}).populate({
        path: "owner",
        select: "username -_id"
    })

    if(!tweets || tweets.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweets fetched succesfully"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched Successfully."));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
  
    if (
        [tweetId, content].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet Id is not valid")
    }

  
    const currentUser = req.user._id.toString();
  
    await validateCurrentUserAgainstOwner(
        currentUser,
        tweetId,
        "You do not have permission to update this Tweet"
      );
  
    const updateTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    );
  
    if (!updateTweet) {
      throw new ApiError(500, "Something went wrong while updating tweet");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, updateTweet, "Tweet updated successfully."));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId)
    {
        throw new ApiError(400, "Tweet Id is not available in params")
    }
    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Tweet Id is not valid")
    }

    const currentUser = req.user._id.toString();
    await validateCurrentUserAgainstOwner(
        currentUser,
        tweetId,
        "You do not have permission to delete this Tweet"
    );

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet Not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully."));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}