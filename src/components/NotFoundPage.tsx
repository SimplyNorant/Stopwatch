import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div>
      <h1>The page you are looking for does not exist!</h1>
      <Link to={"/"}>
        <button>Return home!</button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
