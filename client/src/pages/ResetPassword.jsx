import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      setMessage(data.message);
      setForm({ password: "", confirmPassword: "" });
      setTimeout(() => navigate("/signin", { replace: true }), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="font-playfair text-3xl text-gray-800">Reset password</h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input type="password" minLength={6} value={form.password}
            onChange={(e)=>setForm({...form,password:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-primary"
            placeholder="New password" required />
          <input type="password" value={form.confirmPassword}
            onChange={(e)=>setForm({...form,confirmPassword:e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-primary"
            placeholder="Confirm password" required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button disabled={loading || !!message} className="w-full bg-primary text-white py-2.5 rounded-lg disabled:opacity-60">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ResetPassword;
