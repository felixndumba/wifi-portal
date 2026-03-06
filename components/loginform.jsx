"use client"

import {useState} from "react"

export default function LoginForm({ onSwitchTab }){

const [phone,setPhone] = useState("")

const login = async ()=>{

const res = await fetch("/api/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({phone})
})

const data = await res.json()

alert(data.message)

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