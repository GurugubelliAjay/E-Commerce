import mongoose from "mongoose";
import { redis } from "../lib/redis.js";
import cloudinary from '../lib/cloudinary.js'
import Product from "../models/product.model.js";
export const getAllProducts=async(req,res)=>{
    try{
        const products=await Product.find({});
        res.json({products})
    }catch(error){
        res.status(401).json({message:'Server Error'});
    }
}
export const getFeaturedProducts=async(req,res)=>{
    try{
        let featuredProducts=await redis.get("featured_products")
        if(featuredProducts){
            return res.json(JSON.parse(featuredProducts));
        }
        // If not in redis , fetch from mongodb
        // lean returns js obj instead of mongodb document
        featuredProducts=await Product.find({isFeatured:true}).lean() 
        if(!featuredProducts){
            return res.status(404).json({message:"No featured Products found"});
        }
        // Cache the featured products into redis for future use
        await redis.set("featured_products",JSON.stringify(featuredProducts));
        res.json(featuredProducts);
    }catch(error){
        console.log("Error in fetching featured products : ",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}
export const createProduct=async(req,res)=>{
    try{
        const {name,description,price,image,category}=req.body;
        let cloudinaryResponse=null;
        if(image){
            cloudinaryResponse=await cloudinary.uploader.upload(image,{folder:"products"});
        }
        const product=await Product.create({
            name:name,
            description:description,
            price:price,
            image:cloudinaryResponse?.secure_url?cloudinaryResponse.secure_url:"",
            category:category
        })
        res.status(201).json({product})
    }catch(error){
        console.log("Error in creating product : ",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}
export const deleteProduct=async(req,res)=>{
    try{
        const product=await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        if(product.image){
            const publicId=product.image.split('/').pop().split('.')[0];
            try{
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log('Deleted image from cloudinary')
            }catch(error){
                console.log("Error in deleting image from cloudinary",error.message)
                
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({message:'Product deleted successfully'})
    }catch(error){
        console.log("Error in deleting product : ",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}
export const getRecommendedProducts=async(req,res)=>{
    try{
        const products=await Product.aggregate([
            {
                $sample:{size:3}
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description:1,
                    image:1,
                    price:1
                }
            }
        ])
        res.status(200).json(products)
    }catch(error){
        console.log('Error in fetching recommended products',error.message);
        res.status(500).json({message:"Server Error",error:error})
    }
}
export const getProductsByCategory=async(req,res)=>{
    const {category}=req.params;
    try{
        const products=await Product.find({category});
        res.status(200).json(products);
    }catch(error){
        console.log("Error in fetching products by category : ",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}
export const toggleFeaturedProduct=async(req,res)=>{
    try {
        const product=await Product.findById(req.params.id);
        if(product){
            product.isFeatured=!product.isFeatured;
            const updatedProduct=await product.save();
            await updateFeaturedProductsCache();
            res.status(200).json(updatedProduct);
        }
    } catch (error) {
        console.log("Error in toggling featured product : ",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}
const updateFeaturedProductsCache=async()=>{
    try {
        const featuredProducts=await Product.find({isFeatured:true}).lean();
        await redis.set("featured_products",JSON.stringify(featuredProducts)); 
    } catch (error) {
        console.log("Error in updating featured products cache : ",error.message);
    }
}