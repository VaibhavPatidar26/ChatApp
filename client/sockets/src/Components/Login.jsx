import { useState } from "react";
import { motion } from "framer-motion";
import { useContext } from "react";
import {AppContext} from "../Context/AppContext";
import axios from "axios";
import {toast} from "react-toastify"
import { useNavigate } from "react-router";
export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
    let {backendUrl,token,setToken,setuserId} = useContext(AppContext)
    const [Name,setName] = useState("")
    const [email,setEmail] = useState("") 
    const[Password,setPassword] = useState("")
    const[confirmPass,setConfirmPass]=useState("")
    const navigate = useNavigate()
  async function handleclick(e){
    e.preventDefault()
     console.log("button clicked")
      try {
      if (isLogin) {
        const { data } = await axios.post(`${backendUrl}/api/users/login`, {
          email: email,
          password: Password,
        });
        toast.success(data.message);
        console.log(data)
        if (data.success) {
          setToken(data.token);
          setuserId(data.userId)
          localStorage.setItem("userId",data.userId)

          localStorage.setItem("token", data.token);
          navigate("/chat")
          
        }
      } else {
        const { data } = await axios.post(`${backendUrl}api/users/register`, {
          Name,
          email: email,
          password: Password,
          confirmPass,
        });
        toast.success(data.message);
        if (data.success) {
          setToken(data.token);
          setuserId(data.userId)
          localStorage.setItem("userId",data.userId)
          localStorage.setItem("token", data.token);
          navigate("/chat")
          
        }
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  }
   
    

   





  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 text-center">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
          <p className="text-gray-500 text-sm text-center mt-2">
            {isLogin
              ? "Enter your email and password below"
              : "Fill in your details to get started"}
          </p>

          {/* Form */}
          <form 
          
          className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  type="text"
                  value={Name}
                  onChange={(e)=>{
                    setName(e.target.value)
                  }}
                  placeholder="John Doe"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value = {email}
                onChange={(e)=>{
                    setEmail(e.target.value)
                }}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                value={Password}
                onChange={(e)=>{
                    setPassword(e.target.value)
                }}
                type="password"
                
                placeholder="********"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                value= {confirmPass}
                onChange={(e)=>{
                    setConfirmPass(e.target.value)
                }}
                  type="password"
                  placeholder="********"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              onClick={handleclick}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );

}