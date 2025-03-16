import {redis} from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
const generateTokens=(userId)=>{
    const accessToken=jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"15m"
    });
    const refreshToken=jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:"7d"
    });
    return {accessToken,refreshToken};
}
const storeRefreshToken=async(userId,refreshToken)=>{
    await redis.set(`refresh_token:${userId}`,refreshToken,"EX",7*24*60*60);
}
const setCookies=(res,accessToken,refreshToken)=>{
    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:15*60*1000,
    });
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:7*24*60*60*1000,
    });
}
export const signup=async(req,res)=>{
    const {name,email,password}=req.body;
    try{
        const userExists=await User.findOne({email});
        if(userExists){
            return res.status(400).json({message:"User already exists"});
        }
        const user=await User.create({name,email,password});
        // authenticate user Access Token - Expires in 15m , Refresh Token - Expires in 7d (Redis) 
        const {accessToken,refreshToken}=generateTokens(user._id);
        await storeRefreshToken(user._id,refreshToken);
        setCookies(res,accessToken,refreshToken);
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        });
    }catch(error){
        res.status(500).json({message:"Server Error"});
    }
}
export const login=async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(user && (await user.comparePassword(password))){
            const {accessToken,refreshToken}=generateTokens(user._id);
            await storeRefreshToken(user._id,refreshToken);
            setCookies(res,accessToken,refreshToken);
            res.status(200).json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            });
        }else{
            res.status(400).json({message:"Invalid credentials"});
        }
    }catch(error){
        console.log("Error in login : ",error.message);
        res.status(500).json({message:"Server Error"});
    }
}
export const logout=async(req,res)=>{
    try{
        const refreshToken=req.cookies.refreshToken;
        if(refreshToken){
            const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({message:"Logged out successfully"});
    }catch(error){
        console.log("Error in logout : ",error.message);
        res.status(500).json({message:"Server Error"});
    }
}
// Refreshes the access Token
export const refreshToken=async(req,res)=>{
    try{
        const refreshToken=req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message:"No Refresh Token provided"});
        }
        const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        const storedToken=await redis.get(`refresh_token:${decoded.userId}`);
        if(storedToken!==refreshToken){
            return res.status(401).json({message:"Invalid Refresh Token"});
        }
        const accessToken=jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:"15m"
        });
        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV==="production",
            sameSite:"strict",
            maxAge:15*60*1000,
        });
        res.status(200).json({message:"Access Token refreshed successfully"});
    }catch(error){
        console.log("Error in refreshToken : ",error.message);
        res.status(500).json({message:"Server Error"});
    }
}
export const getProfile=async(req,res)=>{
    try {
        res.json(req.user)
    } catch (error) {
        console.log('Error in getProfile Controller',error.message);
        res.status(500).json({message:'Server Error',error:error.message})
    }
}