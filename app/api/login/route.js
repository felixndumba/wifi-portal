export async function POST(req){

const body = await req.json()

const {phone} = body

if(!phone){

return Response.json({
error:"Phone number required"
},{status:400})

}

return Response.json({

message:"Login successful",
phone

})

}