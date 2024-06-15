const Category=require('../../models/categoryModel')
const categoryPage=async(req,res)=>{
    try {    
        const category=await Category.find({})
        return res.render('categoryManagement',{categoryAlert:'',category})
    } catch (error) {
        console.error(error)
    }
}

const addCategory=async(req,res)=>{
    try {
        const{categoryName}=req.body
        const categoryChecker=await Category.findOne({name:categoryName})
        if(categoryChecker){
            const category=await Category.find({})
            res.render('categoryManagement',{categoryAlert:'Category already exist',category})
        }else{
            const category=new Category({
                name:categoryName
            })
            await category.save()
            res.redirect('/admin/categoryPage')
        }
    
    } catch (error) {
        console.error(error)
    }
}

const categoryEditing=async(req,res)=>{
    try {
        const categoryId= req.query.id
        const categoryData=await Category.findOne({_id:categoryId})

        if(categoryData){
            res.render('categoryEditingPage',{category:categoryData,error: null})
        }else{
            res.redirect('/admin/categoryPage')
        }
        
    } catch (error) {
        console.error(error)
    }
}
const categoryUpdate=async(req,res)=>{
    try {
        const categoryId=req.query.id
        const {categoryName}=req.body

        const existingCategory=await Category.findOne({name:categoryName,_id:{$ne:categoryId}})
        
        if(existingCategory){
            const categoryData=await Category.findOne({_id:categoryId})
            res.render('categoryEditingPage',{category:categoryData,error:'Category already exist'})
        }else{
            const categoryData=await Category.findByIdAndUpdate(categoryId,{$set:{name:categoryName}},{new:true})
            res.redirect('/admin/categoryPage')
        }
        
        
    } catch (error) {
        console.error(error)
    }
}

const ToggleBlockCategories = async(req,res)=>{
    try {
        const id = req.params.id
        const category = await Category.findOne({_id:id})
        category.isActive = !category.isActive
        await category.save()
        res.redirect('/admin/categoryPage')
    } catch (error) {
        console.error(error)
    }
}


module.exports={
    categoryPage,
    addCategory,
    categoryEditing,
    categoryUpdate,
    ToggleBlockCategories
}