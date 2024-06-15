// const User=require('../models/userModel')

// const isBlocked= async(req,res,next)=>{
//     try {
//         const userId=req.session.userId
//         console.log('useid',userId)
//         const user=await User.findOne({_id:userId})

//         if(user.isBlocked){
//             req.session.userId=null
//             return res.redirect('/login')
//         }else{
//             next()
//         }

//     } catch (error) {
//         console.error(error);
//     }
// }

// module.exports={
//     isBlocked
// }

