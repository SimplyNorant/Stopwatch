import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="text-center mt-[10vh]">
      <h1 className="text-3xl">The page you are looking for does not exist!</h1>
      <Link to={"/"}>
        <button className="text-2xl">Return home!</button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
