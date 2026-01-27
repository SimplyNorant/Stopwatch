import { Link, useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();

  return (
    <div className="text-center mt-[10vh]">
      <h1 className="text-3xl">Sorry, an unexpected error has occurred.</h1>
      <p className="text-2xl">
        {error?.statusText || error?.message || "Unknown error"}
      </p>
      <Link to={"/"}>
        <button>Return home!</button>
      </Link>
    </div>
  );
}
