import { useNavigate } from "react-router-dom";
import { Logo } from "@/_components/logo";
import { Button } from "@/_components/ui/button";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <Logo />
      <h1 className="text-4xl font-bold text-foreground">No Page Here!</h1>
      <Button onClick={() => navigate("/")} size="lg">
        Back to Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
