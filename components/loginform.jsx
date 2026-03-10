
"use client"

import {useState} from "react"
import { useRouter } from "next/navigation"

export default function LoginForm({ onSwitchTab }){

const [phone,setPhone] = useState("")
const [password,setPassword] = useState("")
const router = useRouter()

const login = async ()=>{

if(!phone || !password){
alert("Please enter both phone number and password")
return
}

const res = await fetch("/api/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({phone, password})
})

const data = await res.json()

if(data.success){
// Store user info in localStorage
localStorage.setItem("user", JSON.stringify(data.user))
alert(data.message)
router.push("/subscriptions")
}else{
alert(data.error)
}

}

return(

<div className="text-center mt-16">

<h2 className="text-4xl font-bold mb-12">
ACCOUNT <span className="text-yellow-500">LOGIN</span>
</h2>

<div className="w-[450px] mx-auto text-left">

<label className="text-gray-500">
+254 - Phone Number *
</label>

<input
type="text"
className="w-full border-b border-gray-400 py-3 outline-none"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

<label className="text-gray-500 mt-4 block">
Password *
</label>

<input
type="password"
className="w-full border-b border-gray-400 py-3 outline-none"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

</div>

<button
onClick={login}
className="mt-10 bg-black text-white px-16 py-4 rounded-full"
>

LOGIN

</button>

<p className="mt-6 text-gray-600">
Don't have an account?{" "}
<span
  onClick={onSwitchTab}
  className="text-yellow-500 cursor-pointer font-semibold hover:underline"
>
  Register here
</span>
</p>

</div>

)

}

