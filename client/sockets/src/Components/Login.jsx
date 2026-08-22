import { useState, useContext } from "react";
import { AppContext } from "../Context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { Loader2, Lock, Mail, MessageCircle, User } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const { backendUrl, setToken, setUserId, setUserName } = useContext(AppContext);
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleClick(e) {
    e.preventDefault();

    
    if (!email || !Password || (!isLogin && !Name)) {
      return toast.error("Please fill in all required fields.");
    }

    if (!isLogin && Password !== confirmPass) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);
    try {
      let url = `${backendUrl}/api/users/${isLogin ? "login" : "register"}`;
      let payload = isLogin
        ? { email, password: Password }
        : { name: Name, email, password: Password };

      const { data } = await axios.post(url, payload);

      if (data.success) {
        setToken(data.token);
        setUserId(data.userId);
        setUserName(data.name);

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name);

        toast.success(data.message);
        navigate("/chat");
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Real-time chat and calls
            </div>
            <h1 className="text-5xl font-semibold leading-tight tracking-normal text-slate-950">
              Conversations that stay fast, focused, and close.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Message, share files, and jump into audio or video calls from the same clean workspace.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Secure sessions</p>
                <p className="mt-1 text-sm text-slate-500">JWT backed socket auth.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">WebRTC ready</p>
                <p className="mt-1 text-sm text-slate-500">Audio and video in chat.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h2 className="text-center text-2xl font-semibold text-slate-950">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              {isLogin ? "Sign in to continue your chats." : "Start messaging in a few seconds."}
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleClick}>
            {!isLogin && (
              <div>
                  <label className="block text-sm font-medium text-slate-700">
                  Your Name
                </label>
                  <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <User className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={Name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
              </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={Password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
            </div>

            {!isLogin && (
              <div>
                  <label className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                  <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="********"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
