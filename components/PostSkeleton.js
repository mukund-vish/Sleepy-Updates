export default function PostSkeleton() {
  const bar = (width, height, top) => ({ width, height, marginTop: top });
  return (
    <div className="article skeleton" aria-busy="true" aria-label="Loading post">
      <div className="sk" style={bar("6rem", "1rem", 0)} />
      <div className="sk" style={bar("9rem", "0.9rem", "1.7rem")} />
      <div className="sk" style={bar("min(95%, 50rem)", "2.8rem", "0.9rem")} />
      <div className="sk" style={bar("min(60%, 32rem)", "2.8rem", "0.5rem")} />
      <div className="sk" style={bar("min(100%, 44rem)", "1.2rem", "1.4rem")} />
      <div className="article-layout">
        <div>
          <div className="sk" style={{ aspectRatio: "16 / 9", borderRadius: 12 }} />
          <div className="sk" style={bar("70%", "1.6rem", "2rem")} />
          <div className="sk" style={bar("100%", "1.1rem", "1rem")} />
          <div className="sk" style={bar("88%", "1.1rem", "0.5rem")} />
        </div>
        <div className="sk rail" style={{ height: "18rem" }} />
      </div>
    </div>
  );
}