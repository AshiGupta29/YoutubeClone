import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
      throw new ApiError(400, "Channel Id is required");
    }
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Channel Id is not valid");
    }
    const userId  = req.user?._id;
    const credential = { subscriber: userId, channel: channelId };
  
    try {
      const subscribed = await Subscription.findOne(credential);
      if (!subscribed) {
        const newSubcription = await Subscription.create(credential);
        if (!newSubcription) {
          throw new ApiError(500, "Unable to subscribe to channel");
        }
        return res
          .status(201)
          .json(new ApiResponse(201, "Subscription successful", newSubcription));
      }else{
          const deletedSubscription = await Subscription.deleteOne(credential);
           if(!deletedSubscription){
               throw new ApiError(500,"Unable to Unsubscribe channel")
           }
           return res
           .status(200)
           .json(new ApiResponse(200,deletedSubscription,"Channel Unsubscribed Successfully!!"))
      }
    } catch (error) {
      throw new ApiError(500, error.message || "Unable to subscription");
    }
  });
  
  const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
      if(!subscriberId){
          throw new ApiError(400,"subscriberId is Requitred!!")
      }
      if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subscriber Id is not valid");
      }
     try {
     
       const subscribers = await Subscription.aggregate([{
           $match:{
               channel : new mongoose.Types.ObjectId(subscriberId)
           },
       },{
           $group:{
               _id:"channel",
               subscribers:{$push:"$subscriber"}
           }
       },{
           $project:{
               _id:0,
               subscribers:1
           }
       }])
       
       if(!subscribers || subscribers.length === 0 ){
           return res
           .status(200)
           .json(new ApiResponse(200, [], "No subscribers found for the channel"));
   
       }
       return res
       .status(200)
       .json(new ApiResponse(200,subscribers,"All Subscribers fetched Successfully!!"))
       
     } catch (e) {
      throw new ApiError(500,e?.message || "Unable te fetch subscribers!")
      
     }
  });
  
  const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
      if(!channelId){
          throw new ApiError(400,"Channel Id is Requitred!!")
      }
      if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not valid");
      }
      try {
     
          const subscribedChannels = await Subscription.aggregate([{
              $match:{
                  subscriber : new mongoose.Types.ObjectId(channelId)
              },
          },{
              $group:{
                  _id:"subscriber",
                  subscribedChannels:{$push:"$channel"}
              }
          },{
              $project:{
                  _id:0,
                  subscribedChannels:1
              }
          }])
          
          if(!subscribedChannels || subscribedChannels.length === 0 ){
              return res
              .status(200)
              .json(new ApiResponse(200, [], "No subscribedChannel found for the user"));
      
          }
          return res
          .status(200)
          .json(new ApiResponse(200,subscribedChannels,"All SubscribedChannels fetched Successfully!!"))
          
        } catch (e) {
         throw new ApiError(500,e?.message || "Unable te fetch subscribedChannels!")
         
        }
  });
  

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}