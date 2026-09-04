import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reset link.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="font-playfair text-3xl text-gray-800">Forgot password?</h1>
        <p className="text-gray-500 mt-2">Enter your email and we'll send a recovery link.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-primary"
            placeholder="you@example.com" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg disabled:opacity-60">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-6"><Link to="/signin" className="text-primary hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
};
export default ForgotPassword;
