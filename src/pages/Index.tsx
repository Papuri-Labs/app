import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { orgSlug } = useParams();
  const slug = orgSlug || "my-church";

  return <Navigate to={`/${slug}${isAuthenticated ? "/dashboard" : "/about-church"}`} replace />;
};

export default Index;
