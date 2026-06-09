import "./loader.css";

export const LoaderOne = () => {
  return (
    <div className="loader-shell" aria-label="Loading…" role="status">
      <span className="loader-dot" style={{ animationDelay: "0ms" }} />
      <span className="loader-dot" style={{ animationDelay: "120ms" }} />
      <span className="loader-dot" style={{ animationDelay: "240ms" }} />
      <span className="loader-dot" style={{ animationDelay: "360ms" }} />
    </div>
  );
};
